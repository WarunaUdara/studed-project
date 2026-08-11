package graph

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	"time"

	"github.com/studed/api-gateway/graph/model"
	"github.com/studed/api-gateway/internal/events"
	"github.com/studed/api-gateway/internal/middleware"
)

func requireUser(ctx context.Context) (middleware.UserContext, error) {
	userCtx, ok := middleware.UserFromContext(ctx)
	if !ok || userCtx.UserID == "" {
		return middleware.UserContext{}, errors.New("unauthorized")
	}
	return userCtx, nil
}

func requireEducator(userCtx middleware.UserContext) error {
	switch userCtx.Role {
	case "EDUCATOR", "HEAD_EDUCATOR", "ADMIN":
		return nil
	default:
		return errors.New("forbidden: educator role required")
	}
}

func setAuthCookies(ctx context.Context, accessToken, refreshToken string) {
	w, ok := middleware.ResponseWriterFromContext(ctx)
	if !ok {
		return
	}

	http.SetCookie(w, &http.Cookie{
		Name:     "access_token",
		Value:    accessToken,
		HttpOnly: true,
		Secure:   true,
		SameSite: http.SameSiteLaxMode,
		Path:     "/",
		MaxAge:   int(15 * time.Minute / time.Second),
	})

	http.SetCookie(w, &http.Cookie{
		Name:     "refresh_token",
		Value:    refreshToken,
		HttpOnly: true,
		Secure:   true,
		SameSite: http.SameSiteLaxMode,
		Path:     "/",
		MaxAge:   int(7 * 24 * time.Hour / time.Second),
	})
}

// populateLessons attaches lessons (and their waves) to a course. List
// endpoints (Courses, MyEnrollments) return courses without lessons because
// the course-service ListCourses gRPC response carries no lesson data; the
// GraphQL Course type exposes lessons non-null, so without this the
// educator dashboard and course cards report zero lessons. Failures are
// logged but never fail the parent query.
func (r *Resolver) populateLessons(ctx context.Context, course *model.Course) {
	if course == nil {
		return
	}
	full, err := r.CourseClient.GetCourseWithLessons(ctx, course.ID)
	if err != nil {
		slog.Warn("failed to load lessons for course", slog.String("course_id", course.ID), slog.Any("error", err))
		return
	}
	course.Lessons = full.Lessons
	course.Educator = full.Educator
}

func (r *Resolver) populateWavesProgress(ctx context.Context, userID string, course *model.Course) {
	if course == nil {
		return
	}
	for _, lesson := range course.Lessons {
		if lesson == nil {
			continue
		}
		for _, wave := range lesson.Waves {
			if wave == nil {
				continue
			}
			progress, err := r.ProgressClient.GetWaveProgress(ctx, userID, wave.ID)
			if err == nil {
				wave.MyProgress = progress
			}
		}
	}
}

// publishWaveEvents emits real-time wave/leaderboard events; publish
// failures never fail the submission.
func (r *Resolver) publishWaveEvents(ctx context.Context, userCtx middleware.UserContext, waveID, courseID string, result *model.WaveResult) {
	if r.Events == nil {
		return
	}

	_ = r.Events.Publish(ctx, events.ChannelWaveCompleted, events.WaveCompletedEvent{
		UserID:          userCtx.UserID,
		WaveID:          waveID,
		Score:           int32(result.Score),
		CompletedAtUnix: time.Now().Unix(),
	})

	scopes := []struct {
		scope    model.LeaderboardScope
		courseID string
	}{
		{model.LeaderboardScopeGlobal, ""},
	}
	if courseID != "" {
		scopes = append(scopes, struct {
			scope    model.LeaderboardScope
			courseID string
		}{model.LeaderboardScopeCourse, courseID})
	}
	for _, sc := range scopes {
		var cid *string
		if sc.courseID != "" {
			c := sc.courseID
			cid = &c
		}
		rank, err := r.GamificationClient.GetMyRank(ctx, userCtx.UserID, sc.scope, cid, nil)
		if err != nil {
			rank = 0
		}
		_ = r.Events.Publish(ctx, events.ChannelLeaderboard, events.LeaderboardUpdatedEvent{
			Scope:    string(sc.scope),
			CourseID: sc.courseID,
			UserID:   userCtx.UserID,
			FullName: userCtx.FullName,
			TotalXp:  int32(result.TotalXp),
			Rank:     int32(rank),
		})
	}
}

// vizTypeToService maps the GraphQL viz type enum to the ai-service endpoint
// string used by the generateVisualization proxy.
func vizTypeToService(vt model.VizType) string {
	switch vt {
	case model.VizTypeThreedmol:
		return "3dmol"
	case model.VizTypeTscircuit:
		return "tscircuit"
	case model.VizTypeMatterjs:
		return "matterjs"
	default:
		return "manim"
	}
}
