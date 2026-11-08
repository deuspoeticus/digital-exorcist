<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import {
        imageUrl,
        currentRawImage,
        isProcessing,
        systemStability,
        ritualGlitch,
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

    {#if $ritualGlitch}
        <div class="scan" aria-hidden="true"><i></i></div>
    {/if}

    <!-- Tear filter: horizontal noise bands displace the image, then the
         red and green/blue channels are pulled apart. -->
    <svg class="defs" width="0" height="0" aria-hidden="true">
        <filter
            id="ritual-tear"
            x="-8%"
            y="-8%"
            width="116%"
            height="116%"
            color-interpolation-filters="sRGB"
        >
            <feTurbulence
                type="fractalNoise"
                baseFrequency="0.00012 0.06"
                numOctaves="1"
                seed="3"
                result="bands"
            >
                <animate
                    attributeName="seed"
                    values="1;8;3;14;5;11;2;9"
                    dur="0.48s"
                    calcMode="discrete"
                    repeatCount="indefinite"
                />
            </feTurbulence>
            <feDisplacementMap
                in="SourceGraphic"
                in2="bands"
                scale="46"
                xChannelSelector="R"
                yChannelSelector="A"
                result="torn"
            />
            <feColorMatrix
                in="torn"
                type="matrix"
                values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"
                result="red"
            />
            <feOffset in="red" dx="-7" dy="0" result="redShift" />
            <feColorMatrix
                in="torn"
                type="matrix"
                values="0 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0"
                result="cyan"
            />
            <feOffset in="cyan" dx="6" dy="0" result="cyanShift" />
            <feBlend in="redShift" in2="cyanShift" mode="screen" />
        </filter>
    </svg>

    <!-- Viewport Content (Zoom/Pan Target) -->
    <div
        class="viewport-content"
        class:glitching={$ritualGlitch}
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
            class:glitching={$ritualGlitch}
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
                title="Toggle between the original and the result">Compare</button
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
                <h1 class="idle-title misreg" data-text="The Digital Exorcist">
                    The Digital Exorcist
                </h1>
                <p class="idle-verse">Lay a vessel upon the altar.</p>
                <p class="idle-hint">
                    {dropping ? "release to offer" : "drop an image · or click to choose"}
                </p>
                <p class="colophon" aria-hidden="true">
                    <span>DX—001</span><span>local ritual engine</span><span>ImageMagick · WASM</span><span>MMXXVI</span>
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

    .defs {
        position: absolute;
        width: 0;
        height: 0;
    }

    /* ── The ritual glitch ──
       canvas: torn + channel-split + shaken + glowing;
       wrapper: negative flashes (kept separate: the wrapper's transform is zoom/pan). */
    .altar-canvas.glitching {
        filter: url(#ritual-tear) drop-shadow(0 0 1.25rem rgba(224, 55, 44, 0.55));
        animation: shake 0.28s steps(2, jump-none) infinite;
        outline-color: var(--rubric-hi);
    }

    .viewport-content.glitching {
        animation: negate 0.56s steps(1) infinite;
    }

    @keyframes shake {
        0% { transform: translate(0, 0); }
        25% { transform: translate(-6px, 2px) skewX(-1.5deg); }
        50% { transform: translate(5px, -3px); }
        75% { transform: translate(-3px, 4px) skewX(1deg); }
        100% { transform: translate(4px, -1px); }
    }

    @keyframes negate {
        0%, 100% { filter: none; }
        22% { filter: invert(1) contrast(1.6); }
        30% { filter: none; }
        58% { filter: invert(1) hue-rotate(180deg) saturate(3); }
        64% { filter: none; }
        86% { filter: contrast(2.2) brightness(1.4) grayscale(1); }
        92% { filter: none; }
    }

    /* Scanlines + a beam sweeping the altar */
    .scan {
        position: absolute;
        inset: 0;
        z-index: 90;
        pointer-events: none;
        background: repeating-linear-gradient(
            to bottom,
            rgba(0, 0, 0, 0.28) 0px,
            rgba(0, 0, 0, 0.28) 1px,
            transparent 1px,
            transparent 3px
        );
        mix-blend-mode: multiply;
    }

    .scan i {
        position: absolute;
        left: 0;
        right: 0;
        height: 18%;
        top: -18%;
        background: linear-gradient(
            to bottom,
            transparent,
            rgba(224, 55, 44, 0.16) 70%,
            rgba(255, 240, 235, 0.45) 98%,
            transparent
        );
        mix-blend-mode: screen;
        animation: sweep 0.7s linear infinite;
    }

    @keyframes sweep {
        to { top: 100%; }
    }

    @media (prefers-reduced-motion: reduce) {
        .altar-canvas.glitching {
            filter: none;
            outline: 2px solid var(--rubric-hi);
        }
        .scan { display: none; }
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

    /* Post-punk sleeve credits */
    .colophon {
        display: flex;
        gap: 0;
        margin: 2.75rem 0 0;
        font-family: var(--font-mono);
        font-size: 0.5625rem;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: var(--bone-4);
        border-top: var(--hairline);
        border-bottom: var(--hairline);
    }

    .colophon span {
        padding: 0.375rem 0.75rem;
    }

    .colophon span + span {
        border-left: var(--hairline);
    }

    .colophon span:first-child {
        color: var(--rubric-hi);
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
        font-family: var(--font-mono);
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
