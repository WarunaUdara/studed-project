package graph

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"time"

	"github.com/studed/api-gateway/graph/model"
	"github.com/studed/api-gateway/internal/middleware"
)

func setAuthCookies(ctx context.Context, accessToken, refreshToken string) {
	w, ok := middleware.ResponseWriterFromContext(ctx)
	if !ok {
		return
	}

	http.SetCookie(w, &http.Cookie{
		Name:     "access_token",
		Value:    accessToken,
		HttpOnly: true,
		Secure:   false,
		SameSite: http.SameSiteLaxMode,
		Path:     "/",
		MaxAge:   int(15 * time.Minute / time.Second),
	})

	http.SetCookie(w, &http.Cookie{
		Name:     "refresh_token",
		Value:    refreshToken,
		HttpOnly: true,
		Secure:   false,
		SameSite: http.SameSiteLaxMode,
		Path:     "/",
		MaxAge:   int(7 * 24 * time.Hour / time.Second),
	})
}

// Register is the resolver for the register field.
func (r *mutationResolver) Register(ctx context.Context, input model.RegisterInput) (*model.AuthPayload, error) {
	payload, err := r.AuthClient.Register(ctx, input)
	if err != nil {
		return nil, err
	}
	setAuthCookies(ctx, payload.AccessToken, payload.RefreshToken)
	return payload, nil
}

// Login is the resolver for the login field.
func (r *mutationResolver) Login(ctx context.Context, input model.LoginInput) (*model.AuthPayload, error) {
	payload, err := r.AuthClient.Login(ctx, input)
	if err != nil {
		return nil, err
	}
	setAuthCookies(ctx, payload.AccessToken, payload.RefreshToken)
	return payload, nil
}

// RefreshToken is the resolver for the refreshToken field.
func (r *mutationResolver) RefreshToken(ctx context.Context, refreshToken string) (*model.AuthPayload, error) {
	payload, err := r.AuthClient.RefreshToken(ctx, refreshToken)
	if err != nil {
		return nil, err
	}
	setAuthCookies(ctx, payload.AccessToken, payload.RefreshToken)
	return payload, nil
}

// Logout is the resolver for the logout field.
func (r *mutationResolver) Logout(ctx context.Context) (bool, error) {
	w, ok := middleware.ResponseWriterFromContext(ctx)
	if !ok {
		return true, nil
	}

	http.SetCookie(w, &http.Cookie{
		Name:     "access_token",
		Value:    "",
		HttpOnly: true,
		Secure:   false,
		SameSite: http.SameSiteLaxMode,
		Path:     "/",
		MaxAge:   -1,
	})

	http.SetCookie(w, &http.Cookie{
		Name:     "refresh_token",
		Value:    "",
		HttpOnly: true,
		Secure:   false,
		SameSite: http.SameSiteLaxMode,
		Path:     "/",
		MaxAge:   -1,
	})

	return true, nil
}

// CreateCourse is the resolver for the createCourse field.
func (r *mutationResolver) CreateCourse(ctx context.Context, input model.CreateCourseInput) (*model.Course, error) {
	return nil, errors.New("not implemented")
}

// UpdateCourse is the resolver for the updateCourse field.
func (r *mutationResolver) UpdateCourse(ctx context.Context, id string, input model.UpdateCourseInput) (*model.Course, error) {
	return nil, errors.New("not implemented")
}

// PublishCourse is the resolver for the publishCourse field.
func (r *mutationResolver) PublishCourse(ctx context.Context, id string) (*model.Course, error) {
	return nil, errors.New("not implemented")
}

// CreateLesson is the resolver for the createLesson field.
func (r *mutationResolver) CreateLesson(ctx context.Context, courseID string, input model.CreateLessonInput) (*model.Lesson, error) {
	return nil, errors.New("not implemented")
}

// CreateWave is the resolver for the createWave field.
func (r *mutationResolver) CreateWave(ctx context.Context, lessonID string, input model.CreateWaveInput) (*model.Wave, error) {
	return nil, errors.New("not implemented")
}

// UpdateWave is the resolver for the updateWave field.
func (r *mutationResolver) UpdateWave(ctx context.Context, id string, input model.UpdateWaveInput) (*model.Wave, error) {
	return nil, errors.New("not implemented")
}

// SubmitWaveAnswers is the resolver for the submitWaveAnswers field.
func (r *mutationResolver) SubmitWaveAnswers(ctx context.Context, waveID string, answers []*model.AnswerInput) (*model.WaveResult, error) {
	return nil, errors.New("not implemented")
}

// EnrollInCourse is the resolver for the enrollInCourse field.
func (r *mutationResolver) EnrollInCourse(ctx context.Context, courseID string) (*model.Course, error) {
	return nil, errors.New("not implemented")
}

// GenerateLearnBlocks is the resolver for the generateLearnBlocks field.
func (r *mutationResolver) GenerateLearnBlocks(ctx context.Context, prompt string, language *string, grade *model.Grade) ([]*model.LearnBlock, error) {
	return nil, errors.New("not implemented")
}

// GenerateEvaluateBlocks is the resolver for the generateEvaluateBlocks field.
func (r *mutationResolver) GenerateEvaluateBlocks(ctx context.Context, content string, count *int) ([]*model.EvaluateBlock, error) {
	return nil, errors.New("not implemented")
}

// TranslateContent is the resolver for the translateContent field.
func (r *mutationResolver) TranslateContent(ctx context.Context, content string, targetLanguage string) (string, error) {
	return "", errors.New("not implemented")
}

// CreateSubscription is the resolver for the createSubscription field.
func (r *mutationResolver) CreateSubscription(ctx context.Context, input model.CreateSubscriptionInput) (*model.UserSubscription, error) {
	return nil, errors.New("not implemented")
}

// CancelSubscription is the resolver for the cancelSubscription field.
func (r *mutationResolver) CancelSubscription(ctx context.Context) (*model.UserSubscription, error) {
	return nil, errors.New("not implemented")
}

// Me is the resolver for the me field.
func (r *queryResolver) Me(ctx context.Context) (*model.User, error) {
	userCtx, ok := middleware.UserFromContext(ctx)
	if !ok {
		return nil, errors.New("unauthorized")
	}

	return &model.User{
		ID:                userCtx.UserID,
		Email:             userCtx.Email,
		FullName:          userCtx.FullName,
		Role:              model.Role(userCtx.Role),
		PreferredLanguage: userCtx.PreferredLanguage,
	}, nil
}

// Courses is the resolver for the courses field.
func (r *queryResolver) Courses(ctx context.Context, filter *model.CourseFilter, pagination *model.PaginationInput) (*model.CourseConnection, error) {
	return nil, errors.New("not implemented")
}

// Course is the resolver for the course field.
func (r *queryResolver) Course(ctx context.Context, id string) (*model.Course, error) {
	return nil, errors.New("not implemented")
}

// Lesson is the resolver for the lesson field.
func (r *queryResolver) Lesson(ctx context.Context, id string) (*model.Lesson, error) {
	return nil, errors.New("not implemented")
}

// Wave is the resolver for the wave field.
func (r *queryResolver) Wave(ctx context.Context, id string) (*model.Wave, error) {
	return nil, errors.New("not implemented")
}

// Progress is the resolver for the progress field.
func (r *queryResolver) Progress(ctx context.Context, courseID *string) ([]*model.LessonProgress, error) {
	return nil, errors.New("not implemented")
}

// WaveProgress is the resolver for the waveProgress field.
func (r *queryResolver) WaveProgress(ctx context.Context, waveID string) (*model.WaveProgress, error) {
	return nil, errors.New("not implemented")
}

// Leaderboard is the resolver for the leaderboard field.
func (r *queryResolver) Leaderboard(ctx context.Context, scope model.LeaderboardScope, courseID *string, grade *model.Grade) ([]*model.LeaderboardEntry, error) {
	return nil, errors.New("not implemented")
}

// MyRank is the resolver for the myRank field.
func (r *queryResolver) MyRank(ctx context.Context, scope model.LeaderboardScope, courseID *string) (*int, error) {
	return nil, errors.New("not implemented")
}

// Achievements is the resolver for the achievements field.
func (r *queryResolver) Achievements(ctx context.Context) ([]*model.Achievement, error) {
	return nil, errors.New("not implemented")
}

// LeaderboardUpdated is the resolver for the leaderboardUpdated field.
func (r *subscriptionResolver) LeaderboardUpdated(ctx context.Context, scope model.LeaderboardScope, courseID *string) (<-chan *model.LeaderboardEntry, error) {
	return nil, fmt.Errorf("not implemented")
}

// XpGained is the resolver for the xpGained field.
func (r *subscriptionResolver) XpGained(ctx context.Context) (<-chan *model.XpEvent, error) {
	return nil, fmt.Errorf("not implemented")
}

// AchievementUnlocked is the resolver for the achievementUnlocked field.
func (r *subscriptionResolver) AchievementUnlocked(ctx context.Context) (<-chan *model.Achievement, error) {
	return nil, fmt.Errorf("not implemented")
}

// WaveCompleted is the resolver for the waveCompleted field.
func (r *subscriptionResolver) WaveCompleted(ctx context.Context) (<-chan *model.WaveProgress, error) {
	return nil, fmt.Errorf("not implemented")
}

// Mutation returns MutationResolver implementation.
func (r *Resolver) Mutation() MutationResolver { return &mutationResolver{r} }

// Query returns QueryResolver implementation.
func (r *Resolver) Query() QueryResolver { return &queryResolver{r} }

// Subscription returns SubscriptionResolver implementation.
func (r *Resolver) Subscription() SubscriptionResolver { return &subscriptionResolver{r} }

type (
	mutationResolver     struct{ *Resolver }
	queryResolver        struct{ *Resolver }
	subscriptionResolver struct{ *Resolver }
)
