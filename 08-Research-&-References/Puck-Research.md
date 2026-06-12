---
title: "Puck Research"
description: "Deep-dive programming guide for integrating Puck as StudEd's Wave editor."
tags:
  - research
  - puck
  - editor
  - mdx
  - studed
aliases:
  - "Puck"
  - "Editor Programming Guide"
  - "Puck API"
date: 2026-06-03
---

# Puck Research

> [!info] Overview
> [**Puck**](https://puckeditor.com) is a modular, open-source visual editor for React.js. It allows you to build custom drag-and-drop experiences with your own React components. Puck is the **chosen editor** for StudEd's [[MDX Editor]] because its component config model maps perfectly to our block-based Wave content system.

## Why Puck for StudEd

| StudEd Need | Puck Feature |
|-------------|-----------|
| **Block-based content** | Every item in `config.components` becomes a draggable block |
| **Typed block props** | `fields` schema enforces data structure per block type |
| **Custom block UIs** | `custom` field type for photo uploads, AI prompts, molecule pickers |
| **Async data loading** | `resolveData` fetches/generated content per block |
| **Programmatic insertion** | `dispatch({ type: "insert", ... })` from AI chat panel |
| **State introspection** | `createUsePuck()` hook for plugins to read editor state |
| **Clean serialization** | `Data` object `{ content, root, zones }` → JSONB |
| **Read-only renderer** | `<Render config={config} data={data} />` for student view |

## Core Concepts

### 1. Config Object

The `Config` object is the heart of Puck. It defines all available components:

```tsx
import type { Config } from "@puckeditor/core";

const config: Config = {
  components: {
    // Each key is a component type
    MyComponent: {
      // Fields define the editable props
      fields: {
        title: { type: "text" },
        count: { type: "number" },
        active: { type: "radio", options: [{ label: "Yes", value: "yes" }] },
      },
      // Default props for new instances
      defaultProps: { title: "Hello", count: 0, active: "yes" },
      // React component rendered on canvas
      render: ({ title, count, active }) => <div>{title}</div>,
    },
  },
};
```

### 2. Data Object

Puck produces and consumes a `Data` object:

```ts
interface Data {
  content: ComponentData[]; // Array of component instances
  root: RootData;          // Root-level props
  zones: Record<string, ComponentData[]>; // Nested zones (optional)
}

interface ComponentData {
  type: string;    // Matches a key in config.components
  props: Record<string, any>;
}
```

### 3. Component Config API

| Property | Type | Purpose |
|----------|------|---------|
| `fields` | `Record<string, Field>` | Defines editable props |
| `defaultProps` | `Record<string, any>` | Initial values |
| `render` | `React.FC<{ props, puck }>` | Visual output |
| `resolveData` | `async ({ props }, { changed, metadata }) => { props, readOnly }` | Async data fetching / computed props |
| `metadata` | `Record<string, any>` | Static metadata passed to render |

### 4. Field Types

```tsx
// text — single-line string
{ type: "text" }

// textarea — multi-line string
{ type: "textarea" }

// number — numeric
{ type: "number" }

// select — dropdown
{
  type: "select",
  options: [
    { label: "Option A", value: "a" },
    { label: "Option B", value: "b" },
  ],
}

// radio — radio buttons
{
  type: "radio",
  options: [
    { label: "Schematic", value: "schematic" },
    { label: "PCB", value: "pcb" },
  ],
}

// custom — fully custom React UI
{
  type: "custom",
  render: ({ name, onChange, value }) => (
    <input value={value} onChange={(e) => onChange(e.target.value)} />
  ),
}

// external — fetch data from external source
{
  type: "external",
  fetchList: async () => [{ title: "Item 1" }],
  mapProp: (item) => item.title,
}
```

### 5. resolveData — Async Data Fetching

```tsx
const config = {
  components: {
    MoleculeViewer: {
      fields: {
        smiles: { type: "text" },
        title: { type: "text" },
      },
      // Automatically called when props change
      resolveData: async ({ props }, { changed }) => {
        if (!changed.smiles) return { props };

        // Fetch molecule metadata from backend
        const res = await fetch(`/api/molecule?smiles=${props.smiles}`);
        const data = await res.json();

        return {
          props: {
            ...props,
            title: data.commonName || props.title,
          },
          readOnly: {
            title: true, // Lock the title after auto-fetch
          },
        };
      },
      render: ({ title, smiles }) => <div>{title}</div>,
    },
  },
};
```

### 6. Programmatic Control with usePuck

```tsx
import { createUsePuck } from "@puckeditor/core";

const usePuck = createUsePuck();

function MyPlugin() {
  const dispatch = usePuck((s) => s.dispatch);
  const appState = usePuck((s) => s.appState);
  const selectedItem = usePuck((s) => s.selectedItem);

  const insertBlock = () => {
    dispatch({
      type: "insert",
      componentType: "TextBlock",
      props: { content: "AI generated text" },
      index: appState.data.content.length,
    });
  };

  const removeBlock = (index: number) => {
    dispatch({
      type: "remove",
      index,
    });
  };

  return <button onClick={insertBlock}>Insert Block</button>;
}
```

### 7. Actions Reference

| Action | Payload | Description |
|--------|---------|-------------|
| `insert` | `{ componentType, props, index? }` | Add new component |
| `remove` | `{ index }` | Delete component at index |
| `replace` | `{ index, componentType, props }` | Replace component |
| `reorder` | `{ fromIndex, toIndex }` | Move component |
| `setData` | `{ data }` | Replace entire data object |
| `setUi` | `{ ui }` | Update UI state |

### 8. Plugins

```tsx
const myPlugin = {
  name: "my-plugin",
  label: "My Plugin",
  icon: <WrenchIcon />,
  render: () => {
    const type = usePuck((s) => s.selectedItem?.type || "Nothing");
    return <div>Selected: {type}</div>;
  },
};

<Puck config={config} plugins={[myPlugin]} />;
```

### 9. Overrides — Customizing Puck UI

```tsx
<Puck
  config={config}
  overrides={{
    // Replace the entire header
    header: ({ children }) => (
      <div className="custom-header">{children}</div>
    ),
    // Replace component panel
    components: ({ children }) => (
      <div className="custom-sidebar">{children}</div>
    ),
    // Replace canvas area
    canvas: ({ children }) => (
      <div className="custom-canvas">{children}</div>
    ),
    // Replace action bar
    actionBar: ({ children }) => (
      <div className="custom-actions">{children}</div>
    ),
  }}
/>
```

### 10. Metadata

Pass global context to all components:

```tsx
<Puck
  config={config}
  metadata={{
    waveId: "wave-123",
    educatorName: "Mr. Perera",
    targetGrade: "grade_10",
    targetLanguage: "si",
  }}
/>

// Access in component render:
const MyComponent = {
  render: ({ puck }) => {
    return <div>Grade: {puck.metadata.targetGrade}</div>;
  },
};
```

## StudEd-Specific Puck Patterns

### AI Chat Panel as Plugin

```tsx
const aiChatPlugin = {
  name: "ai-chat",
  label: "AI Assistant",
  icon: <SparklesIcon />,
  render: () => {
    const dispatch = useStudEdPuck((s) => s.dispatch);
    const [messages, setMessages] = useState([]);

    const handlePhotoUpload = async (file: File) => {
      // Upload to R2
      const photoUrl = await uploadToR2(file);
      // Send to AI Service
      const response = await aiService.generateFromPhoto(photoUrl);
      // Insert generated blocks
      response.blocks.forEach((block, i) => {
        dispatch({
          type: "insert",
          componentType: block.type,
          props: block.props,
          index: appState.data.content.length + i,
        });
      });
    };

    return (
      <div className="ai-chat-panel">
        <PhotoUploader onUpload={handlePhotoUpload} />
        <ChatMessages messages={messages} />
        <ChatInput onSend={handleSend} />
      </div>
    );
  },
};
```

### Sinhala-Aware Text Component

```tsx
const SinhalaTextBlock = {
  fields: {
    content: {
      type: "custom",
      render: ({ name, onChange, value }) => (
        <div>
          <FieldLabel label="Content (Sinhala/English)">
            <textarea
              value={value || ""}
              onChange={(e) => onChange(e.target.value)}
              className="w-full p-2 border rounded font-sinhala"
              dir="auto"
            />
          </FieldLabel>
          <button
            onClick={async () => {
              const simplified = await aiService.simplifySinhala(value);
              onChange(simplified);
            }}
            className="text-xs text-blue-600 mt-1"
          >
            Simplify with AI
          </button>
        </div>
      ),
    },
    language: {
      type: "select",
      options: [
        { label: "සිංහල", value: "si" },
        { label: "English", value: "en" },
      ],
    },
  },
  render: ({ content, language }) => (
    <div lang={language} className={language === "si" ? "font-sinhala" : ""}>
      {content}
    </div>
  ),
};
```

### Manim Animation Block with resolveData

```tsx
const MathVizBlock = {
  fields: {
    concept: { type: "text" },
    style: { type: "select", options: [{ label: "Cinematic", value: "cinematic" }] },
  },
  defaultProps: { concept: "", style: "cinematic", video_url: "", status: "pending" },
  resolveData: async ({ props }, { changed }) => {
    if (!changed.concept || props.video_url) return { props };

    // Trigger Manim generation via AI Service
    const job = await aiService.generateManim({
      concept: props.concept,
      style: props.style,
    });

    return {
      props: {
        ...props,
        status: "generating",
        job_id: job.id,
      },
    };
  },
  render: ({ concept, video_url, status }) => (
    <div className="mathviz">
      {status === "generating" && <GeneratingSpinner concept={concept} />}
      {video_url && <video src={video_url} controls />}
    </div>
  ),
};
```

## Serialization to JSONB

Puck's `Data` object is intentionally flat and serializable — ideal for PostgreSQL JSONB:

```tsx
// Before saving to database:
const data: Data = editor.getData();
const waveJSONB = {
  learn_blocks: data.content.map((item) => ({
    id: item.props.id || crypto.randomUUID(),
    type: mapComponentType(item.type),
    data: item.props,
  })),
  evaluate_blocks: [], // Could be a separate zone
};

// When loading from database:
const data: Data = {
  content: wave.learn_blocks.map((block) => ({
    type: mapBlockType(block.type),
    props: { id: block.id, ...block.data },
  })),
  root: {},
  zones: {},
};
```

## Performance Considerations

| Concern | Solution |
|---------|----------|
| **Large component lists** | Lazy-load heavy components (3Dmol, Matter.js) via dynamic imports in `render` |
| **Frequent re-renders** | Use `usePuck` selectors to subscribe only to needed state |
| **resolveData loops** | Check `changed` object before making expensive async calls |
| **Bundle size** | Split Puck editor and `<Render>` into separate chunks; students only download renderer |
| **Auto-save** | Debounce `onChange` at 2s intervals to avoid excessive API calls |

## Related Notes

- [[MDX Editor]] — How Puck is embedded in StudEd.
- [[Wave Creation Workflow]] — Educator's step-by-step process.
- [[Educator AI Chat Interface]] — Photo upload and AI chat integration with Puck.
- [[Frontend Architecture]] — Frontend structure hosting the editor.
- [[AI Content Generation Service]] — Backend AI service feeding into Puck.
- [[Math-To-Manim Integration]] — MathViz Puck component details.
- [[3Dmol.js Integration]] — ChemViz Puck component details.
- [[tscircuit Integration]] — ElecSim Puck component details.
- [[Matter.js Integration]] — MechSim Puck component details.
