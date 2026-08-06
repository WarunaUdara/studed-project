package migrator

import (
	"embed"
	"fmt"

	"gorm.io/gorm"
)

// EnsureSchema auto-migrates GORM models safely and logs migration status.
func EnsureSchema(db *gorm.DB, models ...any) error {
	for _, m := range models {
		if err := db.AutoMigrate(m); err != nil {
			return fmt.Errorf("failed to auto migrate model %T: %w", m, err)
		}
	}
	return nil
}

// EnsureSchemaFS placeholder for embedded golang-migrate FS support
func EnsureSchemaFS(db *gorm.DB, fs embed.FS, models ...any) error {
	return EnsureSchema(db, models...)
}
