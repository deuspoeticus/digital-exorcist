<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import { getNextZIndex } from "$lib/stores/appStore";
    import GlassPanel from "./GlassPanel.svelte";
    import { slide } from "svelte/transition";

    export let title = "WINDOW";
    /** Roman numeral shown before the title, e.g. "I". */
    export let numeral = "";
    export let initialPosition = { x: 20, y: 20 };
    export let className = "";
    export let isMinimized = false;
    export let height = 0; // Exposed for stacking windows in a column
    export let zIndex = 50;

    const EDGE = 12; // keep this much of the viewport free around windows
    const HEADER = 32;

    let x = initialPosition.x;
    let y = initialPosition.y;
    let width = 0;
    let isDragging = false;
    let hasMovedManually = false;
    let dragOffsetX = 0;
    let dragOffsetY = 0;
    let vw = 1280;
    let vh = 800;

    // Follow the layout until the user drags the window themselves.
    $: if (!hasMovedManually && initialPosition) {
        x = initialPosition.x;
        y = initialPosition.y;
    }

    // Never leave the viewport (also re-applied when the browser is resized).
    $: clampedX = Math.min(Math.max(EDGE, x), Math.max(EDGE, vw - width - EDGE));
    $: clampedY = Math.min(Math.max(EDGE, y), Math.max(EDGE, vh - HEADER - EDGE));
    // Content scrolls inside the window instead of running off-screen.
    $: maxContent = Math.max(80, vh - clampedY - HEADER - EDGE);

    function onPointerDown(e: PointerEvent) {
        zIndex = getNextZIndex();
        dispatch("focus");

        const target = e.target as HTMLElement;
        if (!target.closest(".window-header") || target.closest(".window-controls")) return;

        isDragging = true;
        hasMovedManually = true;
        dragOffsetX = e.clientX - clampedX;
        dragOffsetY = e.clientY - clampedY;
    }

    function onPointerMove(e: PointerEvent) {
        if (!isDragging) return;
        x = e.clientX - dragOffsetX;
        y = e.clientY - dragOffsetY;
    }

    function onPointerUp() {
        if (isDragging) {
            x = clampedX;
            y = clampedY;
        }
        isDragging = false;
    }

    function toggleMinimize() {
        isMinimized = !isMinimized;
    }

    const dispatch = createEventDispatcher();
</script>

<svelte:window
    bind:innerWidth={vw}
    bind:innerHeight={vh}
    on:pointermove={onPointerMove}
    on:pointerup={onPointerUp}
/>

<div
    class="window"
    class:dragging={isDragging}
    role="presentation"
    style="left: {clampedX}px; top: {clampedY}px; z-index: {zIndex};"
    bind:clientWidth={width}
    bind:clientHeight={height}
    on:pointerdown={onPointerDown}
>
    <GlassPanel className="window-panel {className}">
        <div class="window-header">
            {#if numeral}<span class="numeral">{numeral}</span>{/if}
            <span class="window-title">{title}</span>
            <div class="window-controls">
                <button
                    class="control-btn"
                    on:click={toggleMinimize}
                    title={isMinimized ? "Expand" : "Collapse"}
                    aria-label={isMinimized ? `Expand ${title}` : `Collapse ${title}`}
                    aria-expanded={!isMinimized}
                >
                    <span class="glyph" class:closed={isMinimized}></span>
                </button>
            </div>
        </div>

        {#if !isMinimized}
            <div
                class="window-content"
                style="max-height: {maxContent}px;"
                transition:slide={{ duration: 180 }}
            >
                <slot />
            </div>
        {/if}
    </GlassPanel>
</div>

<style>
    .window {
        position: absolute;
        user-select: none;
    }

    .window.dragging {
        cursor: grabbing;
    }

    :global(.window-panel) {
        display: flex;
        flex-direction: column;
        min-width: 12.5rem;
    }

    .window-header {
        height: 2rem;
        display: flex;
        align-items: center;
        gap: 0.625rem;
        padding: 0 0.5rem 0 0.75rem;
        border-bottom: var(--hairline);
        cursor: grab;
        touch-action: none;
    }

    .numeral {
        font-family: var(--font-pixel);
        font-size: var(--text-xs);
        color: var(--rubric-hi);
        min-width: 1.25rem;
        letter-spacing: 0.05em;
    }

    .window-title {
        flex: 1;
        font-family: var(--font-display);
        font-variant: small-caps;
        text-transform: lowercase;
        font-size: 1rem;
        font-weight: 500;
        letter-spacing: 0.14em;
        color: var(--bone);
        pointer-events: none;
        white-space: nowrap;
    }

    .control-btn {
        width: 1.25rem;
        height: 1.25rem;
        display: grid;
        place-items: center;
        padding: 0;
        border: none;
        background: transparent;
    }

    .control-btn:hover .glyph {
        border-color: var(--bone);
    }

    /* Open: a horizontal stroke. Closed: a hollow square. */
    .glyph {
        display: block;
        width: 0.5rem;
        height: 0;
        border-top: 1px solid var(--bone-3);
        transition: all var(--dur) var(--ease);
    }

    .glyph.closed {
        height: 0.5rem;
        border: 1px solid var(--bone-3);
    }

    .window-content {
        overflow-y: auto;
        overscroll-behavior: contain;
    }
</style>
