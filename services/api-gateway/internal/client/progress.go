package client

import (
	"context"
	"fmt"
	"time"

	"github.com/studed/api-gateway/graph/model"
	progresspb "github.com/studed/shared/proto/gen/go/progress"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

type ProgressClient struct {
	client       progresspb.ProgressServiceClient
	conn         *grpc.ClientConn
	courseClient *CourseClient
}

func NewProgressClient(addr string, courseClient *CourseClient) (*ProgressClient, error) {
	conn, err := grpc.NewClient(addr, grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		return nil, fmt.Errorf("failed to connect to progress service: %w", err)
	}

	return &ProgressClient{
		client:       progresspb.NewProgressServiceClient(conn),
		conn:         conn,
		courseClient: courseClient,
	}, nil
}

func (c *ProgressClient) Close() error {
	return c.conn.Close()
}

func (c *ProgressClient) EnrollInCourse(ctx context.Context, userID, courseID string) (*model.Course, error) {
	resp, err := c.client.EnrollInCourse(ctx, &progresspb.EnrollRequest{
		UserId:   userID,
		CourseId: courseID,
	})
	if err != nil {
		return nil, fmt.Errorf("enroll failed: %w", err)
	}
	if resp.Error != "" {
		return nil, fmt.Errorf("enroll failed: %s", resp.Error)
	}

	return nil, nil
}

func (c *ProgressClient) SubmitWaveAnswers(ctx context.Context, userID, waveID string, answers []*model.AnswerInput) (*model.WaveResult, error) {
	protoAnswers := make([]*progresspb.Answer, len(answers))
	for i, a := range answers {
		protoAnswers[i] = &progresspb.Answer{
			EvaluateBlockId: a.EvaluateBlockID,
			Answer:          a.Answer,
		}
	}

	resp, err := c.client.RecordAttempt(ctx, &progresspb.RecordAttemptRequest{
		UserId:  userID,
		WaveId:  waveID,
		Answers: protoAnswers,
	})
	if err != nil {
		return nil, fmt.Errorf("submit answers failed: %w", err)
	}
	if resp.Error != "" {
		return nil, fmt.Errorf("submit answers failed: %s", resp.Error)
	}

	feedback := make([]*model.QuestionFeedback, len(resp.Feedback))
	for i, f := range resp.Feedback {
		feedback[i] = &model.QuestionFeedback{
			EvaluateBlockID: f.EvaluateBlockId,
			Correct:         f.Correct,
			CorrectAnswer:   &f.CorrectAnswer,
			Explanation:     &f.Explanation,
		}
	}

	remainingAttempts := int(resp.RemainingAttempts)
	return &model.WaveResult{
		Score:             int(resp.Score),
		XpEarned:          int(resp.XpEarned),
		TotalXp:           int(resp.TotalXp),
		Passed:            resp.Passed,
		RemainingAttempts: &remainingAttempts,
		Feedback:          feedback,
	}, nil
}

func (c *ProgressClient) GetWaveProgress(ctx context.Context, userID, waveID string) (*model.WaveProgress, error) {
	resp, err := c.client.GetWaveProgress(ctx, &progresspb.GetWaveProgressRequest{
		UserId: userID,
		WaveId: waveID,
	})
	if err != nil {
		return nil, fmt.Errorf("get wave progress failed: %w", err)
	}
	if resp.Error != "" {
		return nil, fmt.Errorf("get wave progress failed: %s", resp.Error)
	}

	var completedAt *time.Time
	if resp.CompletedAtUnix > 0 {
		t := timeFromUnix(resp.CompletedAtUnix)
		completedAt = &t
	}

	var lastAttemptedAt *time.Time
	if resp.LastAttemptedAtUnix > 0 {
		t := timeFromUnix(resp.LastAttemptedAtUnix)
		lastAttemptedAt = &t
	}

	highestScore := int(resp.HighestScore)
	return &model.WaveProgress{
		Status:          model.ProgressStatus(resp.Status),
		AttemptsCount:   int(resp.AttemptsCount),
		HighestScore:    &highestScore,
		CompletedAt:     completedAt,
		LastAttemptedAt: lastAttemptedAt,
	}, nil
}

func (c *ProgressClient) GetCourseProgress(ctx context.Context, userID, courseID string) ([]*model.LessonProgress, error) {
	resp, err := c.client.GetCourseProgress(ctx, &progresspb.GetCourseProgressRequest{
		UserId:   userID,
		CourseId: courseID,
	})
	if err != nil {
		return nil, fmt.Errorf("get course progress failed: %w", err)
	}
	if resp.Error != "" {
		return nil, fmt.Errorf("get course progress failed: %s", resp.Error)
	}

	lessonMap := make(map[string]*model.Lesson)
	if c.courseClient != nil {
		course, err := c.courseClient.GetCourseWithLessons(ctx, courseID)
		if err == nil && course != nil {
			for _, lesson := range course.Lessons {
				lessonMap[lesson.ID] = lesson
			}
		}
	}

	result := make([]*model.LessonProgress, len(resp.LessonProgress))
	for i, lp := range resp.LessonProgress {
		lesson := lessonMap[lp.LessonId]
		if lesson == nil {
			lesson = &model.Lesson{ID: lp.LessonId}
		}
		result[i] = &model.LessonProgress{
			Lesson:         lesson,
			CompletedWaves: int(lp.CompletedWaves),
			TotalWaves:     int(lp.TotalWaves),
		}
	}

	return result, nil
}

func (c *ProgressClient) IsEnrolled(ctx context.Context, userID, courseID string) (bool, error) {
	resp, err := c.client.IsEnrolled(ctx, &progresspb.IsEnrolledRequest{
		UserId:   userID,
		CourseId: courseID,
	})
	if err != nil {
		return false, fmt.Errorf("is enrolled failed: %w", err)
	}
	if resp.Error != "" {
		return false, fmt.Errorf("is enrolled failed: %s", resp.Error)
	}
	return resp.Enrolled, nil
}

func (c *ProgressClient) GetCourseProgressSummary(ctx context.Context, userID, courseID string) (*model.CourseProgress, error) {
	resp, err := c.client.GetCourseProgress(ctx, &progresspb.GetCourseProgressRequest{
		UserId:   userID,
		CourseId: courseID,
	})
	if err != nil {
		return nil, fmt.Errorf("get course progress failed: %w", err)
	}
	if resp.Error != "" {
		return nil, fmt.Errorf("get course progress failed: %s", resp.Error)
	}

	return &model.CourseProgress{
		CompletedWaves: int(resp.CompletedWaves),
		TotalWaves:     int(resp.TotalWaves),
	}, nil
}

func (c *ProgressClient) GetEnrolledCourses(ctx context.Context, userID string) ([]*model.Course, error) {
	resp, err := c.client.ListEnrollments(ctx, &progresspb.ListEnrollmentsRequest{UserId: userID})
	if err != nil {
		return nil, fmt.Errorf("list enrollments failed: %w", err)
	}
	if resp.Error != "" {
		return nil, fmt.Errorf("list enrollments failed: %s", resp.Error)
	}

	courses := make([]*model.Course, 0, len(resp.Enrollments))
	for _, e := range resp.Enrollments {
		if c.courseClient == nil {
			continue
		}
		course, err := c.courseClient.GetCourseWithLessons(ctx, e.CourseId)
		if err != nil {
			continue
		}
		courses = append(courses, course)
	}

	return courses, nil
}
