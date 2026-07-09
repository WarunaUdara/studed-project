package service

import (
	"context"
	"fmt"
	"strings"

	"github.com/studed/auth-service/internal/jwt"
	"github.com/studed/auth-service/internal/model"
	"github.com/studed/auth-service/internal/repository"
	authpb "github.com/studed/shared/proto/gen/go/auth"
	"golang.org/x/crypto/bcrypt"
)

type AuthService interface {
	Register(ctx context.Context, email, password, fullName string, role model.Role, grade *model.Grade, preferredLanguage string) (*authpb.AuthResponse, error)
	Login(ctx context.Context, email, password string) (*authpb.AuthResponse, error)
	RefreshToken(ctx context.Context, refreshToken string) (*authpb.AuthResponse, error)
	ValidateToken(ctx context.Context, accessToken string) (*authpb.ValidateTokenResponse, error)
	GetUser(ctx context.Context, userID string) (*authpb.User, error)
}

type authService struct {
	repo   repository.UserRepository
	jwtMgr *jwt.Manager
}

func NewAuthService(repo repository.UserRepository, jwtMgr *jwt.Manager) AuthService {
	return &authService{repo: repo, jwtMgr: jwtMgr}
}

func (s *authService) Register(ctx context.Context, email, password, fullName string, role model.Role, grade *model.Grade, preferredLanguage string) (*authpb.AuthResponse, error) {
	email = strings.TrimSpace(strings.ToLower(email))
	if email == "" || password == "" || fullName == "" {
		return nil, fmt.Errorf("email, password, and full name are required")
	}

	if len(password) < 8 {
		return nil, fmt.Errorf("password must be at least 8 characters")
	}

	exists, err := s.repo.EmailExists(ctx, email)
	if err != nil {
		return nil, fmt.Errorf("failed to check email: %w", err)
	}
	if exists {
		return nil, fmt.Errorf("email already registered")
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, fmt.Errorf("failed to hash password: %w", err)
	}

	if preferredLanguage == "" {
		preferredLanguage = "en"
	}

	user := &model.User{
		Email:             email,
		PasswordHash:      string(hash),
		FullName:          strings.TrimSpace(fullName),
		Role:              role,
		Grade:             grade,
		PreferredLanguage: preferredLanguage,
	}

	if user.Role == "" {
		user.Role = model.RoleStudent
	}

	if err := s.repo.Create(ctx, user); err != nil {
		return nil, fmt.Errorf("failed to create user: %w", err)
	}

	tokens, err := s.jwtMgr.Generate(user.ID, user.Email, user.FullName, string(user.Role), user.PreferredLanguage)
	if err != nil {
		return nil, fmt.Errorf("failed to generate tokens: %w", err)
	}

	return &authpb.AuthResponse{
		AccessToken:  tokens.AccessToken,
		RefreshToken: tokens.RefreshToken,
		User:         toProtoUser(user),
	}, nil
}

func (s *authService) Login(ctx context.Context, email, password string) (*authpb.AuthResponse, error) {
	email = strings.TrimSpace(strings.ToLower(email))
	if email == "" || password == "" {
		return nil, fmt.Errorf("email and password are required")
	}

	user, err := s.repo.GetByEmail(ctx, email)
	if err != nil {
		return nil, fmt.Errorf("invalid credentials")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password)); err != nil {
		return nil, fmt.Errorf("invalid credentials")
	}

	tokens, err := s.jwtMgr.Generate(user.ID, user.Email, user.FullName, string(user.Role), user.PreferredLanguage)
	if err != nil {
		return nil, fmt.Errorf("failed to generate tokens: %w", err)
	}

	return &authpb.AuthResponse{
		AccessToken:  tokens.AccessToken,
		RefreshToken: tokens.RefreshToken,
		User:         toProtoUser(user),
	}, nil
}

func (s *authService) RefreshToken(ctx context.Context, refreshToken string) (*authpb.AuthResponse, error) {
	claims, err := s.jwtMgr.ValidateRefresh(refreshToken)
	if err != nil {
		return nil, fmt.Errorf("invalid refresh token: %w", err)
	}

	tokens, err := s.jwtMgr.Generate(claims.UserID, claims.Email, claims.FullName, claims.Role, claims.PreferredLanguage)
	if err != nil {
		return nil, fmt.Errorf("failed to generate tokens: %w", err)
	}

	return &authpb.AuthResponse{
		AccessToken:  tokens.AccessToken,
		RefreshToken: tokens.RefreshToken,
		User: &authpb.User{
			Id:                claims.UserID,
			Email:             claims.Email,
			FullName:          claims.FullName,
			Role:              toProtoRole(claims.Role),
			PreferredLanguage: claims.PreferredLanguage,
		},
	}, nil
}

func (s *authService) ValidateToken(ctx context.Context, accessToken string) (*authpb.ValidateTokenResponse, error) {
	claims, err := s.jwtMgr.ValidateAccess(accessToken)
	if err != nil {
		return &authpb.ValidateTokenResponse{Valid: false, Error: err.Error()}, nil
	}

	return &authpb.ValidateTokenResponse{
		Valid:             true,
		UserId:            claims.UserID,
		Email:             claims.Email,
		Role:              toProtoRole(claims.Role),
		FullName:          claims.FullName,
		PreferredLanguage: claims.PreferredLanguage,
	}, nil
}

func (s *authService) GetUser(ctx context.Context, userID string) (*authpb.User, error) {
	user, err := s.repo.GetByID(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("user not found: %w", err)
	}
	return toProtoUser(user), nil
}

func toProtoUser(u *model.User) *authpb.User {
	var grade authpb.Grade
	if u.Grade != nil {
		grade = toProtoGrade(string(*u.Grade))
	}

	return &authpb.User{
		Id:                u.ID,
		Email:             u.Email,
		FullName:          u.FullName,
		Role:              toProtoRole(string(u.Role)),
		Grade:             grade,
		PreferredLanguage: u.PreferredLanguage,
		CreatedAtUnix:     u.CreatedAt.Unix(),
	}
}

func toProtoRole(role string) authpb.Role {
	switch role {
	case "STUDENT":
		return authpb.Role_ROLE_STUDENT
	case "EDUCATOR":
		return authpb.Role_ROLE_EDUCATOR
	case "HEAD_EDUCATOR":
		return authpb.Role_ROLE_HEAD_EDUCATOR
	case "ADMIN":
		return authpb.Role_ROLE_ADMIN
	default:
		return authpb.Role_ROLE_UNSPECIFIED
	}
}

func toProtoGrade(grade string) authpb.Grade {
	switch grade {
	case "G1":
		return authpb.Grade_GRADE_G1
	case "G2":
		return authpb.Grade_GRADE_G2
	case "G3":
		return authpb.Grade_GRADE_G3
	case "G4":
		return authpb.Grade_GRADE_G4
	case "G5":
		return authpb.Grade_GRADE_G5
	case "G6":
		return authpb.Grade_GRADE_G6
	case "G7":
		return authpb.Grade_GRADE_G7
	case "G8":
		return authpb.Grade_GRADE_G8
	case "G9":
		return authpb.Grade_GRADE_G9
	case "G10":
		return authpb.Grade_GRADE_G10
	case "G11":
		return authpb.Grade_GRADE_G11
	case "OL":
		return authpb.Grade_GRADE_OL
	case "AL":
		return authpb.Grade_GRADE_AL
	default:
		return authpb.Grade_GRADE_UNSPECIFIED
	}
}

func ProtoToModelRole(role authpb.Role) model.Role {
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

func ProtoToModelGrade(grade authpb.Grade) *model.Grade {
	var g model.Grade
	switch grade {
	case authpb.Grade_GRADE_G1:
		g = model.GradeG1
	case authpb.Grade_GRADE_G2:
		g = model.GradeG2
	case authpb.Grade_GRADE_G3:
		g = model.GradeG3
	case authpb.Grade_GRADE_G4:
		g = model.GradeG4
	case authpb.Grade_GRADE_G5:
		g = model.GradeG5
	case authpb.Grade_GRADE_G6:
		g = model.GradeG6
	case authpb.Grade_GRADE_G7:
		g = model.GradeG7
	case authpb.Grade_GRADE_G8:
		g = model.GradeG8
	case authpb.Grade_GRADE_G9:
		g = model.GradeG9
	case authpb.Grade_GRADE_G10:
		g = model.GradeG10
	case authpb.Grade_GRADE_G11:
		g = model.GradeG11
	case authpb.Grade_GRADE_OL:
		g = model.GradeOL
	case authpb.Grade_GRADE_AL:
		g = model.GradeAL
	default:
		return nil
	}
	return &g
}
