package handler

import (
	"log/slog"
	"net/http"
	"net/http/httputil"
	"net/url"
	"strings"
	"time"

	"github.com/studed/api-gateway/internal/middleware"
)

// UploadProxy fronts the upload-service.
//
// upload-service trusts a shared service token and knows nothing about users,
// so the gateway is where per-user authorization happens: reads are public
// (course images are embedded in pages), writes require an educator. The
// service token is attached here and never leaves the cluster, so a browser
// cannot call upload-service directly even if it were routable.
type UploadProxy struct {
	proxy *httputil.ReverseProxy
	log   *slog.Logger
}

func NewUploadProxy(uploadServiceURL, serviceToken string, log *slog.Logger) (*UploadProxy, error) {
	target, err := url.Parse(uploadServiceURL)
	if err != nil {
		return nil, err
	}

	proxy := &httputil.ReverseProxy{
		Rewrite: func(r *httputil.ProxyRequest) {
			r.SetURL(target)
			// SetURL drops the inbound Host; upload-service does not vhost, but
			// keeping it makes upstream logs readable.
			r.Out.Host = target.Host
			r.Out.Header.Set("Authorization", "Bearer "+serviceToken)
			// Never forward the end user's cookies to an internal service.
			r.Out.Header.Del("Cookie")
		},
		// Uploads stream; do not buffer the whole body in the gateway.
		FlushInterval: -1,
		Transport: &http.Transport{
			Proxy:                 http.ProxyFromEnvironment,
			MaxIdleConns:          50,
			IdleConnTimeout:       90 * time.Second,
			TLSHandshakeTimeout:   5 * time.Second,
			ExpectContinueTimeout: 1 * time.Second,
		},
		ErrorHandler: func(w http.ResponseWriter, r *http.Request, err error) {
			log.Error("upload-service proxy error",
				slog.String("path", r.URL.Path), slog.Any("error", err))
			http.Error(w, `{"error":"upload service unavailable"}`, http.StatusBadGateway)
		},
	}

	return &UploadProxy{proxy: proxy, log: log}, nil
}

func (p *UploadProxy) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	// Reads stay public so <img> tags render without an Authorization header.
	if r.Method == http.MethodGet || r.Method == http.MethodHead {
		if !strings.HasPrefix(r.URL.Path, "/v1/uploads/files/") {
			http.Error(w, `{"error":"not found"}`, http.StatusNotFound)
			return
		}
		p.proxy.ServeHTTP(w, r)
		return
	}

	if r.Method != http.MethodPost && r.Method != http.MethodDelete {
		http.Error(w, `{"error":"method not allowed"}`, http.StatusMethodNotAllowed)
		return
	}

	// The auth middleware attaches the user but never blocks, so writes are
	// gated here, mirroring the GraphQL resolvers and the AI chat proxy.
	userCtx, ok := middleware.UserFromContext(r.Context())
	if !ok || userCtx.UserID == "" {
		http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
		return
	}
	if !userCtx.IsEducator() {
		http.Error(w, `{"error":"forbidden: educator role required"}`, http.StatusForbidden)
		return
	}

	p.proxy.ServeHTTP(w, r)
}
