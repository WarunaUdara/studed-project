package main

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"os/signal"
	"path/filepath"
	"strings"
	"syscall"
	"time"

	"cloud.google.com/go/storage"
	"google.golang.org/api/option"
)

type UploadResponse struct {
	URL      string `json:"url"`
	Filename string `json:"filename"`
	Size     int64  `json:"size"`
}

func main() {
	bucketName := os.Getenv("GCS_BUCKET_NAME")
	emulatorHost := os.Getenv("STORAGE_EMULATOR_HOST")
	flociUrl := os.Getenv("FLOCI_GCP_BASE_URL")
	serviceAddr := os.Getenv("UPLOAD_SERVICE_ADDR")
	if serviceAddr == "" {
		serviceAddr = ":8092"
	}

	uploadDir := "./uploads"
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		log.Printf("warning: failed to create local upload directory: %v", err)
	}

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	var storageClient *storage.Client
	if bucketName != "" {
		var opts []option.ClientOption
		if emulatorHost != "" || flociUrl != "" {
			host := emulatorHost
			if host == "" {
				host = flociUrl
			}
			opts = append(opts, option.WithEndpoint(host), option.WithoutAuthentication())
		}
		sc, err := storage.NewClient(ctx, opts...)
		if err != nil {
			log.Printf("warning: failed to initialize GCS storage client: %v", err)
		} else {
			storageClient = sc
			defer storageClient.Close()
			log.Printf("upload-service: GCS bucket '%s' initialized", bucketName)
		}
	}

	mux := http.NewServeMux()

	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("upload-service ok"))
	})

	mux.HandleFunc("/upload", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return;
		}

		// 32MB max upload memory
		if err := r.ParseMultipartForm(32 << 20); err != nil {
			http.Error(w, fmt.Sprintf("Failed to parse form: %v", err), http.StatusBadRequest)
			return
		}

		file, header, err := r.FormFile("file")
		if err != nil {
			http.Error(w, "Missing 'file' form field", http.StatusBadRequest)
			return
		}
		defer file.Close()

		ext := filepath.Ext(header.Filename)
		cleanName := fmt.Sprintf("%d-%s", time.Now().UnixNano(), strings.TrimSuffix(header.Filename, ext))
		safeFilename := fmt.Sprintf("%s%s", cleanName, ext)

		var fileURL string
		var fileSize int64

		if storageClient != nil && bucketName != "" {
			bh := storageClient.Bucket(bucketName)
			obj := bh.Object(safeFilename)
			sw := obj.NewWriter(r.Context())
			sw.ContentType = header.Header.Get("Content-Type")

			written, err := io.Copy(sw, file)
			if err != nil {
				_ = sw.Close()
				http.Error(w, fmt.Sprintf("Failed to write to GCS: %v", err), http.StatusInternalServerError)
				return
			}
			if err := sw.Close(); err != nil {
				http.Error(w, fmt.Sprintf("Failed to finalize GCS upload: %v", err), http.StatusInternalServerError)
				return
			}

			fileSize = written
			if emulatorHost != "" {
				fileURL = fmt.Sprintf("%s/storage/v1/b/%s/o/%s?alt=media", emulatorHost, bucketName, safeFilename)
			} else {
				fileURL = fmt.Sprintf("https://storage.googleapis.com/%s/%s", bucketName, safeFilename)
			}
		} else {
			// Fallback local storage for dev mode / emulator
			dstPath := filepath.Join(uploadDir, safeFilename)
			dst, err := os.Create(dstPath)
			if err != nil {
				http.Error(w, fmt.Sprintf("Failed to save file locally: %v", err), http.StatusInternalServerError)
				return
			}
			defer dst.Close()

			written, err := io.Copy(dst, file)
			if err != nil {
				http.Error(w, fmt.Sprintf("Failed to write file: %v", err), http.StatusInternalServerError)
				return
			}
			fileSize = written
			fileURL = fmt.Sprintf("/uploads/%s", safeFilename)
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		_ = json.NewEncoder(w).Encode(UploadResponse{
			URL:      fileURL,
			Filename: safeFilename,
			Size:     fileSize,
		})
	})

	// Serve static uploads for local dev / emulator mode
	mux.Handle("/uploads/", http.StripPrefix("/uploads/", http.FileServer(http.Dir(uploadDir))))

	server := &http.Server{
		Addr:              serviceAddr,
		Handler:           mux,
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       30 * time.Second,
		WriteTimeout:      30 * time.Second,
		IdleTimeout:       60 * time.Second,
	}

	go func() {
		log.Printf("upload-service listening on %s", serviceAddr)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("upload-service error: %v", err)
		}
	}()

	<-ctx.Done()
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	_ = server.Shutdown(shutdownCtx)
}
