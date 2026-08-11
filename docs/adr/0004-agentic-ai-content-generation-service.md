# ADR 0004: Agentic AI Content Generation Service

- **Status**: Accepted
- **Date**: 2026-08-08

## Context

The StudEd platform needs working AI content generation for educators. Today
`services/ai-service` is a thin Gemini-only REST wrapper that returns 503 when
`GEMINI_API_KEY` is unset, offers no agentic workflow, no vision support, and no
visualization-code generation (Manim / 3Dmol / tscircuit / Matter.js) even
though the product docs (`03-Educator-Portal/*`, `08-Research-&-References/*`)
specify them. The api-gateway GraphQL resolvers `generateLearnBlocks`,
`generateEvaluateBlocks`, `translateContent` are stubbed against it.

Educators must be able to create dynamic question UIs from a limited, whitelisted
set of components (the Puck block library) plus the four visualization families
(math animation, molecular viewer, circuit simulation, physics simulation).

## Decision

Rebuild the internals of `services/ai-service` (Go, matching the monorepo stack)
as an **agentic** service with these layers:

1. **Provider layer** (`internal/provider/`) — a `Provider` interface with two
   implementations:
   - `OpenAI-compatible` (primary) — works against any OpenAI-compatible
     endpoint via `OPENCODE_BASE_URL` / `OPENCODE_API_KEY` / `OPENCODE_MODEL`
     (defaults to the opencode-go endpoint with `deepseek-v4-flash`), with
     JSON-mode, tool-call, and streaming support.
   - `Gemini` (fallback) — the existing client, kept for `GEMINI_API_KEY`
     deployments.
2. **Vision layer** (`internal/vision/`) — multimodal analysis of uploaded
   photos (OCR, diagram understanding, content classification) using the
   configured vision model (`OPENCODE_VISION_MODEL`, default `qwen3.7-plus`).
   This is the "vision agent customized with another model".
3. **Agent core** (`internal/agent/`) — a tool-calling loop: system prompt +
   available tools, LLM tool-call dispatch, per-tool execution, validation with
   retry (invalid JSON / schema violations trigger one repair pass), and
   streaming of lifecycle events (plan, tool_execution_start/end, message
   deltas, done) over SSE.
4. **Tools** (`internal/tools/`): `generateLearnBlocks`, `generateEvaluateBlocks`,
   `generateVisualization` (manim | 3dmol | tscircuit | matterjs), `translateContent`,
   `analyzeImage`.
5. **Blocks** (`internal/blocks/`): extend the existing validation with the
   visualization block types from the research docs.
6. **HTTP surface** (`internal/handler/`), keeping the existing endpoints
   byte-compatible and adding:
   - `POST /v1/generate-visualization`
   - `POST /v1/analyze-image`
   - `POST /v1/agent/stream` (SSE)
   - `POST /v1/agent/task` (non-streaming agent run, for tests/gateway)

The api-gateway gains matching GraphQL mutations (`generateVisualization`,
`analyzeImage`) and the frontend wave editor gains an AI Assistant panel plus
the four visualization Puck blocks, all using the existing OKLCH design tokens.

## Consequences

- AI actually works out of the box with the opencode-go key; Gemini remains a
  drop-in fallback.
- Educators get an agentic assistant in the wave editor that can draft Learn +
  Evaluate content and generate interactive visualizations from natural
  language, with the component set strictly whitelisted by the existing block
  validation.
- The agent loop is provider-agnostic; new models can be added by implementing
  `Provider`.
- Cost controls (token caps, JSON-mode, retry limits) keep generation bounded.
- Visualizations are emitted as validated config/code payloads; execution of
  that code (Manim render, tscircuit compile, Matter.js run) remains a
  client-side / pipeline concern, out of scope here.
