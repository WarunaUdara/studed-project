package client

import (
	"context"
	"testing"

	"github.com/studed/api-gateway/internal/middleware"
	coursepb "github.com/studed/shared/proto/gen/go/course"
)

func TestProtoWaveToModel_StripsAnswersForStudent(t *testing.T) {
	waveProto := &coursepb.Wave{
		Id:                 "w1",
		Title:              "Sample Wave",
		EvaluateBlocksJson: `[{"id":"q1","question":"What is 2+2?","options":["3","4"],"correctAnswer":"4","explanation":"2+2=4"}]`,
	}

	// 1. Student context (non-elevated)
	studentCtx := context.WithValue(context.Background(), middleware.UserContextKey, middleware.UserContext{
		Role: "STUDENT",
	})
	studentWave := protoWaveToModel(studentCtx, waveProto)
	if len(studentWave.EvaluateBlocks) == 0 {
		t.Fatalf("expected 1 evaluate block, got 0")
	}
	if studentWave.EvaluateBlocks[0].CorrectAnswer != nil {
		t.Errorf("expected correctAnswer to be nil for STUDENT, got %v", *studentWave.EvaluateBlocks[0].CorrectAnswer)
	}
	if studentWave.EvaluateBlocks[0].Explanation != nil {
		t.Errorf("expected explanation to be nil for STUDENT, got %v", *studentWave.EvaluateBlocks[0].Explanation)
	}

	// 2. Educator context (elevated)
	educatorCtx := context.WithValue(context.Background(), middleware.UserContextKey, middleware.UserContext{
		Role: "EDUCATOR",
	})
	educatorWave := protoWaveToModel(educatorCtx, waveProto)
	if educatorWave.EvaluateBlocks[0].CorrectAnswer == nil || *educatorWave.EvaluateBlocks[0].CorrectAnswer != "4" {
		t.Errorf("expected correctAnswer to be '4' for EDUCATOR, got %v", educatorWave.EvaluateBlocks[0].CorrectAnswer)
	}
}
