package client

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/studed/api-gateway/graph/model"
)

// AIClient talks to the ai-service over HTTP/JSON.
type AIClient struct {
	baseURL string
	http    *http.Client
}

func NewAIClient(baseURL string) *AIClient {
	return &AIClient{
		baseURL: baseURL,
		http:    &http.Client{Timeout: 90 * time.Second},
	}
}

type aiLearnBlock struct {
	ID       string `json:"id"`
	Type     string `json:"type"`
	Content  string `json:"content"`
	Metadata string `json:"metadata,omitempty"`
}

type aiEvaluateBlock struct {
	ID            string   `json:"id"`
	Type          string   `json:"type"`
	Question      string   `json:"question"`
	Options       []string `json:"options,omitempty"`
	CorrectAnswer string   `json:"correctAnswer"`
	Explanation   string   `json:"explanation,omitempty"`
}

func (c *AIClient) post(ctx context.Context, path string, reqBody any, out any) error {
	payload, err := json.Marshal(reqBody)
	if err != nil {
		return fmt.Errorf("failed to marshal AI request: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, c.baseURL+path, bytes.NewReader(payload))
	if err != nil {
		return fmt.Errorf("failed to build AI request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.http.Do(req)
	if err != nil {
		return fmt.Errorf("AI service unreachable: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		var errResp struct {
			Error string `json:"error"`
		}
		if json.NewDecoder(resp.Body).Decode(&errResp) == nil && errResp.Error != "" {
			return fmt.Errorf("AI service error: %s", errResp.Error)
		}
		return fmt.Errorf("AI service returned status %d", resp.StatusCode)
	}

	if err := json.NewDecoder(resp.Body).Decode(out); err != nil {
		return fmt.Errorf("failed to decode AI response: %w", err)
	}
	return nil
}

func (c *AIClient) GenerateLearnBlocks(ctx context.Context, prompt string, language *string, grade *model.Grade) ([]*model.LearnBlock, error) {
	reqBody := map[string]any{"prompt": prompt}
	if language != nil {
		reqBody["language"] = *language
	}
	if grade != nil {
		reqBody["grade"] = string(*grade)
	}

	var resp struct {
		Blocks []aiLearnBlock `json:"blocks"`
	}
	if err := c.post(ctx, "/v1/generate-learn-blocks", reqBody, &resp); err != nil {
		return nil, err
	}

	blocks := make([]*model.LearnBlock, len(resp.Blocks))
	for i, b := range resp.Blocks {
		block := &model.LearnBlock{
			ID:      b.ID,
			Type:    b.Type,
			Content: b.Content,
		}
		if b.Metadata != "" {
			metadata := b.Metadata
			block.Metadata = &metadata
		}
		blocks[i] = block
	}
	return blocks, nil
}

func (c *AIClient) GenerateEvaluateBlocks(ctx context.Context, content string, count *int) ([]*model.EvaluateBlock, error) {
	reqBody := map[string]any{"content": content}
	if count != nil {
		reqBody["count"] = *count
	}

	var resp struct {
		Blocks []aiEvaluateBlock `json:"blocks"`
	}
	if err := c.post(ctx, "/v1/generate-evaluate-blocks", reqBody, &resp); err != nil {
		return nil, err
	}

	blocks := make([]*model.EvaluateBlock, len(resp.Blocks))
	for i, b := range resp.Blocks {
		block := &model.EvaluateBlock{
			ID:       b.ID,
			Type:     b.Type,
			Question: b.Question,
			Options:  b.Options,
		}
		if b.CorrectAnswer != "" {
			answer := b.CorrectAnswer
			block.CorrectAnswer = &answer
		}
		if b.Explanation != "" {
			explanation := b.Explanation
			block.Explanation = &explanation
		}
		blocks[i] = block
	}
	return blocks, nil
}

func (c *AIClient) TranslateContent(ctx context.Context, content, targetLanguage string) (string, error) {
	var resp struct {
		Translation string `json:"translation"`
	}
	if err := c.post(ctx, "/v1/translate", map[string]any{
		"content":         content,
		"target_language": targetLanguage,
	}, &resp); err != nil {
		return "", err
	}
	return resp.Translation, nil
}
