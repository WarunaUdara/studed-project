---
title: "Sinhala Language Support"
description: "Technical and UX requirements for full Sinhala language support across the platform."
tags:
  - educator
  - student
  - sinhala
  - i18n
  - localization
  - studed
aliases:
  - "Sinhala Support"
  - "Localization"
  - "Unicode"
date: 2026-06-03
---

# Sinhala Language Support

> [!warning] Critical Requirement
> StudEd **must fully support the Sinhala language**. A significant portion of the target audience (Sri Lankan school students) learns primarily in Sinhala. Every part of the platform — from the [[MDX Editor]] to the [[Student Dashboard]] — must handle Sinhala text, input, rendering, and search flawlessly.

## Scope of Support

### 1. Content Creation (Educator)

- The [[MDX Editor]] must accept Sinhala keyboard input (Windows / Mac / mobile Sinhala keyboards).
- [[AI Integration]] must generate and translate content into natural, formal Sinhala.
- All block types ([[Learn Component|text, images with Sinhala captions, audio with Sinhala narration]]) must support Sinhala.

### 2. Content Consumption (Student)

- Sinhala text renders correctly in all [[Learn Component|Learn]] and [[Evaluate Component|Evaluate]] blocks.
- Sinhala fonts are legible and aesthetically consistent with the [[Design System]].
- Audio playback of Sinhala narration is clear.

### 3. Platform UI

- UI labels, buttons, notifications, and error messages support Sinhala.
- Language toggle: students/educators can switch between English and Sinhala.
- Sinhala date/number formatting (e.g., "2026 ජූනි 3").

### 4. Database & Search

- Sinhala text stored correctly using **UTF-8** encoding.
- PostgreSQL collation supports Sinhala sorting.
- Full-text search indexes Sinhala words (may require **Elasticsearch** with an ICU plugin).

## Technical Implementation

### Fonts

| Font | Use Case | Notes |
|------|----------|-------|
| **Noto Sans Sinhala** | UI and body text | Google Fonts, excellent coverage |
| **Iskoola Pota** | Educational content | Traditional, widely recognized in schools |
| **FM Abhaya** | Headings / decorative | Popular Sri Lankan font |

> [!tip] Font Loading
> Use `font-display: swap` to prevent invisible text during load. Preload critical Sinhala font subsets.

### Encoding & Collation

```sql
-- PostgreSQL: Ensure UTF-8 and Sinhala-aware collation
CREATE DATABASE studed
  WITH ENCODING = 'UTF8'
  LC_COLLATE = 'si_LK.UTF-8'
  LC_CTYPE = 'si_LK.UTF-8';
```

> [!warning] Server Locale
> The production server must have `si_LK.UTF-8` locale installed. If not available, use `en_US.UTF-8` and handle sorting in application logic.

### Input Methods

- **Web:** Standard OS keyboard layouts (Sinhala Wijesekara / Phonetic) work in browser inputs.
- **Mobile:** Native Sinhala keyboards on Android/iOS.
- **Editor:** The [[MDX Editor]] must not intercept or break Sinhala key combinations.

### Search

- PostgreSQL's default full-text search does not handle Sinhala well.
- **Recommended:** Use **Elasticsearch** with the `analysis-icu` plugin for proper Sinhala tokenization.
- Alternatively, implement a custom trigram index (`pg_trgm`) for fuzzy matching.

## AI & Sinhala

- LLMs (like Gemini) have decent Sinhala capability but may produce unnatural phrasing.
- **Strategy:**
  - Use prompt engineering: *"Write in formal, school-appropriate Sinhala."*
  - Provide few-shot examples of high-quality Sinhala educational text.
  - Always allow educator review and editing.

## UI Checklist

- [ ] All static labels externalized into translation files (`si.json`, `en.json`).
- [ ] Dynamic content (user names, course titles) displayed in their original language.
- [ ] Right-to-left (RTL) not needed (Sinhala is LTR), but ensure no assumptions.
- [ ] Number and date formatting localized.
- [ ] Error messages translated.
- [ ] Email/SMS notifications available in Sinhala.

## Testing

- [ ] Unit tests with Sinhala Unicode strings (e.g., `ආයුබෝවන්`).
- [ ] End-to-end tests creating a full Wave in Sinhala.
- [ ] Search tests with Sinhala keywords.
- [ ] Cross-browser rendering checks (Chrome, Safari, Firefox, mobile).

## Related Notes

- [[MDX Editor]] — Where educators type Sinhala content.
- [[AI Integration]] — Generating Sinhala content with AI.
- [[Learn Component]] — Rendering Sinhala text, images, audio.
- [[Evaluate Component]] — Sinhala questions and answers.
- [[Design System]] — Typography and font choices.
- [[Database Schema]] — UTF-8 and collation setup.
