package service

import (
	"context"
	"errors"
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

// The cap was enforced on submit while the response reported -1 ("unlimited"),
// so a student was told they had endless attempts right up until the server
// refused the next one. One policy now answers both.
func TestRemainingAttempts_OnePolicy(t *testing.T) {
	cases := []struct {
		name          string
		maxReattempts int32
		used          int32
		expected      int32
	}{
		{"no cap reports unlimited", 0, 5, -1},
		{"a negative cap reports unlimited", -1, 5, -1},
		{"first of three leaves two", 3, 1, 2},
		{"last of three leaves none", 3, 3, 0},
		{"over the cap never goes negative", 3, 7, 0},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			if got := remainingAttempts(tc.maxReattempts, tc.used); got != tc.expected {
				t.Errorf("remainingAttempts(%d, %d) = %d; expected %d",
					tc.maxReattempts, tc.used, got, tc.expected)
			}
		})
	}
}

// A capped wave must report the same remaining count on a fresh submission and
// on an idempotent replay of it.
func TestRecordAttempt_ReportsTheCapItEnforces(t *testing.T) {
	svc, _, course, _ := newTestProgressService()
	ctx := context.Background()
	course.waves["wave-1"].MaxReattempts = 3

	seedEnrollment(svc)

	resp, err := svc.RecordAttempt(ctx, "u1", "wave-1", wrongAnswer(), "sub-1")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if resp.RemainingAttempts != 2 {
		t.Fatalf("first of three attempts should leave 2, got %d", resp.RemainingAttempts)
	}

	replay, err := svc.RecordAttempt(ctx, "u1", "wave-1", wrongAnswer(), "sub-1")
	if err != nil {
		t.Fatalf("unexpected error on replay: %v", err)
	}
	if replay.RemainingAttempts != resp.RemainingAttempts {
		t.Fatalf("a replay reported %d remaining but the original reported %d",
			replay.RemainingAttempts, resp.RemainingAttempts)
	}
}

// XP has to be attributed to the course it was earned in, or the course
// leaderboard ranks by the student's unrelated global total.
func TestRecordAttempt_AttributesXpToItsCourse(t *testing.T) {
	svc, _, _, gamification := newTestProgressService()
	seedEnrollment(svc)

	if _, err := svc.RecordAttempt(context.Background(), "u1", "wave-1", rightAnswer(), "sub-1"); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if len(gamification.courseIDs) == 0 {
		t.Fatal("no XP award was attempted")
	}
	if gamification.courseIDs[0] != "course-1" {
		t.Fatalf("award was attributed to course %q; expected course-1", gamification.courseIDs[0])
	}
}

// Passing a wave is learning activity, so it is what advances the streak.
func TestRecordAttempt_PassAdvancesTheStreak(t *testing.T) {
	svc, _, _, gamification := newTestProgressService()
	seedEnrollment(svc)
	ctx := context.Background()

	if _, err := svc.RecordAttempt(ctx, "u1", "wave-1", wrongAnswer(), "sub-fail"); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if gamification.touchCalls != 0 {
		t.Fatalf("a failed attempt should not advance the streak, got %d calls", gamification.touchCalls)
	}

	if _, err := svc.RecordAttempt(ctx, "u1", "wave-1", rightAnswer(), "sub-pass"); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if gamification.touchCalls != 1 {
		t.Fatalf("a pass should advance the streak once, got %d calls", gamification.touchCalls)
	}
}

// A streak outage must not cost the student their submission.
func TestRecordAttempt_StreakFailureDoesNotFailTheSubmission(t *testing.T) {
	svc, _, _, gamification := newTestProgressService()
	seedEnrollment(svc)
	gamification.touchErr = errors.New("gamification unavailable")

	resp, err := svc.RecordAttempt(context.Background(), "u1", "wave-1", rightAnswer(), "sub-1")
	if err != nil {
		t.Fatalf("a streak outage must not fail the submission: %v", err)
	}
	if !resp.Passed {
		t.Fatal("the attempt should still be recorded as passed")
	}
}

func seedEnrollment(svc *progressService) {
	_, _ = svc.EnrollInCourse(context.Background(), "u1", "course-1")
}

func rightAnswer() []*progresspb.Answer {
	return []*progresspb.Answer{{EvaluateBlockId: "q1", Answer: "yes"}}
}

func wrongAnswer() []*progresspb.Answer {
	return []*progresspb.Answer{{EvaluateBlockId: "q1", Answer: "no"}}
}

// A retry after a network timeout must report the student's real total. The
// replay path returned the zero value when it had nothing to reconcile, so a
// client that retried was told it had 0 XP.
func TestRecordAttempt_ReplayReportsTheRealTotalXp(t *testing.T) {
	svc, _, _, _ := newTestProgressService()
	seedEnrollment(svc)
	ctx := context.Background()

	first, err := svc.RecordAttempt(ctx, "u1", "wave-1", rightAnswer(), "sub-1")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if first.TotalXp == 0 {
		t.Fatalf("the first submission should report a total, got %d", first.TotalXp)
	}

	replay, err := svc.RecordAttempt(ctx, "u1", "wave-1", rightAnswer(), "sub-1")
	if err != nil {
		t.Fatalf("unexpected error on replay: %v", err)
	}
	if replay.TotalXp != first.TotalXp {
		t.Fatalf("replay reported %d total XP but the original reported %d",
			replay.TotalXp, first.TotalXp)
	}
	if replay.XpEarned != first.XpEarned {
		t.Fatalf("replay reported %d XP earned but the original reported %d",
			replay.XpEarned, first.XpEarned)
	}
}
