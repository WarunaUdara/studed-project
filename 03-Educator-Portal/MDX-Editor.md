---
title: "MDX Editor"
description: "The Puck-based visual editor for building Learn and Evaluate content in StudEd Waves."
tags:
  - educator
  - editor
  - mdx
  - drag-and-drop
  - puck
  - studed
aliases:
  - "Content Editor"
  - "Wave Editor"
  - "Puck Editor"
date: 2026-06-03
---

# MDX Editor

> [!info] Purpose
> The **MDX Editor** is StudEd's core content creation tool, powered by [**Puck**](https://puckeditor.com). It is a **visual, drag-and-drop component editor** that allows educators to build both the [[Learn Component|Learn]] and [[Evaluate Component|Evaluate]] phases of a Wave without writing code.
>
> Puck was chosen because its component-based config model maps cleanly to StudEd's block JSONB schema, and its `render`, `fields`, and `resolveData` APIs provide deep customization for embedding interactive visualizations (Manim, 3Dmol, tscircuit, Matter.js).

## Why Puck?

| Requirement | How Puck Delivers |
|-------------|-----------------|
| **Drag-and-drop** | Native drag-and-drop component canvas with sidebar palette |
| **Custom components** | `config.components` API — every block is a React component with typed props |
| **Custom fields** | `fields` config with `custom`, `select`, `textarea`, `radio`, `external` types |
| **Async data** | `resolveData` fetches/generated data asynchronously per component |
| **AI integration** | `metadata` + `onAction` + `usePuck` enable programmatic block insertion from AI chat |
| **Sinhala support** | Native React input handling — no editor engine blocking IME |
| **Serialization** | Clean `Data` object (`{ content, root, zones }`) maps to StudEd `learn_blocks` JSONB |
| **Preview** | `<Render>` component renders saved data identically to the editor |

## Editor Interface Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Toolbar: Undo | Redo | 🤖 AI Chat | Preview | Publish        │
├──────────────────────────┬──────────────────────────────────────┤
│  Component Palette       │  Puck Canvas (Center)               │
│  [Learn Components]      │                                      │
│    📄 TextBlock          │  ┌────────────────────────────────┐  │
│    🖼️ ImageBlock         │  │  TextBlock                     │  │
│    🎵 AudioBlock          │  │  "A linear equation..."        │  │
│    📊 GraphicBlock        │  └────────────────────────────────┘  │
│    📐 MathViz             │  ┌────────────────────────────────┐  │
│    🧪 ChemViz             │  │  ImageBlock                    │  │
│    ⚡ ElecSim             │  │  [algebra-graph.png]           │  │
│    🔧 MechSim             │  └────────────────────────────────┘  │
│    ➖ Divider             │                                      │
│                          │                                      │
│  [Evaluate Components]    │  [🤖 AI Chat Panel — collapsible]   │
│    ❓ MCQBlock             │  ─────────────────────────────────  │
│    ✏️ FillBlankBlock      │  Educator: "Upload photo of notes"  │
│    🎯 DragDropBlock        │  [📎 photo.jpg]                     │
│                          │  AI: "I've created a Wave with..."   │
│  [📤 Upload Photo]        │  [✅ Accept] [🔄 Regenerate]        │
└──────────────────────────┴──────────────────────────────────────┘
```

## Puck Config for StudEd

### 1. Component Definitions

Each block type is a Puck component with a `type`, `fields`, and `render` function:

```tsx
// puck-config.tsx
import type { Config } from "@puckeditor/core";

export const waveEditorConfig: Config = {
  components: {
    TextBlock: {
      fields: {
        content: { type: "textarea" },
        language: {
          type: "select",
          options: [
            { label: "Sinhala", value: "si" },
            { label: "English", value: "en" },
          ],
        },
      },
      defaultProps: {
        content: "<p>Enter your explanation here...</p>",
        language: "si",
      },
      render: ({ content, language }) => (
        <div className="text-block" lang={language} dangerouslySetInnerHTML={{ __html: content }} />
      ),
    },

    ImageBlock: {
      fields: {
        src: { type: "text" },
        alt: { type: "text" },
        caption: { type: "text" },
      },
      defaultProps: { src: "", alt: "", caption: "" },
      render: ({ src, alt, caption }) => (
        <figure>
          <img src={src} alt={alt} className="rounded-lg w-full" />
          {caption && <figcaption>{caption}</figcaption>}
        </figure>
      ),
    },

    MathViz: {
      fields: {
        title: { type: "text" },
        video_url: { type: "text" },
        thumbnail: { type: "text" },
        duration: { type: "number" },
      },
      defaultProps: { title: "Math Animation", video_url: "", thumbnail: "", duration: 0 },
      resolveData: async ({ props }) => {
        // Auto-generate thumbnail if missing
        if (!props.thumbnail && props.video_url) {
          return { props: { ...props, thumbnail: props.video_url.replace(".mp4", "_thumb.jpg") } };
        }
        return { props };
      },
      render: ({ title, video_url, thumbnail, duration }) => (
        <div className="mathviz-container">
          <h4>{title}</h4>
          {video_url ? (
            <video src={video_url} controls poster={thumbnail} className="w-full rounded" />
          ) : (
            <div className="placeholder bg-gray-100 p-8 text-center rounded">
              <p>Math animation will appear here after AI generation.</p>
            </div>
          )}
        </div>
      ),
    },

    ChemViz: {
      fields: {
        title: { type: "text" },
        molecule_smiles: { type: "text" },
        style_preset: {
          type: "select",
          options: [
            { label: "Stick", value: "stick" },
            { label: "Cartoon", value: "cartoon" },
            { label: "Sphere", value: "sphere" },
          ],
        },
      },
      defaultProps: { title: "Molecule", molecule_smiles: "", style_preset: "stick" },
      render: ({ title, molecule_smiles, style_preset }) => (
        <ChemVizViewer smiles={molecule_smiles} style={style_preset} title={title} />
      ),
    },

    ElecSim: {
      fields: {
        title: { type: "text" },
        circuit_code: { type: "textarea" },
        view_mode: {
          type: "radio",
          options: [
            { label: "Schematic", value: "schematic" },
            { label: "PCB", value: "pcb" },
          ],
        },
      },
      defaultProps: { title: "Circuit", circuit_code: "", view_mode: "schematic" },
      render: ({ title, circuit_code, view_mode }) => (
        <ElecSimSchematic code={circuit_code} mode={view_mode} title={title} />
      ),
    },

    MechSim: {
      fields: {
        title: { type: "text" },
        scenario_type: {
          type: "select",
          options: [
            { label: "Pendulum", value: "pendulum" },
            { label: "Collision", value: "collision" },
            { label: "Projectile", value: "projectile" },
            { label: "Custom", value: "custom" },
          ],
        },
        world_config: { type: "textarea" },
      },
      defaultProps: { title: "Physics Sim", scenario_type: "custom", world_config: "{}" },
      render: ({ title, scenario_type, world_config }) => (
        <MechSimCanvas config={JSON.parse(world_config)} title={title} />
      ),
    },

    MCQBlock: {
      fields: {
        question: { type: "textarea" },
        options: { type: "textarea" }, // JSON array string
        correct_index: { type: "number" },
        explanation: { type: "textarea" },
      },
      defaultProps: {
        question: "",
        options: "[\"Option 1\", \"Option 2\", \"Option 3\"]",
        correct_index: 0,
        explanation: "",
      },
      render: ({ question, options, correct_index, explanation }) => (
        <div className="mcq-block border rounded p-4">
          <p className="font-medium">{question}</p>
          <div className="mt-2 space-y-1">
            {JSON.parse(options).map((opt: string, i: number) => (
              <label key={i} className="flex items-center gap-2">
                <input type="radio" name="mcq" disabled />
                <span>{opt}</span>
              </label>
            ))}
          </div>
        </div>
      ),
    },

    FillBlankBlock: {
      fields: {
        sentence: { type: "textarea" },
        answers: { type: "textarea" }, // JSON array string
      },
      defaultProps: { sentence: "The answer is ___.", answers: "[\"answer\"]" },
      render: ({ sentence, answers }) => (
        <div className="fillblank-block border rounded p-4">
          <p dangerouslySetInnerHTML={{ __html: sentence.replace("___", "<input class='border-b-2 border-blue-500' disabled />") }} />
        </div>
      ),
    },

    DragDropBlock: {
      fields: {
        instruction: { type: "textarea" },
        draggables: { type: "textarea" },
        drop_zones: { type: "textarea" },
      },
      defaultProps: { instruction: "", draggables: "[]", drop_zones: "[]" },
      render: ({ instruction }) => (
        <div className="dragdrop-block border rounded p-4 bg-yellow-50">
          <p>{instruction || "Drag-and-drop exercise"}</p>
        </div>
      ),
    },
  },
};
```

### 2. Puck Editor Wrapper

```tsx
// WaveEditor.tsx
import { Puck } from "@puckeditor/core";
import { waveEditorConfig } from "./puck-config";
import type { Data } from "@puckeditor/core";

interface WaveEditorProps {
  initialData: Data;
  onSave: (data: Data) => void;
}

export function WaveEditor({ initialData, onSave }: WaveEditorProps) {
  return (
    <Puck
      config={waveEditorConfig}
      data={initialData}
      onPublish={onSave}
      onChange={(data) => {
        // Auto-save draft
        localStorage.setItem("wave-draft", JSON.stringify(data));
      }}
      metadata={{
        // Passed to all component render and resolveData functions
        waveId: "wave-123",
        educatorId: "educator-456",
        grade: "grade_10",
      }}
      overrides={{
        // Customize Puck UI
        header: ({ actions }) => (
          <div className="flex items-center justify-between p-3 bg-gray-900 text-white">
            <span className="font-medium">StudEd Wave Editor</span>
            {actions}
          </div>
        ),
      }}
    />
  );
}
```

### 3. Student-Side Render

```tsx
// StudentWaveRenderer.tsx
import { Render } from "@puckeditor/core";
import { waveEditorConfig } from "./puck-config";
import type { Data } from "@puckeditor/core";

export function StudentWaveRenderer({ data }: { data: Data }) {
  return <Render config={waveEditorConfig} data={data} />;
}
```

## AI Chat Integration with Puck

The [[Educator AI Chat Interface]] inserts blocks programmatically using Puck's `onAction` and `metadata` APIs:

### Programmatic Block Insertion

```tsx
// Inside the AI Chat panel, when AI returns generated blocks:
import { usePuck } from "@puckeditor/core";

const useStudEdPuck = createUsePuck();

function AIChatPanel() {
  const dispatch = useStudEdPuck((s) => s.dispatch);
  const appState = useStudEdPuck((s) => s.appState);

  const insertAIGeneratedBlocks = (blocks: any[]) => {
    blocks.forEach((block) => {
      dispatch({
        type: "insert",
        componentType: block.type,
        props: block.props,
        // Insert at end of content
        index: appState.data.content.length,
      });
    });
  };

  return (
    <div className="ai-chat-panel">
      {/* Chat UI */}
      <button
        onClick={() => {
          // Call AI Service, then insert result
          insertAIGeneratedBlocks(aiGeneratedBlocks);
        }}
      >
        Insert AI Blocks
      </button>
    </div>
  );
}
```

### Using Puck as a Plugin

```tsx
// AI Chat Plugin for Puck
const aiChatPlugin = {
  name: "ai-chat",
  label: "AI Assistant",
  icon: <BotIcon />,
  render: () => {
    const dispatch = useStudEdPuck((s) => s.dispatch);
    return <AIChatPanel dispatch={dispatch} />;
  },
};

<Puck
  config={waveEditorConfig}
  plugins={[aiChatPlugin]}
  // ...
/>;
```

## Puck Data ↔ StudEd JSONB Mapping

Puck's `Data` object maps cleanly to StudEd's database schema:

```
Puck Data:                    StudEd Wave JSONB:
──────────                    ─────────────────
{
  content: [                  learn_blocks: [
    { type: "TextBlock",         { type: "text",
      props: { ... } },           data: { ... } },
    { type: "MathViz",          { type: "mathviz_manim",
      props: { ... } },           data: { ... } },
  ],                           ],
  root: { ... },               evaluate_blocks: [
  zones: { ... }                 { type: "mcq",
}                                  data: { ... } },
                               ]
```

### Serialization Helper

```tsx
// Convert Puck Data to StudEd Wave JSONB
function puckToWaveJSONB(data: Data): WaveJSONB {
  return {
    learn_blocks: data.content.map((item) => ({
      id: item.props.id || crypto.randomUUID(),
      type: mapPuckTypeToBlockType(item.type),
      data: item.props,
    })),
    evaluate_blocks: [], // Separate section or filtered from content
  };
}

// Convert StudEd Wave JSONB to Puck Data
function waveJSONBToPuck(wave: WaveJSONB): Data {
  return {
    content: wave.learn_blocks.map((block) => ({
      type: mapBlockTypeToPuckType(block.type),
      props: { id: block.id, ...block.data },
    })),
    root: {},
    zones: {},
  };
}
```

## Custom Field Types for StudEd

Puck supports fully custom field UIs via the `custom` field type:

```tsx
// AI-generated field
fields: {
  ai_prompt: {
    type: "custom",
    render: ({ name, onChange, value }) => (
      <div className="space-y-2">
        <label className="text-sm font-medium">AI Prompt</label>
        <textarea
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          className="w-full p-2 border rounded"
          placeholder="Describe what you want the AI to generate..."
        />
        <button
          onClick={() => triggerAIGeneration(value)}
          className="px-3 py-1 bg-blue-500 text-white rounded text-sm"
        >
          🤖 Generate
        </button>
      </div>
    ),
  },

  // Photo upload field
  photo_upload: {
    type: "custom",
    render: ({ name, onChange, value }) => (
      <div>
        <label className="text-sm font-medium">Upload Photo</label>
        <input
          type="file"
          accept="image/*"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (file) {
              const url = await uploadToR2(file);
              onChange(url);
            }
          }}
        />
        {value && <img src={value} className="mt-2 h-24 rounded" />}
      </div>
    ),
  },
}
```

## Viewports for Responsive Preview

```tsx
<Puck
  config={waveEditorConfig}
  viewports={[
    { width: 1440, label: "Desktop", icon: "Monitor" },
    { width: 768, label: "Tablet", icon: "Tablet" },
    { width: 375, label: "Mobile", icon: "Smartphone" },
  ]}
/>
```

## Permissions & UI Customization

Restrict certain Puck features for educators:

```tsx
<Puck
  config={waveEditorConfig}
  permissions={{
    delete: true,
    drag: true,
    edit: true,
    // Disable features not needed
    duplicate: false,
  }}
  overrides={{
    // Hide default header, use custom
    header: () => null,
    // Custom component panel grouping
    components: ({ children }) => (
      <div>
        <h3 className="text-xs font-bold uppercase text-gray-500 mb-2">Learn Blocks</h3>
        {children}
      </div>
    ),
  }}
/>
```

## Related Notes

- [[Wave Creation Workflow]] — How educators use this editor.
- [[Learn Component]] — Learn block specifications.
- [[Evaluate Component]] — Evaluate block specifications.
- [[Puck Research]] — Deep dive into Puck internals and API.
- [[Sinhala Language Support]] — Editor input methods.
- [[Frontend Architecture]] — How the editor is embedded in the app.
- [[Educator AI Chat Interface]] — Photo upload and AI chat UX.
- [[AI Content Generation Service]] — Multi-model AI backend.
- [[Math-To-Manim Integration]] — Math animation block details.
- [[3Dmol.js Integration]] — Chemistry visualization block details.
- [[tscircuit Integration]] — Electronics simulation block details.
- [[Matter.js Integration]] — Physics simulation block details.