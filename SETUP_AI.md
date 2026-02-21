# Troubleshooting `window.ai`

`window.ai` (Gemini Nano) is an **experimental feature** in Chrome. It is NOT enabled by default.

## 1. Requirements
- **Browser**: Chrome Canary (version 128+) or Chrome Dev.
- **OS**: standard desktop OS (Windows, macOS, Linux).
- **Disk Space**: At least 22GB free (for model download).

## 2. Enable Flags
Go to `chrome://flags` and set the following:
1.  `Enables optimization guide on device`: **Enabled BypassPerfRequirement**
2.  `Prompt API for Gemini Nano`: **Enabled**

**Relaunch Chrome** after changing these.

## 3. Download the Model
1.  Go to `chrome://components`.
2.  Look for **Optimization Guide On Device Model**.
    - If you *don't* see it, verify the flags above.
    - If it says `Version: 0.0.0.0`, click **Check for update**.
3.  Wait for it to download (it can take a while). When it shows a version number (e.g., `2024.5.21.1031`), it is ready.

## 4. Verification
Open the DevTools Console (F12) on any page and type:
```javascript
await window.ai.languageModel.capabilities()
```
It should return `{ available: "readily" }` (or `"after-download"`).
