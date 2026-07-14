package service

import (
	"context"
	"testing"
	"time"

	"google.golang.org/grpc"

	"github.com/studed/progress-service/internal/model"
	coursepb "github.com/studed/shared/proto/gen/go/course"
	gampb "github.com/studed/shared/proto/gen/go/gamification"
	progresspb "github.com/studed/shared/proto/gen/go/progress"
)

/* ----- pure function tests ----- */

func TestScoreAnswers_GradesMcqAndFillInBlank(t *testing.T) {
	blocks := []evaluateBlock{
		{ID: "q1", Type: "mcq", CorrectAnswer: "Paris"},
		{ID: "q2", Type: "fill_blank", CorrectAnswer: "  Photosynthesis "},
	}
	answers := []*progresspb.Answer{
		{EvaluateBlockId: "q1", Answer: "paris"},
		{EvaluateBlockId: "q2", Answer: "PHOTOSYNTHESIS"},
	}

	score, feedback := scoreAnswers(blocks, answers)
	if score != 100 {
		t.Fatalf("expected 100 for two correct case-insensitive answers, got %d", score)
	}
	for _, f := range feedback {
		if !f.Correct {
			t.Fatalf("expected all questions correct, got %+v", f)
		}
	}
}

func TestScoreAnswers_PartialCredit(t *testing.T) {
	blocks := []evaluateBlock{
		{ID: "q1", CorrectAnswer: "yes"},
		{ID: "q2", CorrectAnswer: "no"},
		{ID: "q3", CorrectAnswer: "maybe"},
	}
	answers := []*progresspb.Answer{
		{EvaluateBlockId: "q1", Answer: "yes"},
		{EvaluateBlockId: "q2", Answer: "wrong"},
		{EvaluateBlockId: "q3", Answer: "maybe"},
	}

	score, _ := scoreAnswers(blocks, answers)
	if score != 66 {
		t.Fatalf("expected 66 (2/3 correct, integer division), got %d", score)
	}
}

func TestScoreAnswers_MissingAnswerCountsAsIncorrect(t *testing.T) {
	blocks := []evaluateBlock{{ID: "q1", CorrectAnswer: "yes"}}
	score, feedback := scoreAnswers(blocks, nil)
	if score != 0 {
		t.Fatalf("expected 0 when no answers given, got %d", score)
	}
	if feedback[0].Correct {
		t.Fatalf("expected incorrect feedback for missing answer")
	}
}

func TestScoreAnswers_NoBlocksReturnsZero(t *testing.T) {
	score, feedback := scoreAnswers(nil, nil)
	if score != 0 || len(feedback) != 0 {
		t.Fatalf("expected 0 score and no feedback with no evaluate blocks, got score=%d feedback=%+v", score, feedback)
	}
}

func TestParseEvaluateBlocks_EmptyAndInvalid(t *testing.T) {
	blocks, err := parseEvaluateBlocks("")
	if err != nil || len(blocks) != 0 {
		t.Fatalf("expected empty slice for empty string, got %+v, err=%v", blocks, err)
	}

	blocks, err = parseEvaluateBlocks("[]")
	if err != nil || len(blocks) != 0 {
		t.Fatalf("expected empty slice for '[]', got %+v, err=%v", blocks, err)
	}

	if _, err := parseEvaluateBlocks("not-json"); err == nil {
		t.Fatalf("expected error for invalid json")
	}
}

func TestNormalizeAnswer_TrimsAndLowercases(t *testing.T) {
	if normalizeAnswer("  Blue Whale  ") != "blue whale" {
		t.Fatalf("normalizeAnswer did not trim/lowercase as expected")
	}
}

/* ----- fakes for RecordAttempt / GetWaveProgress / EnrollInCourse ----- */

type fakeProgressRepo struct {
	enrollments []model.Enrollment
	attempts    []model.WaveAttempt
}

func (r *fakeProgressRepo) CreateEnrollment(ctx context.Context, e *model.Enrollment) error {
	e.ID = "enr-" + e.UserID + "-" + e.CourseID
	r.enrollments = append(r.enrollments, *e)
	return nil
}

func (r *fakeProgressRepo) GetEnrollment(ctx context.Context, userID, courseID string) (*model.Enrollment, error) {
	for i := range r.enrollments {
		if r.enrollments[i].UserID == userID && r.enrollments[i].CourseID == courseID {
			return &r.enrollments[i], nil
		}
	}
	return nil, errNotFound
}

func (r *fakeProgressRepo) ListEnrollmentsByUser(ctx context.Context, userID string) ([]model.Enrollment, error) {
	var out []model.Enrollment
	for _, e := range r.enrollments {
		if e.UserID == userID {
			out = append(out, e)
		}
	}
	return out, nil
}

func (r *fakeProgressRepo) CreateAttempt(ctx context.Context, a *model.WaveAttempt) error {
	a.ID = "attempt-" + a.WaveID + "-" + time.Now().String()
	r.attempts = append(r.attempts, *a)
	return nil
}

func (r *fakeProgressRepo) GetAttemptsByWave(ctx context.Context, userID, waveID string) ([]model.WaveAttempt, error) {
	var out []model.WaveAttempt
	for _, a := range r.attempts {
		if a.UserID == userID && a.WaveID == waveID {
			out = append(out, a)
		}
	}
	return out, nil
}

func (r *fakeProgressRepo) CountPassedWavesInCourse(ctx context.Context, userID, courseID string) (int64, error) {
	seen := map[string]bool{}
	for _, a := range r.attempts {
		if a.UserID == userID && a.CourseID == courseID && a.Passed {
			seen[a.WaveID] = true
		}
	}
	return int64(len(seen)), nil
}

func (r *fakeProgressRepo) CountPassedWavesInLesson(ctx context.Context, userID, lessonID string) (int64, error) {
	seen := map[string]bool{}
	for _, a := range r.attempts {
		if a.UserID == userID && a.LessonID == lessonID && a.Passed {
			seen[a.WaveID] = true
		}
	}
	return int64(len(seen)), nil
}

func (r *fakeProgressRepo) CountPassedWavesGroupedByLesson(ctx context.Context, userID, courseID string) (map[string]int64, error) {
	seenPerLesson := map[string]map[string]bool{}
	for _, a := range r.attempts {
		if a.UserID != userID || a.CourseID != courseID || !a.Passed {
			continue
		}
		if seenPerLesson[a.LessonID] == nil {
			seenPerLesson[a.LessonID] = map[string]bool{}
		}
		seenPerLesson[a.LessonID][a.WaveID] = true
	}
	counts := make(map[string]int64, len(seenPerLesson))
	for lessonID, waves := range seenPerLesson {
		counts[lessonID] = int64(len(waves))
	}
	return counts, nil
}

type notFoundErr struct{}

func (notFoundErr) Error() string { return "not found" }

var errNotFound = notFoundErr{}

// fakeCourseClient implements coursepb.CourseServiceClient backed by simple
// in-memory fixtures. Only the methods RecordAttempt/GetWaveProgress rely on
// are meaningfully implemented; the rest are unused by these tests.
type fakeCourseClient struct {
	coursepb.CourseServiceClient
	waves   map[string]*coursepb.Wave
	lessons map[string]*coursepb.Lesson
	// wavesByLesson holds waves in sequence order per lesson.
	wavesByLesson map[string][]*coursepb.Wave
}

func (c *fakeCourseClient) GetWave(ctx context.Context, in *coursepb.GetWaveRequest, opts ...grpc.CallOption) (*coursepb.WaveResponse, error) {
	w, ok := c.waves[in.Id]
	if !ok {
		return &coursepb.WaveResponse{Error: "wave not found"}, nil
	}
	return &coursepb.WaveResponse{Wave: w}, nil
}

func (c *fakeCourseClient) GetCourse(ctx context.Context, in *coursepb.GetCourseRequest, opts ...grpc.CallOption) (*coursepb.CourseResponse, error) {
	return &coursepb.CourseResponse{Course: &coursepb.Course{Id: in.Id, Title: "Test Course"}}, nil
}

func (c *fakeCourseClient) GetLesson(ctx context.Context, in *coursepb.GetLessonRequest, opts ...grpc.CallOption) (*coursepb.LessonResponse, error) {
	l, ok := c.lessons[in.Id]
	if !ok {
		return &coursepb.LessonResponse{Error: "lesson not found"}, nil
	}
	return &coursepb.LessonResponse{Lesson: l}, nil
}

func (c *fakeCourseClient) ListWaves(ctx context.Context, in *coursepb.ListWavesRequest, opts ...grpc.CallOption) (*coursepb.WaveListResponse, error) {
	return &coursepb.WaveListResponse{Waves: c.wavesByLesson[in.LessonId]}, nil
}

func (c *fakeCourseClient) ListWavesByLessonIds(ctx context.Context, in *coursepb.ListWavesByLessonIdsRequest, opts ...grpc.CallOption) (*coursepb.WaveListResponse, error) {
	var out []*coursepb.Wave
	for _, lessonID := range in.LessonIds {
		out = append(out, c.wavesByLesson[lessonID]...)
	}
	return &coursepb.WaveListResponse{Waves: out}, nil
}

func (c *fakeCourseClient) ListLessons(ctx context.Context, in *coursepb.ListLessonsRequest, opts ...grpc.CallOption) (*coursepb.LessonListResponse, error) {
	var out []*coursepb.Lesson
	for _, l := range c.lessons {
		if l.CourseId == in.CourseId {
			out = append(out, l)
		}
	}
	return &coursepb.LessonListResponse{Lessons: out}, nil
}

// fakeGamificationClient implements gampb.GamificationServiceClient.
type fakeGamificationClient struct {
	gampb.GamificationServiceClient
	totalXp map[string]int32
}

func newFakeGamificationClient() *fakeGamificationClient {
	return &fakeGamificationClient{totalXp: make(map[string]int32)}
}

func (c *fakeGamificationClient) CalculateAndAwardXp(ctx context.Context, in *gampb.XpCalculationRequest, opts ...grpc.CallOption) (*gampb.XpCalculationResponse, error) {
	if in.Score < in.PassingThreshold {
		return &gampb.XpCalculationResponse{}, nil
	}
	c.totalXp[in.UserId] += in.XpReward
	return &gampb.XpCalculationResponse{XpEarned: in.XpReward, TotalXp: c.totalXp[in.UserId]}, nil
}

func (c *fakeGamificationClient) GetUserXp(ctx context.Context, in *gampb.GetUserXpRequest, opts ...grpc.CallOption) (*gampb.GetUserXpResponse, error) {
	return &gampb.GetUserXpResponse{TotalXp: c.totalXp[in.UserId]}, nil
}

func (c *fakeGamificationClient) UnlockAchievement(ctx context.Context, in *gampb.UnlockAchievementRequest, opts ...grpc.CallOption) (*gampb.UnlockAchievementResponse, error) {
	return &gampb.UnlockAchievementResponse{Unlocked: true}, nil
}

func newTestProgressService() (*progressService, *fakeProgressRepo, *fakeCourseClient, *fakeGamificationClient) {
	repo := &fakeProgressRepo{}
	course := &fakeCourseClient{
		waves:         make(map[string]*coursepb.Wave),
		lessons:       make(map[string]*coursepb.Lesson),
		wavesByLesson: make(map[string][]*coursepb.Wave),
	}
	gamification := newFakeGamificationClient()

	lesson := &coursepb.Lesson{Id: "lesson-1", CourseId: "course-1", SequenceOrder: 1}
	course.lessons[lesson.Id] = lesson

	wave1 := &coursepb.Wave{
		Id: "wave-1", LessonId: lesson.Id, SequenceOrder: 1,
		XpReward: 100, MaxReattempts: 2, PassingThreshold: 70,
		EvaluateBlocksJson: `[{"id":"q1","correctAnswer":"yes"}]`,
	}
	wave2 := &coursepb.Wave{
		Id: "wave-2", LessonId: lesson.Id, SequenceOrder: 2,
		XpReward: 100, MaxReattempts: 2, PassingThreshold: 70,
		EvaluateBlocksJson: `[{"id":"q1","correctAnswer":"yes"}]`,
	}
	course.waves[wave1.Id] = wave1
	course.waves[wave2.Id] = wave2
	course.wavesByLesson[lesson.Id] = []*coursepb.Wave{wave1, wave2}

	svc := NewProgressService(repo, course, gamification).(*progressService)
	return svc, repo, course, gamification
}

func TestEnrollInCourse_IsIdempotent(t *testing.T) {
	svc, repo, _, _ := newTestProgressService()

	first, err := svc.EnrollInCourse(context.Background(), "u1", "course-1")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	second, err := svc.EnrollInCourse(context.Background(), "u1", "course-1")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if first.Enrollment.Id != second.Enrollment.Id {
		t.Fatalf("expected the same enrollment to be returned, got %s vs %s", first.Enrollment.Id, second.Enrollment.Id)
	}
	if len(repo.enrollments) != 1 {
		t.Fatalf("expected exactly one enrollment record, got %d", len(repo.enrollments))
	}
}

func TestRecordAttempt_RejectsUnenrolledUser(t *testing.T) {
	svc, _, _, _ := newTestProgressService()

	_, err := svc.RecordAttempt(context.Background(), "u1", "wave-1", []*progresspb.Answer{
		{EvaluateBlockId: "q1", Answer: "yes"},
	})
	if err == nil {
		t.Fatalf("expected an error for an unenrolled user")
	}
}

func TestRecordAttempt_FirstWaveIsAvailableAndAwardsXp(t *testing.T) {
	svc, _, _, gamification := newTestProgressService()
	if _, err := svc.EnrollInCourse(context.Background(), "u1", "course-1"); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	resp, err := svc.RecordAttempt(context.Background(), "u1", "wave-1", []*progresspb.Answer{
		{EvaluateBlockId: "q1", Answer: "yes"},
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !resp.Passed || resp.Score != 100 {
		t.Fatalf("expected a passing 100%% attempt, got %+v", resp)
	}
	if resp.XpEarned != 100 {
		t.Fatalf("expected 100 xp earned, got %d", resp.XpEarned)
	}
	if gamification.totalXp["u1"] != 100 {
		t.Fatalf("expected gamification service to record 100 total xp, got %d", gamification.totalXp["u1"])
	}
}

func TestRecordAttempt_SecondWaveLockedUntilFirstPassed(t *testing.T) {
	svc, _, _, _ := newTestProgressService()
	if _, err := svc.EnrollInCourse(context.Background(), "u1", "course-1"); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	_, err := svc.RecordAttempt(context.Background(), "u1", "wave-2", []*progresspb.Answer{
		{EvaluateBlockId: "q1", Answer: "yes"},
	})
	if err == nil {
		t.Fatalf("expected wave-2 to be locked before wave-1 is passed")
	}
}

func TestRecordAttempt_UnlocksNextWaveAfterPassing(t *testing.T) {
	svc, _, _, _ := newTestProgressService()
	if _, err := svc.EnrollInCourse(context.Background(), "u1", "course-1"); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if _, err := svc.RecordAttempt(context.Background(), "u1", "wave-1", []*progresspb.Answer{
		{EvaluateBlockId: "q1", Answer: "yes"},
	}); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	resp, err := svc.RecordAttempt(context.Background(), "u1", "wave-2", []*progresspb.Answer{
		{EvaluateBlockId: "q1", Answer: "yes"},
	})
	if err != nil {
		t.Fatalf("expected wave-2 to now be unlocked, got error: %v", err)
	}
	if !resp.Passed {
		t.Fatalf("expected wave-2 attempt to pass")
	}
}

func TestRecordAttempt_EnforcesMaxReattempts(t *testing.T) {
	svc, _, _, _ := newTestProgressService()
	if _, err := svc.EnrollInCourse(context.Background(), "u1", "course-1"); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	failingAnswer := []*progresspb.Answer{{EvaluateBlockId: "q1", Answer: "no"}}
	// wave-1 allows MaxReattempts=2, so 2 attempts should succeed...
	for i := 0; i < 2; i++ {
		if _, err := svc.RecordAttempt(context.Background(), "u1", "wave-1", failingAnswer); err != nil {
			t.Fatalf("attempt %d: unexpected error: %v", i+1, err)
		}
	}
	// ...and the 3rd should be rejected.
	if _, err := svc.RecordAttempt(context.Background(), "u1", "wave-1", failingAnswer); err == nil {
		t.Fatalf("expected the 3rd attempt to be rejected once max reattempts is reached")
	}
}

func TestGetWaveProgress_AvailableWithNoAttempts(t *testing.T) {
	svc, _, _, _ := newTestProgressService()

	resp, err := svc.GetWaveProgress(context.Background(), "u1", "wave-1")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if resp.Status != string(model.ProgressStatusAvailable) {
		t.Fatalf("expected AVAILABLE, got %s", resp.Status)
	}
}

func TestGetWaveProgress_LockedWithoutPriorWaveCompletion(t *testing.T) {
	svc, _, _, _ := newTestProgressService()

	resp, err := svc.GetWaveProgress(context.Background(), "u1", "wave-2")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if resp.Status != string(model.ProgressStatusLocked) {
		t.Fatalf("expected LOCKED for wave-2 before wave-1 is passed, got %s", resp.Status)
	}
}

func TestGetCourseProgress_AggregatesAcrossMultipleLessons(t *testing.T) {
	repo := &fakeProgressRepo{}
	course := &fakeCourseClient{
		waves:         make(map[string]*coursepb.Wave),
		lessons:       make(map[string]*coursepb.Lesson),
		wavesByLesson: make(map[string][]*coursepb.Wave),
	}
	gamification := newFakeGamificationClient()

	lesson1 := &coursepb.Lesson{Id: "lesson-1", CourseId: "course-1", SequenceOrder: 1}
	lesson2 := &coursepb.Lesson{Id: "lesson-2", CourseId: "course-1", SequenceOrder: 2}
	course.lessons[lesson1.Id] = lesson1
	course.lessons[lesson2.Id] = lesson2

	wave1 := &coursepb.Wave{Id: "wave-1", LessonId: lesson1.Id, SequenceOrder: 1}
	wave2 := &coursepb.Wave{Id: "wave-2", LessonId: lesson1.Id, SequenceOrder: 2}
	wave3 := &coursepb.Wave{Id: "wave-3", LessonId: lesson2.Id, SequenceOrder: 1}
	course.wavesByLesson[lesson1.Id] = []*coursepb.Wave{wave1, wave2}
	course.wavesByLesson[lesson2.Id] = []*coursepb.Wave{wave3}

	svc := NewProgressService(repo, course, gamification).(*progressService)

	if _, err := svc.EnrollInCourse(context.Background(), "u1", "course-1"); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	// Pass wave-1 (lesson-1) and wave-3 (lesson-2); leave wave-2 unattempted.
	repo.attempts = append(repo.attempts,
		model.WaveAttempt{UserID: "u1", WaveID: "wave-1", LessonID: lesson1.Id, CourseID: "course-1", Passed: true},
		model.WaveAttempt{UserID: "u1", WaveID: "wave-3", LessonID: lesson2.Id, CourseID: "course-1", Passed: true},
	)

	resp, err := svc.GetCourseProgress(context.Background(), "u1", "course-1")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if resp.TotalWaves != 3 {
		t.Fatalf("expected 3 total waves across both lessons, got %d", resp.TotalWaves)
	}
	if resp.CompletedWaves != 2 {
		t.Fatalf("expected 2 completed waves, got %d", resp.CompletedWaves)
	}
	if len(resp.LessonProgress) != 2 {
		t.Fatalf("expected per-lesson progress for both lessons, got %d entries", len(resp.LessonProgress))
	}

	byLesson := map[string]*progresspb.LessonProgress{}
	for _, lp := range resp.LessonProgress {
		byLesson[lp.LessonId] = lp
	}
	if byLesson[lesson1.Id].TotalWaves != 2 || byLesson[lesson1.Id].CompletedWaves != 1 {
		t.Fatalf("unexpected lesson-1 progress: %+v", byLesson[lesson1.Id])
	}
	if byLesson[lesson2.Id].TotalWaves != 1 || byLesson[lesson2.Id].CompletedWaves != 1 {
		t.Fatalf("unexpected lesson-2 progress: %+v", byLesson[lesson2.Id])
	}
}

func TestGetCourseProgress_RejectsUnenrolledUser(t *testing.T) {
	svc, _, _, _ := newTestProgressService()
	if _, err := svc.GetCourseProgress(context.Background(), "u1", "course-1"); err == nil {
		t.Fatal("expected an error for an unenrolled user")
	}
}
