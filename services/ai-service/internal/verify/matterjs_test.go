package verify

import (
	"encoding/json"
	"strings"
	"testing"
)

func mustMeta(t *testing.T, world map[string]any) json.RawMessage {
	t.Helper()
	payload := map[string]any{"world_config": world}
	b, err := json.Marshal(payload)
	if err != nil {
		t.Fatalf("marshal: %v", err)
	}
	return b
}

func TestVerifyMatterConfig_ValidPendulum(t *testing.T) {
	meta := mustMeta(t, map[string]any{
		"gravity": map[string]any{"x": 0, "y": 1, "scale": 0.001},
		"bounds":  map[string]any{"width": 800, "height": 500},
		"bodies": []any{
			map[string]any{"id": "anchor", "type": "circle", "position": map[string]any{"x": 400, "y": 100}, "radius": 10, "isStatic": true},
			map[string]any{"id": "bob", "type": "circle", "position": map[string]any{"x": 400, "y": 300}, "radius": 20, "density": 0.04, "restitution": 0.6, "friction": 0.01, "isStatic": false},
		},
		"constraints": []any{
			map[string]any{"id": "string", "bodyA": "anchor", "bodyB": "bob", "length": 200, "stiffness": 0.8},
		},
	})
	rep := MatterConfig(meta)
	if !rep.OK {
		t.Fatalf("expected OK, got issues: %v", rep.Issues)
	}
	if rep.Stats.Ticks != simTicks || rep.Stats.Bodies != 2 {
		t.Errorf("stats = %+v", rep.Stats)
	}
}

func TestVerifyMatterConfig_ValidProjectileWithBounce(t *testing.T) {
	// A fast projectile bounces off the walls; that is not an escape.
	meta := mustMeta(t, map[string]any{
		"gravity": map[string]any{"x": 0, "y": 1, "scale": 0.001},
		"bounds":  map[string]any{"width": 800, "height": 500},
		"bodies": []any{
			map[string]any{"id": "projectile", "type": "circle", "position": map[string]any{"x": 100, "y": 400}, "radius": 12, "density": 0.04, "restitution": 0.6, "friction": 0.01, "isStatic": false, "velocity": map[string]any{"x": 14, "y": -11}},
			map[string]any{"id": "ground", "type": "rectangle", "position": map[string]any{"x": 400, "y": 490}, "width": 800, "height": 20, "isStatic": true},
		},
	})
	rep := MatterConfig(meta)
	if !rep.OK {
		t.Fatalf("expected OK for bouncing projectile, got: %v", rep.Issues)
	}
}

func TestVerifyMatterConfig_MissingConstraintBody(t *testing.T) {
	meta := mustMeta(t, map[string]any{
		"gravity": map[string]any{"x": 0, "y": 1},
		"bounds":  map[string]any{"width": 800, "height": 500},
		"bodies": []any{
			map[string]any{"id": "bob", "type": "circle", "position": map[string]any{"x": 400, "y": 300}, "radius": 20, "isStatic": false},
		},
		"constraints": []any{
			map[string]any{"id": "string", "bodyA": "nonexistent", "bodyB": "bob", "length": 200, "stiffness": 0.8},
		},
	})
	rep := MatterConfig(meta)
	if rep.OK {
		t.Fatal("expected failure for constraint referencing a missing body")
	}
	found := false
	for _, issue := range rep.Issues {
		if strings.Contains(issue, "nonexistent") {
			found = true
		}
	}
	if !found {
		t.Errorf("issues = %v, want mention of missing body", rep.Issues)
	}
}

func TestVerifyMatterConfig_NonFinitePosition(t *testing.T) {
	meta := mustMeta(t, map[string]any{
		"bounds": map[string]any{"width": 800, "height": 500},
		"bodies": []any{
			map[string]any{"id": "ghost", "type": "circle", "position": map[string]any{"x": "NaN", "y": 100}, "radius": 10},
		},
	})
	rep := MatterConfig(meta)
	if rep.OK {
		t.Fatal("expected failure for non-finite position")
	}
}

func TestVerifyMatterConfig_UnknownBodyType(t *testing.T) {
	meta := mustMeta(t, map[string]any{
		"bounds": map[string]any{"width": 800, "height": 500},
		"bodies": []any{
			map[string]any{"id": "weird", "type": "triangle", "position": map[string]any{"x": 100, "y": 100}, "radius": 10},
		},
	})
	rep := MatterConfig(meta)
	if rep.OK {
		t.Fatal("expected failure for unknown body type")
	}
	if !strings.Contains(rep.IssuesText(), "triangle") {
		t.Errorf("issues = %v, want mention of triangle", rep.Issues)
	}
}

func TestVerifyMatterConfig_EmptyBodies(t *testing.T) {
	meta := mustMeta(t, map[string]any{
		"bounds": map[string]any{"width": 800, "height": 500},
		"bodies": []any{},
	})
	rep := MatterConfig(meta)
	if rep.OK {
		t.Fatal("expected failure for empty bodies")
	}
}

func TestVerifyMatterConfig_UnstableDensity(t *testing.T) {
	// Zero/negative density makes mass <= 0 -> unstable; must be flagged.
	meta := mustMeta(t, map[string]any{
		"gravity": map[string]any{"x": 0, "y": 1, "scale": 0.001},
		"bounds":  map[string]any{"width": 800, "height": 500},
		"bodies": []any{
			map[string]any{"id": "bob", "type": "circle", "position": map[string]any{"x": 400, "y": 300}, "radius": 20, "density": 0, "isStatic": false},
		},
	})
	rep := MatterConfig(meta)
	if rep.OK {
		t.Fatal("expected failure for non-positive density")
	}
}

func TestVerifyMatterConfig_InvalidJSON(t *testing.T) {
	rep := MatterConfig(json.RawMessage(`{not json`))
	if rep.OK {
		t.Fatal("expected failure for invalid JSON")
	}
}

func TestVerifyMatterConfig_StiffnessOutOfRange(t *testing.T) {
	meta := mustMeta(t, map[string]any{
		"bounds": map[string]any{"width": 800, "height": 500},
		"bodies": []any{
			map[string]any{"id": "a", "type": "circle", "position": map[string]any{"x": 100, "y": 100}, "radius": 10, "isStatic": true},
			map[string]any{"id": "b", "type": "circle", "position": map[string]any{"x": 200, "y": 100}, "radius": 10, "isStatic": false},
		},
		"constraints": []any{
			map[string]any{"id": "c", "bodyA": "a", "bodyB": "b", "length": 100, "stiffness": 5},
		},
	})
	rep := MatterConfig(meta)
	if rep.OK {
		t.Fatal("expected failure for stiffness out of range")
	}
}
