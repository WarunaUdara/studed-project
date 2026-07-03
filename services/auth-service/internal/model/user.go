package model

import (
	"time"
)

type Role string

const (
	RoleStudent      Role = "STUDENT"
	RoleEducator     Role = "EDUCATOR"
	RoleHeadEducator Role = "HEAD_EDUCATOR"
	RoleAdmin        Role = "ADMIN"
)

type Grade string

const (
	GradeG1  Grade = "G1"
	GradeG2  Grade = "G2"
	GradeG3  Grade = "G3"
	GradeG4  Grade = "G4"
	GradeG5  Grade = "G5"
	GradeG6  Grade = "G6"
	GradeG7  Grade = "G7"
	GradeG8  Grade = "G8"
	GradeG9  Grade = "G9"
	GradeG10 Grade = "G10"
	GradeG11 Grade = "G11"
	GradeOL  Grade = "OL"
	GradeAL  Grade = "AL"
)

type User struct {
	ID                string `gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	Email             string `gorm:"uniqueIndex;not null"`
	PasswordHash      string `gorm:"not null"`
	FullName          string `gorm:"not null"`
	Role              Role   `gorm:"not null;default:'STUDENT'"`
	Grade             *Grade
	PreferredLanguage string    `gorm:"not null;default:'en'"`
	TotalXp           int       `gorm:"not null;default:0"`
	CreatedAt         time.Time `gorm:"autoCreateTime"`
	UpdatedAt         time.Time `gorm:"autoUpdateTime"`
}

func (User) TableName() string {
	return "users"
}
