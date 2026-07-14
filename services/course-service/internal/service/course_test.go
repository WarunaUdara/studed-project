package service

import (
	"context"
	"errors"
	"testing"

	"github.com/studed/course-service/internal/model"
	"github.com/studed/course-service/internal/repository"
	authpb "github.com/studed/shared/proto/gen/go/auth"
	coursepb "github.com/studed/shared/proto/gen/go/course"
)

type notFoundErr struct{ what string }

func (e notFoundErr) Error() string { return e.what + " not found" }

type fakeCourseRepo struct {
	courses map[string]*model.Course
	nextID  int
}

func newFakeCourseRepo() *fakeCourseRepo {
	return &fakeCourseRepo{courses: make(map[string]*model.Course)}
}

func (r *fakeCourseRepo) Create(ctx context.Context, c *model.Course) error {
	r.nextID++
	c.ID = "course-" + itoa(r.nextID)
	r.courses[c.ID] = c
	return nil
}

func (r *fakeCourseRepo) GetByID(ctx context.Context, id string) (*model.Course, error) {
	c, ok := r.courses[id]
	if !ok {
		return nil, notFoundErr{"course"}
	}
	return c, nil
}

func (r *fakeCourseRepo) List(ctx context.Context, filters repository.ListFilters) ([]*model.Course, error) {
	var out []*model.Course
	for _, c := range r.courses {
		if filters.PublishedOnly && c.Status != model.CourseStatusPublished {
			continue
		}
		if filters.FilterByGrade && c.GradeLevel != filters.Grade {
			continue
		}
		if filters.FilterByEducator && c.EducatorID != filters.EducatorID {
			continue
		}
		out = append(out, c)
	}
	return out, nil
}

func (r *fakeCourseRepo) Update(ctx context.Context, c *model.Course) error {
	r.courses[c.ID] = c
	return nil
}

type fakeLessonRepo struct {
	lessons map[string]*model.Lesson
	nextID  int
}

func newFakeLessonRepo() *fakeLessonRepo {
	return &fakeLessonRepo{lessons: make(map[string]*model.Lesson)}
}

func (r *fakeLessonRepo) Create(ctx context.Context, l *model.Lesson) error {
	r.nextID++
	l.ID = "lesson-" + itoa(r.nextID)
	r.lessons[l.ID] = l
	return nil
}

func (r *fakeLessonRepo) GetByID(ctx context.Context, id string) (*model.Lesson, error) {
	l, ok := r.lessons[id]
	if !ok {
		return nil, notFoundErr{"lesson"}
	}
	return l, nil
}

func (r *fakeLessonRepo) ListByCourse(ctx context.Context, courseID string, publishedOnly bool) ([]*model.Lesson, error) {
	var out []*model.Lesson
	for _, l := range r.lessons {
		if l.CourseID != courseID {
			continue
		}
		if publishedOnly && !l.IsPublished {
			continue
		}
		out = append(out, l)
	}
	return out, nil
}

func (r *fakeLessonRepo) Update(ctx context.Context, l *model.Lesson) error {
	r.lessons[l.ID] = l
	return nil
}

func (r *fakeLessonRepo) GetCourseID(ctx context.Context, id string) (string, error) {
	l, ok := r.lessons[id]
	if !ok {
		return "", notFoundErr{"lesson"}
	}
	return l.CourseID, nil
}

type fakeWaveRepo struct {
	waves  map[string]*model.Wave
	nextID int
}

func newFakeWaveRepo() *fakeWaveRepo {
	return &fakeWaveRepo{waves: make(map[string]*model.Wave)}
}

func (r *fakeWaveRepo) Create(ctx context.Context, w *model.Wave) error {
	r.nextID++
	w.ID = "wave-" + itoa(r.nextID)
	r.waves[w.ID] = w
	return nil
}

func (r *fakeWaveRepo) GetByID(ctx context.Context, id string) (*model.Wave, error) {
	w, ok := r.waves[id]
	if !ok {
		return nil, notFoundErr{"wave"}
	}
	return w, nil
}

func (r *fakeWaveRepo) ListByLesson(ctx context.Context, lessonID string, publishedOnly bool) ([]*model.Wave, error) {
	var out []*model.Wave
	for _, w := range r.waves {
		if w.LessonID != lessonID {
			continue
		}
		if publishedOnly && !w.IsPublished {
			continue
		}
		out = append(out, w)
	}
	return out, nil
}

func (r *fakeWaveRepo) Update(ctx context.Context, w *model.Wave) error {
	r.waves[w.ID] = w
	return nil
}

func (r *fakeWaveRepo) GetLessonID(ctx context.Context, id string) (string, error) {
	w, ok := r.waves[id]
	if !ok {
		return "", notFoundErr{"wave"}
	}
	return w.LessonID, nil
}

func itoa(n int) string {
	if n == 0 {
		return "0"
	}
	digits := ""
	for n > 0 {
		digits = string(rune('0'+n%10)) + digits
		n /= 10
	}
	return digits
}

func newTestCourseService() (CourseService, *fakeCourseRepo, *fakeLessonRepo, *fakeWaveRepo) {
	courseRepo := newFakeCourseRepo()
	lessonRepo := newFakeLessonRepo()
	waveRepo := newFakeWaveRepo()
	svc := NewCourseService(courseRepo, lessonRepo, waveRepo)
	return svc, courseRepo, lessonRepo, waveRepo
}

/* ----- Course ----- */

func TestCreateCourse_RequiresTitleAndSlug(t *testing.T) {
	svc, _, _, _ := newTestCourseService()

	if _, err := svc.CreateCourse(context.Background(), &coursepb.CreateCourseRequest{Slug: "s"}); err == nil {
		t.Fatalf("expected error when title is missing")
	}
	if _, err := svc.CreateCourse(context.Background(), &coursepb.CreateCourseRequest{Title: "t"}); err == nil {
		t.Fatalf("expected error when slug is missing")
	}
}

func TestCreateCourse_DefaultsToDraftStatus(t *testing.T) {
	svc, _, _, _ := newTestCourseService()

	resp, err := svc.CreateCourse(context.Background(), &coursepb.CreateCourseRequest{
		Title: "Mathematics", Slug: "math", EducatorId: "edu-1",
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if resp.Course.Status != coursepb.CourseStatus_COURSE_STATUS_DRAFT {
		t.Fatalf("expected a new course to default to DRAFT, got %v", resp.Course.Status)
	}
}

func TestUpdateCourse_RejectsNonOwner(t *testing.T) {
	svc, _, _, _ := newTestCourseService()

	created, err := svc.CreateCourse(context.Background(), &coursepb.CreateCourseRequest{
		Title: "Mathematics", Slug: "math", EducatorId: "edu-1",
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	_, err = svc.UpdateCourse(context.Background(), &coursepb.UpdateCourseRequest{
		Id: created.Course.Id, EducatorId: "edu-2", Title: "Hacked",
	})
	if err == nil {
		t.Fatalf("expected an authorization error when a different educator updates the course")
	}
}

func TestUpdateCourse_OnlyOverwritesProvidedFields(t *testing.T) {
	svc, _, _, _ := newTestCourseService()

	created, err := svc.CreateCourse(context.Background(), &coursepb.CreateCourseRequest{
		Title: "Mathematics", Description: "Algebra and geometry", Slug: "math", EducatorId: "edu-1",
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	updated, err := svc.UpdateCourse(context.Background(), &coursepb.UpdateCourseRequest{
		Id: created.Course.Id, EducatorId: "edu-1", Title: "Advanced Mathematics",
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if updated.Course.Title != "Advanced Mathematics" {
		t.Fatalf("expected title to update, got %q", updated.Course.Title)
	}
	if updated.Course.Description != "Algebra and geometry" {
		t.Fatalf("expected description to remain unchanged, got %q", updated.Course.Description)
	}
}

func TestPublishCourse_IsIdempotentAndSetsPublishedAt(t *testing.T) {
	svc, courseRepo, _, _ := newTestCourseService()

	created, err := svc.CreateCourse(context.Background(), &coursepb.CreateCourseRequest{
		Title: "Mathematics", Slug: "math", EducatorId: "edu-1",
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	first, err := svc.PublishCourse(context.Background(), &coursepb.PublishCourseRequest{
		Id: created.Course.Id, EducatorId: "edu-1",
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if first.Course.Status != coursepb.CourseStatus_COURSE_STATUS_PUBLISHED {
		t.Fatalf("expected course to be published")
	}
	publishedAt := courseRepo.courses[created.Course.Id].PublishedAt
	if publishedAt == nil {
		t.Fatalf("expected PublishedAt to be set")
	}

	// Publishing again should be a no-op, not an error, and must not change
	// the original PublishedAt timestamp.
	if _, err := svc.PublishCourse(context.Background(), &coursepb.PublishCourseRequest{
		Id: created.Course.Id, EducatorId: "edu-1",
	}); err != nil {
		t.Fatalf("unexpected error on republish: %v", err)
	}
	if !courseRepo.courses[created.Course.Id].PublishedAt.Equal(*publishedAt) {
		t.Fatalf("expected PublishedAt to remain stable across a redundant publish call")
	}
}

func TestPublishCourse_RejectsNonOwner(t *testing.T) {
	svc, _, _, _ := newTestCourseService()

	created, err := svc.CreateCourse(context.Background(), &coursepb.CreateCourseRequest{
		Title: "Mathematics", Slug: "math", EducatorId: "edu-1",
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if _, err := svc.PublishCourse(context.Background(), &coursepb.PublishCourseRequest{
		Id: created.Course.Id, EducatorId: "edu-2",
	}); err == nil {
		t.Fatalf("expected an authorization error when a different educator publishes the course")
	}
}

func TestListCourses_FiltersByPublishedGradeAndEducator(t *testing.T) {
	svc, _, _, _ := newTestCourseService()

	c1, _ := svc.CreateCourse(context.Background(), &coursepb.CreateCourseRequest{
		Title: "G10 Math", Slug: "g10-math", EducatorId: "edu-1", GradeLevel: authpb.Grade_GRADE_G10,
	})
	_, _ = svc.PublishCourse(context.Background(), &coursepb.PublishCourseRequest{Id: c1.Course.Id, EducatorId: "edu-1"})

	_, _ = svc.CreateCourse(context.Background(), &coursepb.CreateCourseRequest{
		Title: "G11 Science (unpublished)", Slug: "g11-sci", EducatorId: "edu-2", GradeLevel: authpb.Grade_GRADE_G11,
	})

	resp, err := svc.ListCourses(context.Background(), &coursepb.ListCoursesRequest{PublishedOnly: true})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(resp.Courses) != 1 || resp.Courses[0].Title != "G10 Math" {
		t.Fatalf("expected only the published G10 course, got %+v", resp.Courses)
	}
}

/* ----- Lesson ----- */

func TestCreateLesson_RejectsNonOwnerOfCourse(t *testing.T) {
	svc, _, _, _ := newTestCourseService()

	course, _ := svc.CreateCourse(context.Background(), &coursepb.CreateCourseRequest{
		Title: "Mathematics", Slug: "math", EducatorId: "edu-1",
	})

	if _, err := svc.CreateLesson(context.Background(), &coursepb.CreateLessonRequest{
		CourseId: course.Course.Id, EducatorId: "edu-2", Title: "Algebra",
	}); err == nil {
		t.Fatalf("expected an authorization error when a different educator creates a lesson")
	}
}

func TestPublishLesson_IsIdempotent(t *testing.T) {
	svc, _, lessonRepo, _ := newTestCourseService()

	course, _ := svc.CreateCourse(context.Background(), &coursepb.CreateCourseRequest{
		Title: "Mathematics", Slug: "math", EducatorId: "edu-1",
	})
	lesson, err := svc.CreateLesson(context.Background(), &coursepb.CreateLessonRequest{
		CourseId: course.Course.Id, EducatorId: "edu-1", Title: "Algebra",
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if lesson.Lesson.IsPublished {
		t.Fatalf("expected a new lesson to start unpublished")
	}

	if _, err := svc.PublishLesson(context.Background(), &coursepb.PublishLessonRequest{
		Id: lesson.Lesson.Id, EducatorId: "edu-1",
	}); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !lessonRepo.lessons[lesson.Lesson.Id].IsPublished {
		t.Fatalf("expected lesson to be published")
	}

	if _, err := svc.PublishLesson(context.Background(), &coursepb.PublishLessonRequest{
		Id: lesson.Lesson.Id, EducatorId: "edu-1",
	}); err != nil {
		t.Fatalf("republishing an already-published lesson should not error, got: %v", err)
	}
}

/* ----- Wave ----- */

func TestCreateWave_RejectsNonOwnerOfCourse(t *testing.T) {
	svc, _, _, _ := newTestCourseService()

	course, _ := svc.CreateCourse(context.Background(), &coursepb.CreateCourseRequest{
		Title: "Mathematics", Slug: "math", EducatorId: "edu-1",
	})
	lesson, _ := svc.CreateLesson(context.Background(), &coursepb.CreateLessonRequest{
		CourseId: course.Course.Id, EducatorId: "edu-1", Title: "Algebra",
	})

	if _, err := svc.CreateWave(context.Background(), &coursepb.CreateWaveRequest{
		LessonId: lesson.Lesson.Id, EducatorId: "edu-2", Title: "Linear Equations",
	}); err == nil {
		t.Fatalf("expected an authorization error when a different educator creates a wave")
	}
}

func TestCreateWave_ParsesEvaluateBlocksJson(t *testing.T) {
	svc, _, _, _ := newTestCourseService()

	course, _ := svc.CreateCourse(context.Background(), &coursepb.CreateCourseRequest{
		Title: "Mathematics", Slug: "math", EducatorId: "edu-1",
	})
	lesson, _ := svc.CreateLesson(context.Background(), &coursepb.CreateLessonRequest{
		CourseId: course.Course.Id, EducatorId: "edu-1", Title: "Algebra",
	})

	wave, err := svc.CreateWave(context.Background(), &coursepb.CreateWaveRequest{
		LessonId: lesson.Lesson.Id, EducatorId: "edu-1", Title: "Linear Equations",
		EvaluateBlocksJson: `[{"id":"q1","correctAnswer":"2"}]`,
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if wave.Wave.EvaluateBlocksJson != `[{"id":"q1","correctAnswer":"2"}]` {
		t.Fatalf("expected evaluate blocks json to round-trip, got %q", wave.Wave.EvaluateBlocksJson)
	}
}

func TestCreateWave_InvalidEvaluateBlocksJsonFallsBackToEmptyArray(t *testing.T) {
	svc, _, _, _ := newTestCourseService()

	course, _ := svc.CreateCourse(context.Background(), &coursepb.CreateCourseRequest{
		Title: "Mathematics", Slug: "math", EducatorId: "edu-1",
	})
	lesson, _ := svc.CreateLesson(context.Background(), &coursepb.CreateLessonRequest{
		CourseId: course.Course.Id, EducatorId: "edu-1", Title: "Algebra",
	})

	wave, err := svc.CreateWave(context.Background(), &coursepb.CreateWaveRequest{
		LessonId: lesson.Lesson.Id, EducatorId: "edu-1", Title: "Linear Equations",
		EvaluateBlocksJson: "not-json",
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if wave.Wave.EvaluateBlocksJson != "[]" {
		t.Fatalf("expected malformed json to fall back to an empty array, got %q", wave.Wave.EvaluateBlocksJson)
	}
}

func TestUpdateWave_OnlyOverwritesNonZeroFields(t *testing.T) {
	svc, _, _, _ := newTestCourseService()

	course, _ := svc.CreateCourse(context.Background(), &coursepb.CreateCourseRequest{
		Title: "Mathematics", Slug: "math", EducatorId: "edu-1",
	})
	lesson, _ := svc.CreateLesson(context.Background(), &coursepb.CreateLessonRequest{
		CourseId: course.Course.Id, EducatorId: "edu-1", Title: "Algebra",
	})
	wave, _ := svc.CreateWave(context.Background(), &coursepb.CreateWaveRequest{
		LessonId: lesson.Lesson.Id, EducatorId: "edu-1", Title: "Linear Equations",
		XpReward: 100, MaxReattempts: 3, PassingThreshold: 70,
	})

	updated, err := svc.UpdateWave(context.Background(), &coursepb.UpdateWaveRequest{
		Id: wave.Wave.Id, EducatorId: "edu-1", XpReward: 150,
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if updated.Wave.XpReward != 150 {
		t.Fatalf("expected xp reward to update to 150, got %d", updated.Wave.XpReward)
	}
	if updated.Wave.MaxReattempts != 3 || updated.Wave.PassingThreshold != 70 {
		t.Fatalf("expected unspecified fields to remain unchanged, got %+v", updated.Wave)
	}
}

func TestPublishWave_RejectsNonOwner(t *testing.T) {
	svc, _, _, _ := newTestCourseService()

	course, _ := svc.CreateCourse(context.Background(), &coursepb.CreateCourseRequest{
		Title: "Mathematics", Slug: "math", EducatorId: "edu-1",
	})
	lesson, _ := svc.CreateLesson(context.Background(), &coursepb.CreateLessonRequest{
		CourseId: course.Course.Id, EducatorId: "edu-1", Title: "Algebra",
	})
	wave, _ := svc.CreateWave(context.Background(), &coursepb.CreateWaveRequest{
		LessonId: lesson.Lesson.Id, EducatorId: "edu-1", Title: "Linear Equations",
	})

	if _, err := svc.PublishWave(context.Background(), &coursepb.PublishWaveRequest{
		Id: wave.Wave.Id, EducatorId: "edu-2",
	}); err == nil {
		t.Fatalf("expected an authorization error when a different educator publishes a wave")
	}
}

func TestGetWave_RequiresID(t *testing.T) {
	svc, _, _, _ := newTestCourseService()
	if _, err := svc.GetWave(context.Background(), &coursepb.GetWaveRequest{}); err == nil {
		t.Fatalf("expected an error for an empty wave id")
	}
}

func TestGetCourse_NotFoundPropagatesError(t *testing.T) {
	svc, _, _, _ := newTestCourseService()
	_, err := svc.GetCourse(context.Background(), &coursepb.GetCourseRequest{Id: "does-not-exist"})
	if err == nil {
		t.Fatalf("expected a not-found error")
	}
	var nf notFoundErr
	if !errors.As(err, &nf) {
		t.Fatalf("expected a notFoundErr, got %T: %v", err, err)
	}
}
