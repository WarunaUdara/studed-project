package service

import (
	"context"
	"encoding/json"
	"fmt"
	"sort"
	"strings"
	"time"

	"github.com/studed/progress-service/internal/model"
	"github.com/studed/progress-service/internal/repository"
	coursepb "github.com/studed/shared/proto/gen/go/course"
	gampb "github.com/studed/shared/proto/gen/go/gamification"
	progresspb "github.com/studed/shared/proto/gen/go/progress"
)

type ProgressService interface {
	EnrollInCourse(ctx context.Context, userID, courseID string) (*progresspb.EnrollResponse, error)
	RecordAttempt(ctx context.Context, userID, waveID string, answers []*progresspb.Answer) (*progresspb.RecordAttemptResponse, error)
	GetWaveProgress(ctx context.Context, userID, waveID string) (*progresspb.WaveProgressResponse, error)
	GetCourseProgress(ctx context.Context, userID, courseID string) (*progresspb.CourseProgressResponse, error)
	IsEnrolled(ctx context.Context, userID, courseID string) (*progresspb.IsEnrolledResponse, error)
	ListEnrollments(ctx context.Context, userID string) (*progresspb.ListEnrollmentsResponse, error)
}

type progressService struct {
	repo         repository.ProgressRepository
	course       coursepb.CourseServiceClient
	gamification gampb.GamificationServiceClient
}

func NewProgressService(repo repository.ProgressRepository, courseClient coursepb.CourseServiceClient, gamificationClient gampb.GamificationServiceClient) ProgressService {
	return &progressService{
		repo:         repo,
		course:       courseClient,
		gamification: gamificationClient,
	}
}

func (s *progressService) EnrollInCourse(ctx context.Context, userID, courseID string) (*progresspb.EnrollResponse, error) {
	if userID == "" || courseID == "" {
		return nil, fmt.Errorf("user id and course id are required")
	}

	existing, err := s.repo.GetEnrollment(ctx, userID, courseID)
	if err == nil && existing != nil {
		return &progresspb.EnrollResponse{
			Enrollment: enrollmentToProto(existing),
		}, nil
	}

	enrollment := &model.Enrollment{
		UserID:     userID,
		CourseID:   courseID,
		EnrolledAt: time.Now(),
	}

	if err := s.repo.CreateEnrollment(ctx, enrollment); err != nil {
		return nil, fmt.Errorf("failed to create enrollment: %w", err)
	}

	return &progresspb.EnrollResponse{
		Enrollment: enrollmentToProto(enrollment),
	}, nil
}

func (s *progressService) RecordAttempt(ctx context.Context, userID, waveID string, answers []*progresspb.Answer) (*progresspb.RecordAttemptResponse, error) {
	if userID == "" || waveID == "" {
		return nil, fmt.Errorf("user id and wave id are required")
	}

	waveResp, err := s.course.GetWave(ctx, &coursepb.GetWaveRequest{Id: waveID})
	if err != nil {
		return nil, fmt.Errorf("failed to fetch wave: %w", err)
	}
	if waveResp.Error != "" {
		return nil, fmt.Errorf("failed to fetch wave: %s", waveResp.Error)
	}
	wave := waveResp.Wave

	lessonResp, err := s.course.GetLesson(ctx, &coursepb.GetLessonRequest{Id: wave.LessonId})
	if err != nil {
		return nil, fmt.Errorf("failed to fetch lesson: %w", err)
	}
	if lessonResp.Error != "" {
		return nil, fmt.Errorf("failed to fetch lesson: %s", lessonResp.Error)
	}
	lesson := lessonResp.Lesson

	if _, err := s.repo.GetEnrollment(ctx, userID, lesson.CourseId); err != nil {
		return nil, fmt.Errorf("user is not enrolled in this course")
	}

	progress, err := s.GetWaveProgress(ctx, userID, waveID)
	if err != nil {
		return nil, fmt.Errorf("failed to check wave progress: %w", err)
	}
	if progress.Status == string(model.ProgressStatusLocked) {
		return nil, fmt.Errorf("cannot attempt wave: wave is locked")
	}

	attempts, err := s.repo.GetAttemptsByWave(ctx, userID, waveID)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch attempts: %w", err)
	}

	if wave.MaxReattempts > 0 && int32(len(attempts)) >= wave.MaxReattempts {
		return nil, fmt.Errorf("maximum reattempts reached")
	}

	evaluateBlocks, err := parseEvaluateBlocks(wave.EvaluateBlocksJson)
	if err != nil {
		return nil, fmt.Errorf("failed to parse evaluate blocks: %w", err)
	}

	score, feedback := scoreAnswers(evaluateBlocks, answers)
	passed := false
	if len(evaluateBlocks) > 0 {
		passed = score >= wave.PassingThreshold
	}

	xpEarned := int32(0)
	totalXp := int32(0)
	if passed {
		xpResp, err := s.gamification.CalculateAndAwardXp(ctx, &gampb.XpCalculationRequest{
			UserId:           userID,
			WaveId:           waveID,
			Score:            score,
			XpReward:         wave.XpReward,
			PassingThreshold: wave.PassingThreshold,
		})
		if err != nil {
			return nil, fmt.Errorf("failed to award xp: %w", err)
		}
		if xpResp.Error != "" {
			return nil, fmt.Errorf("failed to award xp: %s", xpResp.Error)
		}
		xpEarned = xpResp.XpEarned
		totalXp = xpResp.TotalXp
	} else {
		xpResp, err := s.gamification.GetUserXp(ctx, &gampb.GetUserXpRequest{UserId: userID})
		if err == nil && xpResp.Error == "" {
			totalXp = xpResp.TotalXp
		}
	}

	answersJSON, _ := json.Marshal(answers)
	attempt := &model.WaveAttempt{
		UserID:        userID,
		WaveID:        waveID,
		LessonID:      wave.LessonId,
		CourseID:      lesson.CourseId,
		AnswersJSON:   string(answersJSON),
		Score:         score,
		Passed:        passed,
		XPAwarded:     xpEarned,
		AttemptNumber: int32(len(attempts)) + 1,
		CreatedAt:     time.Now(),
	}

	if err := s.repo.CreateAttempt(ctx, attempt); err != nil {
		return nil, fmt.Errorf("failed to record attempt: %w", err)
	}

	if passed {
		// 1. Check if lesson is complete
		wavesResp, err := s.course.ListWaves(ctx, &coursepb.ListWavesRequest{LessonId: wave.LessonId, PublishedOnly: true})
		if err == nil {
			lessonTotal := int32(len(wavesResp.Waves))
			lessonCompletedVal, err := s.repo.CountPassedWavesInLesson(ctx, userID, wave.LessonId)
			if err == nil && int32(lessonCompletedVal) == lessonTotal {
				// Unlock lesson_complete!
				_, _ = s.gamification.UnlockAchievement(ctx, &gampb.UnlockAchievementRequest{
					UserId:        userID,
					AchievementId: "lesson_complete",
				})

				// 2. Check if lesson is proficient (average score of all waves in lesson >= 80)
				var sumScores int32
				var countWaves int32
				for _, w := range wavesResp.Waves {
					var waveHighest int32
					attempts, err := s.repo.GetAttemptsByWave(ctx, userID, w.Id)
					if err == nil {
						for _, a := range attempts {
							if a.Score > waveHighest {
								waveHighest = a.Score
							}
						}
						sumScores += waveHighest
						countWaves++
					}
				}
				if countWaves == lessonTotal && lessonTotal > 0 {
					avg := float64(sumScores) / float64(lessonTotal)
					if avg >= 80 {
						_, _ = s.gamification.UnlockAchievement(ctx, &gampb.UnlockAchievementRequest{
							UserId:        userID,
							AchievementId: "lesson_proficient",
						})
					}
				}
			}
		}

		// 3. Check if course is complete
		lessonsResp, err := s.course.ListLessons(ctx, &coursepb.ListLessonsRequest{CourseId: lesson.CourseId, PublishedOnly: true})
		if err == nil {
			var courseTotalWaves int32
			for _, l := range lessonsResp.Lessons {
				lwaves, err := s.course.ListWaves(ctx, &coursepb.ListWavesRequest{LessonId: l.Id, PublishedOnly: true})
				if err == nil {
					courseTotalWaves += int32(len(lwaves.Waves))
				}
			}
			courseCompletedVal, err := s.repo.CountPassedWavesInCourse(ctx, userID, lesson.CourseId)
			if err == nil && int32(courseCompletedVal) == courseTotalWaves && courseTotalWaves > 0 {
				// Unlock first_course!
				_, _ = s.gamification.UnlockAchievement(ctx, &gampb.UnlockAchievementRequest{
					UserId:        userID,
					AchievementId: "first_course",
				})
			}
		}

		// Update totalXp to include any achievement milestone bonuses
		xpResp, err := s.gamification.GetUserXp(ctx, &gampb.GetUserXpRequest{UserId: userID})
		if err == nil && xpResp.Error == "" {
			totalXp = xpResp.TotalXp
		}
	}


	remainingAttempts := wave.MaxReattempts - int32(len(attempts)) - 1
	if remainingAttempts < 0 {
		remainingAttempts = 0
	}

	return &progresspb.RecordAttemptResponse{
		AttemptId:         attempt.ID,
		Score:             score,
		Passed:            passed,
		XpEarned:          xpEarned,
		TotalXp:           totalXp,
		RemainingAttempts: remainingAttempts,
		Feedback:          feedback,
	}, nil
}

func (s *progressService) GetWaveProgress(ctx context.Context, userID, waveID string) (*progresspb.WaveProgressResponse, error) {
	// 1. Fetch current wave details to locate its course
	waveResp, err := s.course.GetWave(ctx, &coursepb.GetWaveRequest{Id: waveID})
	if err != nil {
		return nil, fmt.Errorf("failed to fetch wave details: %w", err)
	}
	if waveResp.Error != "" {
		return nil, fmt.Errorf("failed to fetch wave details: %s", waveResp.Error)
	}
	wave := waveResp.Wave

	// 2. Fetch the lesson to find course ID
	lessonResp, err := s.course.GetLesson(ctx, &coursepb.GetLessonRequest{Id: wave.LessonId})
	if err != nil {
		return nil, fmt.Errorf("failed to fetch lesson details: %w", err)
	}
	if lessonResp.Error != "" {
		return nil, fmt.Errorf("failed to fetch lesson details: %s", lessonResp.Error)
	}
	lesson := lessonResp.Lesson
	courseID := lesson.CourseId

	// 3. Fetch all lessons in this course to reconstruct natural order
	lessonsResp, err := s.course.ListLessons(ctx, &coursepb.ListLessonsRequest{CourseId: courseID, PublishedOnly: true})
	if err != nil {
		return nil, fmt.Errorf("failed to list lessons: %w", err)
	}
	lessons := lessonsResp.Lessons
	sort.Slice(lessons, func(i, j int) bool {
		return lessons[i].SequenceOrder < lessons[j].SequenceOrder
	})

	// 4. Collect and sort all waves across the sorted lessons
	var courseWaves []*coursepb.Wave
	for _, l := range lessons {
		wavesResp, err := s.course.ListWaves(ctx, &coursepb.ListWavesRequest{LessonId: l.Id, PublishedOnly: true})
		if err != nil {
			return nil, fmt.Errorf("failed to list waves: %w", err)
		}
		lwaves := wavesResp.Waves
		sort.Slice(lwaves, func(i, j int) bool {
			return lwaves[i].SequenceOrder < lwaves[j].SequenceOrder
		})
		courseWaves = append(courseWaves, lwaves...)
	}

	// 5. Find current wave index
	currentIndex := -1
	for i, w := range courseWaves {
		if w.Id == waveID {
			currentIndex = i
			break
		}
	}

	// 6. Check if locked by previous wave completion
	if currentIndex > 0 {
		prevWaveID := courseWaves[currentIndex-1].Id
		prevAttempts, err := s.repo.GetAttemptsByWave(ctx, userID, prevWaveID)
		if err != nil {
			return nil, fmt.Errorf("failed to fetch previous wave attempts: %w", err)
		}
		prevCompleted := false
		for _, a := range prevAttempts {
			if a.Passed {
				prevCompleted = true
				break
			}
		}
		if !prevCompleted {
			return &progresspb.WaveProgressResponse{
				Status:        string(model.ProgressStatusLocked),
				AttemptsCount: 0,
			}, nil
		}
	}

	attempts, err := s.repo.GetAttemptsByWave(ctx, userID, waveID)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch attempts: %w", err)
	}

	if len(attempts) == 0 {
		return &progresspb.WaveProgressResponse{
			Status:        string(model.ProgressStatusAvailable),
			AttemptsCount: 0,
		}, nil
	}

	var highestScore int32
	var completedAt int64
	var lastAttemptedAt int64
	status := model.ProgressStatusStarted

	for _, a := range attempts {
		if a.Score > highestScore {
			highestScore = a.Score
		}
		if a.Passed && completedAt == 0 {
			completedAt = a.CreatedAt.Unix()
			status = model.ProgressStatusCompleted
		}
		if a.CreatedAt.Unix() > lastAttemptedAt {
			lastAttemptedAt = a.CreatedAt.Unix()
		}
	}

	return &progresspb.WaveProgressResponse{
		Status:              string(status),
		AttemptsCount:       int32(len(attempts)),
		HighestScore:        highestScore,
		CompletedAtUnix:     completedAt,
		LastAttemptedAtUnix: lastAttemptedAt,
	}, nil
}

func (s *progressService) GetCourseProgress(ctx context.Context, userID, courseID string) (*progresspb.CourseProgressResponse, error) {
	courseResp, err := s.course.GetCourse(ctx, &coursepb.GetCourseRequest{Id: courseID})
	if err != nil {
		return nil, fmt.Errorf("failed to fetch course: %w", err)
	}
	if courseResp.Error != "" {
		return nil, fmt.Errorf("failed to fetch course: %s", courseResp.Error)
	}
	course := courseResp.Course

	enrollment, err := s.repo.GetEnrollment(ctx, userID, courseID)
	if err != nil {
		return nil, fmt.Errorf("user is not enrolled in this course")
	}

	lessonsResp, err := s.course.ListLessons(ctx, &coursepb.ListLessonsRequest{CourseId: courseID, PublishedOnly: true})
	if err != nil {
		return nil, fmt.Errorf("failed to list lessons: %w", err)
	}

	var totalWaves int32
	var completedWaves int32

	completedWavesVal, err := s.repo.CountPassedWavesInCourse(ctx, userID, courseID)
	if err != nil {
		return nil, fmt.Errorf("failed to count passed waves in course: %w", err)
	}
	completedWaves = int32(completedWavesVal)

	lessonIDs := make([]string, len(lessonsResp.Lessons))
	for i, lesson := range lessonsResp.Lessons {
		lessonIDs[i] = lesson.Id
	}

	// One batched gRPC call for all waves across every lesson, and one
	// grouped DB query for completed-wave counts, instead of a per-lesson
	// ListWaves + CountPassedWavesInLesson round trip.
	wavesResp, err := s.course.ListWavesByLessonIds(ctx, &coursepb.ListWavesByLessonIdsRequest{LessonIds: lessonIDs, PublishedOnly: true})
	if err != nil {
		return nil, fmt.Errorf("failed to list waves: %w", err)
	}
	wavesByLesson := make(map[string]int32, len(lessonIDs))
	for _, w := range wavesResp.Waves {
		wavesByLesson[w.LessonId]++
	}

	completedByLesson, err := s.repo.CountPassedWavesGroupedByLesson(ctx, userID, courseID)
	if err != nil {
		return nil, fmt.Errorf("failed to count passed waves by lesson: %w", err)
	}

	lessonProgressList := make([]*progresspb.LessonProgress, 0, len(lessonsResp.Lessons))
	for _, lesson := range lessonsResp.Lessons {
		lessonTotal := wavesByLesson[lesson.Id]
		totalWaves += lessonTotal

		lessonProgressList = append(lessonProgressList, &progresspb.LessonProgress{
			LessonId:       lesson.Id,
			CompletedWaves: int32(completedByLesson[lesson.Id]),
			TotalWaves:     lessonTotal,
		})
	}

	_ = course
	_ = enrollment

	return &progresspb.CourseProgressResponse{
		CompletedWaves: completedWaves,
		TotalWaves:     totalWaves,
		StartedAtUnix:  enrollment.EnrolledAt.Unix(),
		LessonProgress: lessonProgressList,
	}, nil
}

func (s *progressService) IsEnrolled(ctx context.Context, userID, courseID string) (*progresspb.IsEnrolledResponse, error) {
	_, err := s.repo.GetEnrollment(ctx, userID, courseID)
	return &progresspb.IsEnrolledResponse{
		Enrolled: err == nil,
	}, nil
}

func (s *progressService) ListEnrollments(ctx context.Context, userID string) (*progresspb.ListEnrollmentsResponse, error) {
	if userID == "" {
		return nil, fmt.Errorf("user id is required")
	}

	enrollments, err := s.repo.ListEnrollmentsByUser(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to list enrollments: %w", err)
	}

	protoEnrollments := make([]*progresspb.Enrollment, len(enrollments))
	for i, e := range enrollments {
		protoEnrollments[i] = enrollmentToProto(&e)
	}

	return &progresspb.ListEnrollmentsResponse{
		Enrollments: protoEnrollments,
	}, nil
}

func enrollmentToProto(e *model.Enrollment) *progresspb.Enrollment {
	return &progresspb.Enrollment{
		Id:             e.ID,
		UserId:         e.UserID,
		CourseId:       e.CourseID,
		EnrolledAtUnix: e.EnrolledAt.Unix(),
	}
}

type evaluateBlock struct {
	ID            string   `json:"id"`
	Type          string   `json:"type"`
	Question      string   `json:"question"`
	Options       []string `json:"options,omitempty"`
	CorrectAnswer string   `json:"correctAnswer,omitempty"`
	Explanation   string   `json:"explanation,omitempty"`
}

func parseEvaluateBlocks(jsonStr string) ([]evaluateBlock, error) {
	if jsonStr == "" || jsonStr == "[]" {
		return []evaluateBlock{}, nil
	}
	var blocks []evaluateBlock
	if err := json.Unmarshal([]byte(jsonStr), &blocks); err != nil {
		return nil, err
	}
	return blocks, nil
}

func scoreAnswers(blocks []evaluateBlock, answers []*progresspb.Answer) (int32, []*progresspb.QuestionFeedback) {
	if len(blocks) == 0 {
		return 0, []*progresspb.QuestionFeedback{}
	}

	answerMap := make(map[string]string, len(answers))
	for _, a := range answers {
		answerMap[a.EvaluateBlockId] = strings.TrimSpace(strings.ToLower(a.Answer))
	}

	correctCount := 0
	feedback := make([]*progresspb.QuestionFeedback, len(blocks))

	for i, block := range blocks {
		given := answerMap[block.ID]
		correct := normalizeAnswer(given) == normalizeAnswer(block.CorrectAnswer)
		if correct {
			correctCount++
		}
		feedback[i] = &progresspb.QuestionFeedback{
			EvaluateBlockId: block.ID,
			Correct:         correct,
			CorrectAnswer:   block.CorrectAnswer,
			Explanation:     block.Explanation,
		}
	}

	score := int32((correctCount * 100) / len(blocks))
	return score, feedback
}

func normalizeAnswer(s string) string {
	return strings.TrimSpace(strings.ToLower(s))
}
