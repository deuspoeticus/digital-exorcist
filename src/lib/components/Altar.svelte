<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import {
        imageUrl,
        currentRawImage,
        isProcessing,
        systemStability,
    } from "$lib/stores/appStore";
    import HexDump from "./HexDump.svelte";

    const dispatch = createEventDispatcher<{ fileSelected: File }>();

    export let canvasRef: HTMLCanvasElement;

    // Zoom / Pan / Compare state
    let scale = 1;
    let panX = 0;
    let panY = 0;
    let isDragging = false;
    let dragStart = { x: 0, y: 0 };
    let isComparing = false;
    let containerWidth = 0;
    let containerHeight = 0;

    function handleWheel(e: WheelEvent) {
        if (!$imageUrl && !$currentRawImage) return;
        e.preventDefault();
        const delta = e.deltaY * -0.001;
        scale = Math.min(Math.max(0.1, scale + delta), 10);
    }

    function handleMouseDown(e: MouseEvent) {
        if (!$imageUrl && !$currentRawImage) return;
        isDragging = true;
        dragStart = { x: e.clientX - panX, y: e.clientY - panY };
    }

    function handleMouseMove(e: MouseEvent) {
        if (!isDragging) return;
        panX = e.clientX - dragStart.x;
        panY = e.clientY - dragStart.y;
    }

    function handleMouseUp() {
        isDragging = false;
    }

    function toggleCompare() {
        isComparing = !isComparing;
        // Do NOT reset view on compare toggle
    }

    function fitView() {
        if (!$currentRawImage || !containerWidth || !containerHeight) {
            console.log("FitView Skipped: Missing data", {
                img: !!$currentRawImage,
                w: containerWidth,
                h: containerHeight,
            });
            scale = 1;
            panX = 0;
            panY = 0;
            return;
        }

        const imageRatio = $currentRawImage.width / $currentRawImage.height;
        const containerRatio = containerWidth / containerHeight;

        // Fit logic: inverse of cover
        let rawScale;
        if (imageRatio > containerRatio) {
            rawScale = containerWidth / $currentRawImage.width;
        } else {
            rawScale = containerHeight / $currentRawImage.height;
        }

        // Apply padding (95%)
        rawScale = rawScale * 0.95;

        // Snap to nearest lower 5% step for cleaner UI numbers
        scale = Math.floor(rawScale / 0.05) * 0.05;
        // Ensure minimum safe scale
        scale = Math.max(scale, 0.05);

        console.log("FitView Applied Scale:", scale, "(Raw:", rawScale, ")");

        panX = 0;
        panY = 0;
        // isComparing = false; // Decoupled
    }

    function coverView() {
        if (!$currentRawImage || !containerWidth || !containerHeight) return;
        const imageRatio = $currentRawImage.width / $currentRawImage.height;
        const containerRatio = containerWidth / containerHeight;
        panX = 0;
        panY = 0;
        // isComparing = false; // Decoupled

        if (imageRatio > containerRatio) {
            scale = containerHeight / (containerWidth / imageRatio);
        } else {
            scale = containerWidth / (containerHeight * imageRatio);
        }
    }

    function onFileInput(e: Event) {
        const input = e.target as HTMLInputElement;
        if (!input.files?.length) return;
        dispatch("fileSelected", input.files[0]);
    }

    // Identify if it's a new image to trigger auto-fit
    let lastImageId: string | null = null;

    $: if ($imageUrl && $currentRawImage && containerWidth && containerHeight) {
        // Create a simple unique ID for the current image state
        const currentId = $imageUrl;
        if (currentId !== lastImageId) {
            lastImageId = currentId;
            fitView();
        }
    }

    // Auto-disable compare mode when processing starts so user sees the result
    $: if ($isProcessing) {
        isComparing = false;
    }
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
    class="altar"
    bind:clientWidth={containerWidth}
    bind:clientHeight={containerHeight}
    on:wheel={handleWheel}
    on:mousedown={handleMouseDown}
    on:mousemove={handleMouseMove}
    on:mouseup={handleMouseUp}
    on:mouseleave={handleMouseUp}
>
    <!-- Processing Overlay -->
    {#if $isProcessing}
        <HexDump />
    {/if}

    <!-- Viewport Content (Zoom/Pan Target) -->
    <div
        class="viewport-content"
        style:transform="translate({panX}px, {panY}px) scale({scale})"
        style:transform-origin="center center"
    >
        <!-- Original Image (Comparison) -->
        {#if $imageUrl && isComparing}
            <img
                src={$imageUrl}
                width={$currentRawImage?.width}
                height={$currentRawImage?.height}
                style:width="100% !important"
                style:height="100% !important"
                alt="Original"
                class="altar-image"
            />
        {/if}

        <!-- Canvas (Probe) -->
        <canvas
            bind:this={canvasRef}
            class="altar-canvas"
            class:processing={$isProcessing}
            style:display={!isComparing && ($imageUrl || $currentRawImage)
                ? "block"
                : "none"}
        ></canvas>
    </div>

    {#if $imageUrl || $currentRawImage}
        <div
            class="altar-controls"
            class:unstable={$systemStability === "unstable"}
            on:mousedown|stopPropagation
        >
            <button on:click={() => (scale = Math.min(scale + 0.5, 10))}
                >+</button
            >
            <span class="scale-label">{Math.round(scale * 100)}%</span>
            <button on:click={() => (scale = Math.max(scale - 0.5, 0.1))}
                >-</button
            >
            <div class="separator"></div>
            <button class:active={isComparing} on:mousedown={toggleCompare}
                >Compare</button
            >
            <div class="separator"></div>
            <button on:click={fitView}>Fit</button>
            <button on:click={coverView}>Cover</button>
        </div>
    {/if}

    <!-- Idle State -->
    {#if !$imageUrl && !$currentRawImage}
        <div
            class="altar-idle"
            role="button"
            tabindex="0"
            on:click={() => document.getElementById("fileInput")?.click()}
            on:keydown={(e) => {
                if (e.key === "Enter" || e.key === " ")
                    document.getElementById("fileInput")?.click();
            }}
        >
            <div class="idle-content">
                <div class="idle-title">altar</div>
                <div class="idle-status blink">no vessel loaded</div>
                <div class="idle-hint">drop or select</div>
            </div>
        </div>
    {/if}

    <!-- Hidden Input -->
    <input
        id="fileInput"
        type="file"
        accept="image/*"
        on:change={onFileInput}
        hidden
    />
</div>

<style>
    .altar {
        flex: 1;
        position: relative;
        width: 100%;
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        background: var(--void-gradient);
        overflow: hidden;
        z-index: 0;
    }

    /* Noise background */
    .altar::before {
        content: "";
        position: absolute;
        inset: 0;
        background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.05'/%3E%3C/svg%3E");
        opacity: 0.15;
        pointer-events: none;
        z-index: 0;
    }

    .viewport-content {
        transform-origin: center;
        display: flex;
        justify-content: center;
        align-items: center;
        will-change: transform;
        z-index: 10;
    }

    .altar-canvas,
    .altar-image {
        /* Allow full natural size, scaling handled by transform */
        display: block;
        box-shadow: var(--aberration-glow);
        image-rendering: pixelated; /* Ensure crisp scaling */
        /* max-width: none !important; */
        /* max-height: none !important; */
        /* width: auto !important; */
        /* height: auto !important; */
    }

    /* Glitch effect */
    .altar-canvas.processing {
        filter: invert(1) contrast(2) saturate(2) hue-rotate(90deg);
        animation: glitch-anim 0.2s infinite;
    }

    @keyframes glitch-anim {
        0% {
            transform: translate(0);
        }
        20% {
            transform: translate(-0.25rem, 0.125rem);
        }
        40% {
            transform: translate(-0.125rem, -0.25rem);
        }
        60% {
            transform: translate(0.25rem, 0.125rem);
        }
        80% {
            transform: translate(0.125rem, -0.125rem);
        }
        100% {
            transform: translate(0);
        }
    }

    .altar-idle {
        position: absolute;
        inset: 0;
        display: flex;
        justify-content: center;
        align-items: center;
        cursor: pointer;
        z-index: 20;
    }

    .altar-controls {
        position: absolute;
        top: 2rem;
        left: 50%;
        transform: translateX(-50%);
        backdrop-filter: blur(1rem) saturate(140%);
        border: 0.0625rem solid var(--color-cyan);
        padding: 0.5rem 1rem;
        border-radius: 99rem;
        display: flex;
        gap: 1rem;
        align-items: center;
        z-index: 50;
        box-shadow: var(--aberration-glow);
        transition: border-color 0.5s ease;
    }

    .altar-controls.unstable {
        border-color: var(--color-magenta);
    }

    .altar-controls button {
        background: transparent;
        border: none;
        color: var(--text-bright);
        cursor: pointer;
        font-family: var(--font-pixel);
        font-size: 0.8rem;
        padding: 0.25rem 0.75rem;
        border-radius: 0.25rem;
        transition: all 0.2s;
    }

    .altar-controls button:hover {
        background: var(--bg-panel-hover);
        color: var(--color-cyan);
    }

    .altar-controls button.active {
        background: var(--color-cyan);
        color: var(--bg-void);
        box-shadow: 0 0 0.625rem var(--color-cyan);
    }

    .scale-label {
        min-width: 2.5rem;
        text-align: center;
        font-size: 0.8rem;
        color: var(--text-dim);
    }

    .separator {
        width: 0.0625rem;
        height: 1rem;
        background: var(--glass-border);
    }

    .idle-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5rem;
        text-align: center;
    }

    .idle-title {
        font-family: var(--font-pixel);
        color: var(--text-dim);
        font-size: 1.5rem;
        letter-spacing: 1.25rem;
        text-transform: uppercase;
        opacity: 0.6;
    }

    .idle-status {
        font-family: var(--font-pixel-line);
        color: var(--text-bright);
        font-size: 3rem;
        letter-spacing: 1rem;
        text-transform: uppercase;
        text-shadow: var(--aberration-glow);
    }

    .idle-status.blink {
        animation: blinker 3s linear infinite;
    }

    .idle-hint {
        font-family: var(--font-pixel);
        color: var(--text-dim);
        font-size: 1.2rem;
        letter-spacing: 0.8rem;
        text-transform: uppercase;
    }

    @keyframes blinker {
        0%,
        100% {
            opacity: 1;
            filter: saturate(1);
        }
        50% {
            opacity: 0.3;
            filter: saturate(4) blur(0.125rem);
        }
    }
</style>
