package graph

import (
	"context"
	"strings"
	"testing"

	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"

	"github.com/studed/api-gateway/internal/client"
	"github.com/studed/api-gateway/internal/middleware"
	coursepb "github.com/studed/shared/proto/gen/go/course"
	progresspb "github.com/studed/shared/proto/gen/go/progress"
)

type mockPublicCoursePBClient struct {
	coursepb.CourseServiceClient
	courses map[string]*coursepb.Course
	lessons map[string][]*coursepb.Lesson
	waves   map[string][]*coursepb.Wave
}

func (m *mockPublicCoursePBClient) GetCourse(ctx context.Context, in *coursepb.GetCourseRequest, opts ...grpc.CallOption) (*coursepb.CourseResponse, error) {
	c, ok := m.courses[in.Id]
	if !ok {
		return nil, status.Error(codes.NotFound, "course not found")
	}
	return &coursepb.CourseResponse{Course: c}, nil
}

func (m *mockPublicCoursePBClient) ListLessons(ctx context.Context, in *coursepb.ListLessonsRequest, opts ...grpc.CallOption) (*coursepb.LessonListResponse, error) {
	return &coursepb.LessonListResponse{Lessons: m.lessons[in.CourseId]}, nil
}

func (m *mockPublicCoursePBClient) ListWaves(ctx context.Context, in *coursepb.ListWavesRequest, opts ...grpc.CallOption) (*coursepb.WaveListResponse, error) {
	return &coursepb.WaveListResponse{Waves: m.waves[in.LessonId]}, nil
}

type mockPublicProgressPBClient struct {
	progresspb.ProgressServiceClient
}

func (m *mockPublicProgressPBClient) GetCourseProgress(ctx context.Context, in *progresspb.GetCourseProgressRequest, opts ...grpc.CallOption) (*progresspb.CourseProgressResponse, error) {
	return &progresspb.CourseProgressResponse{
		CompletedWaves: 2,
		TotalWaves:     5,
	}, nil
}

func (m *mockPublicProgressPBClient) GetWaveProgress(ctx context.Context, in *progresspb.GetWaveProgressRequest, opts ...grpc.CallOption) (*progresspb.WaveProgressResponse, error) {
	return &progresspb.WaveProgressResponse{
		Status:       "COMPLETED",
		HighestScore: 100,
	}, nil
}

func setupPublicCourseTest() *queryResolver {
	courses := map[string]*coursepb.Course{
		"published-course-1": {
			Id:          "published-course-1",
			Title:       "Public Physics Course",
			Description: "Introductory Physics for A/L",
			Status:      coursepb.CourseStatus_COURSE_STATUS_PUBLISHED,
			EducatorId:  "educator-101",
		},
		"draft-course-1": {
			Id:          "draft-course-1",
			Title:       "Unpublished Advanced Physics",
			Description: "Draft Course in Development",
			Status:      coursepb.CourseStatus_COURSE_STATUS_DRAFT,
			EducatorId:  "educator-101",
		},
	}

	lessons := map[string][]*coursepb.Lesson{
		"published-course-1": {
			{
				Id:            "lesson-1",
				CourseId:      "published-course-1",
				Title:         "Kinematics",
				SequenceOrder: 1,
				IsPublished:   true,
			},
			{
				Id:            "lesson-2",
				CourseId:      "published-course-1",
				Title:         "Draft Mechanics Lesson",
				SequenceOrder: 2,
				IsPublished:   false,
			},
		},
	}

	waves := map[string][]*coursepb.Wave{
		"lesson-1": {
			{Id: "wave-1", LessonId: "lesson-1", Title: "Newton's First Law", IsPublished: true},
			{Id: "wave-2", LessonId: "lesson-1", Title: "Draft Wave", IsPublished: false},
		},
	}

	mockPB := &mockPublicCoursePBClient{
		courses: courses,
		lessons: lessons,
		waves:   waves,
	}
	mockCourseClient := client.NewCourseClientFromPB(mockPB)
	mockProgressClient := client.NewProgressClientFromPB(&mockPublicProgressPBClient{}, mockCourseClient)

	resolver := &queryResolver{
		Resolver: &Resolver{
			CourseClient:   mockCourseClient,
			ProgressClient: mockProgressClient,
		},
	}

	return resolver
}

func TestPublicCourseQuery_UnauthenticatedGuestCanViewPublishedCourse(t *testing.T) {
	resolver := setupPublicCourseTest()

	// Guest context: no user in context
	ctx := context.Background()

	course, err := resolver.Course(ctx, "published-course-1")
	if err != nil {
		t.Fatalf("expected unauthenticated guest to view published course, got error: %v", err)
	}

	if course.ID != "published-course-1" || course.Title != "Public Physics Course" {
		t.Fatalf("unexpected course response: %+v", course)
	}

	// Unauthenticated guest must NOT have user progress populated
	if course.MyProgress != nil {
		t.Fatalf("expected MyProgress to be nil for unauthenticated guest, got %+v", course.MyProgress)
	}

	// Draft lessons must be stripped for unauthenticated guest
	if len(course.Lessons) != 1 {
		t.Fatalf("expected 1 published lesson for guest, got %d", len(course.Lessons))
	}
	if course.Lessons[0].ID != "lesson-1" {
		t.Fatalf("unexpected lesson ID: %s", course.Lessons[0].ID)
	}

	// Draft waves in published lesson must be stripped for guest
	if len(course.Lessons[0].Waves) != 1 {
		t.Fatalf("expected 1 published wave for guest, got %d", len(course.Lessons[0].Waves))
	}
	if course.Lessons[0].Waves[0].ID != "wave-1" {
		t.Fatalf("unexpected wave ID: %s", course.Lessons[0].Waves[0].ID)
	}
}

func TestPublicCourseQuery_UnauthenticatedGuestBlockedFromDraftCourse(t *testing.T) {
	resolver := setupPublicCourseTest()

	ctx := context.Background()

	_, err := resolver.Course(ctx, "draft-course-1")
	if err == nil {
		t.Fatalf("expected error when unauthenticated guest attempts to view draft course")
	}

	if !strings.Contains(err.Error(), "forbidden") && !strings.Contains(err.Error(), "unauthorized") && !strings.Contains(err.Error(), "not authorized") {
		t.Fatalf("expected forbidden/unauthorized error message, got: %v", err)
	}
}

func TestPublicCourseQuery_AuthenticatedStudentGetsProgress(t *testing.T) {
	resolver := setupPublicCourseTest()

	userCtx := middleware.UserContext{UserID: "student-202", Role: "STUDENT"}
	ctx := context.WithValue(context.Background(), middleware.UserContextKey, userCtx)

	course, err := resolver.Course(ctx, "published-course-1")
	if err != nil {
		t.Fatalf("unexpected error for student course query: %v", err)
	}

	if course.MyProgress == nil {
		t.Fatalf("expected MyProgress to be populated for authenticated student")
	}
	if course.MyProgress.CompletedWaves != 2 || course.MyProgress.TotalWaves != 5 {
		t.Fatalf("unexpected MyProgress values: %+v", course.MyProgress)
	}
}

func TestPublicCourseQuery_NonOwnerEducatorBlockedFromDraftCourse(t *testing.T) {
	resolver := setupPublicCourseTest()

	// Educator 999 attempting to view Educator 101's draft course
	otherEducatorCtx := middleware.UserContext{UserID: "educator-999", Role: "EDUCATOR"}
	ctx := context.WithValue(context.Background(), middleware.UserContextKey, otherEducatorCtx)

	_, err := resolver.Course(ctx, "draft-course-1")
	if err == nil {
		t.Fatalf("expected error when non-owner educator attempts to view draft course")
	}
}
