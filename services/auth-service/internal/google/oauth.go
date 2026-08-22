package google

import (
	"context"
	"fmt"

	"github.com/coreos/go-oidc/v3/oidc"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
)

const issuer = "https://accounts.google.com"

// Claims is the subset of a Google ID token that StudEd needs to map a Google
// account onto a local user.
type Claims struct {
	Email         string `json:"email"`
	EmailVerified bool   `json:"email_verified"`
	Name          string `json:"name"`
	Subject       string `json:"sub"`
}

// Client exchanges a Google authorization code for an ID token (authorization
// code + PKCE flow) and verifies its signature against Google's published keys.
type Client struct {
	cfg      *oauth2.Config
	verifier *oidc.IDTokenVerifier
}

// NewClient builds the OAuth2 config and a shared OIDC verifier. The OIDC
// provider discovery (and JWKS fetch) is done once here at startup so the hot
// path never hits the network to Google except for the token exchange.
func NewClient(clientID, clientSecret, redirectURI string) (*Client, error) {
	if clientID == "" || clientSecret == "" {
		return nil, fmt.Errorf("google client id and secret are required")
	}

	provider, err := oidc.NewProvider(context.Background(), issuer)
	if err != nil {
		return nil, fmt.Errorf("failed to discover google oidc provider: %w", err)
	}

	cfg := &oauth2.Config{
		ClientID:     clientID,
		ClientSecret: clientSecret,
		RedirectURL:  redirectURI,
		Endpoint:     google.Endpoint,
		Scopes:       []string{oidc.ScopeOpenID, "email", "profile"},
	}

	return &Client{
		cfg:      cfg,
		verifier: provider.Verifier(&oidc.Config{ClientID: clientID}),
	}, nil
}

// ExchangeAndVerify trades the authorization code for tokens and returns the
// verified claims from the ID token.
func (c *Client) ExchangeAndVerify(ctx context.Context, code, codeVerifier string) (*Claims, error) {
	if code == "" {
		return nil, fmt.Errorf("authorization code is required")
	}
	if codeVerifier == "" {
		return nil, fmt.Errorf("code verifier is required")
	}

	opts := []oauth2.AuthCodeOption{oauth2.VerifierOption(codeVerifier)}

	token, err := c.cfg.Exchange(ctx, code, opts...)
	if err != nil {
		return nil, fmt.Errorf("failed to exchange authorization code: %w", err)
	}

	rawIDToken, ok := token.Extra("id_token").(string)
	if !ok || rawIDToken == "" {
		return nil, fmt.Errorf("google response did not include an id token")
	}

	idToken, err := c.verifier.Verify(ctx, rawIDToken)
	if err != nil {
		return nil, fmt.Errorf("failed to verify id token: %w", err)
	}

	var claims Claims
	if err := idToken.Claims(&claims); err != nil {
		return nil, fmt.Errorf("failed to decode id token claims: %w", err)
	}

	if claims.Email == "" || !claims.EmailVerified {
		return nil, fmt.Errorf("google account email is not verified")
	}
	if claims.Subject == "" {
		return nil, fmt.Errorf("google account has no subject")
	}

	return &claims, nil
}
