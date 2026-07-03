package model

import (
	"time"

	authpb "github.com/studed/shared/proto/gen/go/auth"
	coursepb "github.com/studed/shared/proto/gen/go/course"
)

type CourseStatus string

const (
	CourseStatusDraft     CourseStatus = "DRAFT"
	CourseStatusPublished CourseStatus = "PUBLISHED"
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

type Course struct {
	ID          string `gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	Title       string `gorm:"not null"`
	Description string `gorm:"not null"`
	Slug        string `gorm:"uniqueIndex;not null"`
	GradeLevel  Grade  `gorm:"not null"`
	EducatorID  string `gorm:"not null;index"`
	Price       *float64
	Status      CourseStatus `gorm:"not null;default:'DRAFT'"`
	PublishedAt *time.Time
	CreatedAt   time.Time `gorm:"autoCreateTime"`
	UpdatedAt   time.Time `gorm:"autoUpdateTime"`
}

func (Course) TableName() string {
	return "courses"
}

func (c *Course) ToProto() *coursepb.Course {
	course := &coursepb.Course{
		Id:            c.ID,
		Title:         c.Title,
		Description:   c.Description,
		Slug:          c.Slug,
		GradeLevel:    ToAuthProtoGrade(c.GradeLevel),
		EducatorId:    c.EducatorID,
		Status:        ToProtoStatus(c.Status),
		CreatedAtUnix: c.CreatedAt.Unix(),
		UpdatedAtUnix: c.UpdatedAt.Unix(),
	}
	if c.Price != nil {
		course.Price = *c.Price
	}
	return course
}

func ToProtoStatus(status CourseStatus) coursepb.CourseStatus {
	switch status {
	case CourseStatusPublished:
		return coursepb.CourseStatus_COURSE_STATUS_PUBLISHED
	default:
		return coursepb.CourseStatus_COURSE_STATUS_DRAFT
	}
}

func ToAuthProtoGrade(grade Grade) authpb.Grade {
	switch grade {
	case GradeG1:
		return authpb.Grade_GRADE_G1
	case GradeG2:
		return authpb.Grade_GRADE_G2
	case GradeG3:
		return authpb.Grade_GRADE_G3
	case GradeG4:
		return authpb.Grade_GRADE_G4
	case GradeG5:
		return authpb.Grade_GRADE_G5
	case GradeG6:
		return authpb.Grade_GRADE_G6
	case GradeG7:
		return authpb.Grade_GRADE_G7
	case GradeG8:
		return authpb.Grade_GRADE_G8
	case GradeG9:
		return authpb.Grade_GRADE_G9
	case GradeG10:
		return authpb.Grade_GRADE_G10
	case GradeG11:
		return authpb.Grade_GRADE_G11
	case GradeOL:
		return authpb.Grade_GRADE_OL
	case GradeAL:
		return authpb.Grade_GRADE_AL
	default:
		return authpb.Grade_GRADE_UNSPECIFIED
	}
}

func FromAuthProtoGrade(grade authpb.Grade) Grade {
	switch grade {
	case authpb.Grade_GRADE_G1:
		return GradeG1
	case authpb.Grade_GRADE_G2:
		return GradeG2
	case authpb.Grade_GRADE_G3:
		return GradeG3
	case authpb.Grade_GRADE_G4:
		return GradeG4
	case authpb.Grade_GRADE_G5:
		return GradeG5
	case authpb.Grade_GRADE_G6:
		return GradeG6
	case authpb.Grade_GRADE_G7:
		return GradeG7
	case authpb.Grade_GRADE_G8:
		return GradeG8
	case authpb.Grade_GRADE_G9:
		return GradeG9
	case authpb.Grade_GRADE_G10:
		return GradeG10
	case authpb.Grade_GRADE_G11:
		return GradeG11
	case authpb.Grade_GRADE_OL:
		return GradeOL
	case authpb.Grade_GRADE_AL:
		return GradeAL
	default:
		return GradeG1
	}
}
