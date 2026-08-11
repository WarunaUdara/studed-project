package service

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"math"
	"regexp"
	"sort"
	"strconv"
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
	RecordAttempt(ctx context.Context, userID, waveID string, answers []*progresspb.Answer, submissionID string) (*progresspb.RecordAttemptResponse, error)
	GetWaveProgress(ctx context.Context, userID, waveID string) (*progresspb.WaveProgressResponse, error)
	GetCourseProgress(ctx context.Context, userID, courseID string) (*progresspb.CourseProgressResponse, error)
	IsEnrolled(ctx context.Context, userID, courseID string) (*progresspb.IsEnrolledResponse, error)
	ListEnrollments(ctx context.Context, userID string) (*progresspb.ListEnrollmentsResponse, error)
	ResetWaveAttempts(ctx context.Context, req *progresspb.ResetWaveAttemptsRequest) (*progresspb.ResetWaveAttemptsResponse, error)
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
		return nil, fmt.Errorf("failed to enroll: %w", err)
	}

	return &progresspb.EnrollResponse{
		Enrollment: enrollmentToProto(enrollment),
	}, nil
}

func (s *progressService) RecordAttempt(ctx context.Context, userID, waveID string, answers []*progresspb.Answer, submissionID string) (*progresspb.RecordAttemptResponse, error) {
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

	// Idempotency check: if submissionID was already recorded, return existing attempt directly
	if submissionID != "" {
		if existing, err := s.repo.GetAttemptBySubmissionID(ctx, submissionID); err == nil && existing != nil {
			evaluateBlocks, _ := parseEvaluateBlocks(wave.EvaluateBlocksJson)
			var existingAnswers []*progresspb.Answer
			_ = json.Unmarshal([]byte(existing.AnswersJSON), &existingAnswers)
			_, feedback := scoreAnswers(evaluateBlocks, existingAnswers)

			remaining := int32(-1)
			if wave.MaxReattempts > 0 {
				if attempts, err := s.repo.GetAttemptsByWave(ctx, userID, waveID); err == nil {
					remaining = wave.MaxReattempts - int32(len(attempts))
					if remaining < 0 {
						remaining = 0
					}
				}
			}

			// Idempotent retry: an attempt that passed but never recorded XP
			// (the original award call failed) is reconciled here by re-running
			// the award. Gamification's award-once semantics make this safe —
			// it can never double-award. Attempts that already recorded XP
			// (>0) skip the award path entirely.
			var warnings []string
			xpEarned := existing.XPAwarded
			totalXp := int32(0)
			if existing.Passed && existing.XPAwarded == 0 {
				var earned int32
				earned, totalXp, warnings = s.awardXpForWave(ctx, existing.UserID, existing.WaveID, existing.Score, wave.XpReward, wave.PassingThreshold, existing.ID)
				if earned > 0 {
					existing.XPAwarded = earned
					xpEarned = earned
				}
			}

			return &progresspb.RecordAttemptResponse{
				AttemptId:         existing.ID,
				Score:             existing.Score,
				Passed:            existing.Passed,
				XpEarned:          xpEarned,
				TotalXp:           totalXp,
				RemainingAttempts: remaining,
				Feedback:          feedback,
				Warnings:          warnings,
			}, nil
		}
	}

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

	answersJSON, _ := json.Marshal(answers)
	attempt := &model.WaveAttempt{
		UserID:        userID,
		WaveID:        waveID,
		LessonID:      wave.LessonId,
		CourseID:      lesson.CourseId,
		SubmissionID:  submissionID,
		AnswersJSON:   string(answersJSON),
		Score:         score,
		Passed:        passed,
		XPAwarded:     0,
		AttemptNumber: int32(len(attempts)) + 1,
		CreatedAt:     time.Now(),
	}

	// Persist attempt in DB FIRST before attempting XP calculations to prevent ghost XP inflation
	if err := s.repo.CreateAttempt(ctx, attempt); err != nil {
		return nil, fmt.Errorf("failed to record attempt: %w", err)
	}

	xpEarned := int32(0)
	totalXp := int32(0)
	var warnings []string
	if passed {
		xpEarned, totalXp, warnings = s.awardXpForWave(ctx, userID, waveID, score, wave.XpReward, wave.PassingThreshold, attempt.ID)
	} else {
		total, err := s.fetchTotalXp(ctx, userID)
		if err != nil {
			slog.Warn("get_user_xp call failed", slog.String("user_id", userID), slog.Any("error", err))
			warnings = append(warnings, fmt.Sprintf("failed to fetch total xp: %v", err))
		} else {
			totalXp = total
		}
	}

	if passed {
		// 1. Check if lesson is complete
		wavesResp, err := s.course.ListWaves(ctx, &coursepb.ListWavesRequest{LessonId: wave.LessonId, PublishedOnly: true})
		if err == nil {
			lessonTotal := int32(len(wavesResp.Waves))
			lessonCompletedVal, err := s.repo.CountPassedWavesInLesson(ctx, userID, wave.LessonId)
			if err == nil && int32(lessonCompletedVal) == lessonTotal {
				// Unlock lesson_complete!
				if _, err := s.gamification.UnlockAchievement(ctx, &gampb.UnlockAchievementRequest{
					UserId:        userID,
					AchievementId: "lesson_complete",
				}); err != nil {
					slog.Error("failed to unlock lesson_complete achievement", slog.String("user_id", userID), slog.String("wave_id", waveID), slog.Any("error", err))
				}

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
						if _, err := s.gamification.UnlockAchievement(ctx, &gampb.UnlockAchievementRequest{
							UserId:        userID,
							AchievementId: "lesson_proficient",
						}); err != nil {
							slog.Error("failed to unlock lesson_proficient achievement", slog.String("user_id", userID), slog.String("wave_id", waveID), slog.Any("error", err))
						}
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
				if _, err := s.gamification.UnlockAchievement(ctx, &gampb.UnlockAchievementRequest{
					UserId:        userID,
					AchievementId: "first_course",
				}); err != nil {
					slog.Error("failed to unlock first_course achievement", slog.String("user_id", userID), slog.String("wave_id", waveID), slog.Any("error", err))
				}
			}
		}

		// Update totalXp to include any achievement milestone bonuses
		total, err := s.fetchTotalXp(ctx, userID)
		if err != nil {
			slog.Warn("failed to refresh total xp after achievement evaluation", slog.String("user_id", userID), slog.Any("error", err))
			warnings = append(warnings, fmt.Sprintf("failed to refresh total xp: %v", err))
		} else {
			totalXp = total
		}
	}

	remainingAttempts := int32(-1)
	if wave.MaxReattempts > 0 {
		remainingAttempts = wave.MaxReattempts - int32(len(attempts)) - 1
		if remainingAttempts < 0 {
			remainingAttempts = 0
		}
	}

	return &progresspb.RecordAttemptResponse{
		AttemptId:         attempt.ID,
		Score:             score,
		Passed:            passed,
		XpEarned:          xpEarned,
		TotalXp:           totalXp,
		RemainingAttempts: remainingAttempts,
		Feedback:          feedback,
		Warnings:          warnings,
	}, nil
}

// awardXpForWave calls gamification to calculate and award XP for a passed
// wave, records the awarded amount on the attempt row, and returns the XP
// earned, the user's resulting total, and any non-fatal warnings.
//
// Errors from gamification never fail the submission (the attempt is already
// persisted): they are logged and surfaced as warnings so an ambiguous XP
// state is never silently reported as "0 XP earned". A failed attempt-row
// update is surfaced the same way — the user keeps their awarded XP, and the
// row is reconciled on a retry of the same submission.
func (s *progressService) awardXpForWave(ctx context.Context, userID, waveID string, score, xpReward, passingThreshold int32, attemptID string) (int32, int32, []string) {
	xpResp, err := s.gamification.CalculateAndAwardXp(ctx, &gampb.XpCalculationRequest{
		UserId:           userID,
		WaveId:           waveID,
		Score:            score,
		XpReward:         xpReward,
		PassingThreshold: passingThreshold,
	})
	if err != nil {
		slog.Error("calculate_and_award_xp call failed; xp state unknown",
			slog.String("user_id", userID), slog.String("wave_id", waveID),
			slog.String("attempt_id", attemptID), slog.Any("error", err))
		return 0, 0, []string{fmt.Sprintf("xp award failed: %v", err)}
	}
	if xpResp.Error != "" {
		slog.Error("calculate_and_award_xp returned an error; xp state unknown",
			slog.String("user_id", userID), slog.String("wave_id", waveID),
			slog.String("attempt_id", attemptID), slog.String("error", xpResp.Error))
		return 0, 0, []string{fmt.Sprintf("xp award failed: %s", xpResp.Error)}
	}

	if attemptID != "" && xpResp.XpEarned > 0 {
		if err := s.repo.UpdateAttemptXPAwarded(ctx, attemptID, xpResp.XpEarned); err != nil {
			slog.Error("xp awarded but failed to record it on the attempt row",
				slog.String("attempt_id", attemptID), slog.Int("xp_earned", int(xpResp.XpEarned)),
				slog.Any("error", err))
			return xpResp.XpEarned, xpResp.TotalXp, []string{
				fmt.Sprintf("xp of %d was awarded but recording it on the attempt failed: %v", xpResp.XpEarned, err),
			}
		}
	}
	return xpResp.XpEarned, xpResp.TotalXp, nil
}

// fetchTotalXp returns the user's current total XP, or an error if the
// gamification service could not be reached. Callers decide whether to surface
// the failure as a warning instead of silently reporting 0.
func (s *progressService) fetchTotalXp(ctx context.Context, userID string) (int32, error) {
	xpResp, err := s.gamification.GetUserXp(ctx, &gampb.GetUserXpRequest{UserId: userID})
	if err != nil {
		return 0, err
	}
	if xpResp.Error != "" {
		return 0, errors.New(xpResp.Error)
	}
	return xpResp.TotalXp, nil
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
		prevWave := courseWaves[currentIndex-1]
		prevAttempts, err := s.repo.GetAttemptsByWave(ctx, userID, prevWave.Id)
		if err != nil {
			return nil, fmt.Errorf("failed to fetch previous wave attempts: %w", err)
		}
		prevUnlockedNext := false
		for _, a := range prevAttempts {
			if a.Passed {
				prevUnlockedNext = true
				break
			}
		}
		if !prevUnlockedNext && prevWave.MaxReattempts > 0 && int32(len(prevAttempts)) >= prevWave.MaxReattempts {
			prevUnlockedNext = true
		}
		if !prevUnlockedNext {
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

func (s *progressService) ResetWaveAttempts(ctx context.Context, req *progresspb.ResetWaveAttemptsRequest) (*progresspb.ResetWaveAttemptsResponse, error) {
	if req.UserId == "" || req.WaveId == "" {
		return &progresspb.ResetWaveAttemptsResponse{
			Success: false,
			Error:   "user_id and wave_id are required",
		}, nil
	}

	if err := s.repo.DeleteAttemptsByWave(ctx, req.UserId, req.WaveId); err != nil {
		return &progresspb.ResetWaveAttemptsResponse{
			Success: false,
			Error:   fmt.Sprintf("failed to reset wave attempts: %v", err),
		}, nil
	}

	return &progresspb.ResetWaveAttemptsResponse{
		Success: true,
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
		correct := answersEquivalent(given, block.CorrectAnswer)
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

	score := int32(math.Round(float64(correctCount*100) / float64(len(blocks))))
	return score, feedback
}

func normalizeAnswer(s string) string {
	cleaned := strings.TrimSpace(strings.ToLower(s))
	if f, err := strconv.ParseFloat(cleaned, 64); err == nil {
		return fmt.Sprintf("%g", f)
	}
	return cleaned
}

// answersEquivalent reports whether a student answer matches the expected
// answer, accepting mathematically equivalent forms such as "0.5", ".5",
// "1/2", "1 1/2", "50%", and "\frac{1}{2}".
func answersEquivalent(given, expected string) bool {
	if normalizeAnswer(given) == normalizeAnswer(expected) {
		return true
	}

	gv, gok := parseNumeric(given)
	ev, eok := parseNumeric(expected)
	if !gok || !eok {
		return false
	}
	return numbersEqual(gv, ev)
}

func numbersEqual(a, b float64) bool {
	if a == b {
		return true
	}
	diff := math.Abs(a - b)
	scale := math.Max(math.Abs(a), math.Abs(b))
	return diff <= 1e-9*scale
}

var latexFracRe = regexp.MustCompile(`^\\d?frac\{([^{}]+)\}\{([^{}]+)\}$`)

// parseNumeric evaluates a numeric answer in decimal, fraction, mixed-number,
// percentage, or simple LaTeX \frac form.
func parseNumeric(s string) (float64, bool) {
	cleaned := strings.TrimSpace(strings.ToLower(s))
	cleaned = strings.TrimPrefix(cleaned, "$")
	cleaned = strings.TrimSuffix(cleaned, "$")
	cleaned = strings.ReplaceAll(strings.TrimSpace(cleaned), ",", "")

	percent := false
	if strings.HasSuffix(cleaned, "%") {
		percent = true
		cleaned = strings.TrimSpace(strings.TrimSuffix(cleaned, "%"))
	}

	if m := latexFracRe.FindStringSubmatch(cleaned); m != nil {
		cleaned = m[1] + "/" + m[2]
	}

	value, ok := parseFractionOrFloat(cleaned)
	if !ok {
		return 0, false
	}
	if percent {
		value /= 100
	}
	return value, true
}

func parseFractionOrFloat(s string) (float64, bool) {
	s = strings.TrimSpace(s)

	// Mixed number, e.g. "1 1/2" or "-2 3/4".
	if parts := strings.Fields(s); len(parts) == 2 && strings.Contains(parts[1], "/") {
		whole, err := strconv.ParseFloat(parts[0], 64)
		if err != nil {
			return 0, false
		}
		frac, ok := parseFractionOrFloat(parts[1])
		if !ok {
			return 0, false
		}
		if strings.HasPrefix(s, "-") {
			return whole - frac, true
		}
		return whole + frac, true
	}

	if num, den, found := strings.Cut(s, "/"); found {
		n, errN := strconv.ParseFloat(strings.TrimSpace(num), 64)
		d, errD := strconv.ParseFloat(strings.TrimSpace(den), 64)
		if errN != nil || errD != nil || d == 0 {
			return 0, false
		}
		return n / d, true
	}

	f, err := strconv.ParseFloat(s, 64)
	if err != nil {
		return 0, false
	}
	return f, true
}
