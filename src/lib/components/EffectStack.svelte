<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import {
        effectStack,
        removeEntry,
        toggleEntry,
        moveEntry,
        updateEntryEffects,
        clearStack,
        popEntry,
        isProcessing,
        lastProcessedStack,
    } from "$lib/stores/appStore";
    import type { Effect } from "$lib/stores/appStore";

    import ParameterInput from "./ParameterInput.svelte";

    const dispatch = createEventDispatcher<{
        stackChanged: void;
        export: void;
    }>();

    let expandedId: string | null = null;

    function toggle(id: string) {
        toggleEntry(id);
        // dispatch("stackChanged"); // Manual update only
    }

    function remove(id: string) {
        removeEntry(id);
        if (expandedId === id) expandedId = null;
        // dispatch("stackChanged"); // Manual update only
    }

    function move(id: string, dir: -1 | 1) {
        moveEntry(id, dir);
        // dispatch("stackChanged"); // Manual update only
    }

    function toggleExpand(id: string) {
        expandedId = expandedId === id ? null : id;
    }

    function onParamChange(
        entryId: string,
        effectIdx: number,
        argIdx: number,
        newValue: string | number,
    ) {
        const entry = $effectStack.find((e) => e.id === entryId);
        if (!entry) return;

        const updated = entry.effects.map((eff, i) => {
            if (i !== effectIdx) return eff;
            const newArgs = eff.args.map((arg, j) =>
                j === argIdx ? { ...arg, value: newValue } : arg,
            );
            return { ...eff, args: newArgs };
        });

        updateEntryEffects(entryId, updated);
        // dispatch("stackChanged"); // Manual update only
    }

    function clear() {
        clearStack();
        expandedId = null;
        dispatch("stackChanged"); // Clear should process immediately to reset state
    }

    function undo() {
        const popped = popEntry();
        if (popped && expandedId === popped.id) expandedId = null;
        // dispatch("stackChanged"); // Undo should probably wait for rerun too? Or be instant?
        // Let's make Undo instant for better UX flow, or manual?
        // User requested disabling live updating. So undo should also require Rerun.
    }

    function rerun() {
        dispatch("stackChanged");
    }

    $: isClean = $lastProcessedStack === JSON.stringify($effectStack);

    function triggerExport() {
        dispatch("export");
    }

    const sourceBadge: Record<string, string> = {
        preset: "SIGIL",
        ai: "NEURAL",
        manual: "CMD",
    };
</script>

<div class="stack-container">
    {#if $effectStack.length > 0}
        <div class="stack-header">
            <span class="stack-title">Effect Stack</span>
            <span class="stack-count"
                >{$effectStack.filter((e) => e.enabled)
                    .length}/{$effectStack.length}</span
            >
        </div>

        <div class="stack-list">
            {#each $effectStack as entry, idx (entry.id)}
                <div class="stack-entry" class:disabled={!entry.enabled}>
                    <!-- Entry Header -->
                    <div class="entry-header">
                        <!-- Reorder -->
                        <div class="reorder-btns">
                            <button
                                class="icon-btn"
                                disabled={idx === 0 || $isProcessing}
                                on:click={() => move(entry.id, -1)}
                                title="Move up">▲</button
                            >
                            <button
                                class="icon-btn"
                                disabled={idx === $effectStack.length - 1 ||
                                    $isProcessing}
                                on:click={() => move(entry.id, 1)}
                                title="Move down">▼</button
                            >
                        </div>

                        <!-- Toggle -->
                        <button
                            class="toggle-btn"
                            class:on={entry.enabled}
                            on:click={() => toggle(entry.id)}
                            disabled={$isProcessing}
                            >{entry.enabled ? "●" : "○"}</button
                        >

                        <!-- Label + Source -->
                        <span class="entry-label" title={entry.command}>
                            <span class="source-badge"
                                >{sourceBadge[entry.source]}</span
                            >
                            {entry.label}
                        </span>

                        <!-- Expand (if has sliders) -->
                        {#if entry.effects.length > 0}
                            <button
                                class="icon-btn expand-btn"
                                on:click={() => toggleExpand(entry.id)}
                                >{expandedId === entry.id ? "▴" : "▾"}</button
                            >
                        {/if}

                        <!-- Delete -->
                        <button
                            class="icon-btn delete-btn"
                            on:click={() => remove(entry.id)}
                            disabled={$isProcessing}
                            title="Remove">×</button
                        >
                    </div>

                    <!-- Expanded: Parameters -->
                    {#if expandedId === entry.id && entry.effects.length > 0}
                        <div class="entry-sliders">
                            {#each entry.effects as effect, i}
                                <div class="effect-group">
                                    <!-- Only show effect name if it has multiple args or isn't obvious -->
                                    {#if effect.args.length > 1}
                                        <div class="effect-name">
                                            {effect.name}
                                        </div>
                                    {/if}

                                    {#each effect.args as arg, j}
                                        <ParameterInput
                                            {arg}
                                            disabled={$isProcessing}
                                            on:change={(e) =>
                                                onParamChange(
                                                    entry.id,
                                                    i,
                                                    j,
                                                    e.detail,
                                                )}
                                        />
                                    {/each}
                                </div>
                            {/each}
                        </div>
                    {/if}
                </div>
            {/each}
        </div>

        <!-- Bottom Controls -->
        <div class="stack-controls">
            <button
                class="stack-btn secondary"
                on:click={undo}
                disabled={$isProcessing || $effectStack.length === 0}
                >Undo</button
            >
            <button
                class="stack-btn secondary"
                on:click={clear}
                disabled={$isProcessing}>Clear</button
            >
        </div>

        <div class="stack-footer">
            <button
                class="rerun-btn"
                on:click={rerun}
                disabled={$isProcessing || isClean}
            >
                {#if $isProcessing}
                    PROCESSING...
                {:else}
                    RECAST
                {/if}
            </button>
        </div>
    {:else}
        <div class="stack-empty">
            <span
                >No effects applied — click a preset or type in the terminal</span
            >
        </div>
    {/if}
</div>

<style>
    .stack-container {
        background: var(--bg-void);
        display: flex;
        flex-direction: column;
        height: 100%;
        max-height: 100%;
        overflow: hidden;
    }

    .stack-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.5rem 0.75rem;
        background: var(--bg-glass);
        border-bottom: var(--glass-border);
    }

    .stack-title {
        font-size: 0.75rem;
        color: var(--text-bright);
        text-transform: uppercase;
        letter-spacing: 0.0625rem;
    }

    .stack-count {
        font-size: 0.7rem;
        color: var(--text-dim);
    }

    .stack-list {
        flex: 1;
        overflow-y: auto;
        min-height: 0;
    }

    .stack-entry {
        border-bottom: 0.0625rem solid #ffffff;
        transition: all 0.2s ease;
        background: transparent;
    }

    .stack-entry.disabled {
        opacity: 0.4;
        background: rgba(0, 0, 0, 0.2);
    }

    .entry-header {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 0.625rem;
        border-left: 0.125rem solid transparent;
    }

    .entry-header:hover {
        background: var(--bg-panel-hover);
        border-left-color: var(--color-cyan);
    }

    .reorder-btns {
        display: flex;
        flex-direction: column;
        gap: 0;
    }

    .icon-btn {
        background: none;
        border: none;
        color: var(--text-dim);
        cursor: pointer;
        font-size: 0.6rem;
        padding: 0 0.25rem;
        line-height: 1;
        transition: color 0.2s;
    }

    .icon-btn:hover:not(:disabled) {
        color: var(--color-cyan);
    }

    .icon-btn:disabled {
        opacity: 0.2;
        cursor: not-allowed;
    }

    .toggle-btn {
        background: none;
        border: none;
        cursor: pointer;
        padding: 0 0.25rem;
        color: var(--text-dim);
        font-family: var(--font-mono);
        font-size: 1rem;
        line-height: 1;
    }

    .toggle-btn.on {
        color: var(--color-cyan);
        text-shadow: 0 0 0.5rem var(--color-cyan);
    }

    .toggle-btn:disabled {
        cursor: not-allowed;
    }

    .entry-label {
        flex: 1;
        font-size: 0.75rem;
        color: var(--text-bright);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-family: var(--font-mono);
        letter-spacing: 0.03125rem;
    }

    .source-badge {
        font-size: 0.6rem;
        margin-right: 0.5rem;
        opacity: 0.6;
        color: var(--color-magenta);
        font-weight: 700;
    }

    .expand-btn {
        font-size: 0.8rem;
        color: var(--text-dim);
    }

    .delete-btn {
        font-size: 1.1rem;
        color: rgba(255, 0, 0, 0.3);
        margin-left: 0.25rem;
    }

    .delete-btn:hover:not(:disabled) {
        color: #ff3333;
        text-shadow: 0 0 0.625rem rgba(255, 0, 0, 0.5);
    }

    /* Sliders */
    .entry-sliders {
        padding: 0.625rem 0.9375rem;
        background: rgba(0, 0, 0, 0.3);
        border-top: var(--glass-border);
        border-bottom: var(--glass-border);
        box-shadow: inset 0 0 0.625rem rgba(0, 243, 255, 0.05);
    }

    .effect-group {
        margin-bottom: 0.75rem;
        border-bottom: 1px solid #ffffff;
        padding-bottom: 0.75rem;
    }

    .effect-group:last-child {
        margin-bottom: 0;
        border-bottom: none;
        padding-bottom: 0;
    }

    .effect-name {
        font-size: 0.7rem;
        color: var(--color-magenta);
        margin-bottom: 0.5rem;
        font-weight: bold;
        text-transform: uppercase;
        letter-spacing: 0.05rem;
    }

    /* Bottom Controls */
    .stack-controls {
        display: flex;
        justify-content: stretch;
        padding: 0;
        border-top: var(--glass-border);
    }

    .stack-btn {
        flex: 1;
        background: transparent;
        border: none;
        border-right: var(--glass-border);
        color: var(--text-dim);
        font-size: 0.7rem;
        font-family: var(--font-mono);
        padding: 0.625rem;
        cursor: pointer;
        text-transform: uppercase;
        border-radius: 0;
        transition: all 0.2s ease;
    }

    .stack-btn:last-child {
        border-right: none;
    }

    .stack-btn:hover:not(:disabled) {
        background: var(--bg-panel-hover);
        color: var(--color-cyan);
        box-shadow: var(--aberration-glow);
    }

    .stack-btn:disabled {
        opacity: 0.3;
        cursor: not-allowed;
    }

    .stack-empty {
        padding: 1.875rem 1.25rem;
        text-align: center;
        font-size: 0.75rem;
        color: var(--text-dim);
        text-transform: uppercase;
        letter-spacing: 0.125rem;
        background: repeating-linear-gradient(
            45deg,
            rgba(0, 0, 0, 0.4),
            rgba(0, 0, 0, 0.4) 0.3125rem,
            rgba(0, 243, 255, 0.02) 0.3125rem,
            rgba(0, 243, 255, 0.02) 0.625rem
        );
    }

    .stack-btn.secondary {
        font-size: 0.65rem;
        opacity: 0.7;
    }

    .stack-footer {
        padding: 1rem;
        margin-top: auto;
        border-top: var(--glass-border);
        background: rgba(0, 0, 0, 0.2);
    }

    .rerun-btn {
        width: 100%;
        padding: 1rem;
        background: var(--bg-glass);
        border: 1px solid var(--color-magenta);
        color: var(--color-magenta);
        font-family: var(--font-pixel);
        font-size: 0.9rem;
        font-weight: bold;
        text-transform: uppercase;
        letter-spacing: 0.1rem;
        cursor: pointer;
        transition: all 0.2s;
        box-shadow: 0 0 10px rgba(255, 0, 255, 0.1);
        position: relative;
        overflow: hidden;
    }

    .rerun-btn:hover:not(:disabled) {
        background: var(--color-magenta);
        color: var(--bg-void);
        box-shadow: 0 0 20px rgba(255, 0, 255, 0.4);
    }

    .rerun-btn:active:not(:disabled) {
        transform: scale(0.98);
    }

    .rerun-btn:disabled {
        opacity: 0.3;
        cursor: not-allowed;
        border-color: var(--text-dim);
        color: var(--text-dim);
        box-shadow: none;
    }

    /* Glitch line on hover */
    .rerun-btn:hover:not(:disabled)::after {
        content: "";
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 2px;
        background: #fff;
        animation: rerun-scanline 1s linear infinite;
    }

    @keyframes rerun-scanline {
        0% {
            transform: translateY(-10px);
        }
        100% {
            transform: translateY(60px);
        }
    }
</style>
