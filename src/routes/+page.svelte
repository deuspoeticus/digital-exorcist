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
    isNeuralLinkPresent,
  } from "$lib/stores/appStore";

  // Components
  import Altar from "$lib/components/Altar.svelte";
  import DesktopOnly from "$lib/components/DesktopOnly.svelte";

  // New Layout Components
  import DraggableWindow from "$lib/components/ui/DraggableWindow.svelte";
  import GrimoireContent from "$lib/components/GrimoireContent.svelte";
  import RitualContent from "$lib/components/RitualContent.svelte";
  import FileInfo from "$lib/components/FileInfo.svelte";
  import NeuralLink from "$lib/components/NeuralLink.svelte";
  import Terminal from "$lib/components/Terminal.svelte";
  import ExportContent from "$lib/components/ExportContent.svelte";

  let canvasRef: HTMLCanvasElement;
  let debounceTimer: ReturnType<typeof setTimeout>;

  let currentFilename: string | null = null;
  let windowWidth = 1200;
  let grimoireHeight = 0;
  let fileInfoHeight = 0;
  let neuralHeight = 0;

  // Window layout: two columns of stacked windows hugging the edges.
  const EDGE = 16;
  const GAP = 12;
  const LEFT_W = 288;
  const RIGHT_W = 320;
  const DESKTOP_MIN = 900;
  // Keep the image clear of the columns when fitting it.
  const altarInsets = { left: EDGE + LEFT_W + EDGE, right: EDGE + RIGHT_W + EDGE };

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
    void fullCommand; // full CLI is built by the sanitizer inside the worker
    addLog(`[Worker] ${command}`);

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

    // No Neural Link → typed prompts do nothing (no Dum-Dum random effect,
    // no fallback command). Presets stay available from the Grimoire.
    if (!$isNeuralLinkPresent) {
      addLog("[System] Neural Link severed. The machine does not hear you.");
      return;
    }

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
    <Altar bind:canvasRef insets={altarInsets} on:fileSelected={onFileSelected} />
  </div>

  <!-- Left column -->
  <DraggableWindow
    numeral="I"
    title="Vessel"
    bind:height={fileInfoHeight}
    initialPosition={{ x: EDGE, y: EDGE }}
    className="window-left"
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
    numeral="II"
    title="Neural Link"
    bind:height={neuralHeight}
    initialPosition={{ x: EDGE, y: EDGE + fileInfoHeight + GAP }}
    className="window-left"
  >
    <NeuralLink />
  </DraggableWindow>

  <DraggableWindow
    numeral="III"
    title="Export"
    initialPosition={{ x: EDGE, y: EDGE + fileInfoHeight + GAP + neuralHeight + GAP }}
    className="window-left"
  >
    <ExportContent on:export={onExport} />
  </DraggableWindow>

  <!-- Right column -->
  <DraggableWindow
    numeral="IV"
    title="Grimoire"
    bind:height={grimoireHeight}
    initialPosition={{ x: windowWidth - RIGHT_W - EDGE, y: EDGE }}
    className="window-right"
  >
    <GrimoireContent
      disabled={$isProcessing || !$currentRawImage}
      on:pushPreset={onPushPreset}
    />
  </DraggableWindow>

  <DraggableWindow
    numeral="V"
    title="Ritual"
    initialPosition={{ x: windowWidth - RIGHT_W - EDGE, y: EDGE + grimoireHeight + GAP }}
    className="window-right"
  >
    <RitualContent
      disabled={$isProcessing || !$currentRawImage}
      on:export={onExport}
      on:audit={onAudit}
      on:stackChanged={onStackChanged}
    />
  </DraggableWindow>

  <div class="terminal-layer">
    <div class="terminal-wrapper">
      <Terminal
        logs={$logs}
        isProcessing={$isProcessing}
        on:command={onTerminalCommand}
      />
    </div>
  </div>

  <!-- Post-punk grain over everything, barely there -->
  <div class="grain" aria-hidden="true"></div>

  {#if windowWidth < DESKTOP_MIN}
    <DesktopOnly />
  {/if}
</div>

<style>
  .desktop {
    position: relative;
    width: 100vw;
    height: 100vh;
    overflow: hidden;
    background: var(--ink-0);
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

  :global(.window-left) {
    width: 18rem; /* LEFT_W */
  }

  :global(.window-right) {
    width: 20rem; /* RIGHT_W */
  }

  /* Terminal sits in the free channel between the two columns. */
  .terminal-layer {
    position: absolute;
    bottom: 1.25rem;
    left: calc(16px + 18rem + 16px);
    right: calc(16px + 20rem + 16px);
    display: flex;
    justify-content: center;
    z-index: 60;
    pointer-events: none;
    height: 50vh;
    align-items: flex-end;
  }

  .terminal-wrapper {
    pointer-events: auto;
    width: 100%;
    max-width: 46rem;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
  }

  /* Xerox grain: post-punk texture at the threshold of perception. */
  .grain {
    position: fixed;
    inset: 0;
    z-index: 9000;
    pointer-events: none;
    opacity: 0.045;
    mix-blend-mode: overlay;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 240 240' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  }
</style>
