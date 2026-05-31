<div align="center">
  <img src="icons/favicon.svg" width="80" height="80" alt="FeedDoc logo" />

# FeedDoc

**Slice documents into focused, AI-ready segments directly from a Chrome side panel.**

FeedDoc is a browser extension for turning long PDFs, PowerPoint decks, and Word documents into smaller files that are easier to attach to AI chats. Pick the exact page or slide ranges you need, generate one or many clean segments, and feed them into ChatGPT, Claude, Grok, or T3 Chat without leaving the conversation.

[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=061016)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)](https://vite.dev/)
[![Chrome Extension](https://img.shields.io/badge/Chrome_Extension-MV3-4285F4?logo=googlechrome&logoColor=white)](https://developer.chrome.com/docs/extensions/)
[![pdf-lib](https://img.shields.io/badge/pdf--lib-PDF_slicing-EF4444)](https://pdf-lib.js.org/)
[![PDF.js](https://img.shields.io/badge/PDF.js-page_detection-FF7139?logo=mozilla&logoColor=white)](https://mozilla.github.io/pdf.js/)
[![JSZip](https://img.shields.io/badge/JSZip-Office_archives-F7DF1E)](https://stuk.github.io/jszip/)
[![Mammoth](https://img.shields.io/badge/Mammoth-DOCX_tools-3B82F6)](https://github.com/mwilliamson/mammoth.js)
[![License: MIT](https://img.shields.io/badge/License-MIT-00FF9F.svg)](LICENSE.txt)

</div>

---

## Product preview

https://github.com/user-attachments/assets/6e79e026-009b-42d1-8a83-c9c67bcff000

---

## Why FeedDoc exists

AI chat file uploads are most useful when the attachment is focused. Full documents often include pages, slides, appendices, or sections that are irrelevant to the prompt. FeedDoc keeps the workflow simple:

1. Open the side panel while you are on a supported AI chat.
2. Drop in a PDF, PPTX, or DOCX file.
3. Define one or more page/slide ranges.
4. Slice the document locally in the browser.
5. Feed the resulting segments into the active chat or download them for later.

The result is a lightweight document-prep layer between your source files and your AI assistant.

---

## Core features

### Multi-format document slicing

- **PDF** — detects total page count with PDF.js and creates focused PDF outputs with pdf-lib.
- **PPTX** — reads the Office Open XML package with JSZip, keeps selected slides, updates presentation relationships, and rewrites the deck package.
- **DOCX** — estimates page boundaries from WordprocessingML page-break markers and generates a smaller DOCX from the selected range.

### Multi-segment workflow

FeedDoc is built for more than a single crop. You can create up to ten named segments from one source file, validate ranges before slicing, prevent overlapping ranges, and export every segment individually or together.

### Direct AI chat attachment

The extension detects the current tab and exposes platform-specific feed actions for:

- **ChatGPT**
- **Claude**
- **Grok**
- **T3 Chat**

Under the hood, the content script attaches generated files through the page's file input when available and falls back to drag-and-drop style events when needed.

### Local-first processing

Document slicing runs in the browser side panel. Files are read as browser `ArrayBuffer` data, sliced client-side, and only leave the browser when you explicitly feed/download/save them.

### Optional cloud library

FeedDoc can optionally connect to Supabase Storage to keep a personal library of useful originals and generated segments. Saved files can be renamed, downloaded, made permanent, deleted, or fed back into a supported AI chat from the library view.

### Large-file friendly handoff

For smaller files, the side panel sends generated file bytes directly through extension messaging. For larger payloads, FeedDoc stages the file in Chrome session storage before asking the content script to attach it, avoiding message-size issues.

### Cyberpunk side-panel UI

The interface uses a compact dark shell with neon green accents, monospaced typography, scanline texture, animated progress states, status badges, and platform-colored feed buttons designed for quick use beside an AI conversation.

---

## Supported inputs and outputs

| Source file | Range unit | Output | Notes |
| --- | --- | --- | --- |
| `.pdf` | Pages | `.pdf` | Precise page slicing with `pdf-lib`. |
| `.pptx` | Slides | `.pptx` | Keeps selected slides and rewrites slide/package relationships. |
| `.docx` | Estimated pages | `.docx` | Uses explicit/rendered page-break markers where present. |

FeedDoc enforces a **512 MB** source-file limit and warns on files above **100 MB** so the user can decide whether to continue.

---

## Supported AI platforms

| Platform | Domain detection | Feed label |
| --- | --- | --- |
| ChatGPT | `chatgpt.com` | Feed to ChatGPT |
| Claude | `claude.ai` | Feed to Claude |
| Grok | `grok.com`, `x.ai` | Feed to Grok |
| T3 Chat | `t3.chat` | Feed to T3 Chat |

Platform detection controls the active feed button and helps FeedDoc use the right selectors for the current chat UI.

---

## Design and architecture

```text
Chrome toolbar click
        │
        ▼
Manifest V3 side panel
        │
        ├── React UI: upload, segment picker, results, settings, library
        │
        ├── Format slicers
        │     ├── PDF: PDF.js + pdf-lib
        │     ├── PPTX: JSZip + Office Open XML relationship updates
        │     └── DOCX: JSZip + WordprocessingML page-break markers
        │
        ├── Storage layer
        │     ├── chrome.storage.local for settings and library metadata
        │     ├── chrome.storage.session for large in-flight attachments
        │     └── optional Supabase Storage for saved files
        │
        └── Extension messaging
              └── content script attaches generated files to AI chat pages
```

### Main moving parts

- **`sidepanel/src/App.jsx`** coordinates the upload → range selection → slicing → feed/download/save flow.
- **`sidepanel/src/components/*`** contains the focused UI pieces for uploads, segment editing, result actions, settings, and the saved-file library.
- **`sidepanel/src/slicers/*`** contains the document-format-specific slicing logic.
- **`sidepanel/src/utils/platformConfig.js`** defines supported AI platforms, MIME types, file limits, and platform detection.
- **`sidepanel/src/utils/storage.js`** wraps Chrome local storage for settings and file metadata.
- **`sidepanel/src/utils/supabase.js`** handles optional Supabase Storage upload, delete, and fetch operations.
- **`content.js`** receives generated files from the extension and attaches them to the current AI chat page.
- **`background.js`** opens the side panel and forwards active-tab URL changes to keep platform detection current.

---

## Technology stack

| Layer | Technology | Purpose |
| --- | --- | --- |
| Extension shell | Chrome Extension Manifest V3 | Side panel, tab awareness, extension messaging, storage permissions. |
| UI | React 18 | Interactive side-panel workflow and reusable controls. |
| Build system | Vite 6 | Bundles the side panel and copies extension assets into `dist/`. |
| PDF handling | PDF.js, pdf-lib | Page-count detection and PDF page extraction. |
| Office file handling | JSZip | Reads and rewrites `.pptx`/`.docx` ZIP package contents. |
| DOCX support | Mammoth dependency + WordprocessingML parsing | Supports Word-document handling in the extension stack. |
| Persistence | Chrome Storage | Saves extension settings and local library metadata. |
| Optional cloud storage | Supabase Storage REST API | Uploads, deletes, fetches, and serves saved originals/segments. |
| Styling | CSS custom properties | Neon dark theme, responsive side-panel layout, animations, and status states. |

---

## Privacy model

FeedDoc is designed as a local-first utility:

- Files are processed in the browser extension side panel.
- Generated segments are not uploaded anywhere unless you use a feed action or enable/save to cloud storage.
- Library metadata is stored in Chrome local storage.
- Optional Supabase storage is user-configured and only used when storage features are enabled.

---

## Development notes

This repository includes the extension source and a generated `dist/` build. The primary scripts are intentionally small:

```bash
pnpm install
pnpm build
```

The build copies the Manifest V3 files, background/content scripts, icons, side-panel bundle, and PDF.js worker into `dist/`.

---

## License

FeedDoc is released under the [MIT License](LICENSE.txt).
