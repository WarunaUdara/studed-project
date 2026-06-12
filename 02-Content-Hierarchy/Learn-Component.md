---
title: "Learn Component"
description: "Multimedia content blocks used in the Learn phase of a Wave."
tags:
  - content
  - learn
  - multimedia
  - blocks
  - studed
aliases:
  - "Learn Blocks"
  - "Learn Phase"
  - "Multimedia Content"
date: 2026-06-03
---

# Learn Component

> [!info] Purpose
> The **Learn** phase of a Wave delivers educational content through rich, multimedia blocks. It is the "teaching" part before the "testing" part.

## Supported Block Types

### 1. Text Block

Plain or rich text content. Supports headings, lists, bold/italic, and inline math.

- **Editor:** WYSIWYG text area in the [[MDX Editor]].
- **AI Integration:** AI can auto-generate explanatory text from a prompt.
- **Sinhala:** Full Unicode support.

### 2. Image Block

Static images (diagrams, illustrations, photos).

- **Formats:** PNG, JPG, WebP, SVG.
- **Upload:** Drag-and-drop or URL embed.
- **Optimizations:** Responsive srcset, lazy loading, CDN delivery.
- **Alt Text:** Required for accessibility and SEO.

### 3. Graphic Block

Vector graphics, charts, or custom SVG illustrations.

- **Use Case:** Math graphs, scientific diagrams, flowcharts.
- **Tools:** May integrate with libraries like Mermaid, D3.js, or custom SVG renderer.
- **Interactivity:** Some graphics may be lightly interactive (hover tooltips).

### 4. Audio Block

Sound clips, voiceovers, or music.

- **Formats:** MP3, OGG, WAV.
- **Use Case:** Pronunciation guides, narration for young learners, background music.
- **Player:** Custom HTML5 audio player with play/pause, speed control.
- **Accessibility:** Transcript/caption support.

### 5. MathViz Block (Math Animation)

Interactive mathematical animations generated via **Math-To-Manim**.

- **Use Case:** Geometric proofs, calculus visualizations, 3D geometry, Fourier series.
- **Input:** Educator uploads a math diagram or describes a concept in the [[Educator AI Chat Interface|AI Chat]].
- **AI Generation:** DeepSeek-Coder generates a Manim scene spec → Math-To-Manim pipeline renders MP4/GIF.
- **Student Experience:** Embedded video with speed control, narration transcript, and replay.
- **See:** [[Math-To-Manim Integration]] for full technical details.

### 6. ChemViz Block (Molecular Viewer)

Interactive 3D molecular visualizations powered by **3Dmol.js**.

- **Use Case:** Molecular structures, bonding visualization, protein folding (A/L Biology/Chemistry).
- **Input:** Educator uploads a chemical structure diagram or provides a SMILES string.
- **AI Generation:** DeepSeek-Coder generates 3Dmol.js configuration → WebGL renders interactive viewer.
- **Student Experience:** Rotate, zoom, pan, identify atoms, toggle surface rendering.
- **See:** [[3Dmol.js Integration]] for full technical details.

### 7. ElecSim Block (Circuit Simulation)

Interactive electronics circuit schematics and simulations powered by **tscircuit**.

- **Use Case:** Circuit design, component behavior, Ohm's law, logic gates (O/L, A/L Physics/Electronics).
- **Input:** Educator uploads a circuit diagram or describes a circuit.
- **AI Generation:** DeepSeek-Coder generates tscircuit TypeScript/React code → interactive schematic/PCB viewer.
- **Student Experience:** Modify resistor values, toggle switches, observe current flow, view PCB layout.
- **See:** [[tscircuit Integration]] for full technical details.

### 8. MechSim Block (Physics Simulation)

Interactive 2D physics simulations powered by **Matter.js**.

- **Use Case:** Pendulums, collisions, projectile motion, springs, inclined planes (O/L, A/L Physics).
- **Input:** Educator describes a mechanics scenario or uploads a force diagram.
- **AI Generation:** DeepSeek-Coder generates Matter.js world configuration → Canvas physics engine.
- **Student Experience:** Drag objects, change parameters (gravity, mass, friction), observe real-time physics.
- **See:** [[Matter.js Integration]] for full technical details.

### 9. Video Block (Future)

Embedded video content.

- **Source:** Upload or external embed (YouTube/Vimeo).
- **Planned:** Not in MVP unless bandwidth allows.

## Block Schema (JSONB)

```json
[
  {
    "id": "learn-1",
    "type": "text",
    "data": {
      "content": "<p>A linear equation...</p>",
      "language": "si"
    }
  },
  {
    "id": "learn-2",
    "type": "image",
    "data": {
      "src": "https://cdn.studed.lk/images/algebra.png",
      "alt": "Algebra diagram",
      "caption": "Figure 1: Linear relationship"
    }
  },
  {
    "id": "learn-3",
    "type": "audio",
    "data": {
      "src": "https://cdn.studed.lk/audio/expl.mp3",
      "title": "Explanation audio",
      "transcript": "In this wave, we explore..."
    }
  }
]
```

## AI-Assisted Content Creation

> [!tip] AI Makes Creation Easy
> The [[AI Integration]] in the [[MDX Editor]] can:
> - Generate explanatory text from a topic prompt.
> - Suggest image descriptions for graphic generation.
> - Draft audio narration scripts.
> - Auto-translate Learn content into Sinhala (with educator review).

## Rendering Strategy

- Blocks render **sequentially** in the Student Portal.
- The student scrolls or clicks "Next" to advance.
- Progress indicator shows "Block 2 of 5".
- At the end of the Learn phase, a "Start Evaluation" button appears.

## Accessibility Considerations

- All images must have `alt` text.
- Audio must have transcripts.
- Text must meet WCAG contrast ratios.
- Keyboard-navigable block progression.

## Related Notes

- [[Wave Anatomy]] — Where Learn fits in the Wave lifecycle.
- [[Evaluate Component]] — The testing phase counterpart.
- [[MDX Editor]] — The tool educators use to build Learn blocks.
- [[AI Integration]] — How AI assists in content creation.
- [[Sinhala Language Support]] — Rendering Sinhala text and audio.
- [[Frontend Architecture]] — How blocks are rendered on the client.
- [[Educator AI Chat Interface]] — Upload photos and auto-generate specialized blocks.
- [[AI Content Generation Service]] — Multi-model AI orchestration for block generation.
- [[Math-To-Manim Integration]] — Math animation block details.
- [[3Dmol.js Integration]] — Chemistry visualization block details.
- [[tscircuit Integration]] — Electronics simulation block details.
- [[Matter.js Integration]] — Mechanics simulation block details.
