package service

import (
	"context"
	"testing"

	authpb "github.com/studed/shared/proto/gen/go/auth"
	coursepb "github.com/studed/shared/proto/gen/go/course"
)

func TestCourseVisibility_PublishedOnlyFiltering(t *testing.T) {
	svc, _, _, _ := newTestCourseService()
	ctx := context.Background()

	// 1. Create 1 published course and 1 draft course
	c1Resp, err := svc.CreateCourse(ctx, &coursepb.CreateCourseRequest{
		Title:       "Published Bio Course",
		Slug:        "pub-bio-course",
		Description: "A/L Biology",
		GradeLevel:  authpb.Grade_GRADE_G10,
		EducatorId:  "educator-1",
	})
	if err != nil {
		t.Fatalf("failed to create course: %v", err)
	}

	pubResp, err := svc.PublishCourse(ctx, &coursepb.PublishCourseRequest{
		Id:         c1Resp.Course.Id,
		EducatorId: "educator-1",
	})
	if err != nil {
		t.Fatalf("failed to publish course: %v", err)
	}

	_, err = svc.CreateCourse(ctx, &coursepb.CreateCourseRequest{
		Title:       "Draft Bio Course",
		Slug:        "draft-bio-course",
		Description: "Draft in Progress",
		GradeLevel:  authpb.Grade_GRADE_G10,
		EducatorId:  "educator-1",
	})
	if err != nil {
		t.Fatalf("failed to create draft course: %v", err)
	}

	// 2. Query ListCourses with PublishedOnly = true
	coursesResp, err := svc.ListCourses(ctx, &coursepb.ListCoursesRequest{
		PublishedOnly: true,
	})
	if err != nil {
		t.Fatalf("ListCourses failed: %v", err)
	}

	if len(coursesResp.Courses) != 1 {
		t.Fatalf("expected 1 published course, got %d", len(coursesResp.Courses))
	}
	if coursesResp.Courses[0].Id != pubResp.Course.Id {
		t.Fatalf("expected course ID %s, got %s", pubResp.Course.Id, coursesResp.Courses[0].Id)
	}
}

func TestCourseVisibility_LessonAndWavePublishedOnlyFiltering(t *testing.T) {
	svc, _, _, _ := newTestCourseService()
	ctx := context.Background()

	// Create course and publish it
	cResp, _ := svc.CreateCourse(ctx, &coursepb.CreateCourseRequest{Title: "Physics", Slug: "physics", EducatorId: "educator-1"})
	_, _ = svc.PublishCourse(ctx, &coursepb.PublishCourseRequest{Id: cResp.Course.Id, EducatorId: "educator-1"})

	// Create published lesson and draft lesson
	l1Resp, _ := svc.CreateLesson(ctx, &coursepb.CreateLessonRequest{CourseId: cResp.Course.Id, Title: "Motion", SequenceOrder: 1, EducatorId: "educator-1"})
	pubLesson, _ := svc.PublishLesson(ctx, &coursepb.PublishLessonRequest{Id: l1Resp.Lesson.Id, EducatorId: "educator-1"})

	_, _ = svc.CreateLesson(ctx, &coursepb.CreateLessonRequest{CourseId: cResp.Course.Id, Title: "Advanced Statics", SequenceOrder: 2, EducatorId: "educator-1"})

	// Create published wave and draft wave in published lesson
	w1Resp, _ := svc.CreateWave(ctx, &coursepb.CreateWaveRequest{LessonId: pubLesson.Lesson.Id, Title: "Velocity Vector", EducatorId: "educator-1"})
	pubWave, _ := svc.PublishWave(ctx, &coursepb.PublishWaveRequest{Id: w1Resp.Wave.Id, EducatorId: "educator-1"})

	_, _ = svc.CreateWave(ctx, &coursepb.CreateWaveRequest{LessonId: pubLesson.Lesson.Id, Title: "Acceleration Vector", EducatorId: "educator-1"})

	// List lessons with publishedOnly = true
	lessonsResp, err := svc.ListLessons(ctx, &coursepb.ListLessonsRequest{CourseId: cResp.Course.Id, PublishedOnly: true})
	if err != nil {
		t.Fatalf("ListLessons failed: %v", err)
	}

	if len(lessonsResp.Lessons) != 1 || lessonsResp.Lessons[0].Id != pubLesson.Lesson.Id {
		t.Fatalf("expected 1 published lesson (%s), got %+v", pubLesson.Lesson.Id, lessonsResp.Lessons)
	}

	// List waves with publishedOnly = true
	wavesResp, err := svc.ListWaves(ctx, &coursepb.ListWavesRequest{LessonId: pubLesson.Lesson.Id, PublishedOnly: true})
	if err != nil {
		t.Fatalf("ListWaves failed: %v", err)
	}

	if len(wavesResp.Waves) != 1 || wavesResp.Waves[0].Id != pubWave.Wave.Id {
		t.Fatalf("expected 1 published wave (%s), got %+v", pubWave.Wave.Id, wavesResp.Waves)
	}
}
