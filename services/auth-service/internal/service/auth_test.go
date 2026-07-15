package service

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/studed/auth-service/internal/jwt"
	"github.com/studed/auth-service/internal/model"
	authpb "github.com/studed/shared/proto/gen/go/auth"
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

func (r *inMemoryUserRepo) Update(ctx context.Context, user *model.User) error {
	for i, u := range r.users {
		if u.ID == user.ID {
			r.users[i] = user
			return nil
		}
	}
	return errors.New("user not found")
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

func TestRefreshToken_IssuesNewTokenPair(t *testing.T) {
	svc := newTestService()
	ctx := context.Background()

	grade := model.GradeG10
	registered, err := svc.Register(ctx, "refresh@example.com", "password123", "Refresh User", model.RoleStudent, &grade, "en")
	if err != nil {
		t.Fatalf("register failed: %v", err)
	}

	refreshed, err := svc.RefreshToken(ctx, registered.RefreshToken)
	if err != nil {
		t.Fatalf("refresh failed: %v", err)
	}
	if refreshed.AccessToken == "" || refreshed.RefreshToken == "" {
		t.Fatal("expected a new token pair")
	}
	if refreshed.User.Email != "refresh@example.com" {
		t.Fatalf("expected refreshed claims to carry the same user, got %s", refreshed.User.Email)
	}
}

func TestRefreshToken_RejectsAccessTokenUsedAsRefresh(t *testing.T) {
	svc := newTestService()
	ctx := context.Background()

	registered, err := svc.Register(ctx, "typeconfusion@example.com", "password123", "Test User", model.RoleStudent, nil, "en")
	if err != nil {
		t.Fatalf("register failed: %v", err)
	}

	if _, err := svc.RefreshToken(ctx, registered.AccessToken); err == nil {
		t.Fatal("expected an error when an access token is presented as a refresh token")
	}
}

func TestRefreshToken_RejectsGarbageToken(t *testing.T) {
	svc := newTestService()
	if _, err := svc.RefreshToken(context.Background(), "not-a-real-token"); err == nil {
		t.Fatal("expected an error for a malformed refresh token")
	}
}

func TestRegister_RejectsMissingRequiredFields(t *testing.T) {
	svc := newTestService()
	ctx := context.Background()

	cases := []struct {
		name     string
		email    string
		password string
		fullName string
	}{
		{"missing email", "", "password123", "Some Name"},
		{"missing password", "noPassword@example.com", "", "Some Name"},
		{"missing full name", "noname@example.com", "password123", ""},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			if _, err := svc.Register(ctx, tc.email, tc.password, tc.fullName, model.RoleStudent, nil, "en"); err == nil {
				t.Fatalf("expected an error for %s", tc.name)
			}
		})
	}
}

func TestRegister_RejectsPasswordShorterThan8Chars(t *testing.T) {
	svc := newTestService()
	if _, err := svc.Register(context.Background(), "short@example.com", "short", "Short Pw", model.RoleStudent, nil, "en"); err == nil {
		t.Fatal("expected an error for a password under 8 characters")
	}
}

func TestRegister_DefaultsRoleToStudentWhenUnspecified(t *testing.T) {
	svc := newTestService()
	ctx := context.Background()

	resp, err := svc.Register(ctx, "norole@example.com", "password123", "No Role", "", nil, "en")
	if err != nil {
		t.Fatalf("register failed: %v", err)
	}
	if resp.User.Role != authpb.Role_ROLE_STUDENT {
		t.Fatalf("expected role to default to STUDENT, got %v", resp.User.Role)
	}
}

func TestRegister_DefaultsPreferredLanguageToEnglish(t *testing.T) {
	svc := newTestService()
	resp, err := svc.Register(context.Background(), "nolang@example.com", "password123", "No Lang", model.RoleStudent, nil, "")
	if err != nil {
		t.Fatalf("register failed: %v", err)
	}
	if resp.User.PreferredLanguage != "en" {
		t.Fatalf("expected preferred language to default to 'en', got %q", resp.User.PreferredLanguage)
	}
}

func TestGetUser_ReturnsRegisteredUser(t *testing.T) {
	svc := newTestService()
	ctx := context.Background()

	registered, err := svc.Register(ctx, "getuser@example.com", "password123", "Get User", model.RoleEducator, nil, "en")
	if err != nil {
		t.Fatalf("register failed: %v", err)
	}

	fetched, err := svc.GetUser(ctx, registered.User.Id)
	if err != nil {
		t.Fatalf("get user failed: %v", err)
	}
	if fetched.Email != "getuser@example.com" || fetched.Role != authpb.Role_ROLE_EDUCATOR {
		t.Fatalf("unexpected user: %+v", fetched)
	}
}

func TestGetUser_UnknownIDReturnsError(t *testing.T) {
	svc := newTestService()
	if _, err := svc.GetUser(context.Background(), "does-not-exist"); err == nil {
		t.Fatal("expected an error for an unknown user id")
	}
}

func TestToProtoRole_UnknownRoleIsUnspecified(t *testing.T) {
	if got := toProtoRole("SOMETHING_MADE_UP"); got != authpb.Role_ROLE_UNSPECIFIED {
		t.Fatalf("expected an unrecognized role string to map to ROLE_UNSPECIFIED, got %v", got)
	}
	if got := toProtoRole("ADMIN"); got != authpb.Role_ROLE_ADMIN {
		t.Fatalf("expected ADMIN to map to ROLE_ADMIN, got %v", got)
	}
}

func TestToProtoGrade_UnknownGradeIsUnspecified(t *testing.T) {
	if got := toProtoGrade("NOT_A_GRADE"); got != authpb.Grade_GRADE_UNSPECIFIED {
		t.Fatalf("expected an unrecognized grade string to map to GRADE_UNSPECIFIED, got %v", got)
	}
	if got := toProtoGrade("AL"); got != authpb.Grade_GRADE_AL {
		t.Fatalf("expected AL to map to GRADE_AL, got %v", got)
	}
}

func TestProtoToModelRole_DefaultsToStudent(t *testing.T) {
	if got := ProtoToModelRole(authpb.Role_ROLE_UNSPECIFIED); got != model.RoleStudent {
		t.Fatalf("expected unspecified role to default to student, got %v", got)
	}
	if got := ProtoToModelRole(authpb.Role_ROLE_HEAD_EDUCATOR); got != model.RoleHeadEducator {
		t.Fatalf("expected ROLE_HEAD_EDUCATOR to map to head educator, got %v", got)
	}
}

func TestProtoToModelGrade_UnspecifiedReturnsNil(t *testing.T) {
	if got := ProtoToModelGrade(authpb.Grade_GRADE_UNSPECIFIED); got != nil {
		t.Fatalf("expected unspecified grade to map to nil, got %v", got)
	}
	if got := ProtoToModelGrade(authpb.Grade_GRADE_G7); got == nil || *got != model.GradeG7 {
		t.Fatalf("expected GRADE_G7 to map to model.GradeG7, got %v", got)
	}
}
