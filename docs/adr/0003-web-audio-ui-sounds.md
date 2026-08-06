# ADR 0003: Synthesize UI Sounds via Web Audio API

- **Status**: Accepted
- **Date**: 2026-08-06

## Context
Loading external sound asset files increases bundle size and network request latency.

## Decision
All interactive UI sound effects (clicks, success chimes, level-up alerts) will be synthesized directly using Web Audio API oscillators without audio file assets.

## Consequences
- Zero asset download overhead.
- Instant, sub-millisecond audio feedback.
- Respects `prefers-reduced-motion` settings.
