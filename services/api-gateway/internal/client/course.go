package client

import (
	"context"
	"fmt"

	"github.com/studed/api-gateway/graph/model"
	coursepb "github.com/studed/shared/proto/gen/go/course"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

type CourseClient struct {
	client coursepb.CourseServiceClient
	conn   *grpc.ClientConn
}

func NewCourseClient(addr string) (*CourseClient, error) {
	conn, err := grpc.NewClient(addr, grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		return nil, fmt.Errorf("failed to connect to course service: %w", err)
	}

	return &CourseClient{
		client: coursepb.NewCourseServiceClient(conn),
		conn:   conn,
	}, nil
}

func (c *CourseClient) Close() error {
	return c.conn.Close()
}

func (c *CourseClient) CreateCourse(ctx context.Context, educatorID string, input model.CreateCourseInput) (*model.Course, error) {
	resp, err := c.client.CreateCourse(ctx, &coursepb.CreateCourseRequest{
		Title:       input.Title,
		Description: input.Description,
		Slug:        input.Slug,
		GradeLevel:  modelGradeToProto(input.GradeLevel),
		Price:       valueOrZero(input.Price),
		EducatorId:  educatorID,
	})
	if err != nil {
		return nil, fmt.Errorf("create course failed: %w", err)
	}
	if resp.Error != "" {
		return nil, fmt.Errorf("create course failed: %s", resp.Error)
	}

	return protoCourseToModel(resp.Course), nil
}

func (c *CourseClient) GetCourse(ctx context.Context, id string) (*model.Course, error) {
	resp, err := c.client.GetCourse(ctx, &coursepb.GetCourseRequest{Id: id})
	if err != nil {
		return nil, fmt.Errorf("get course failed: %w", err)
	}
	if resp.Error != "" {
		return nil, fmt.Errorf("get course failed: %s", resp.Error)
	}

	return protoCourseToModel(resp.Course), nil
}

func (c *CourseClient) ListCourses(ctx context.Context, filter *model.CourseFilter) (*model.CourseConnection, error) {
	req := &coursepb.ListCoursesRequest{}
	if filter != nil {
		if filter.Grade != nil {
			req.GradeLevel = modelGradeToProto(*filter.Grade)
		}
		if filter.IsPublished != nil {
			req.PublishedOnly = *filter.IsPublished
		}
	}

	resp, err := c.client.ListCourses(ctx, req)
	if err != nil {
		return nil, fmt.Errorf("list courses failed: %w", err)
	}

	edges := make([]*model.CourseEdge, len(resp.Courses))
	for i, c := range resp.Courses {
		edges[i] = &model.CourseEdge{
			Node:   protoCourseToModel(c),
			Cursor: c.Id,
		}
	}

	return &model.CourseConnection{
		Edges: edges,
		PageInfo: &model.PageInfo{
			HasNextPage: false,
			EndCursor:   nil,
		},
	}, nil
}

func (c *CourseClient) PublishCourse(ctx context.Context, educatorID, id string) (*model.Course, error) {
	resp, err := c.client.PublishCourse(ctx, &coursepb.PublishCourseRequest{
		Id:         id,
		EducatorId: educatorID,
	})
	if err != nil {
		return nil, fmt.Errorf("publish course failed: %w", err)
	}
	if resp.Error != "" {
		return nil, fmt.Errorf("publish course failed: %s", resp.Error)
	}

	return protoCourseToModel(resp.Course), nil
}

func protoCourseToModel(c *coursepb.Course) *model.Course {
	if c == nil {
		return nil
	}

	var price *float64
	if c.Price != 0 {
		p := c.Price
		price = &p
	}

	return &model.Course{
		ID:          c.Id,
		Title:       c.Title,
		Description: c.Description,
		Slug:        c.Slug,
		GradeLevel:  protoGradeToModel(c.GradeLevel),
		Price:       price,
		IsPublished: c.Status == coursepb.CourseStatus_COURSE_STATUS_PUBLISHED,
		Lessons:     []*model.Lesson{},
		CreatedAt:   timeFromUnix(c.CreatedAtUnix),
	}
}

func valueOrZero(v *float64) float64 {
	if v == nil {
		return 0
	}
	return *v
}
