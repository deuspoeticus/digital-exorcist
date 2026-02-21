<script lang="ts">
    import { onMount, createEventDispatcher } from "svelte";
    import { getNextZIndex } from "$lib/stores/appStore";
    import GlassPanel from "./GlassPanel.svelte";
    import { slide } from "svelte/transition";

    export let title = "WINDOW";
    export let initialPosition = { x: 20, y: 20 };
    export let className = "";
    export let isMinimized = false;
    export let height = 0; // Expose height for relative positioning
    export let zIndex = 50; // Initial z-index

    let x = initialPosition.x;
    let y = initialPosition.y;
    let isDragging = false;
    let hasMovedManually = false;
    let dragOffsetX = 0;
    let dragOffsetY = 0;
    let windowElement: HTMLElement;

    // Reactively update coordinates if initialPosition changes,
    // but only if the user hasn't moved it themselves yet.
    $: if (!hasMovedManually && initialPosition) {
        x = initialPosition.x;
        y = initialPosition.y;
    }

    function onMouseDown(e: MouseEvent) {
        zIndex = getNextZIndex();
        dispatch("focus");

        const target = e.target as HTMLElement;
        const isHeader = target.closest(".window-header");
        const isControl = target.closest(".window-controls");

        if (!isHeader || isControl) return;

        isDragging = true;
        hasMovedManually = true;
        dragOffsetX = e.clientX - x;
        dragOffsetY = e.clientY - y;
    }

    function onMouseMove(e: MouseEvent) {
        if (!isDragging) return;
        x = e.clientX - dragOffsetX;
        y = e.clientY - dragOffsetY;
    }

    function onMouseUp() {
        isDragging = false;
    }

    function toggleMinimize() {
        isMinimized = !isMinimized;
    }

    const dispatch = createEventDispatcher();
</script>

<svelte:window on:mousemove={onMouseMove} on:mouseup={onMouseUp} />

<div
    class="draggable-window-wrapper"
    role="presentation"
    style="left: {x}px; top: {y}px; z-index: {zIndex};"
    bind:this={windowElement}
    bind:clientHeight={height}
    on:mousedown={onMouseDown}
>
    <GlassPanel className="window-panel {className}">
        <div class="window-header">
            <span class="window-title">{title}</span>
            <div class="window-controls">
                <button
                    class="control-btn"
                    on:click={toggleMinimize}
                    title={isMinimized ? "Expand" : "Minimize"}
                >
                    {isMinimized ? "□" : "−"}
                </button>
            </div>
        </div>

        {#if !isMinimized}
            <div class="window-content" transition:slide={{ duration: 200 }}>
                <slot />
            </div>
        {/if}
    </GlassPanel>
</div>

<style>
    .draggable-window-wrapper {
        position: absolute;
        z-index: 50;
        user-select: none;
        transition: z-index 0.1s;
        animation: float 6s ease-in-out infinite;
    }

    .draggable-window-wrapper:active,
    .draggable-window-wrapper:hover {
        animation-play-state: paused;
    }

    @keyframes float {
        0%,
        100% {
            transform: translateY(0);
        }
        50% {
            transform: translateY(-0.25rem);
        }
    }

    /* The wrapper doesn't need dragging cursors anymore, handled in header */

    :global(.window-panel) {
        display: flex;
        flex-direction: column;
        min-width: 12.5rem;
    }

    .window-header {
        height: 2rem;
        background: linear-gradient(
            90deg,
            color-mix(in srgb, var(--color-magenta), transparent 70%) 0%,
            color-mix(in srgb, var(--color-cyan), transparent 70%) 100%
        );
        border-bottom: var(--glass-border);
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 0.75rem;
        cursor: grab;
    }

    .window-header:active {
        cursor: grabbing;
    }

    .window-title {
        font-family: var(--font-pixel, monospace);
        font-size: 0.75rem;
        letter-spacing: 0.0625rem;
        color: var(--text-bright);
        text-shadow: 0 0 0.3125rem rgba(0, 0, 0, 0.5);
        text-transform: uppercase;
        pointer-events: none;
    }

    .window-controls {
        display: flex;
        gap: 0.375rem;
    }

    .control-btn {
        background: transparent;
        border: 0.0625rem solid rgba(255, 255, 255, 0.1);
        color: var(--text-dim);
        width: 1.25rem;
        height: 1.25rem;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        font-size: 0.875rem;
        line-height: 1;
        transition: all 0.2s;
        font-family: monospace;
    }

    .control-btn:hover {
        background: var(--bg-panel-hover);
        color: var(--color-cyan);
        border-color: var(--color-cyan);
        box-shadow: var(--aberration-glow);
    }

    .window-content {
        flex: 1;
        overflow: auto;
    }
</style>
