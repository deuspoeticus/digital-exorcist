# The Digital Exorcist

Digital Exorcist is a web-based, privacy-first image manipulation toolkit. It blends the raw power of **ImageMagick WASM** with the interpretative capabilities of **Gemini AI**, creating a unique "Vibe" engine for image editing entirely within your browser. 

No images are uploaded to any server. All processing happens locally on your machine.

## Features
- **Local ImageMagick:** Non-blocking Web Worker integration of ImageMagick via WASM.
- **Vibe Engine (Gemini):** Type what you want (e.g., "make it look like a cursed VHS tape") and the AI generates the precise ImageMagick commands to achieve it.
- **The Altar:** A node-based/stack-based UI to layer, reorder, and tweak effects continuously.
- **The Grimoire:** A preset system for quick access to standard (and non-standard) digital corruptions.
- **Privacy First:** Your images never leave your browser tab. 

## Prerequisites
- Node.js (v18+)
- A modern browser (Chrome 128+ recommended for local AI features).

## Quickstart

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/digital-exorcist.git
   cd digital-exorcist
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```

## AI Configuration (Optional but Recommended)

By default, Digital Exorcist can use a cloud-based Gemini API key if provided. However, to maintain absolute privacy, it is designed to use Chrome's experimental **Gemini Nano (`window.ai`)**.

### Using Local Gemini Nano (`window.ai`)
This requires Chrome Canary or the Dev build.

1. Go to `chrome://flags`.
2. Enable: `Enables optimization guide on device` (Set to "Enabled BypassPerfRequirement").
3. Enable: `Prompt API for Gemini Nano`.
4. Relaunch Chrome.
5. Go to `chrome://components` and ensure **Optimization Guide On Device Model** is fully downloaded.
6. Open the browser console and test: `await window.ai.languageModel.capabilities()`. It should return `{ available: "readily" }`.

### Using Cloud Gemini API (Fallback)
If you cannot use `window.ai`, you can provide a standard API key:
1. Copy the example env file: `cp .env.example .env`
2. Add your key: `VITE_GEMINI_API_KEY="your_api_key_here"`

## Development & Roadmap
See `ROADMAP.md` for current progress and architectural plans.

## Acknowledgments
This project is built upon incredible open-source tools. Special thanks to:
- [knicknic/wasm-imagemagick](https://github.com/knicknic/wasm-imagemagick) - This repository enables the core functionality of Digital Exorcist by porting ImageMagick to WebAssembly, allowing non-blocking, client-side image processing.

## License
MIT License. See `LICENSE` for more information.
