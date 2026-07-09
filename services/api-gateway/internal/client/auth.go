package client

import (
	"context"
	"fmt"
	"time"

	"github.com/studed/api-gateway/graph/model"
	authpb "github.com/studed/shared/proto/gen/go/auth"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

func timeFromUnix(unix int64) time.Time {
	return time.Unix(unix, 0).UTC()
}

type AuthClient struct {
	client authpb.AuthServiceClient
	conn   *grpc.ClientConn
}

func NewAuthClient(addr string) (*AuthClient, error) {
	conn, err := grpc.NewClient(addr, grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		return nil, fmt.Errorf("failed to connect to auth service: %w", err)
	}

	return &AuthClient{
		client: authpb.NewAuthServiceClient(conn),
		conn:   conn,
	}, nil
}

func (c *AuthClient) Close() error {
	return c.conn.Close()
}

func (c *AuthClient) Register(ctx context.Context, input model.RegisterInput) (*model.AuthPayload, error) {
	var grade authpb.Grade
	if input.Grade != nil {
		grade = modelGradeToProto(*input.Grade)
	}

	var preferredLanguage string
	if input.PreferredLanguage != nil {
		preferredLanguage = *input.PreferredLanguage
	}

	resp, err := c.client.Register(ctx, &authpb.RegisterRequest{
		Email:             input.Email,
		Password:          input.Password,
		FullName:          input.FullName,
		Role:              modelRoleToProto(input.Role),
		Grade:             grade,
		PreferredLanguage: preferredLanguage,
	})
	if err != nil {
		return nil, fmt.Errorf("register failed: %w", err)
	}
	if resp.Error != "" {
		return nil, fmt.Errorf("register failed: %s", resp.Error)
	}

	return protoAuthResponseToModel(resp), nil
}

func (c *AuthClient) Login(ctx context.Context, input model.LoginInput) (*model.AuthPayload, error) {
	resp, err := c.client.Login(ctx, &authpb.LoginRequest{
		Email:    input.Email,
		Password: input.Password,
	})
	if err != nil {
		return nil, fmt.Errorf("login failed: %w", err)
	}
	if resp.Error != "" {
		return nil, fmt.Errorf("login failed: %s", resp.Error)
	}

	return protoAuthResponseToModel(resp), nil
}

func (c *AuthClient) ValidateToken(ctx context.Context, accessToken string) (*authpb.ValidateTokenResponse, error) {
	return c.client.ValidateToken(ctx, &authpb.ValidateTokenRequest{AccessToken: accessToken})
}

func (c *AuthClient) GetUser(ctx context.Context, userID string) (*model.User, error) {
	user, err := c.client.GetUser(ctx, &authpb.GetUserRequest{UserId: userID})
	if err != nil {
		return nil, fmt.Errorf("get user failed: %w", err)
	}
	return protoUserToModel(user), nil
}

func (c *AuthClient) RefreshToken(ctx context.Context, refreshToken string) (*model.AuthPayload, error) {
	resp, err := c.client.RefreshToken(ctx, &authpb.RefreshTokenRequest{RefreshToken: refreshToken})
	if err != nil {
		return nil, fmt.Errorf("refresh token failed: %w", err)
	}
	if resp.Error != "" {
		return nil, fmt.Errorf("refresh token failed: %s", resp.Error)
	}

	return protoAuthResponseToModel(resp), nil
}

func protoAuthResponseToModel(resp *authpb.AuthResponse) *model.AuthPayload {
	return &model.AuthPayload{
		AccessToken:  resp.AccessToken,
		RefreshToken: resp.RefreshToken,
		User:         protoUserToModel(resp.User),
	}
}

func protoUserToModel(u *authpb.User) *model.User {
	if u == nil {
		return nil
	}

	var grade *model.Grade
	if u.Grade != authpb.Grade_GRADE_UNSPECIFIED {
		g := protoGradeToModel(u.Grade)
		grade = &g
	}

	return &model.User{
		ID:                u.Id,
		Email:             u.Email,
		FullName:          u.FullName,
		Role:              protoRoleToModel(u.Role),
		Grade:             grade,
		PreferredLanguage: u.PreferredLanguage,
		TotalXp:           0,
		CreatedAt:         timeFromUnix(u.CreatedAtUnix),
	}
}

func modelRoleToProto(role model.Role) authpb.Role {
	switch role {
	case model.RoleStudent:
		return authpb.Role_ROLE_STUDENT
	case model.RoleEducator:
		return authpb.Role_ROLE_EDUCATOR
	case model.RoleHeadEducator:
		return authpb.Role_ROLE_HEAD_EDUCATOR
	case model.RoleAdmin:
		return authpb.Role_ROLE_ADMIN
	default:
		return authpb.Role_ROLE_UNSPECIFIED
	}
}

func protoRoleToModel(role authpb.Role) model.Role {
	switch role {
	case authpb.Role_ROLE_STUDENT:
		return model.RoleStudent
	case authpb.Role_ROLE_EDUCATOR:
		return model.RoleEducator
	case authpb.Role_ROLE_HEAD_EDUCATOR:
		return model.RoleHeadEducator
	case authpb.Role_ROLE_ADMIN:
		return model.RoleAdmin
	default:
		return model.RoleStudent
	}
}

func modelGradeToProto(grade model.Grade) authpb.Grade {
	switch grade {
	case model.GradeG1:
		return authpb.Grade_GRADE_G1
	case model.GradeG2:
		return authpb.Grade_GRADE_G2
	case model.GradeG3:
		return authpb.Grade_GRADE_G3
	case model.GradeG4:
		return authpb.Grade_GRADE_G4
	case model.GradeG5:
		return authpb.Grade_GRADE_G5
	case model.GradeG6:
		return authpb.Grade_GRADE_G6
	case model.GradeG7:
		return authpb.Grade_GRADE_G7
	case model.GradeG8:
		return authpb.Grade_GRADE_G8
	case model.GradeG9:
		return authpb.Grade_GRADE_G9
	case model.GradeG10:
		return authpb.Grade_GRADE_G10
	case model.GradeG11:
		return authpb.Grade_GRADE_G11
	case model.GradeOl:
		return authpb.Grade_GRADE_OL
	case model.GradeAl:
		return authpb.Grade_GRADE_AL
	default:
		return authpb.Grade_GRADE_UNSPECIFIED
	}
}

func protoGradeToModel(grade authpb.Grade) model.Grade {
	switch grade {
	case authpb.Grade_GRADE_G1:
		return model.GradeG1
	case authpb.Grade_GRADE_G2:
		return model.GradeG2
	case authpb.Grade_GRADE_G3:
		return model.GradeG3
	case authpb.Grade_GRADE_G4:
		return model.GradeG4
	case authpb.Grade_GRADE_G5:
		return model.GradeG5
	case authpb.Grade_GRADE_G6:
		return model.GradeG6
	case authpb.Grade_GRADE_G7:
		return model.GradeG7
	case authpb.Grade_GRADE_G8:
		return model.GradeG8
	case authpb.Grade_GRADE_G9:
		return model.GradeG9
	case authpb.Grade_GRADE_G10:
		return model.GradeG10
	case authpb.Grade_GRADE_G11:
		return model.GradeG11
	case authpb.Grade_GRADE_OL:
		return model.GradeOl
	case authpb.Grade_GRADE_AL:
		return model.GradeAl
	default:
		return model.GradeG1
	}
}
