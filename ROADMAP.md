# Digital Exorcist: Technical Roadmap & Beta Status

> **Status:** Pre-Alpha  
> **Version:** 0.0.1  
> **Last Updated:** 2026-02-19

## 1. Project Overview & Achievements
Scale: 0% ———|— 40% —————— 100% (Beta)

We are approximately **40% complete** towards a functional Beta. The core engine and aesthetics are solid, but user persistence and fine-grained controls are missing.

### ✅ Achieved Milestones
*   **Core Architecture**
    *   [x] **SvelteKit + Vite** project structure initialized.
    *   [x] **ImageMagick WASM** integrated via Web Worker (`MagickBridge`) for non-blocking UI.
    *   [x] **Gemini AI Integration** for prompt-to-command ("Vibe") generation.
    *   [x] **Command Parser** (`parser.ts`) to deconstruct IM commands into UI-editable sliders.
*   **User Interface (The "Altar")**
    *   [x] **Draggable Window System** implemented (`DraggableWindow.svelte`) for modular tools.
    *   [x] **Terminal Component** for direct CLI interaction and logs.
    *   [x] **Canvas Rendering** with zoom/pan support (`Altar.svelte`).
    *   [x] **Preset System** ("Grimoire") with categorization (Sigils, Codex, Spellbook).
*   **Design System**
    *   [x] **"Astral Glitch" Theme:** Consistent use of `Geist Mono`, neon colors (`--color-cyan`, `--color-magenta`), and glassmorphism.
    *   [x] **Relative Units:** comprehensive migration to `rem` for scalability.

---

## 2. Technical Architecture (Current State)

### Data Flow
1.  **Input:** User drags image -> `processImageToRaw()` -> `currentRawImage` (Store).
2.  **Processing:**
    *   **Manual:** User adjusts slider -> `updateEntryEffects()` -> `appStore`.
    *   **AI:** User types prompt -> Gemini API -> `validateCommand` -> `pushEntry()`.
3.  **Execution:** `buildStackCommand()` constructs the full CLI string -> sent to `worker.ts` via `MagickBridge`.
4.  **Output:** Worker returns `ImageBitmap` -> Painted to `<canvas>` in `Altar.svelte`.

### Key Files
*   **State:** `src/lib/stores/appStore.ts` (Central source of truth for stack, image, logs).
*   **Logic:** `src/lib/effects/parser.ts` (Regex-based command parsing).
*   **Worker:** `src/lib/workers/bridge.ts` (Typed wrapper around the IM worker).
*   **Config:** `src/lib/ai/config.ts` (System prompts, allowed flags, presets).

---

## 3. Architecture & Refactoring (Optimization Phase) 🔧
*Goal: Decouple the monolithic `+page.svelte` and ensure type safety.*

### Current Issues identified
1.  **Monolithic Controller:** `src/routes/+page.svelte` handles too much: UI layout, file I/O, AI orchestration, and worker events.
2.  **Type Looseness:** `bridge.ts` uses `any` for worker messages, bypassing strict type checks.
3.  **Redundant Logic:** Canvas drawing code is duplicated between initialization and "show original".

### Target Architecture
*   **View Layer (Svelte):** Purely reactive. Components (`Altar`, `Terminal`) subscribe to `appStore` and dispatch simple events.
*   **State Layer (Stores):** `appStore` holds all UI state. `auditStore` holds metrics.
*   **Service Layer (The "Brain"):**
    *   **`AiAgent` (New):** Encapsulates the "User Prompt -> Gemini -> Validator -> Stack Push" workflow.
    *   **`MagickBridge`:** Existing worker wrapper, to be typed strictly.
    *   **`FileHandler` (New):** Abstraction for loading files and extracting raw data.
*   **Engine Layer (Worker):** `magick.worker.ts` executing WASM commands.

### Optimization Plan
*   [ ] **Refactor `+page.svelte`:** Move `onTerminalCommand` logic to `lib/services/aiAgent.ts`.
*   [ ] **Strict Typing:** Define `WorkerMessage` types in `bridge.ts` to remove `as any`.
*   [ ] **Utility Extraction:** Move canvas operations to `lib/utils/canvas.ts`.
*   [ ] **CSS Cleanup:** Verify generic tokens in `app.css` and remove unused specific class overrides.

---

## 4. Beta Roadmap (The Path Forward)

### Phase 1: The Grimoire (Persistence) 🚧 **HIGH PRIORITY**
*Goal: Enable users to save, load, and share their ritual stacks.*

#### Technical Implementation
1.  **Store Enhancements (`appStore.ts`):**
    *   Implement `localStorage` syncing for a `savedRituals` array.
    *   Create a `Ritual` interface: `{ id: string, name: string, date: number, stack: StackEntry[] }`.
2.  **UI Components:**
    *   **Save Action:** Add "Save Ritual" button to `RitualContent` header.
    *   **Library View:** Update `GrimoireContent.svelte` to list "User Rituals" with delete/load actions.
3.  **Serialization:**
    *   Ensure `StackEntry` objects are JSON-safe (strip runtime-only state if any).

### Phase 2: Arcane Controls (Advanced Inputs) 🛠
*Goal: Provide surgical control over parameters beyond simple sliders.*

#### Technical Implementation
1.  **New Component: `ParameterInput.svelte`**
    *   **Number:** Combined slider + text input for precise values. Support "infinite" ranges for flags like `-evaluate` (0.1 to 100+).
    *   **Color:** Hex input + visual color picker for flags like `-fill`, `-tint`.
    *   **Select:** Dropdowns for restricted enums (e.g., `-compose` methods, `-morphology` kernels) defined in `config.ts`.
2.  **Refactor `EffectStack.svelte`:**
    *   Replace the generic `<input type="range">` loop with specific `ParameterInput` instances based on the effect type.
3.  **Command Parser Update:**
    *   Update `parser.ts` to correctly identify and type these arguments (e.g., distinguishing a color argument from a numeric one).

### Phase 3: Polish & "Juice" ✨
*Goal: Elevate the sensory experience.*

1.  **Audio Feedback:**
    *   Implement `src/lib/utils/audio.ts` for UI sounds (hover clicks, processing hum, completion chime).
2.  **Visual Feedback:**
    *   Add "Processing" states to individual stack items.
    *   Error handling: Visual red flash on stack entries that cause IM errors.
3.  **Export Options:**
    *   Implement "Export at Original Resolution" (currently processes at preview size).
    *   Add "Copy Command" button to clipboard.

---

## 4. Known Issues / Debt
*   **Mobile Support:** The draggable window layout is desktop-only. Need a stack-based mobile layout or a "desktop only" warning.
*   **Performance:** Large stacks (>10 effects) on high-res images may block the worker too long. Need to investigate chunked processing or progress reporting.
*   **Parser Fragility:** The regex parser works for documented presets but may fail on complex, nested commands generated by AI.
