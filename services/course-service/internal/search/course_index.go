package search

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"strings"

	elasticsearch "github.com/elastic/go-elasticsearch/v8"
	"github.com/studed/course-service/internal/model"
	"github.com/studed/course-service/internal/repository"
)

const CourseIndexName = "studed_courses"

// icuIndexBody uses the analysis-icu plugin for proper Sinhala/Tamil
// tokenization. standardIndexBody is the fallback when the plugin is absent.
const icuIndexBody = `{
  "settings": {
    "analysis": {
      "analyzer": {
        "studed_text": {
          "type": "custom",
          "tokenizer": "icu_tokenizer",
          "filter": ["icu_folding", "lowercase"]
        }
      }
    }
  },
  "mappings": {
    "properties": {
      "title":       {"type": "text", "analyzer": "studed_text"},
      "description": {"type": "text", "analyzer": "studed_text"},
      "slug":        {"type": "keyword"},
      "grade_level": {"type": "keyword"},
      "educator_id": {"type": "keyword"},
      "status":      {"type": "keyword"}
    }
  }
}`

const standardIndexBody = `{
  "mappings": {
    "properties": {
      "title":       {"type": "text"},
      "description": {"type": "text"},
      "slug":        {"type": "keyword"},
      "grade_level": {"type": "keyword"},
      "educator_id": {"type": "keyword"},
      "status":      {"type": "keyword"}
    }
  }
}`

type CourseIndex struct {
	es  *elasticsearch.Client
	log *slog.Logger
}

func New(esURL string, log *slog.Logger) (*CourseIndex, error) {
	es, err := elasticsearch.NewClient(elasticsearch.Config{
		Addresses: []string{esURL},
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create elasticsearch client: %w", err)
	}
	return &CourseIndex{es: es, log: log}, nil
}

// EnsureIndex creates the course index if it does not exist, preferring the
// ICU analyzer and falling back to the standard analyzer when the
// analysis-icu plugin is unavailable.
func (s *CourseIndex) EnsureIndex(ctx context.Context) error {
	res, err := s.es.Indices.Exists([]string{CourseIndexName}, s.es.Indices.Exists.WithContext(ctx))
	if err != nil {
		return fmt.Errorf("failed to check index existence: %w", err)
	}
	defer res.Body.Close()
	if res.StatusCode == 200 {
		return nil
	}

	if err := s.createIndex(ctx, icuIndexBody); err != nil {
		s.log.Warn("icu analyzer unavailable, falling back to standard analyzer", slog.Any("error", err))
		return s.createIndex(ctx, standardIndexBody)
	}
	return nil
}

func (s *CourseIndex) createIndex(ctx context.Context, body string) error {
	res, err := s.es.Indices.Create(
		CourseIndexName,
		s.es.Indices.Create.WithContext(ctx),
		s.es.Indices.Create.WithBody(strings.NewReader(body)),
	)
	if err != nil {
		return fmt.Errorf("failed to create index: %w", err)
	}
	defer res.Body.Close()
	if res.IsError() {
		raw, _ := io.ReadAll(res.Body)
		return fmt.Errorf("index creation failed: %s", string(raw))
	}
	return nil
}

type courseDocument struct {
	Title       string `json:"title"`
	Description string `json:"description"`
	Slug        string `json:"slug"`
	GradeLevel  string `json:"grade_level"`
	EducatorID  string `json:"educator_id"`
	Status      string `json:"status"`
}

func (s *CourseIndex) IndexCourse(ctx context.Context, c *model.Course) error {
	doc := courseDocument{
		Title:       c.Title,
		Description: c.Description,
		Slug:        c.Slug,
		GradeLevel:  string(c.GradeLevel),
		EducatorID:  c.EducatorID,
		Status:      string(c.Status),
	}
	payload, err := json.Marshal(doc)
	if err != nil {
		return fmt.Errorf("failed to marshal course document: %w", err)
	}

	res, err := s.es.Index(
		CourseIndexName,
		bytes.NewReader(payload),
		s.es.Index.WithContext(ctx),
		s.es.Index.WithDocumentID(c.ID),
		s.es.Index.WithRefresh("false"),
	)
	if err != nil {
		return fmt.Errorf("failed to index course: %w", err)
	}
	defer res.Body.Close()
	if res.IsError() {
		raw, _ := io.ReadAll(res.Body)
		return fmt.Errorf("index request failed: %s", string(raw))
	}
	return nil
}

// SearchCourses runs a fuzzy full-text query against title and description,
// applying the same filters the SQL path supports. It returns matching course
// IDs ordered by relevance.
func (s *CourseIndex) SearchCourses(ctx context.Context, query string, filters repository.ListFilters) ([]string, error) {
	must := []map[string]any{
		{
			"multi_match": map[string]any{
				"query":     query,
				"fields":    []string{"title^2", "description"},
				"fuzziness": "AUTO",
			},
		},
	}

	var filter []map[string]any
	if filters.PublishedOnly {
		filter = append(filter, map[string]any{"term": map[string]any{"status": string(model.CourseStatusPublished)}})
	}
	if filters.FilterByGrade && filters.Grade != "" {
		filter = append(filter, map[string]any{"term": map[string]any{"grade_level": string(filters.Grade)}})
	}
	if filters.FilterByEducator {
		filter = append(filter, map[string]any{"term": map[string]any{"educator_id": filters.EducatorID}})
	}

	body := map[string]any{
		"size":    100,
		"_source": false,
		"query": map[string]any{
			"bool": map[string]any{
				"must":   must,
				"filter": filter,
			},
		},
	}

	payload, err := json.Marshal(body)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal search query: %w", err)
	}

	res, err := s.es.Search(
		s.es.Search.WithContext(ctx),
		s.es.Search.WithIndex(CourseIndexName),
		s.es.Search.WithBody(bytes.NewReader(payload)),
	)
	if err != nil {
		return nil, fmt.Errorf("search request failed: %w", err)
	}
	defer res.Body.Close()
	if res.IsError() {
		raw, _ := io.ReadAll(res.Body)
		return nil, fmt.Errorf("search failed: %s", string(raw))
	}

	var result struct {
		Hits struct {
			Hits []struct {
				ID string `json:"_id"`
			} `json:"hits"`
		} `json:"hits"`
	}
	if err := json.NewDecoder(res.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("failed to decode search response: %w", err)
	}

	ids := make([]string, len(result.Hits.Hits))
	for i, h := range result.Hits.Hits {
		ids[i] = h.ID
	}
	return ids, nil
}
