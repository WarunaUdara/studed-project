package blocks

import (
	"encoding/json"
	"fmt"
	"strings"
)

// Visualization block types the wave editor understands, matching the
// research specs in 08-Research-&-References/*-Integration.md.
var validVizTypes = map[string]bool{
	"mathviz_manim":     true,
	"chemviz_3dmol":     true,
	"elecsim_tscircuit": true,
	"mechsim_matterjs":  true,
}

// IsVizType reports whether t is one of the four visualization families.
func IsVizType(t string) bool { return validVizTypes[t] }

// Visualization payload schemas (LearnBlock.Metadata as JSON).

type Dimensions struct {
	Width  int `json:"width,omitempty"`
	Height int `json:"height,omitempty"`
}

// MathVizMetadata is the payload for mathviz_manim blocks.
type MathVizMetadata struct {
	Title       string          `json:"title"`
	Description string          `json:"description,omitempty"`
	SceneSpec   json.RawMessage `json:"scene_spec,omitempty"`
	ScriptID    string          `json:"script_id,omitempty"`
	Duration    int             `json:"duration,omitempty"`
	Dimensions  *Dimensions     `json:"dimensions,omitempty"`
}

// MoleculeSource identifies a molecule for chemviz_3dmol blocks.
type MoleculeSource struct {
	SourceType  string `json:"source_type"` // pdb | smiles | file | programmatic
	SourceValue string `json:"source_value"`
	Smiles      string `json:"smiles,omitempty"`
}

// ChemVizMetadata is the payload for chemviz_3dmol blocks.
type ChemVizMetadata struct {
	Title         string            `json:"title"`
	Description   string            `json:"description,omitempty"`
	Molecule      MoleculeSource    `json:"molecule"`
	Style         map[string]any    `json:"style,omitempty"`
	Surface       map[string]any    `json:"surface,omitempty"`
	Camera        map[string]any    `json:"camera,omitempty"`
	Interactivity map[string]any    `json:"interactivity,omitempty"`
	Annotations   []map[string]any  `json:"annotations,omitempty"`
	Dimensions    *Dimensions       `json:"dimensions,omitempty"`
}

// EditableParam describes a user-adjustable parameter of a simulation.
type EditableParam struct {
	Component string    `json:"component,omitempty"`
	Property  string    `json:"property"`
	Label     string    `json:"label"`
	Type      string    `json:"type"` // select | slider
	Options   []string  `json:"options,omitempty"`
	Min       *float64  `json:"min,omitempty"`
	Max       *float64  `json:"max,omitempty"`
	Step      *float64  `json:"step,omitempty"`
	Default   any       `json:"default,omitempty"`
}

// ElecSimMetadata is the payload for elecsim_tscircuit blocks.
type ElecSimMetadata struct {
	Title          string          `json:"title"`
	Description    string          `json:"description,omitempty"`
	CircuitCode    string          `json:"circuit_code"`
	EditableParams []EditableParam `json:"editable_params,omitempty"`
	Simulation     map[string]any  `json:"simulation,omitempty"`
	ViewModes      []string        `json:"view_modes,omitempty"`
	DefaultView    string          `json:"default_view,omitempty"`
	Dimensions     *Dimensions     `json:"dimensions,omitempty"`
}

// MechSimMetadata is the payload for mechsim_matterjs blocks.
type MechSimMetadata struct {
	Title               string           `json:"title"`
	Description         string           `json:"description,omitempty"`
	ScenarioType        string           `json:"scenario_type"`
	WorldConfig         map[string]any   `json:"world_config"`
	EditableParams      []EditableParam  `json:"editable_params,omitempty"`
	Measurements        []map[string]any `json:"measurements,omitempty"`
	EducationalOverlays map[string]any   `json:"educational_overlays,omitempty"`
	Dimensions          *Dimensions      `json:"dimensions,omitempty"`
}

// ValidateVizMetadata parses and validates the JSON payload for a
// visualization block. It returns the strongly-typed payload so handlers can
// forward it to the frontend unchanged.
func ValidateVizMetadata(vizType string, raw json.RawMessage) (any, error) {
	vizType = strings.ToLower(strings.TrimSpace(vizType))
	if !validVizTypes[vizType] {
		return nil, fmt.Errorf("unknown visualization type %q", vizType)
	}
	if len(raw) == 0 {
		return nil, fmt.Errorf("%s block requires a JSON metadata payload", vizType)
	}

	switch vizType {
	case "mathviz_manim":
		var m MathVizMetadata
		if err := json.Unmarshal(raw, &m); err != nil {
			return nil, fmt.Errorf("mathviz metadata is not valid JSON: %w", err)
		}
		if strings.TrimSpace(m.Title) == "" {
			return nil, fmt.Errorf("mathviz block requires metadata.title")
		}
		if len(m.SceneSpec) == 0 && strings.TrimSpace(m.ScriptID) == "" {
			return nil, fmt.Errorf("mathviz block requires metadata.scene_spec or metadata.script_id")
		}
		return &m, nil

	case "chemviz_3dmol":
		var m ChemVizMetadata
		if err := json.Unmarshal(raw, &m); err != nil {
			return nil, fmt.Errorf("chemviz metadata is not valid JSON: %w", err)
		}
		src := strings.ToLower(m.Molecule.SourceType)
		if src != "pdb" && src != "smiles" && src != "file" && src != "programmatic" {
			return nil, fmt.Errorf("chemviz molecule.source_type must be pdb|smiles|file|programmatic")
		}
		if strings.TrimSpace(m.Molecule.SourceValue) == "" {
			return nil, fmt.Errorf("chemviz block requires molecule.source_value")
		}
		if strings.TrimSpace(m.Title) == "" {
			return nil, fmt.Errorf("chemviz block requires metadata.title")
		}
		return &m, nil

	case "elecsim_tscircuit":
		var m ElecSimMetadata
		if err := json.Unmarshal(raw, &m); err != nil {
			return nil, fmt.Errorf("elecsim metadata is not valid JSON: %w", err)
		}
		if strings.TrimSpace(m.CircuitCode) == "" {
			return nil, fmt.Errorf("elecsim block requires metadata.circuit_code")
		}
		if strings.TrimSpace(m.Title) == "" {
			return nil, fmt.Errorf("elecsim block requires metadata.title")
		}
		return &m, nil

	case "mechsim_matterjs":
		var m MechSimMetadata
		if err := json.Unmarshal(raw, &m); err != nil {
			return nil, fmt.Errorf("mechsim metadata is not valid JSON: %w", err)
		}
		if strings.TrimSpace(m.ScenarioType) == "" {
			return nil, fmt.Errorf("mechsim block requires metadata.scenario_type")
		}
		bodies, ok := m.WorldConfig["bodies"].([]any)
		if !ok || len(bodies) == 0 {
			return nil, fmt.Errorf("mechsim block requires metadata.world_config.bodies to be a non-empty array")
		}
		if strings.TrimSpace(m.Title) == "" {
			return nil, fmt.Errorf("mechsim block requires metadata.title")
		}
		return &m, nil
	}
	return nil, fmt.Errorf("unsupported visualization type %q", vizType)
}
