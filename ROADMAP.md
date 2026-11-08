# Roadmap

Last updated: November 2026.

## Current state

The app is deployed at https://deuspoeticus.github.io/digital-exorcist/ and works for its core purpose: loading an image, building a stack of ImageMagick effects, tuning them and exporting the result.

Working:

- ImageMagick (WebAssembly) in a Web Worker, also under the GitHub Pages subpath.
- Grimoire presets, the ritual stack with reordering, toggles, parameter sliders, undo and clear.
- Terminal prompts through Gemini Nano (on device) or Claude Haiku 5.5 (user's own key).
- In-app Gemini Nano setup: detection, a download button with progress, and a diagnostics page.
- Draggable windows that stay inside the viewport, a desktop-only notice for small screens, and drag and drop.
- Automatic deployment to GitHub Pages on every push to `main`.
- Unit tests for the parser, validator, sanitizer, command splitter and effect stack, run in CI.

## Next

Ordered by priority.

1. **Better export.** Add PNG export, since JPEG compression blurs hard pixel edges. Confirm that export uses the full loaded resolution.
2. **Browser tests in CI.** Turn the manual headless Chrome checks into a Playwright suite: the worker under the Pages subpath, presets, the stack, the glitch state, and both AI paths with mocked APIs.
3. **Save and share rituals.** Store a stack under a name in the browser, and encode it in the URL so it can be shared as a link without a server.
4. **Animated export.** Render a ritual over several frames with varying parameters and export it as GIF or WebM.
5. **Heresy mode.** An optional switch that sends AI output to ImageMagick without validation, so failed and partial renders become visible.
6. **Image-aware prompts.** Let the model see a thumbnail of the image. This stays local with Gemini Nano. With Claude, the image would be sent to Anthropic, so it would need to be opt-in.
7. **Faster tuning.** Cache the output of each stack step so that changing a late step does not rerun the whole stack.

## Known issues

- **Gemini Nano download can stall.** On at least one Linux laptop that met every requirement, Chrome reported "Foreground Installing" at 0% and never downloaded. The cause is inside Chrome and has not been found. See `SETUP_AI.md` for diagnostics.
- **Unverified Nano details.** The download progress handling and the fallback that retries session creation without `temperature` and `topK` were tested against a mocked API only.
- **Leftover cloud route.** `src/routes/api/ai/+server.ts` and the cloud fallback in `src/lib/ai/gemini.ts` are no longer used by the deployed site. They are only reached if a Gemini Nano session fails during a prompt, and then the request fails and a random preset is applied. The route also refers to a retired Gemini model. It should be removed.
- **Old ImageMagick.** `wasm-imagemagick` bundles ImageMagick 7.0.x from 2019 and is unmaintained. Newer operators are missing.
- **Large images.** Images are capped at 3840 pixels on the long side. Long stacks on large images can take several seconds, and the processing effect may stutter.
- **Duplicate `-alpha opaque`.** The stack runner appends `-alpha opaque` to commands that already end with it. It is harmless but adds noise.

## Decisions

These choices are deliberate and should stay unless the goals change.

- **ImageMagick command lines.** The project keeps `wasm-imagemagick` because it runs real command lines. The maintained `@imagemagick/magick-wasm` package only offers an object API, which would break the terminal, the presets and the AI output.
- **Unpredictable output is part of the design.** The AI is allowed to produce strange or partly broken commands. Fixes should target broken plumbing and leave the randomness of the results alone.
- **Desktop only.** Small screens get a notice asking for a larger screen. There is no mobile layout.
- **No server.** Everything runs in the browser. Features that would need a server, such as a public gallery, are out of scope.
- **Visual language.** Ink and bone colours with one red accent. IM Fell for names and labels, Geist Mono for data and commands, blackletter only for the wordmark, and the pixel font only during processing. 3D and glitch effects are limited to small details and the processing state.
