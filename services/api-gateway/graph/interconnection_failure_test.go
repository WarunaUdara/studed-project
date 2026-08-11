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

// failingCourseClient implements coursepb.CourseServiceClient and returns configured error for all RPCs
type failingCourseClient struct {
	coursepb.CourseServiceClient
	grpcErr error
}

func (f *failingCourseClient) GetCourse(ctx context.Context, in *coursepb.GetCourseRequest, opts ...grpc.CallOption) (*coursepb.CourseResponse, error) {
	return nil, f.grpcErr
}

// failingProgressClient implements progresspb.ProgressServiceClient and returns configured error for all RPCs
type failingProgressClient struct {
	progresspb.ProgressServiceClient
	grpcErr error
}

func (f *failingProgressClient) EnrollInCourse(ctx context.Context, in *progresspb.EnrollRequest, opts ...grpc.CallOption) (*progresspb.EnrollResponse, error) {
	return nil, f.grpcErr
}

func TestInterconnectionFailure_gRPCServiceUnavailable(t *testing.T) {
	unavailableErr := status.Error(codes.Unavailable, "connection refused by target RPC host")

	mockCourse := client.NewCourseClientFromPB(&failingCourseClient{grpcErr: unavailableErr})
	mockProgress := client.NewProgressClientFromPB(&failingProgressClient{grpcErr: unavailableErr}, mockCourse)

	resolver := &mutationResolver{
		Resolver: &Resolver{
			CourseClient:   mockCourse,
			ProgressClient: mockProgress,
		},
	}

	userCtx := middleware.UserContext{UserID: "user-123", Role: "STUDENT"}
	ctx := context.WithValue(context.Background(), middleware.UserContextKey, userCtx)

	_, err := resolver.EnrollInCourse(ctx, "course-456")
	if err == nil {
		t.Fatalf("expected gRPC connection error when downstream service is unavailable")
	}

	if status.Code(err) != codes.Unavailable && !strings.Contains(err.Error(), "unavailable") && !strings.Contains(err.Error(), "connection refused") {
		t.Fatalf("expected unavailable/connection refused error, got: %v", err)
	}
}

func TestInterconnectionFailure_gRPCDeadlineExceeded(t *testing.T) {
	timeoutErr := status.Error(codes.DeadlineExceeded, "context deadline exceeded waiting for RPC response")

	mockCourse := client.NewCourseClientFromPB(&failingCourseClient{grpcErr: timeoutErr})

	resolver := &queryResolver{
		Resolver: &Resolver{
			CourseClient: mockCourse,
		},
	}

	_, err := resolver.Course(context.Background(), "course-789")
	if err == nil {
		t.Fatalf("expected deadline exceeded error when downstream gRPC call times out")
	}
}
