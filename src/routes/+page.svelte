<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { sanitizeCommand } from "$lib/workers/sanitizer";
  import { MagickBridge } from "$lib/workers/bridge";
  import { aiAgent } from "$lib/services/aiAgent";
  import { fileHandler } from "$lib/services/fileHandler";
  import { drawToCanvas } from "$lib/utils/canvas";
  import {
    imageUrl,
    currentRawImage,
    isProcessing,
    status,
    isAiReady,
    logs,
    addLog,
    pushEntry,
    clearStack,
    buildStackCommand,
    lastProcessedStack,
    effectStack,
  } from "$lib/stores/appStore";

  // Components
  import Altar from "$lib/components/Altar.svelte";
  import AiWarning from "$lib/components/AiWarning.svelte";

  // New Layout Components
  import DraggableWindow from "$lib/components/ui/DraggableWindow.svelte";
  import GrimoireContent from "$lib/components/GrimoireContent.svelte";
  import RitualContent from "$lib/components/RitualContent.svelte";
  import FileInfo from "$lib/components/FileInfo.svelte";
  import Terminal from "$lib/components/Terminal.svelte";
  import ExportContent from "$lib/components/ExportContent.svelte";

  let canvasRef: HTMLCanvasElement;
  let debounceTimer: ReturnType<typeof setTimeout>;

  let currentFilename: string | null = null;
  let windowWidth = 1200;
  let grimoireHeight = 0;
  let fileInfoHeight = 0;

  // ─── Worker Bridge ──────────────────────────────────────────────────
  const bridge = new MagickBridge({
    onDone({ bitmap, width, height }, elapsedMs) {
      if (canvasRef) {
        canvasRef.width = width;
        canvasRef.height = height;
        const ctx = canvasRef.getContext("2d");
        if (ctx) ctx.drawImage(bitmap, 0, 0);
      }
      addLog(`[Worker] Done in ${elapsedMs}ms`);
      $status = "Done!";
      $isProcessing = false;
    },
    onExportDone({ blob }) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ritual_export_${Date.now()}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      addLog("[System] Export complete.");
      $status = "Exported!";
      $isProcessing = false;
    },
    onAuditDone({ result }) {
      console.group("🧙‍♂️ Digital Exorcist: Engine Audit");
      console.log(result);
      console.groupEnd();
      addLog("[System] Audit complete. Check console.");
      $status = "Audit Done!";
      $isProcessing = false;
    },
    onError(error) {
      addLog(`[Error] Worker: ${error}`);
      $status = "Error!";
      $isProcessing = false;
    },
  });

  bridge.setRunRitual(runStack);

  // lifecycle
  onMount(async () => {
    $status = "Ready";
    addLog("[System] WASM Engine: READY ✦");

    bridge.create();
    await aiAgent.init();
  });

  onDestroy(() => {
    bridge.terminate();
    clearTimeout(debounceTimer);

    if ($imageUrl && $imageUrl.startsWith("blob:")) {
      URL.revokeObjectURL($imageUrl);
    }
  });

  // ─── Stack-Based Processing ─────────────────────────────────────────

  /** Build the full command from the stack and send to WASM */
  function runStack() {
    if (!$currentRawImage) {
      addLog("[Error] No image loaded yet.");
      return;
    }

    const command = buildStackCommand();
    if (!command.trim()) {
      // Empty stack — show original image
      showOriginal();
      return;
    }

    $isProcessing = true;
    $status = "Processing...";

    // Force alpha opaque at the end to ensure consistency since we hid it from the stack
    const fullCommand = sanitizeCommand(
      command + " -alpha opaque",
      $currentRawImage.width,
      $currentRawImage.height,
    );
    addLog(`[Worker] ${fullCommand}`);

    bridge.process(command + " -alpha opaque", $currentRawImage);

    // Save current stack state as "processed"
    lastProcessedStack.set(JSON.stringify($effectStack));
  }

  /** Show the original unprocessed image */
  function showOriginal() {
    if (!$currentRawImage || !canvasRef) return;
    drawToCanvas(canvasRef, $currentRawImage);
    $status = "Ready";
  }

  /** Debounced re-process after stack mutation */
  function onStackChanged() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      if (!$currentRawImage) return;
      runStack();
    }, 200);
  }

  // ─── Event Handlers ─────────────────────────────────────────────────

  async function onTerminalCommand(e: CustomEvent<string>) {
    if ($isProcessing) return;

    if (!$currentRawImage) {
      addLog("[Error] No image loaded. Upload one first.");
      return;
    }

    const vibe = e.detail;
    addLog(`[User] ${vibe}`);

    try {
      await aiAgent.processVibe(vibe);
      runStack();
    } catch (err) {
      // Log handled in AiAgent
    }
  }

  function onPushPreset(e: CustomEvent<{ label: string; command: string }>) {
    if ($isProcessing || !$currentRawImage) return;
    const { label, command } = e.detail;
    addLog(`[Preset] Pushing: ${label}`);
    pushEntry(label, command, "preset");
    runStack();
  }

  async function onFileSelected(e: CustomEvent<File>) {
    try {
      const file = e.detail;
      currentFilename = file.name;
      // Use FileHandler
      await fileHandler.loadFile(file);

      // Render the PROCESSED image (downscaled) to the canvas, not original
      // This ensures canvas dimensions match $currentRawImage dimensions used by fitView
      if ($currentRawImage && canvasRef) {
        drawToCanvas(canvasRef, $currentRawImage);
      }
    } catch (err) {
      // Log handled in fileHandler
    }
  }

  function onExport() {
    if ($isProcessing || !$currentRawImage) return;
    $isProcessing = true;
    $status = "Exporting...";
    addLog("[System] Starting High-Quality Export...");
    const command = buildStackCommand() || "-negate";
    bridge.export(command, $currentRawImage);
  }

  function onAudit() {
    if ($isProcessing) return;
    $isProcessing = true;
    $status = "Auditing...";
    addLog("[System] Running Engine Audit...");
    bridge.audit();
  }

  function onClear() {
    fileHandler.clear();
    currentFilename = null;
    if (canvasRef) {
      const ctx = canvasRef.getContext("2d");
      ctx?.clearRect(0, 0, canvasRef.width, canvasRef.height);
    }
    $status = "Ready";
  }
</script>

<svelte:window bind:innerWidth={windowWidth} />

<div class="desktop">
  <!-- Background / Altar -->
  <div class="altar-layer">
    <Altar bind:canvasRef on:fileSelected={onFileSelected} />
  </div>

  <!-- Left Window: File Info -->
  <DraggableWindow
    title="FILE INFO"
    bind:height={fileInfoHeight}
    initialPosition={{ x: 30, y: 30 }}
    className="window-file-info"
  >
    <FileInfo
      hasImage={!!$currentRawImage}
      rawImage={$currentRawImage}
      filename={currentFilename}
      on:audit={onAudit}
      on:clear={onClear}
    />
  </DraggableWindow>

  <DraggableWindow
    title="EXPORT"
    initialPosition={{ x: 30, y: 30 + fileInfoHeight + 30 }}
    className="window-export"
  >
    <ExportContent on:export={onExport} />
  </DraggableWindow>

  <!-- Right Windows: Grimoire & Ritual -->
  <DraggableWindow
    title="GRIMOIRE"
    bind:height={grimoireHeight}
    initialPosition={{ x: windowWidth - 350, y: 30 }}
    className="window-grimoire"
  >
    <GrimoireContent
      disabled={$isProcessing || !!!$currentRawImage}
      on:pushPreset={onPushPreset}
    />
  </DraggableWindow>

  <DraggableWindow
    title="RITUAL STACK"
    initialPosition={{ x: windowWidth - 350, y: 30 + grimoireHeight + 30 }}
    className="window-ritual"
  >
    <RitualContent
      disabled={$isProcessing || !!!$currentRawImage}
      on:export={onExport}
      on:audit={onAudit}
      on:stackChanged={onStackChanged}
    />
  </DraggableWindow>

  <div class="terminal-layer">
    <div class="terminal-wrapper">
      <div class="noise-overlay"></div>
      <Terminal
        logs={$logs}
        isProcessing={$isProcessing}
        on:command={onTerminalCommand}
      />
    </div>
  </div>

  <AiWarning />
</div>

<style>
  :global(body, html) {
    height: 100%;
    margin: 0;
    overflow: hidden;
    background-color: var(--bg-void);
    color: var(--text-bright);
    font-family: var(--font-pixel);
  }

  .desktop {
    position: relative;
    width: 100vw;
    height: 100vh;
    overflow: hidden;
    background: var(--bg-void);
  }

  .altar-layer {
    position: absolute;
    inset: 0;
    z-index: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }

  /* Specific window sizing overrides can go here via globals if needed, 
     but mostly handled by content */

  :global(.window-grimoire),
  :global(.window-ritual) {
    width: 320px;
  }

  :global(.window-file-info),
  :global(.window-export) {
    width: 280px;
  }

  .terminal-layer {
    position: absolute;
    bottom: 2rem;
    left: 50%;
    transform: translateX(-50%);
    width: 60%;
    max-width: 800px;
    min-width: 400px;
    z-index: 60;
    pointer-events: none;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    /* Allow expansion up to 50% of screen */
    height: 50vh;
  }

  .terminal-wrapper {
    position: relative;
    pointer-events: auto;
    width: 100%;
    height: auto;
    min-height: 48px; /* Height of the input bar */
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    overflow: visible; /* Let the ghost log float above */
  }

  .noise-overlay {
    position: absolute;
    inset: 0;
    pointer-events: none;
    opacity: 0.05;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
    z-index: 1;
  }
</style>
