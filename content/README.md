# StudEd Content

Declarative, version-controlled course content for StudEd. Every course is a
single `course.json` manifest under `content/courses/<slug>/`. A sync tool
upserts that manifest into the live API (courses → lessons → waves), so content
is **reviewable, diffable, and editable by AI agents or educators** — no
hand-written SQL or imperative seed scripts.

## Layout

```
content/
├── README.md                      # this file
├── courses/
│   ├── course.schema.json         # JSON Schema (AI/editor validation)
│   ├── coordinate-geometry/
│   │   └── course.json            # Coordinate Geometry course manifest
│   └── thinking-in-python/
│       └── course.json            # Thinking in Python course manifest
```

## Manifest format

A course manifest is a single JSON document. The canonical schema lives in
`content/courses/course.schema.json`.

```json
{
  "slug": "thinking-in-python",
  "title": "Thinking in Python",
  "description": "Build Python programs to develop strong foundations for creating with code.",
  "gradeLevel": "G9",
  "subject": "ICT",
  "price": 0,
  "version": 1,
  "lessons": [
    {
      "title": "Level 1: Variables",
      "sequenceOrder": 1,
      "status": "published",
      "waves": [
        {
          "title": "1. What Is a Variable?",
          "sequenceOrder": 1,
          "status": "published",
          "xpReward": 100,
          "maxReattempts": 3,
          "passingThreshold": 60,
          "estimatedDuration": 8,
          "difficulty": "EASY",
          "learnBlocks": [
            { "id": "lb-1", "type": "text", "content": "A variable is a named box that stores a value." },
            { "id": "lb-2", "type": "code", "content": "score = 100\nprint(score)" }
          ],
          "evaluateBlocks": [
            {
              "id": "eb-1",
              "type": "multiple_choice",
              "question": "What does this code print?",
              "options": ["100", "score", "print", "None"],
              "correctAnswer": "100",
              "explanation": "print(score) outputs the value stored in the variable score, which is 100."
            }
          ]
        }
      ]
    }
  ]
}
```

## Block types

### Learn blocks

| type              | Rendered by                              |
| ----------------- | ---------------------------------------- |
| `text`            | Paragraph                                |
| `heading`         | Section heading                          |
| `code`            | Copyable Python/code snippet             |
| `formula`         | KaTeX formula                            |
| `callout`         | Highlighted note                         |
| `image` / `video` | Media                                    |
| `coordinate_plane`| Interactive 2D coordinate grid (SVG)     |
| `manim`, `molecule`, `circuit`, `physics` | Submodule visualizations |

`coordinate_plane` accepts a `steps` array in `metadata` to drive the widget
(see `frontend/src/components/learn/visualizations/CoordinatePlaneBlock.tsx`).

### Evaluate blocks

| type               | Input               | Requirements                              |
| ------------------ | ------------------- | ----------------------------------------- |
| `multiple_choice`  | Radio buttons       | ≥ 2 `options`; `correctAnswer` matches one verbatim |
| `true_false`       | True/False buttons  | `correctAnswer` is `True` or `False` (options auto-generated) |
| `numeric`          | Text input          | `correctAnswer` is the number            |
| `fill_in_blank`    | Text input          | `correctAnswer` is the expected string   |

## Authoring workflow (educators & AI agents)

1. **Brief** — describe the course/topic and grade in a prompt (or directly edit a manifest).
2. **Draft** — generate or hand-write `course.json` following the schema.
3. **Validate** — `bun run scripts/content-sync/src/index.ts --validate content/courses/<slug>`.
4. **Sync** — push to the backend:
   `make content-sync` (all courses) or
   `bun run scripts/content-sync/src/index.ts content/courses/<slug>` (one course).
   Sync is **idempotent and update-aware**: re-running after editing a manifest
   updates existing courses/lessons/waves instead of duplicating them.
5. **Publish** — every synced course, lesson, and wave is published automatically.

To author a new block type, extend the catalog in
`scripts/content-sync/src/types.ts` and `validate.ts`, add a renderer case in
`frontend/src/components/learn/LearnBlockRenderer.tsx`, and document it here.

## Draft vs published

Set `status: "draft"` on a lesson or wave to keep the structure visible in the
manifest without shipping it to students. Draft items are validated but never
synced.
