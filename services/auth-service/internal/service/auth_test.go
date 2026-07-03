package service

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/studed/auth-service/internal/jwt"
	"github.com/studed/auth-service/internal/model"
	authpb "github.com/studed/shared/proto/gen/go"
)

type inMemoryUserRepo struct {
	users []*model.User
}

func (r *inMemoryUserRepo) Create(ctx context.Context, user *model.User) error {
	for _, u := range r.users {
		if u.Email == user.Email {
			return errors.New("duplicate email")
		}
	}
	user.ID = generateID()
	r.users = append(r.users, user)
	return nil
}

func (r *inMemoryUserRepo) GetByEmail(ctx context.Context, email string) (*model.User, error) {
	for _, u := range r.users {
		if u.Email == email {
			return u, nil
		}
	}
	return nil, errors.New("not found")
}

func (r *inMemoryUserRepo) GetByID(ctx context.Context, id string) (*model.User, error) {
	for _, u := range r.users {
		if u.ID == id {
			return u, nil
		}
	}
	return nil, errors.New("not found")
}

func (r *inMemoryUserRepo) EmailExists(ctx context.Context, email string) (bool, error) {
	for _, u := range r.users {
		if u.Email == email {
			return true, nil
		}
	}
	return false, nil
}

var idCounter int

func generateID() string {
	idCounter++
	return string(rune('a' + idCounter%26))
}

func newTestService() AuthService {
	repo := &inMemoryUserRepo{}
	jwtMgr := jwt.NewManager("access-secret", "refresh-secret", testAccessTTL, testRefreshTTL)
	return NewAuthService(repo, jwtMgr)
}

const testAccessTTL = 15 * time.Minute
const testRefreshTTL = 60 * time.Minute

func TestRegisterAndLogin(t *testing.T) {
	svc := newTestService()
	ctx := context.Background()

	grade := model.GradeG10
	resp, err := svc.Register(ctx, "test@example.com", "password123", "Test User", model.RoleStudent, &grade, "en")
	if err != nil {
		t.Fatalf("register failed: %v", err)
	}
	if resp.AccessToken == "" {
		t.Fatal("expected access token")
	}
	if resp.RefreshToken == "" {
		t.Fatal("expected refresh token")
	}
	if resp.User.Email != "test@example.com" {
		t.Fatalf("unexpected email: %s", resp.User.Email)
	}

	loginResp, err := svc.Login(ctx, "test@example.com", "password123")
	if err != nil {
		t.Fatalf("login failed: %v", err)
	}
	if loginResp.AccessToken == "" {
		t.Fatal("expected access token on login")
	}

	_, err = svc.Login(ctx, "test@example.com", "wrongpassword")
	if err == nil {
		t.Fatal("expected login failure with wrong password")
	}
}

func TestRegisterDuplicateEmail(t *testing.T) {
	svc := newTestService()
	ctx := context.Background()

	if _, err := svc.Register(ctx, "dup@example.com", "password123", "User One", model.RoleStudent, nil, "en"); err != nil {
		t.Fatalf("first register failed: %v", err)
	}

	if _, err := svc.Register(ctx, "dup@example.com", "password123", "User Two", model.RoleStudent, nil, "en"); err == nil {
		t.Fatal("expected duplicate email error")
	}
}

func TestValidateToken(t *testing.T) {
	svc := newTestService()
	ctx := context.Background()

	resp, err := svc.Register(ctx, "validate@example.com", "password123", "Validate User", model.RoleEducator, nil, "si")
	if err != nil {
		t.Fatalf("register failed: %v", err)
	}

	validated, err := svc.ValidateToken(ctx, resp.AccessToken)
	if err != nil {
		t.Fatalf("validate token failed: %v", err)
	}
	if !validated.Valid {
		t.Fatal("expected token to be valid")
	}
	if validated.Role != authpb.Role_ROLE_EDUCATOR {
		t.Fatalf("unexpected role: %v", validated.Role)
	}

	validatedInvalid, err := svc.ValidateToken(ctx, "invalid-token")
	if err != nil {
		t.Fatalf("validate token returned error: %v", err)
	}
	if validatedInvalid.Valid {
		t.Fatal("expected invalid token to be invalid")
	}
}
