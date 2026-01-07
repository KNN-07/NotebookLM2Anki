# PROJECT KNOWLEDGE BASE

**Generated:** 2026-01-07T13:42:00Z
**Commit:** 30f5a0d
**Branch:** main

## OVERVIEW

Chrome Extension (MV3) that exports Quizzes and Flashcards from Google NotebookLM to Anki via AnkiConnect, .apkg file, or CSV. Build-less architecture using vanilla ES Modules with vendored dependencies.

## STRUCTURE

```
NotebookLM2Anki/
├── manifest.json        # Extension config (version, permissions, entry points)
├── src/
│   ├── background/      # Service worker: AnkiConnect API, offscreen orchestration
│   ├── content/         # Page injection: data mining from iframes, UI button
│   ├── popup/           # Extension popup: export UI and controls
│   ├── lib/             # Shared utilities: extraction, APKG generation, CSV
│   ├── offscreen/       # WASM sandbox: sql.js for .apkg SQLite creation
│   └── templates/       # Anki note type definitions (Quiz 15-field, Flashcard 2-field)
├── vendor/              # Bundled third-party: sql.js, jszip, FileSaver, genanki
└── icons/               # Extension icons (16/32/48/128px)
```

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| Add export format | `src/popup/popup.js`, `src/background/background.js` | Add button + handler |
| Change card styling | `src/background/background.js` (lines 95-105) | QUIZ_STYLING, FLASHCARD_STYLING constants |
| Fix extraction | `src/lib/extractor.js`, `src/content/content.js` | Check `data-app-data` parsing paths |
| Modify note fields | `src/lib/constants.js` | QUIZ_FIELDS (15), FLASHCARD_FIELDS (2) |
| Update card templates | `src/templates/*.js` | getQuizModel(), getFlashcardModel() |
| APKG generation | `src/lib/apkg-generator.js`, `src/offscreen/offscreen.js` | Uses sql.js WASM |
| AnkiConnect logic | `src/background/background.js` | ankiRequest(), ensureQuizModel() |
| UI button injection | `src/content/content.js` | createExportButton(), CONFIG.ANCHOR_SELECTORS |

## ARCHITECTURE

```
[NotebookLM Page]
       │
       ▼ (content.js injects button, mines data from data-app-data)
[Content Script] ──postMessage──> [Iframe Miner]
       │
       ▼ chrome.runtime.sendMessage
[Background Service Worker]
       │
       ├──> AnkiConnect (HTTP POST to 127.0.0.1:8765)
       │
       └──> Offscreen Document (WASM sandbox for .apkg)
                    │
                    └──> sql.js + genanki.js → SQLite .anki21 → ZIP → .apkg
```

## CONVENTIONS

### Code Style
- 2-space indentation, no build step, native ES Modules
- JSDoc comments on exports, camelCase naming

### Math Notation
- `$$...$$` → `\[...\]`, `$...$` → `\(...\)` via `cleanMath()` in background.js/utils.js

### Deck Naming
- Parent deck: `NotebookLM`
- Subdeck format: `NotebookLM::NotebookTitle`
- `::` in titles sanitized to ` - ` to prevent accidental nesting

## ANTI-PATTERNS (THIS PROJECT)

| Don't | Why | Instead |
|-------|-----|---------|
| Use `::` in deck names | Reserved for Anki subdeck hierarchy | Use ` - ` separator |
| Add npm/package.json | Build-less architecture | Vendor libs in `/vendor` |
| Modify field count without Anki update | Causes silent export failures | Update both constants + Anki note type |
| Use `as any` / type suppressions | No TypeScript, but apply same discipline | Fix actual issues |
| Touch cross-origin iframes | Will throw, already try-caught | Skip silently |

## DATA EXTRACTION

NotebookLM stores state in `[data-app-data]` attribute on `app-root`. Data structure is unstable:

```javascript
// Quiz locations (check in order):
data.quiz                         // Primary
data.mostRecentQuery.quiz         // Fallback

// Flashcard location:
data.flashcards                   // Array of {f: "front", b: "back"}
```

**Gotcha**: Google may change internal structure. If extraction breaks, check these paths first.

## MESSAGING PROTOCOL

| Direction | Action | Payload |
|-----------|--------|---------|
| Content → Background | `sendBatchToAnki` | `{batchData, deckTitle}` (legacy quiz) |
| Content → Background | `sendToAnki` | `{data, deckName, type}` (unified) |
| Popup → Background | `checkAnki` | - |
| Popup → Background | `generateApkg` | `{data, deckName}` |
| Iframe → Parent | `ANKI_MINER_READY` | - |
| Iframe → Parent | `ANKI_REAL_SUCCESS` | `{count, deck, type}` |

## COMMANDS

```bash
# Development (no build needed)
# 1. Go to chrome://extensions/
# 2. Enable Developer mode
# 3. Load unpacked → select this folder

# Release (automatic via GitHub Actions on manifest.json version bump)
# Just increment version in manifest.json and push to main
```

## PERMISSIONS

From `manifest.json`: `activeTab`, `storage`, `scripting`, `offscreen`
- Host: `notebooklm.google.com/*`, `*.usercontent.goog/*`, `127.0.0.1:8765/*`
- CSP: `wasm-unsafe-eval` (required for sql.js)

## VENDOR LIBRARIES

| Library | Purpose | Notes |
|---------|---------|-------|
| sql.js | SQLite in WASM | Creates .anki21 database |
| jszip.min.js | ZIP creation | Packages media + DB into .apkg |
| FileSaver.min.js | File downloads | Triggers browser download |
| genanki.js | Anki deck generation | Model/Deck/Note abstractions |

**Do not npm install these.** Vendor manually.

## KNOWN ISSUES

1. **Race condition**: "Wait for page to fully load" alert if button clicked before Miner ready
2. **Global pollution**: sql.js adds to global namespace (vendored, can't easily fix)
3. **Legacy vs new format**: Quiz uses `sendBatchToAnki`, flashcards use `sendToAnki` - not unified
4. **Template errors silenced**: `try-catch` blocks in templates log but don't surface errors

## RELEASE PROCESS

1. Bump `version` in `manifest.json`
2. Push to `main`
3. GitHub Actions detects version change → builds .zip and .crx → creates GitHub Release

**Manual release**: Use `workflow_dispatch` with optional version override.