# Connecting an AI model

The Digital Exorcist can turn a written description into ImageMagick commands. For that it needs a language model. There are two options, and the app works without either of them.

The Neural Link window shows which model is connected. The setup page (the "Setup guide" link in that window) checks your browser and device and can start the Gemini Nano download.

## Option 1: Gemini Nano, on your device

Gemini Nano is a small model built into desktop Chrome. It runs locally, costs nothing, and your prompts stay on your machine.

### Requirements

- Desktop Chrome 148 or newer on Windows, macOS, Linux or a Chromebook Plus. Mobile Chrome does not include it.
- Enough free disk space. Chrome asks for about 20 GB free on the drive that holds your Chrome profile, although the model itself is a few gigabytes.
- A capable device. Chrome checks the graphics card and memory before allowing the download. On one tested laptop, Chrome required 3 GB of video memory.
- An unmetered internet connection for the download.

### Setup

1. Open the app in Chrome.
2. If the Neural Link window shows **Summon Gemini Nano**, click it. Chrome only starts the download after a click, which is why this step cannot be automatic.
3. Keep the tab open while the progress bar fills. When it finishes, the Neural Link window shows Gemini Nano as ready.

You only do this once. Chrome keeps the model and shares it between sites.

### If the download does not start

Open `chrome://on-device-internals` in a new tab. It shows whether your device qualifies and the state of each model file.

- **A criterion shows `false`.** Your device does not qualify. On weak hardware you can override the check by setting `chrome://flags/#optimization-guide-on-device-model` to **Enabled BypassPerfRequirement** and relaunching Chrome. Expect slow responses.
- **The `nano_v3_gpu_component` asset stays at "Foreground Installing" and 0%.** Chrome has accepted the request but is not downloading. Quit Chrome completely (on Linux it keeps running in the background, so use `pkill chrome` or the Exit menu item), open it again, and click Summon again. This has not always been enough. If it stays at 0%, launching Chrome from a terminal with verbose logging can show the reason:

  ```bash
  google-chrome --enable-logging=stderr \
    --vmodule='*on_device_model*=2,*optimization_guide*=2,*component_updater*=2' \
    > ~/chrome-nano.log 2>&1 &
  ```

- **Chrome reports the model as available but the app does not connect.** Reload the page. The app checks availability when it starts.

## Option 2: Claude Haiku 5.5, with your own API key

If Gemini Nano is not available, you can use Claude Haiku 5.5 through your own Anthropic API key.

1. Create a key in the [Anthropic Console](https://console.anthropic.com/).
2. In the Neural Link window, open **Bind an Anthropic key**, paste the key, and click **Bind**. The app checks the key with a request that uses no tokens.
3. Type a description in the terminal.

What to know:

- **Cost.** Each prompt is billed to your key at Anthropic's standard rates. A prompt is short, so each one costs a small fraction of a cent.
- **Privacy.** Your prompt text is sent to Anthropic. Images are not sent.
- **Storage.** The key is kept in that browser's local storage and is sent only to Anthropic. **Sever uplink** removes it.
- **Shared computers.** Anyone using the same browser profile can use the stored key. Sever the uplink when you are done.

If Gemini Nano becomes available later, the app uses it first and keeps your key as a fallback.
