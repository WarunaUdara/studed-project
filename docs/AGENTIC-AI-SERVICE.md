# Agentic AI Service Design

> Companion to ADR-0004. Describes the concrete architecture, data contracts, and
> workflow for the rebuilt `services/ai-service`.

## Goal

Make StudEd AI actually work: an educator opens the wave editor, describes what
they want (or uploads a photo), and an **agentic AI service** drafts Learn blocks,
Evaluate blocks, and interactive visualizations using a **whitelisted component
set** — the Puck block library + the four visualization families. Everything is
validated before it reaches the editor, and generation is streamed as events so
the UI can show live progress.

## Architecture

```
frontend (Puck wave editor + AI Assistant panel)
   │  GraphQL (gateway)          │  SSE /v1/agent/stream (via gateway proxy)
   ▼                             ▼
api-gateway (gqlgen) ──HTTP──► ai-service :8090
                                 │
                    ┌────────────┼─────────────┐
                    ▼            ▼             ▼
              agent core    provider(s)    vision client
              (tool loop)   (opencode-go,  (qwen3.7-plus)
                            gemini)
```

## Provider layer (`internal/provider/`)

```go
type Provider interface {
    // GenerateJSON returns model output parsed as JSON (JSON-mode enforced).
    GenerateJSON(ctx context.Context, system, user string, opts Options) ([]byte, error)
    // Stream streams assistant deltas + tool calls; used by the agent loop.
    Stream(ctx context.Context, msgs []Message, tools []Tool, opts Options) (<-chan StreamEvent, error)
}
```

- `opencode.go` — OpenAI-compatible client (`OPENCODE_BASE_URL`,
  `OPENCODE_API_KEY`, `OPENCODE_MODEL` default `deepseek-v4-flash`). JSON mode,
  tool calls, streaming.
- `gemini.go` — existing client, adapted to the interface (fallback).
- Selection via `AI_PROVIDER=opencode|gemini` (default `opencode`).

## Vision layer (`internal/vision/`)

`AnalyzeImage(ctx, imageBase64, prompt) (VisionResult, error)` — sends the image
plus an analysis prompt to the vision model (`OPENCODE_VISION_MODEL`, default
`qwen3.7-plus`) and returns a typed analysis:

```json
{
  "contentType": "handwritten_notes|textbook|diagram|equations|molecule|circuit|physics_setup|other",
  "detectedLanguage": "en|si|ta",
  "subjects": ["mathematics"],
  "keyConcepts": ["pythagorean theorem"],
  "hasEquations": true,
  "suggestedVisualization": "manim|3dmol|tscircuit|matterjs|none",
  "extractedText": "..."
}
```

## Agent core (`internal/agent/`)

`Run(ctx, req AgentRequest, events chan<- AgentEvent)` — the loop:

1. Build messages: system prompt (educator persona + block whitelist + JSON
   schema reference) + user request.
2. Call `Provider.Stream` with the tool set.
3. For each `tool_call` in the stream: execute the tool, append the result,
   loop back to step 2 (max `MAX_AGENT_ITERATIONS`, default 6).
4. Final assistant message must be a validated block payload; if validation
   fails, run one repair pass (return the validation error to the model).
5. Emit events: `plan`, `tool_start`, `tool_end`, `delta`, `done`, `error`.

Tools (`internal/tools/`):

| Tool | Input | Output |
|------|-------|--------|
| `generateLearnBlocks` | prompt, language, grade | `[LearnBlock]` |
| `generateEvaluateBlocks` | content, count | `[EvaluateBlock]` |
| `generateVisualization` | concept, vizType (manim/3dmol/tscircuit/matterjs), grade | `VisualizationBlock` |
| `translateContent` | content, targetLanguage | string |
| `analyzeImage` | imageBase64, prompt | `VisionResult` |

## Blocks (`internal/blocks/`)

Extend the existing validation maps with the visualization types:

- Learn: `text`, `math`, `image`, `video`, `callout`, `example`,
  `mathviz_manim`, `chemviz_3dmol`, `elecsim_tscircuit`, `mechsim_matterjs`
- Evaluate: `mcq`, `fill_in_blank`, `true_false`, `numeric`, `drag_drop`

Each viz block validates its `metadata` JSON against the schema in
`08-Research-&-References/*-Integration.md` (e.g. `mathviz_manim` requires
`title` + `scene_spec`/`script_id`; `chemviz_3dmol` requires `molecule` with
`source_type` + `source_value`; `elecsim_tscircuit` requires `circuit_code`;
`mechsim_matterjs` requires `world_config` with `bodies`).

## HTTP surface (`internal/handler/`)

Existing (byte-compatible): `POST /v1/generate-learn-blocks`,
`POST /v1/generate-evaluate-blocks`, `POST /v1/translate`.

New:

- `POST /v1/generate-visualization` — `{concept, vizType, grade}` →
  `{block}` (single VisualizationBlock, validated).
- `POST /v1/analyze-image` — `{imageBase64, prompt?}` → `{analysis}`.
- `POST /v1/agent/stream` — `{request, waveContext?}` → SSE stream of agent
  events; final event carries `learnBlocks` + `evaluateBlocks`.
- `POST /v1/agent/task` — same, but non-streaming JSON response (for gateway
  sync mutations and tests).

All bodies bounded (`MAX_BODY_BYTES`, default 2MB), 90s write timeout
(architecture convention), structured slog logging, `/health` unchanged.

## Gateway

- Extend `internal/client/ai.go` with `GenerateVisualization`,
  `AnalyzeImage`, `AgentTask`.
- GraphQL schema: add `generateVisualization(concept, vizType, grade):
  VisualizationBlock!` and `analyzeImage(imageBase64, prompt): ImageAnalysis!`
  mutations; `VisualizationBlock`/`ImageAnalysis` types.
- SSE proxy: `GET /api/v1/ai/agent/stream` streams the ai-service SSE through
  the gateway (service-token protected).

## Frontend

- New Puck blocks in `puck-config.tsx`: `ChemViz` (3Dmol viewer),
  `ElecSim` (tscircuit), `MechSim` (Matter.js), `MathViz` (existing, keep) —
  render from `metadata`/props with a code/config preview.
- `AIAssistantPanel` component in the wave editor: prompt input, quick-action
  chips ("Draft Learn section", "Generate 5 MCQs", "Translate to Sinhala",
  "Make an animation"), streaming status, suggestion cards with Insert /
  Regenerate. Insert dispatches Puck `insert` actions so blocks land in the
  canvas and serialize via the existing `puckToWaveData`.
- All styling uses existing OKLCH tokens; sounds via `lib/sounds.ts`.

## Testing

- Unit: blocks validation (incl. viz schemas), provider (httptest server),
  agent loop with a scripted provider, tools with a fake LLM.
- Integration: `handler` tests with `httptest` + mock provider (existing
  pattern); live smoke against the real endpoint gated by env.
- Frontend: `bun run typecheck`, `bun run build`, vitest for puck
  serialization of the new blocks.
- E2E check with browser (vision agent verifies UI).

## Config (env)

| Var | Default |
|-----|---------|
| `AI_SERVICE_ADDR` | `:8090` |
| `AI_PROVIDER` | `opencode` |
| `OPENCODE_BASE_URL` | `https://opencode.ai/zen/go/v1` |
| `OPENCODE_API_KEY` | (required for opencode) |
| `OPENCODE_MODEL` | `deepseek-v4-flash` |
| `OPENCODE_VISION_MODEL` | `qwen3.7-plus` |
| `GEMINI_API_KEY` / `GEMINI_MODEL` | fallback provider |
| `MAX_AGENT_ITERATIONS` | `6` |
| `MAX_BODY_BYTES` | `2097152` |
