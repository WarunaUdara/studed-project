package service

import (
	"testing"

	progresspb "github.com/studed/shared/proto/gen/go/progress"
)

// Extensible Table-Driven Regression Test Suite for Progress Evaluation & Normalization
func TestProgressRegression_NormalizeAnswerMatrix(t *testing.T) {
	regressionMatrix := []struct {
		name     string
		input    string
		expected string
	}{
		{"trim lowercase basic string", "  Photosynthesis  ", "photosynthesis"},
		{"integer conversion", "20", "20"},
		{"float trailing zeros", "20.00", "20"},
		{"float decimal fraction", "0.3330", "0.333"},
		{"negative decimal", " -0.500 ", "-0.5"},
		{"scientific notation float", "1e-2", "0.01"},
		{"non-numeric mixed string", " 42 apples ", "42 apples"},
		{"empty string", "   ", ""},
		{"special math expression text", "x = 5.00", "x = 5.00"},
	}

	for _, tt := range regressionMatrix {
		t.Run(tt.name, func(t *testing.T) {
			got := normalizeAnswer(tt.input)
			if got != tt.expected {
				t.Errorf("normalizeAnswer(%q) = %q; expected %q", tt.input, got, tt.expected)
			}
		})
	}
}

func TestProgressRegression_ScoreAnswersMatrix(t *testing.T) {
	regressionMatrix := []struct {
		name          string
		blocks        []evaluateBlock
		answers       []*progresspb.Answer
		expectedScore int32
		expectedCount int
	}{
		{
			name: "100% score for exact numeric & string answers",
			blocks: []evaluateBlock{
				{ID: "b1", Type: "mcq", CorrectAnswer: "Gravity"},
				{ID: "b2", Type: "fill_blank", CorrectAnswer: "9.8"},
			},
			answers: []*progresspb.Answer{
				{EvaluateBlockId: "b1", Answer: "GRAVITY"},
				{EvaluateBlockId: "b2", Answer: "9.80"},
			},
			expectedScore: 100,
			expectedCount: 2,
		},
		{
			name: "Partial score rounding with missing block answer",
			blocks: []evaluateBlock{
				{ID: "b1", CorrectAnswer: "A"},
				{ID: "b2", CorrectAnswer: "B"},
				{ID: "b3", CorrectAnswer: "C"},
			},
			answers: []*progresspb.Answer{
				{EvaluateBlockId: "b1", Answer: "A"},
			},
			expectedScore: 33, // 1/3 = 33%
			expectedCount: 3,
		},
		{
			name:          "Zero blocks returns zero score",
			blocks:        nil,
			answers:       nil,
			expectedScore: 0,
			expectedCount: 0,
		},
	}

	for _, tt := range regressionMatrix {
		t.Run(tt.name, func(t *testing.T) {
			score, feedback := scoreAnswers(tt.blocks, tt.answers)
			if score != tt.expectedScore {
				t.Errorf("scoreAnswers() score = %d; expected %d", score, tt.expectedScore)
			}
			if len(feedback) != tt.expectedCount {
				t.Errorf("scoreAnswers() feedback count = %d; expected %d", len(feedback), tt.expectedCount)
			}
		})
	}
}
