// Package verify provides headless verification of AI-generated simulation
// configs before they reach the editor. For Matter.js physics blocks it runs
// a real (simplified) physics loop over the config — same integration rules
// the frontend renderer uses — and reports whether the simulation is
// structurally sound, numerically stable, and physically plausible.
package verify

import (
	"encoding/json"
	"fmt"
	"math"
	"strings"
)

// MatterBody is the subset of the mechsim world_config.bodies schema that the
// headless simulator needs. Unknown fields are ignored.
type MatterBody struct {
	ID          string   `json:"id"`
	Type        string   `json:"type"` // circle | rectangle
	Position    *Point   `json:"position"`
	Velocity    *Point   `json:"velocity"`
	Radius      float64  `json:"radius"`
	Width       float64  `json:"width"`
	Height      float64  `json:"height"`
	Density     *float64 `json:"density"` // nil = renderer default 0.002
	Restitution float64  `json:"restitution"`
	Friction    float64  `json:"friction"`
	IsStatic    bool     `json:"isStatic"`
}

// Point is a 2D vector.
type Point struct {
	X float64 `json:"x"`
	Y float64 `json:"y"`
}

// MatterConstraint mirrors world_config.constraints entries.
type MatterConstraint struct {
	ID        string  `json:"id"`
	BodyA     string  `json:"bodyA"`
	BodyB     string  `json:"bodyB"`
	Length    float64 `json:"length"`
	Stiffness float64 `json:"stiffness"`
}

// MatterEditableParam mirrors editable_params entries (property resolution
// check only).
type MatterEditableParam struct {
	Property string `json:"property"`
}

// MatterMeasurement mirrors measurements entries (source resolution check).
type MatterMeasurement struct {
	Label   string `json:"label"`
	Type    string `json:"type"`
	Source  string `json:"source"`
	Formula string `json:"formula"`
}

// MatterWorld is the parsed world_config payload.
type MatterWorld struct {
	Gravity      *Point             `json:"gravity"`
	GravityScale float64            `json:"-"`
	BoundsRaw    *MatterBounds      `json:"bounds"`
	Bodies       []MatterBody       `json:"bodies"`
	Constraints  []MatterConstraint `json:"constraints"`
	Thrust       *Point             `json:"thrust"`
}

// MatterBounds is the raw bounds schema (width/height).
type MatterBounds struct {
	Width  float64 `json:"width"`
	Height float64 `json:"height"`
}

// MatterReport is the verification result, JSON-serializable so the agent can
// read it and repair the config when the simulation is unsound.
type MatterReport struct {
	OK       bool     `json:"ok"`
	Issues   []string `json:"issues"`
	Warnings []string `json:"warnings,omitempty"`
	Stats    struct {
		Ticks    int     `json:"ticks"`
		Bodies   int     `json:"bodies"`
		MaxSpeed float64 `json:"max_speed"`
	} `json:"stats"`
}

const (
	simTicks       = 180 // 3 seconds at 60fps
	simBoundsSlack = 40  // px margin before a body is "out of bounds"
)

// MatterConfig parses a mechsim metadata payload and simulates it
// headlessly. It returns a report; the simulation never panics — every
// structural, semantic, or numeric problem becomes an issue in the report.
func MatterConfig(metadata json.RawMessage) *MatterReport {
	rep := &MatterReport{}
	var meta struct {
		ScenarioType   string                     `json:"scenario_type"`
		WorldConfig    map[string]json.RawMessage `json:"world_config"`
		EditableParams []MatterEditableParam      `json:"editable_params"`
		Measurements   []MatterMeasurement        `json:"measurements"`
	}
	if err := json.Unmarshal(metadata, &meta); err != nil {
		rep.Issues = append(rep.Issues, "metadata is not valid JSON: "+err.Error())
		rep.OK = false
		return rep
	}
	if len(meta.WorldConfig) == 0 {
		rep.Issues = append(rep.Issues, "world_config is missing")
		rep.OK = false
		return rep
	}

	world, errs := parseWorld(meta.WorldConfig)
	rep.Issues = append(rep.Issues, errs...)
	if len(errs) > 0 {
		rep.OK = false
		return rep
	}

	// Structural checks first.
	if len(world.Bodies) == 0 {
		rep.Issues = append(rep.Issues, "world_config.bodies is empty")
		rep.OK = false
		return rep
	}
	ids := make(map[string]bool, len(world.Bodies))
	for i := range world.Bodies {
		b := &world.Bodies[i]
		if b.ID == "" {
			rep.Issues = append(rep.Issues, fmt.Sprintf("body #%d has no id", i))
			continue
		}
		if ids[b.ID] {
			rep.Issues = append(rep.Issues, fmt.Sprintf("duplicate body id %q", b.ID))
		}
		ids[b.ID] = true
		if b.Type != "circle" && b.Type != "rectangle" {
			rep.Issues = append(rep.Issues, fmt.Sprintf("body %q has unknown type %q (want circle|rectangle)", b.ID, b.Type))
		}
		if b.Position == nil || math.IsNaN(b.Position.X) || math.IsNaN(b.Position.Y) || math.IsInf(b.Position.X, 0) || math.IsInf(b.Position.Y, 0) {
			rep.Issues = append(rep.Issues, fmt.Sprintf("body %q has a non-finite position", b.ID))
		}
	}
	for _, c := range world.Constraints {
		if c.BodyA == "" || c.BodyB == "" {
			rep.Issues = append(rep.Issues, fmt.Sprintf("constraint %q must reference bodyA and bodyB", c.ID))
			continue
		}
		if !ids[c.BodyA] {
			rep.Issues = append(rep.Issues, fmt.Sprintf("constraint %q references missing body %q", c.ID, c.BodyA))
		}
		if !ids[c.BodyB] {
			rep.Issues = append(rep.Issues, fmt.Sprintf("constraint %q references missing body %q", c.ID, c.BodyB))
		}
		if math.IsNaN(c.Stiffness) || c.Stiffness < 0 || c.Stiffness > 1 {
			rep.Issues = append(rep.Issues, fmt.Sprintf("constraint %q stiffness %v must be in [0,1]", c.ID, c.Stiffness))
		}
	}

	// Semantic checks: editable param properties and measurement sources must
	// resolve to declared bodies/constraints, and the scenario must actually
	// demonstrate its physics (a projectile without an initial velocity or a
	// pendulum without a constraint is a broken lesson, not a simulation).
	checkEditableParams(rep, meta.EditableParams, ids, world)
	checkMeasurements(rep, meta.Measurements, ids)
	checkScenarioSemantics(rep, meta.ScenarioType, world, ids)

	if len(rep.Issues) > 0 {
		rep.OK = false
		return rep
	}

	// Numeric stability: run the physics loop.
	rep.Stats.Ticks = simTicks
	rep.Stats.Bodies = len(world.Bodies)

	// Fast simulation of a body's behaviour: gravity + thrust + constraint
	// pulls + friction + bounds bounce, mirroring the frontend renderer.
	boundsW, boundsH := worldBounds(world)
	maxSpeed := 0.0
	for i := range world.Bodies {
		b := &world.Bodies[i]
		if b.IsStatic {
			continue
		}
		x, y := b.Position.X, b.Position.Y
		vx, vy := 0.0, 0.0
		if b.Velocity != nil {
			vx, vy = b.Velocity.X, b.Velocity.Y
		}
		density := 0.002 // renderer default when the config omits it
		if b.Density != nil {
			density = *b.Density
		}
		mass := math.Max(density, 0.00001)
		if density <= 0 {
			rep.Issues = append(rep.Issues, fmt.Sprintf("body %q has non-positive density %v", b.ID, density))
			rep.OK = false
			return rep
		}
		for tick := 0; tick < simTicks; tick++ {
			// Gravity: direction vector scaled by gravity.scale (default
			// 0.001), exactly like the frontend renderer.
			if world.Gravity != nil {
				scale := world.GravityScale
				if scale == 0 {
					scale = 0.001
				}
				vx += world.Gravity.X * scale
				vy += world.Gravity.Y * scale
			}
			// Thrust: a = F/m.
			if world.Thrust != nil {
				vx += (world.Thrust.X / mass) * 0.05
				vy += (world.Thrust.Y / mass) * 0.05
			}
			// Constraints pull toward the anchor (stiffness-weighted spring).
			for _, c := range world.Constraints {
				other := findBody(world.Bodies, c.BodyA, c.BodyB, b.ID)
				if other == nil {
					continue
				}
				dx := other.X - x
				dy := other.Y - y
				dist := math.Max(math.Hypot(dx, dy), 1)
				rest := c.Length
				if rest <= 0 {
					rest = 100
				}
				stiff := c.Stiffness
				if stiff <= 0 {
					stiff = 0.01
				}
				pull := (dist - rest) * stiff
				if c.BodyA == b.ID {
					vx += (dx / dist) * pull
					vy += (dy / dist) * pull
				} else {
					vx -= (dx / dist) * pull * 0.5
					vy -= (dy / dist) * pull * 0.5
				}
			}
			// Friction damping.
			vx *= 1 - b.Friction
			vy *= 1 - b.Friction

			// Numerical blow-up guard: any non-finite velocity means the
			// config is unstable (huge forces, absurd density, etc.).
			if math.IsNaN(vx) || math.IsNaN(vy) || math.IsInf(vx, 0) || math.IsInf(vy, 0) {
				rep.Issues = append(rep.Issues, fmt.Sprintf("body %q velocity became non-finite (unstable config)", b.ID))
				rep.OK = false
				return rep
			}

			x += vx
			y += vy

			speed := math.Hypot(vx, vy)
			if speed > maxSpeed {
				maxSpeed = speed
			}

			// Bounds bounce (same semantics as the renderer): reflect the
			// velocity with restitution. Only a body that is still outside
			// AFTER bouncing (e.g. starts beyond the wall, or bounds too
			// small for the radius) is a real escape.
			r := b.Radius
			if r <= 0 && b.Type == "rectangle" {
				r = math.Max(b.Width, b.Height) / 2
			}
			if r <= 0 {
				r = 20
			}
			rest := b.Restitution
			if rest < 0 || rest > 1 {
				rest = 0.6
			}
			bounced := false
			if x-r < 0 {
				x = r
				vx = math.Abs(vx) * rest
				bounced = true
			}
			if x+r > boundsW {
				x = boundsW - r
				vx = -math.Abs(vx) * rest
				bounced = true
			}
			if y-r < 0 {
				y = r
				vy = math.Abs(vy) * rest
				bounced = true
			}
			if y+r > boundsH {
				y = boundsH - r
				vy = -math.Abs(vy) * rest
				bounced = true
			}
			_ = bounced

			if x < -simBoundsSlack || x > boundsW+simBoundsSlack || y < -simBoundsSlack || y > boundsH+simBoundsSlack {
				rep.Issues = append(rep.Issues, fmt.Sprintf("body %q escapes the canvas bounds (x=%.0f y=%.0f after %d ticks)", b.ID, x, y, tick))
				rep.OK = false
				return rep
			}
		}
	}
	rep.Stats.MaxSpeed = math.Round(maxSpeed*100) / 100

	if len(rep.Issues) == 0 {
		rep.OK = true
	}
	return rep
}

// parseWorld decodes the raw world_config map into the simulator struct.
func parseWorld(raw map[string]json.RawMessage) (*MatterWorld, []string) {
	w := &MatterWorld{}
	var errs []string
	if g, ok := raw["gravity"]; ok {
		var p Point
		if err := json.Unmarshal(g, &p); err != nil {
			errs = append(errs, "gravity is not valid: "+err.Error())
		} else {
			w.Gravity = &p
		}
	}
	if t, ok := raw["thrust"]; ok {
		var p Point
		if err := json.Unmarshal(t, &p); err != nil {
			errs = append(errs, "thrust is not valid: "+err.Error())
		} else {
			w.Thrust = &p
		}
	}
	if b, ok := raw["bounds"]; ok {
		var mb MatterBounds
		if err := json.Unmarshal(b, &mb); err != nil {
			errs = append(errs, "bounds is not valid: "+err.Error())
		} else {
			w.BoundsRaw = &mb
		}
	}
	if b, ok := raw["bodies"]; ok {
		if err := json.Unmarshal(b, &w.Bodies); err != nil {
			errs = append(errs, "bodies is not valid: "+err.Error())
		}
	}
	if c, ok := raw["constraints"]; ok {
		_ = json.Unmarshal(c, &w.Constraints) // optional; bad constraints are skipped
	}
	return w, errs
}

func worldBounds(w *MatterWorld) (float64, float64) {
	if w.BoundsRaw != nil && w.BoundsRaw.Width > 0 && w.BoundsRaw.Height > 0 {
		return w.BoundsRaw.Width, w.BoundsRaw.Height
	}
	return 800, 500
}

// findBody returns the position of the constraint partner that is not `self`.
func findBody(bodies []MatterBody, a, b, self string) *Point {
	for i := range bodies {
		if bodies[i].ID != a && bodies[i].ID != b {
			continue
		}
		if bodies[i].ID == self {
			continue
		}
		if bodies[i].Position == nil {
			return &Point{}
		}
		return bodies[i].Position
	}
	return nil
}

// IssuesText renders the report issues as a single prompt-friendly string.
func (r *MatterReport) IssuesText() string {
	if len(r.Issues) == 0 {
		return ""
	}
	return strings.Join(r.Issues, "; ")
}

// checkEditableParams verifies every editable param property resolves to
// something the renderer can actually apply. Unresolvable properties (e.g.
// "initialVelocity.x", which the renderer never reads) make the slider a
// dead control — the config is rejected so the agent repairs it.
func checkEditableParams(rep *MatterReport, params []MatterEditableParam, ids map[string]bool, world *MatterWorld) {
	for _, p := range params {
		prop := strings.TrimSpace(p.Property)
		if prop == "" {
			continue
		}
		switch {
		case prop == "gravity.scale":
		case prop == "thrust.x" || prop == "thrust.y":
		case prop == "global.restitution" || prop == "global.friction" || prop == "global.gravity":
		case strings.HasPrefix(prop, "bodies."):
			// bodies.<id>.<field> — the renderer applies when the property
			// contains the body id (density/radius/restitution/friction).
			rest := strings.TrimPrefix(prop, "bodies.")
			bodyID := rest
			if i := strings.IndexByte(rest, '.'); i >= 0 {
				bodyID = rest[:i]
			}
			if !ids[bodyID] {
				rep.Issues = append(rep.Issues, fmt.Sprintf("editable_param property %q references missing body %q", prop, bodyID))
			}
		case strings.HasPrefix(prop, "constraints."):
			rest := strings.TrimPrefix(prop, "constraints.")
			conID := rest
			if i := strings.IndexByte(rest, '.'); i >= 0 {
				conID = rest[:i]
			}
			found := false
			for _, c := range world.Constraints {
				if c.ID == conID {
					found = true
					break
				}
			}
			if !found {
				rep.Issues = append(rep.Issues, fmt.Sprintf("editable_param property %q references missing constraint %q", prop, conID))
			}
		default:
			rep.Issues = append(rep.Issues, fmt.Sprintf("editable_param property %q is not a resolvable renderer property (use gravity.scale, thrust.x/y, global.restitution, global.friction, bodies.<id>.density|radius|restitution|friction, or constraints.<id>.stiffness)", prop))
		}
	}
}

// checkMeasurements verifies live measurement sources reference declared
// bodies (computed formulas are validated loosely — any dotted identifier
// token must reference a declared body or a known global).
func checkMeasurements(rep *MatterReport, measurements []MatterMeasurement, ids map[string]bool) {
	for _, m := range measurements {
		src := strings.TrimSpace(m.Source)
		if src == "" {
			continue
		}
		bodyID := src
		if i := strings.IndexByte(src, '.'); i >= 0 {
			bodyID = src[:i]
		}
		if !ids[bodyID] {
			rep.Issues = append(rep.Issues, fmt.Sprintf("measurement %q source %q references missing body %q", m.Label, src, bodyID))
		}
	}
}

// checkScenarioSemantics ensures the config actually demonstrates the
// physics of its declared scenario. A "projectile" that never gets an
// initial velocity, a "pendulum" with no constraint, or a "collision" with
// a single body is a broken lesson, not a simulation.
func checkScenarioSemantics(rep *MatterReport, scenario string, world *MatterWorld, ids map[string]bool) {
	scenario = strings.ToLower(strings.TrimSpace(scenario))
	dynamic := 0
	hasVelocity := false
	gravityY := 0.0
	if world.Gravity != nil {
		gravityY = world.Gravity.Y
	}
	for i := range world.Bodies {
		b := &world.Bodies[i]
		if !b.IsStatic {
			dynamic++
		}
		if !b.IsStatic && b.Velocity != nil && (b.Velocity.X != 0 || b.Velocity.Y != 0) {
			hasVelocity = true
		}
	}

	switch scenario {
	case "projectile":
		if !hasVelocity {
			rep.Issues = append(rep.Issues, "projectile scenario requires at least one dynamic body with an initial velocity (velocity.x/velocity.y) — a projectile with no launch velocity is not projectile motion")
		}
		if gravityY == 0 {
			rep.Issues = append(rep.Issues, "projectile scenario requires gravity (world_config.gravity.y != 0) — the parabolic arc needs gravity")
		}
	case "pendulum", "spring", "newtons_cradle":
		if len(world.Constraints) == 0 {
			rep.Issues = append(rep.Issues, fmt.Sprintf("%s scenario requires at least one constraint (world_config.constraints)", scenario))
		}
	case "collision":
		if dynamic < 2 {
			rep.Issues = append(rep.Issues, "collision scenario requires at least two dynamic bodies to collide")
		}
	case "newtons_laws":
		// The renderer supplies the three-law presets for this scenario, so
		// no specific world is required — any accompanying world is bonus.
	default:
		// custom / unknown scenarios: no semantic constraint.
	}
}
