# ADR 0002: Use OKLCH Color Space for Styling

- **Status**: Accepted
- **Date**: 2026-08-06

## Context
Standard HSL and RGB color spaces lack perceptual uniformity and wide gamut support across modern high-DPI displays.

## Decision
All color tokens across StudEd frontend and design system will strictly use OKLCH (`oklch(L C H)`) with matching `-foreground` variants.

## Consequences
- Consistent perceived lightness across hues.
- Native alignment with Tailwind CSS v4.
