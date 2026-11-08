# The Digital Exorcist

The Digital Exorcist is a glitch art tool that runs in the browser. You load an image, stack ImageMagick effects on it, and export the result. You can also describe an effect in words, and an AI model turns that description into ImageMagick commands.

Images are processed on your machine with ImageMagick compiled to WebAssembly. They are never uploaded.

**Live version:** https://deuspoeticus.github.io/digital-exorcist/

## What it does

- **Grimoire.** A library of presets in three tiers: Sigils (basic operations), Codex (composed effects) and Spellbook (heavier rituals).
- **Ritual stack.** Every effect you apply becomes an entry in a stack. Entries can be reordered, switched off, removed, or tuned with sliders that the app builds from the command's arguments.
- **Terminal.** Type a description such as "a haunted VHS tape". If an AI model is connected, it writes the ImageMagick flags, which are validated and added to the stack.
- **Altar.** The canvas, with zoom, fit, cover, and a compare toggle that switches between the original and the result. You can drop an image onto it or click to choose one.
- **Export.** Saves the result as a JPEG at quality 90.

The app is built for desktop screens. On screens narrower than 900 pixels it shows a notice asking for a larger screen.

## AI options

AI is optional. Presets and manual editing work without it. When no model is connected, the Neural Link window shows the link as severed and typed prompts do nothing.

There are two ways to connect a model:

1. **Gemini Nano, on your device.** Desktop Chrome 148 or newer includes this model. It is free and nothing leaves your machine. The first use needs a one-time download of a few gigabytes, which you can start from the Neural Link window or the setup page.
2. **Claude Haiku 5.5, with your own Anthropic API key.** Paste a key into the Neural Link window. The key is stored only in that browser. Your prompt text is sent to Anthropic and billed to your key. Images are not sent.

If both are available, Gemini Nano is used.

See [SETUP_AI.md](SETUP_AI.md) for setup details and troubleshooting.

## Running it locally

You need Node.js 20 or newer.

```bash
git clone https://github.com/deuspoeticus/digital-exorcist.git
cd digital-exorcist
npm install
npm run dev
```

Other commands:

| Command | Purpose |
| --- | --- |
| `npm test` | Unit tests (Vitest) for the parser, validator, sanitizer, command splitter and effect stack |
| `npm run check` | Type check |
| `npm run build` | Static build into `build/` |

For a build that will be served from a subpath, set `BASE_PATH`, for example `BASE_PATH=/digital-exorcist npm run build`.

## Deployment

The site is a static build hosted on GitHub Pages. The workflow in `.github/workflows/deploy.yml` builds and publishes it on every push to `main`. In the repository settings, Pages must use **GitHub Actions** as its source.

## How it is built

- **SvelteKit** with the static adapter. There is no server.
- **wasm-imagemagick** runs ImageMagick inside a Web Worker. This library is old and no longer maintained, but it accepts real ImageMagick command lines, which the terminal, the presets and the AI output all depend on. Its files are kept in `static/` so the build does not depend on the package layout.
- **Validator and sanitizer.** AI output is checked against an allowlist of flags and argument values before it runs. The sanitizer sets the input and output files, so a command cannot choose its own.
- **Fonts** are served from the site itself, so the page makes no requests to font services.

Main folders:

| Path | Contents |
| --- | --- |
| `src/routes` | The editor page and the setup page |
| `src/lib/components` | Windows, panels and the canvas |
| `src/lib/ai` | Gemini Nano and Claude clients, prompt, allowlist and validator |
| `src/lib/workers` | The ImageMagick worker and the command sanitizer |
| `src/lib/effects` | Parser that turns commands into editable parameters |
| `tests` | Unit tests |

See [ROADMAP.md](ROADMAP.md) for known issues and planned work.

## Acknowledgments

- [knicknic/wasm-imagemagick](https://github.com/knicknic/wasm-imagemagick) for the ImageMagick WebAssembly build that the whole tool runs on.
- [Geist](https://vercel.com/font) by Vercel, the [IM Fell types](https://iginomarini.com/fell/) digitized by Igino Marini, and [UnifrakturMaguntia](https://unifraktur.sourceforge.net/maguntia.html), all under the SIL Open Font License.

## License

MIT. See [LICENSE](LICENSE).
