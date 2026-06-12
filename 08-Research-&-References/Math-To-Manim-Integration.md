---
title: "Math-To-Manim Integration"
description: "Integrating Math-To-Manim for automated mathematical animation generation in StudEd Waves."
tags:
  - research
  - math
  - manim
  - visualization
  - animation
  - math-to-manim
  - studed
aliases:
  - "Manim"
  - "Math Animation"
  - "Math Visualization"
date: 2026-06-03
---

# Math-To-Manim Integration

> [!info] Overview
> [**Math-To-Manim**](https://github.com/HarleyCoops/Math-To-Manim) is an open-source Python framework that turns text and image prompts into **Manim** (Mathematical Animation) explainer videos. It uses a multi-agent pipeline (Intent → Prerequisite Graph → Curriculum → Math Packet → Storyboard → Scene Spec → Manim Code → Render → Review) to generate cinematic educational animations.
>
> In StudEd, Math-To-Manim powers the **MathViz Block** inside the [[Learn Component]], allowing educators to automatically generate animated mathematical explanations from photos or text prompts.

## What It Does

Math-To-Manim generates:
- **Geometric proofs** (Pythagorean theorem, circle area derivations)
- **Calculus visualizations** (derivatives as slopes, Fourier epicycles)
- **3D geometry** (Hopf fibration, rhombicosidodecahedron)
- **Physics animations** (Lorenz attractor, quantum harmonic oscillator)
- **Step-by-step derivations** with narration-synced visuals

## Integration Architecture

```mermaid
graph LR
    A[Educator uploads math photo<br/>or types prompt] --> B[AI Service]
    B --> C[DeepSeek-Coder generates<br/>scene_spec.json]
    C --> D[Math-To-Manim Pipeline<br/>Docker container]
    D --> E[Manim renders<br/>MP4/GIF]
    E --> F[Cloudflare R2 CDN storage]
    F --> G[Puck<br/>MathViz Block]
    G --> H[Student views<br/>embedded animation]
```

## StudEd MathViz Block

### Block Schema

```json
{
  "id": "mathviz-1",
  "type": "mathviz_manim",
  "data": {
    "title": "Pythagorean Theorem Proof",
    "description": "Visual proof using square rearrangement",
    "script_id": "manim_abc123",
    "video_url": "https://cdn.studed.lk/videos/pythagoras_abc123.mp4",
    "gif_preview": "https://cdn.studed.lk/videos/pythagoras_abc123_preview.gif",
    "thumbnail": "https://cdn.studed.lk/thumbs/pythagoras_abc123.png",
    "duration": 45,
    "dimensions": { "width": 1920, "height": 1080 },
    "narration_script": {
      "si": "මුලින්ම අපි τριγώνය බලමු...",
      "en": "First, let's look at the triangle..."
    },
    "interactive_controls": {
      "play_pause": true,
      "speed": [0.5, 1.0, 1.5, 2.0],
      "seek": true,
      "fullscreen": true
    }
  }
}
```

### Frontend Component

```tsx
// React component for the MathViz block
import { useRef, useState } from 'react';

export function MathVizBlock({ block }: { block: MathVizBlockData }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [speed, setSpeed] = useState(1.0);
  
  return (
    <div className="mathviz-container rounded-xl overflow-hidden bg-gray-900">
      <div className="p-3 bg-gray-800 flex items-center justify-between">
        <h4 className="text-white font-medium">{block.title}</h4>
        <div className="flex gap-2">
          {[0.5, 1, 1.5, 2].map((s) => (
            <button
              key={s}
              onClick={() => { setSpeed(s); videoRef.current!.playbackRate = s; }}
              className={`px-2 py-1 rounded text-xs ${speed === s ? 'bg-blue-500' : 'bg-gray-700'} text-white`}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>
      
      <video
        ref={videoRef}
        src={block.video_url}
        poster={block.thumbnail}
        controls
        className="w-full"
        preload="metadata"
      />
      
      {block.narration_script.si && (
        <div className="p-3 bg-gray-800 border-t border-gray-700">
          <p className="text-gray-300 text-sm">{block.narration_script.si}</p>
        </div>
      )}
    </div>
  );
}
```

## Backend Pipeline

### 1. Scene Specification Generation

When an educator requests a math animation, the AI Service sends a prompt to DeepSeek-Coder:

```
Generate a Math-To-Manim scene_spec.json for:
"Explain the Pythagorean theorem proof by rearranging squares"
Target: Grade 10, Duration: 45 seconds, Style: cinematic
```

DeepSeek-Coder returns:
```json
{
  "scene_title": "Pythagorean Proof by Squares",
  "duration_seconds": 45,
  "style": "cinematic",
  "beats": [
    { "time": 0, "action": "Draw right triangle with sides a, b, c" },
    { "time": 5, "action": "Construct squares on each side" },
    { "time": 15, "action": "Show area labels: a², b², c²" },
    { "time": 25, "action": "Animate rearrangement of a² + b² into c²" },
    { "time": 40, "action": "QED label with glow effect" }
  ],
  "camera_notes": "Start wide, zoom into triangle at 0:10",
  "color_palette": ["#3B82F6", "#10B981", "#F59E0B"]
}
```

### 2. Manim Code Generation

The Math-To-Manim pipeline turns the scene spec into runnable Python:

```python
from manim import *

class PythagoreanProofBySquares(Scene):
    def construct(self):
        # Setup
        triangle = Polygon(
            ORIGIN, [3, 0, 0], [0, 4, 0],
            color=BLUE, fill_opacity=0.3
        )
        
        # Beat 1: Draw triangle
        self.play(Create(triangle), run_time=2)
        self.wait(1)
        
        # Beat 2: Construct squares
        square_a = Square(side_length=3).next_to(triangle, DOWN, buff=0)
        square_b = Square(side_length=4).next_to(triangle, LEFT, buff=0)
        square_c = Square(side_length=5).rotate(
            np.arctan(4/3)
        ).next_to(triangle, UP+RIGHT, buff=0)
        
        self.play(
            Create(square_a), Create(square_b), Create(square_c),
            run_time=3
        )
        
        # ... remaining beats
```

### 3. Rendering Pipeline

```mermaid
graph LR
    A[Generated Python] --> B[Validate Syntax]
    B --> C[Security Scan<br/>No imports except manim]
    C --> D[Docker Container<br/>manimcommunity/manim]
    D --> E[Render MP4<br/>1080p60]
    E --> F[Generate GIF Preview<br/>ffmpeg]
    F --> G[Generate Thumbnail<br/>frame extraction]
    G --> H[Upload to Cloudflare R2]
    H --> I[Return CDN URLs]
```

### Go Service Handler

```go
// ai-service/internal/manim/renderer.go
package manim

import (
    "context"
    "fmt"
    "os/exec"
    "path/filepath"
)

type Renderer struct {
    dockerImage string
    outputDir   string
}

func (r *Renderer) Render(ctx context.Context, script string) (*RenderResult, error) {
    // Write script to temp file
    scriptPath := filepath.Join(r.outputDir, "scene.py")
    // ... write script
    
    // Run Manim in Docker
    cmd := exec.CommandContext(ctx, "docker", "run", "--rm",
        "-v", fmt.Sprintf("%s:/manim", r.outputDir),
        "manimcommunity/manim:v0.18.0",
        "manim", "-pqm", "/manim/scene.py", "PythagoreanProofBySquares",
    )
    
    output, err := cmd.CombinedOutput()
    if err != nil {
        return nil, fmt.Errorf("manim render failed: %w\n%s", err, output)
    }
    
    // Extract output paths
    mp4Path := filepath.Join(r.outputDir, "media/videos/.../PythagoreanProofBySquares.mp4")
    
    return &RenderResult{
        MP4Path: mp4Path,
    }, nil
}
```

## Puck Custom Component Integration

Using Puck's component config API:

```typescript
import type { Config } from "@puckeditor/core";

export const mathVizConfig: Config = {
  components: {
    MathViz: {
      fields: {
        title: { type: "text" },
        video_url: { type: "text" },
        thumbnail: { type: "text" },
        duration: { type: "number" },
      },
      defaultProps: {
        title: "Math Animation",
        video_url: "",
        thumbnail: "",
        duration: 0,
      },
      render: ({ title, video_url, thumbnail, duration }) => {
        return (
          <div className="mathviz-block">
            {video_url ? (
              <video src={video_url} controls poster={thumbnail} />
            ) : (
              <div className="placeholder">
                <button onClick={() => openManimGenerator()}>
                  Generate Math Animation
                </button>
              </div>
            )}
          </div>
        );
      },
    },
  },
};
```

## Performance & Cost Considerations

| Metric | Value |
|--------|-------|
| **Render time** | 30–120 seconds per animation |
| **Docker memory** | 2–4GB per render job |
| **Output file size** | 5–20MB MP4, 1–3MB GIF preview |
| **AI generation cost** | $0.10–$0.50 per scene spec + code |
| **Render compute cost** | ~$0.05 per minute on AWS ECS |

> [!tip] Background Rendering
> Manim renders run asynchronously via Asynq job queue. Educators see a "Generating..." placeholder that auto-updates when the render completes.

## Fallback Strategy

If Manim rendering fails:
1. Return the generated Python code as a "code preview" block.
2. Allow educator to edit code manually.
3. Offer pre-rendered template animations for common concepts.
4. Fallback to static SVG diagram if render repeatedly fails.

## Related Notes

- [[Educator AI Chat Interface]] — Where educators request math animations.
- [[AI Content Generation Service]] — Multi-model orchestration.
- [[Learn Component]] — Where MathViz blocks appear in Waves.
- [[MDX Editor]] — Editor integration for MathViz blocks.
- [[Puck Research]] — Puck custom component implementation details.
