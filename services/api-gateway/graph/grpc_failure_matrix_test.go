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
)

type matrixFailingCourseClient struct {
	coursepb.CourseServiceClient
	returnedCode codes.Code
	returnedMsg  string
}

func (m *matrixFailingCourseClient) GetCourse(ctx context.Context, in *coursepb.GetCourseRequest, opts ...grpc.CallOption) (*coursepb.CourseResponse, error) {
	return nil, status.Error(m.returnedCode, m.returnedMsg)
}

func TestGrpcFailureMatrix_ResolverErrorHandling(t *testing.T) {
	failureCases := []struct {
		name           string
		code           codes.Code
		msg            string
		expectContains string
	}{
		{
			name:           "InvalidArgument error",
			code:           codes.InvalidArgument,
			msg:            "course_id cannot be blank",
			expectContains: "cannot be blank",
		},
		{
			name:           "PermissionDenied error",
			code:           codes.PermissionDenied,
			msg:            "only educators can view draft course",
			expectContains: "only educators",
		},
		{
			name:           "Unauthenticated error",
			code:           codes.Unauthenticated,
			msg:            "token expired or missing",
			expectContains: "token",
		},
		{
			name:           "ResourceExhausted error",
			code:           codes.ResourceExhausted,
			msg:            "rate limit exceeded on API Gateway",
			expectContains: "rate limit",
		},
		{
			name:           "Internal error",
			code:           codes.Internal,
			msg:            "unexpected database connection pool failure",
			expectContains: "database",
		},
	}

	for _, tt := range failureCases {
		t.Run(tt.name, func(t *testing.T) {
			mockCourse := client.NewCourseClientFromPB(&matrixFailingCourseClient{
				returnedCode: tt.code,
				returnedMsg:  tt.msg,
			})

			resolver := &queryResolver{
				Resolver: &Resolver{
					CourseClient: mockCourse,
				},
			}

			userCtx := middleware.UserContext{UserID: "user-test", Role: "STUDENT"}
			ctx := context.WithValue(context.Background(), middleware.UserContextKey, userCtx)

			_, err := resolver.Course(ctx, "course-1")
			if err == nil {
				t.Fatalf("expected error for gRPC code %s, got nil", tt.code)
			}

			if status.Code(err) != tt.code && !strings.Contains(err.Error(), tt.expectContains) {
				t.Errorf("expected error to contain %q or match gRPC code %s, got: %v", tt.expectContains, tt.code, err)
			}
		})
	}
}
