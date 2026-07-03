package logger

import "log/slog"

func New(service string) *slog.Logger {
	return slog.Default().With(slog.String("service", service))
}
