<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import {
        imageUrl,
        currentRawImage,
        isProcessing,
        systemStability,
    } from "$lib/stores/appStore";
    import HexDump from "./HexDump.svelte";
    import Sigil from "./ui/Sigil.svelte";

    const dispatch = createEventDispatcher<{ fileSelected: File }>();

    export let canvasRef: HTMLCanvasElement;
    /** Space taken by the side windows, so the image fits between them. */
    export let insets = { left: 0, right: 0 };

    // Vertical breathing room: toolbar above, terminal below.
    const TOP_RESERVE = 72;
    const BOTTOM_RESERVE = 112;

    $: freeCenterX = (insets.left - insets.right) / 2;

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
            scale = 1;
            panX = 0;
            panY = 0;
            return;
        }

        // Fit inside the free area between the window columns
        const availW = Math.max(160, containerWidth - insets.left - insets.right);
        const availH = Math.max(160, containerHeight - TOP_RESERVE - BOTTOM_RESERVE);

        let rawScale = Math.min(
            availW / $currentRawImage.width,
            availH / $currentRawImage.height,
        );

        // Snap to nearest lower 5% step for cleaner UI numbers
        scale = Math.floor(rawScale / 0.05) * 0.05;
        // Ensure minimum safe scale
        scale = Math.max(scale, 0.05);

        panX = freeCenterX;
        panY = (TOP_RESERVE - BOTTOM_RESERVE) / 2;
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

    let dropping = false;

    function onDrop(e: DragEvent) {
        dropping = false;
        const file = e.dataTransfer?.files?.[0];
        if (file && file.type.startsWith("image/")) dispatch("fileSelected", file);
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
    on:dragover|preventDefault={() => (dropping = true)}
    on:dragleave={() => (dropping = false)}
    on:drop|preventDefault={onDrop}
    class:dropping
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
            style="left: calc(50% + {freeCenterX}px);"
            on:mousedown|stopPropagation
        >
            <button
                class="icon"
                aria-label="Zoom out"
                on:click={() => (scale = Math.max(scale - 0.5, 0.1))}>−</button
            >
            <span class="scale-label">{Math.round(scale * 100)}%</span>
            <button
                class="icon"
                aria-label="Zoom in"
                on:click={() => (scale = Math.min(scale + 0.5, 10))}>+</button
            >
            <div class="separator"></div>
            <button
                class:active={isComparing}
                on:mousedown={toggleCompare}
                title="Hold to see the original">Compare</button
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
            <div class="idle-content" style="transform: translateX({freeCenterX}px);">
                <Sigil size={112} spinning />
                <h1 class="idle-title">The Digital Exorcist</h1>
                <p class="idle-verse">Lay a vessel upon the altar.</p>
                <p class="idle-hint">
                    {dropping ? "release to offer" : "drop an image · or click to choose"}
                </p>
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
        background: var(--ink-0);
        overflow: hidden;
        z-index: 0;
    }

    /* Faint vignette: the altar is lit from above */
    .altar::before {
        content: "";
        position: absolute;
        inset: 0;
        background: radial-gradient(ellipse 60% 55% at 50% 42%, rgba(230, 225, 213, 0.035), transparent 70%);
        pointer-events: none;
    }

    .altar.dropping::after {
        content: "";
        position: absolute;
        inset: 1rem;
        border: 1px dashed var(--bone-3);
        pointer-events: none;
        z-index: 30;
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
        display: block;
        image-rendering: pixelated;
        box-shadow: 0 2rem 4rem rgba(0, 0, 0, 0.6);
        outline: 1px solid var(--bone-5);
    }

    /* While the engine works: a chromatic split and a stutter. */
    .altar-canvas.processing {
        filter: drop-shadow(-2px 0 rgba(224, 55, 44, 0.55)) drop-shadow(2px 0 rgba(110, 200, 220, 0.4));
        animation: stutter 0.9s steps(1) infinite;
    }

    @keyframes stutter {
        0%, 100% { transform: translate(0); }
        31% { transform: translate(-1px, 0); }
        33% { transform: translate(2px, 0); }
        35% { transform: translate(0); }
        72% { transform: translate(0, 1px); }
        74% { transform: translate(0); }
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

    .altar-idle:focus-visible {
        outline: none;
    }

    .altar-idle:focus-visible .idle-hint,
    .altar-idle:hover .idle-hint {
        color: var(--bone-2);
    }

    .idle-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
    }

    .idle-title {
        margin: 1.75rem 0 0;
        font-family: var(--font-blackletter);
        font-weight: 400;
        font-size: 3.25rem;
        line-height: 1;
        color: var(--bone);
        letter-spacing: 0.01em;
    }

    .idle-verse {
        margin: 0.75rem 0 0;
        font-family: var(--font-display);
        font-style: italic;
        font-size: 1.25rem;
        color: var(--bone-3);
    }

    .idle-hint {
        margin: 1.75rem 0 0;
        font-family: var(--font-mono);
        font-size: var(--text-xs);
        letter-spacing: 0.2em;
        text-transform: uppercase;
        color: var(--bone-4);
        transition: color var(--dur) var(--ease);
    }

    /* Toolbar: a plain hairline strip */
    .altar-controls {
        position: absolute;
        top: 1rem;
        transform: translateX(-50%);
        display: flex;
        align-items: center;
        gap: 0.25rem;
        padding: 0.25rem;
        background: rgba(10, 10, 10, 0.85);
        border: var(--hairline);
        box-shadow: var(--bevel);
        z-index: 50;
    }

    .altar-controls.unstable {
        border-color: var(--rubric);
    }

    .altar-controls button {
        border: none;
        padding: 0.3rem 0.625rem;
        font-size: var(--text-xs);
        color: var(--bone-3);
    }

    .altar-controls button.icon {
        font-size: var(--text-md);
        padding: 0.2rem 0.5rem;
    }

    .altar-controls button.active {
        color: var(--ink-0);
        background: var(--bone);
    }

    .scale-label {
        min-width: 3rem;
        text-align: center;
        font-family: var(--font-pixel);
        font-size: var(--text-xs);
        color: var(--bone-2);
        font-variant-numeric: tabular-nums;
    }

    .separator {
        width: 1px;
        height: 0.875rem;
        margin: 0 0.25rem;
        background: var(--bone-5);
    }
</style>
