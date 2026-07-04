package client

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/studed/api-gateway/graph/model"
	coursepb "github.com/studed/shared/proto/gen/go/course"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

type CourseClient struct {
	client coursepb.CourseServiceClient
	conn   *grpc.ClientConn
}

func NewCourseClient(addr string) (*CourseClient, error) {
	conn, err := grpc.NewClient(addr, grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		return nil, fmt.Errorf("failed to connect to course service: %w", err)
	}

	return &CourseClient{
		client: coursepb.NewCourseServiceClient(conn),
		conn:   conn,
	}, nil
}

func (c *CourseClient) Close() error {
	return c.conn.Close()
}

func (c *CourseClient) CreateCourse(ctx context.Context, educatorID string, input model.CreateCourseInput) (*model.Course, error) {
	resp, err := c.client.CreateCourse(ctx, &coursepb.CreateCourseRequest{
		Title:       input.Title,
		Description: input.Description,
		Slug:        input.Slug,
		GradeLevel:  modelGradeToProto(input.GradeLevel),
		Price:       valueOrZero(input.Price),
		EducatorId:  educatorID,
	})
	if err != nil {
		return nil, fmt.Errorf("create course failed: %w", err)
	}
	if resp.Error != "" {
		return nil, fmt.Errorf("create course failed: %s", resp.Error)
	}

	return protoCourseToModel(resp.Course), nil
}

func (c *CourseClient) GetCourse(ctx context.Context, id string) (*model.Course, error) {
	resp, err := c.client.GetCourse(ctx, &coursepb.GetCourseRequest{Id: id})
	if err != nil {
		return nil, fmt.Errorf("get course failed: %w", err)
	}
	if resp.Error != "" {
		return nil, fmt.Errorf("get course failed: %s", resp.Error)
	}

	return protoCourseToModel(resp.Course), nil
}

func (c *CourseClient) UpdateCourse(ctx context.Context, educatorID string, id string, input model.UpdateCourseInput) (*model.Course, error) {
	req := &coursepb.UpdateCourseRequest{
		Id:         id,
		EducatorId: educatorID,
	}
	if input.Title != nil {
		req.Title = *input.Title
	}
	if input.Description != nil {
		req.Description = *input.Description
	}
	if input.Slug != nil {
		req.Slug = *input.Slug
	}
	if input.GradeLevel != nil {
		req.GradeLevel = modelGradeToProto(*input.GradeLevel)
	}
	if input.Price != nil {
		req.Price = *input.Price
	}

	resp, err := c.client.UpdateCourse(ctx, req)
	if err != nil {
		return nil, fmt.Errorf("update course failed: %w", err)
	}
	if resp.Error != "" {
		return nil, fmt.Errorf("update course failed: %s", resp.Error)
	}

	return protoCourseToModel(resp.Course), nil
}

func (c *CourseClient) GetCourseWithLessons(ctx context.Context, id string) (*model.Course, error) {
	course, err := c.GetCourse(ctx, id)
	if err != nil {
		return nil, err
	}

	lessonsResp, err := c.client.ListLessons(ctx, &coursepb.ListLessonsRequest{CourseId: id})
	if err != nil {
		return nil, fmt.Errorf("list lessons failed: %w", err)
	}

	course.Lessons = make([]*model.Lesson, len(lessonsResp.Lessons))
	for i, l := range lessonsResp.Lessons {
		lesson := protoLessonToModel(l)

		wavesResp, err := c.client.ListWaves(ctx, &coursepb.ListWavesRequest{LessonId: l.Id})
		if err != nil {
			return nil, fmt.Errorf("list waves failed: %w", err)
		}

		lesson.Waves = make([]*model.Wave, len(wavesResp.Waves))
		for j, w := range wavesResp.Waves {
			lesson.Waves[j] = protoWaveToModel(w)
		}

		course.Lessons[i] = lesson
	}

	return course, nil
}

func (c *CourseClient) ListCourses(ctx context.Context, filter *model.CourseFilter, educatorID string) (*model.CourseConnection, error) {
	req := &coursepb.ListCoursesRequest{}
	if educatorID != "" {
		req.EducatorId = educatorID
	}
	if filter != nil {
		if filter.Grade != nil {
			req.GradeLevel = modelGradeToProto(*filter.Grade)
		}
		if filter.IsPublished != nil {
			req.PublishedOnly = *filter.IsPublished
		}
	}

	resp, err := c.client.ListCourses(ctx, req)
	if err != nil {
		return nil, fmt.Errorf("list courses failed: %w", err)
	}

	edges := make([]*model.CourseEdge, len(resp.Courses))
	for i, c := range resp.Courses {
		edges[i] = &model.CourseEdge{
			Node:   protoCourseToModel(c),
			Cursor: c.Id,
		}
	}

	return &model.CourseConnection{
		Edges: edges,
		PageInfo: &model.PageInfo{
			HasNextPage: false,
			EndCursor:   nil,
		},
	}, nil
}

func (c *CourseClient) PublishCourse(ctx context.Context, educatorID, id string) (*model.Course, error) {
	resp, err := c.client.PublishCourse(ctx, &coursepb.PublishCourseRequest{
		Id:         id,
		EducatorId: educatorID,
	})
	if err != nil {
		return nil, fmt.Errorf("publish course failed: %w", err)
	}
	if resp.Error != "" {
		return nil, fmt.Errorf("publish course failed: %s", resp.Error)
	}

	return protoCourseToModel(resp.Course), nil
}

func (c *CourseClient) CreateLesson(ctx context.Context, educatorID, courseID string, input model.CreateLessonInput) (*model.Lesson, error) {
	resp, err := c.client.CreateLesson(ctx, &coursepb.CreateLessonRequest{
		CourseId:      courseID,
		Title:         input.Title,
		SequenceOrder: int32(input.SequenceOrder),
		EducatorId:    educatorID,
	})
	if err != nil {
		return nil, fmt.Errorf("create lesson failed: %w", err)
	}
	if resp.Error != "" {
		return nil, fmt.Errorf("create lesson failed: %s", resp.Error)
	}

	return protoLessonToModel(resp.Lesson), nil
}

func (c *CourseClient) GetLesson(ctx context.Context, id string) (*model.Lesson, error) {
	resp, err := c.client.GetLesson(ctx, &coursepb.GetLessonRequest{Id: id})
	if err != nil {
		return nil, fmt.Errorf("get lesson failed: %w", err)
	}
	if resp.Error != "" {
		return nil, fmt.Errorf("get lesson failed: %s", resp.Error)
	}

	return protoLessonToModel(resp.Lesson), nil
}

func (c *CourseClient) GetLessonWithWaves(ctx context.Context, id string) (*model.Lesson, error) {
	lesson, err := c.GetLesson(ctx, id)
	if err != nil {
		return nil, err
	}

	wavesResp, err := c.client.ListWaves(ctx, &coursepb.ListWavesRequest{LessonId: id})
	if err != nil {
		return nil, fmt.Errorf("list waves failed: %w", err)
	}

	lesson.Waves = make([]*model.Wave, len(wavesResp.Waves))
	for i, w := range wavesResp.Waves {
		lesson.Waves[i] = protoWaveToModel(w)
	}

	return lesson, nil
}

func (c *CourseClient) CreateWave(ctx context.Context, educatorID, lessonID string, input model.CreateWaveInput) (*model.Wave, error) {
	learnBlocksJSON, evaluateBlocksJSON := blocksToJSON(input.LearnBlocks, input.EvaluateBlocks)

	resp, err := c.client.CreateWave(ctx, &coursepb.CreateWaveRequest{
		LessonId:           lessonID,
		Title:              input.Title,
		SequenceOrder:      int32(input.SequenceOrder),
		XpReward:           int32(input.XpReward),
		MaxReattempts:      int32(input.MaxReattempts),
		PassingThreshold:   int32(input.PassingThreshold),
		EstimatedDuration:  int32(input.EstimatedDuration),
		Difficulty:         modelDifficultyToProto(input.Difficulty),
		LearnBlocksJson:    learnBlocksJSON,
		EvaluateBlocksJson: evaluateBlocksJSON,
		EducatorId:         educatorID,
	})
	if err != nil {
		return nil, fmt.Errorf("create wave failed: %w", err)
	}
	if resp.Error != "" {
		return nil, fmt.Errorf("create wave failed: %s", resp.Error)
	}

	return protoWaveToModel(resp.Wave), nil
}

func (c *CourseClient) GetWave(ctx context.Context, id string) (*model.Wave, error) {
	resp, err := c.client.GetWave(ctx, &coursepb.GetWaveRequest{Id: id})
	if err != nil {
		return nil, fmt.Errorf("get wave failed: %w", err)
	}
	if resp.Error != "" {
		return nil, fmt.Errorf("get wave failed: %s", resp.Error)
	}

	return protoWaveToModel(resp.Wave), nil
}

func (c *CourseClient) UpdateWave(ctx context.Context, educatorID, id string, input model.UpdateWaveInput) (*model.Wave, error) {
	learnBlocksJSON, evaluateBlocksJSON := blocksToJSON(input.LearnBlocks, input.EvaluateBlocks)

	req := &coursepb.UpdateWaveRequest{
		Id:                 id,
		LearnBlocksJson:    learnBlocksJSON,
		EvaluateBlocksJson: evaluateBlocksJSON,
		EducatorId:         educatorID,
	}
	if input.Title != nil {
		req.Title = *input.Title
	}
	if input.SequenceOrder != nil {
		req.SequenceOrder = int32(*input.SequenceOrder)
	}
	if input.XpReward != nil {
		req.XpReward = int32(*input.XpReward)
	}
	if input.MaxReattempts != nil {
		req.MaxReattempts = int32(*input.MaxReattempts)
	}
	if input.PassingThreshold != nil {
		req.PassingThreshold = int32(*input.PassingThreshold)
	}
	if input.EstimatedDuration != nil {
		req.EstimatedDuration = int32(*input.EstimatedDuration)
	}
	if input.Difficulty != nil {
		req.Difficulty = modelDifficultyToProto(*input.Difficulty)
	}

	resp, err := c.client.UpdateWave(ctx, req)
	if err != nil {
		return nil, fmt.Errorf("update wave failed: %w", err)
	}
	if resp.Error != "" {
		return nil, fmt.Errorf("update wave failed: %s", resp.Error)
	}

	return protoWaveToModel(resp.Wave), nil
}

func blocksToJSON(learnBlocks []*model.LearnBlockInput, evaluateBlocks []*model.EvaluateBlockInput) (string, string) {
	learnJSON := "[]"
	if len(learnBlocks) > 0 {
		data := make([]map[string]any, len(learnBlocks))
		for i, b := range learnBlocks {
			m := map[string]any{
				"id":      b.ID,
				"type":    b.Type,
				"content": b.Content,
			}
			if b.Metadata != nil {
				m["metadata"] = *b.Metadata
			}
			data[i] = m
		}
		if bytes, err := json.Marshal(data); err == nil {
			learnJSON = string(bytes)
		}
	}

	evalJSON := "[]"
	if len(evaluateBlocks) > 0 {
		data := make([]map[string]any, len(evaluateBlocks))
		for i, b := range evaluateBlocks {
			m := map[string]any{
				"id":       b.ID,
				"type":     b.Type,
				"question": b.Question,
			}
			if b.Options != nil {
				m["options"] = b.Options
			}
			if b.CorrectAnswer != nil {
				m["correctAnswer"] = *b.CorrectAnswer
			}
			if b.Explanation != nil {
				m["explanation"] = *b.Explanation
			}
			if b.Metadata != nil {
				m["metadata"] = *b.Metadata
			}
			data[i] = m
		}
		if bytes, err := json.Marshal(data); err == nil {
			evalJSON = string(bytes)
		}
	}

	return learnJSON, evalJSON
}

func protoCourseToModel(c *coursepb.Course) *model.Course {
	if c == nil {
		return nil
	}

	var price *float64
	if c.Price != 0 {
		p := c.Price
		price = &p
	}

	return &model.Course{
		ID:          c.Id,
		Title:       c.Title,
		Description: c.Description,
		Slug:        c.Slug,
		GradeLevel:  protoGradeToModel(c.GradeLevel),
		Price:       price,
		IsPublished: c.Status == coursepb.CourseStatus_COURSE_STATUS_PUBLISHED,
		Lessons:     []*model.Lesson{},
		CreatedAt:   timeFromUnix(c.CreatedAtUnix),
	}
}

func protoLessonToModel(l *coursepb.Lesson) *model.Lesson {
	if l == nil {
		return nil
	}
	return &model.Lesson{
		ID:            l.Id,
		Title:         l.Title,
		SequenceOrder: int(l.SequenceOrder),
		IsPublished:   l.IsPublished,
		Waves:         []*model.Wave{},
	}
}

func protoWaveToModel(w *coursepb.Wave) *model.Wave {
	if w == nil {
		return nil
	}
	wave := &model.Wave{
		ID:                w.Id,
		Title:             w.Title,
		SequenceOrder:     int(w.SequenceOrder),
		XpReward:          int(w.XpReward),
		MaxReattempts:     int(w.MaxReattempts),
		PassingThreshold:  int(w.PassingThreshold),
		EstimatedDuration: int(w.EstimatedDuration),
		IsPublished:       w.IsPublished,
		LearnBlocks:       parseLearnBlocks(w.LearnBlocksJson),
		EvaluateBlocks:    parseEvaluateBlocks(w.EvaluateBlocksJson),
	}

	switch w.Difficulty {
	case coursepb.Difficulty_DIFFICULTY_EASY:
		wave.Difficulty = model.DifficultyEasy
	case coursepb.Difficulty_DIFFICULTY_HARD:
		wave.Difficulty = model.DifficultyHard
	default:
		wave.Difficulty = model.DifficultyMedium
	}

	return wave
}

func parseLearnBlocks(jsonStr string) []*model.LearnBlock {
	if jsonStr == "" || jsonStr == "[]" {
		return []*model.LearnBlock{}
	}

	var raw []map[string]any
	if err := json.Unmarshal([]byte(jsonStr), &raw); err != nil {
		return []*model.LearnBlock{}
	}

	blocks := make([]*model.LearnBlock, len(raw))
	for i, item := range raw {
		id, _ := item["id"].(string)
		bType, _ := item["type"].(string)
		content := ""
		if c, ok := item["content"].(string); ok {
			content = c
		}

		var metadata *string
		if m, ok := item["metadata"].(string); ok {
			metadata = &m
		}

		blocks[i] = &model.LearnBlock{
			ID:       id,
			Type:     bType,
			Content:  content,
			Metadata: metadata,
		}
	}

	return blocks
}

func parseEvaluateBlocks(jsonStr string) []*model.EvaluateBlock {
	if jsonStr == "" || jsonStr == "[]" {
		return []*model.EvaluateBlock{}
	}

	var raw []map[string]any
	if err := json.Unmarshal([]byte(jsonStr), &raw); err != nil {
		return []*model.EvaluateBlock{}
	}

	blocks := make([]*model.EvaluateBlock, len(raw))
	for i, item := range raw {
		id, _ := item["id"].(string)
		bType, _ := item["type"].(string)
		question := ""
		if q, ok := item["question"].(string); ok {
			question = q
		}

		var options []string
		if opts, ok := item["options"].([]any); ok {
			options = make([]string, len(opts))
			for j, o := range opts {
				if s, ok := o.(string); ok {
					options[j] = s
				}
			}
		}

		var correctAnswer *string
		if ca, ok := item["correctAnswer"].(string); ok {
			correctAnswer = &ca
		}

		var explanation *string
		if e, ok := item["explanation"].(string); ok {
			explanation = &e
		}

		var metadata *string
		if m, ok := item["metadata"].(string); ok {
			metadata = &m
		}

		blocks[i] = &model.EvaluateBlock{
			ID:            id,
			Type:          bType,
			Question:      question,
			Options:       options,
			CorrectAnswer: correctAnswer,
			Explanation:   explanation,
			Metadata:      metadata,
		}
	}

	return blocks
}

func modelDifficultyToProto(difficulty model.Difficulty) coursepb.Difficulty {
	switch difficulty {
	case model.DifficultyEasy:
		return coursepb.Difficulty_DIFFICULTY_EASY
	case model.DifficultyHard:
		return coursepb.Difficulty_DIFFICULTY_HARD
	default:
		return coursepb.Difficulty_DIFFICULTY_MEDIUM
	}
}

func valueOrZero(v *float64) float64 {
	if v == nil {
		return 0
	}
	return *v
}
