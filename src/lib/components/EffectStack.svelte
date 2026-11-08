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
        preset: "grimoire",
        ai: "oracle",
        manual: "writ",
    };
</script>

<div class="stack-container">
    {#if $effectStack.length > 0}
        <div class="stack-header">
            <span class="rubric-label">the stack</span>
            <span class="stack-count"
                >{$effectStack.filter((e) => e.enabled).length} / {$effectStack.length}</span
            >
        </div>

        <ol class="stack-list">
            {#each $effectStack as entry, idx (entry.id)}
                <li class="stack-entry" class:disabled={!entry.enabled}>
                    <div class="entry-header">
                        <span class="idx">{String(idx + 1).padStart(2, "0")}</span>

                        <button
                            class="toggle"
                            class:on={entry.enabled}
                            on:click={() => toggle(entry.id)}
                            disabled={$isProcessing}
                            title={entry.enabled ? "Disable" : "Enable"}
                            aria-label={entry.enabled ? `Disable ${entry.label}` : `Enable ${entry.label}`}
                            aria-pressed={entry.enabled}
                        ><span class="seal" class:bone={entry.enabled}></span></button>

                        <span class="entry-label" title={entry.command}>
                            {entry.label}
                            <span class="source-badge">{sourceBadge[entry.source] ?? entry.source}</span>
                        </span>

                        <div class="entry-tools">
                            <button
                                class="icon-btn"
                                disabled={idx === 0 || $isProcessing}
                                on:click={() => move(entry.id, -1)}
                                title="Move up"
                                aria-label="Move up"
                            ><span class="tri up"></span></button>
                            <button
                                class="icon-btn"
                                disabled={idx === $effectStack.length - 1 || $isProcessing}
                                on:click={() => move(entry.id, 1)}
                                title="Move down"
                                aria-label="Move down"
                            ><span class="tri down"></span></button>
                            {#if entry.effects.length > 0}
                                <button
                                    class="icon-btn"
                                    class:active={expandedId === entry.id}
                                    on:click={() => toggleExpand(entry.id)}
                                    title="Parameters"
                                    aria-label="Parameters"
                                    aria-expanded={expandedId === entry.id}
                                ><span class="bars"></span></button>
                            {/if}
                            <button
                                class="icon-btn delete-btn"
                                on:click={() => remove(entry.id)}
                                disabled={$isProcessing}
                                title="Remove"
                                aria-label={`Remove ${entry.label}`}
                            >×</button>
                        </div>
                    </div>

                    {#if expandedId === entry.id && entry.effects.length > 0}
                        <div class="entry-sliders">
                            {#each entry.effects as effect, i}
                                <div class="effect-group">
                                    {#if effect.args.length > 1}
                                        <div class="effect-name">{effect.name}</div>
                                    {/if}
                                    {#each effect.args as arg, j}
                                        <ParameterInput
                                            {arg}
                                            disabled={$isProcessing}
                                            on:change={(e) => onParamChange(entry.id, i, j, e.detail)}
                                        />
                                    {/each}
                                </div>
                            {/each}
                        </div>
                    {/if}
                </li>
            {/each}
        </ol>

        <div class="stack-footer">
            <button
                class="btn-sm"
                on:click={undo}
                disabled={$isProcessing || $effectStack.length === 0}>Undo</button
            >
            <button class="btn-sm btn-rubric" on:click={clear} disabled={$isProcessing}
                >Clear</button
            >
            <button
                class="recast btn-emboss"
                on:click={rerun}
                disabled={$isProcessing || isClean}
            >
                {$isProcessing ? "Working…" : "Recast"}
            </button>
        </div>
    {:else}
        <div class="stack-empty">
            <p class="verse">The stack is empty.</p>
            <p class="fine-print">Choose a rite from the Grimoire, or speak to the machine below.</p>
        </div>
    {/if}
</div>

<style>
    .stack-header {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        padding: 0.875rem 1rem 0.5rem;
    }

    .stack-header .rubric-label {
        font-size: 0.9375rem;
        color: var(--bone-2);
    }

    .stack-count {
        font-family: var(--font-pixel);
        font-size: var(--text-xs);
        color: var(--bone-3);
    }

    .stack-list {
        list-style: none;
        margin: 0;
        padding: 0;
    }

    .stack-entry {
        border-top: var(--hairline);
    }

    .stack-entry:last-child {
        border-bottom: var(--hairline);
    }

    .entry-header {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        height: 2.25rem;
        padding: 0 0.5rem 0 1rem;
    }

    .idx {
        font-family: var(--font-pixel);
        font-size: var(--text-xs);
        color: var(--bone-4);
        width: 1.25rem;
    }

    .toggle {
        display: grid;
        place-items: center;
        width: 1.25rem;
        height: 1.25rem;
        padding: 0;
        border: none;
        background: none;
    }

    .toggle:hover:not(:disabled) {
        background: none;
    }

    .entry-label {
        flex: 1;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: var(--text-md);
        color: var(--bone);
    }

    .disabled .entry-label {
        color: var(--bone-4);
        text-decoration: line-through;
        text-decoration-color: var(--bone-4);
    }

    .source-badge {
        margin-left: 0.375rem;
        font-family: var(--font-display);
        font-style: italic;
        font-size: 0.8125rem;
        color: var(--bone-4);
    }

    .entry-tools {
        display: flex;
        align-items: center;
        gap: 0.125rem;
        opacity: 0.55;
        transition: opacity var(--dur) var(--ease);
    }

    .stack-entry:hover .entry-tools,
    .entry-tools:focus-within {
        opacity: 1;
    }

    .icon-btn {
        display: grid;
        place-items: center;
        width: 1.375rem;
        height: 1.375rem;
        padding: 0;
        border: none;
        font-size: var(--text-md);
        color: var(--bone-3);
    }

    .icon-btn.active {
        background: var(--bone-6);
    }

    .delete-btn:hover:not(:disabled) {
        color: var(--rubric-hi);
        background: none;
    }

    .tri {
        width: 0;
        height: 0;
        border-left: 0.25rem solid transparent;
        border-right: 0.25rem solid transparent;
    }

    .tri.up {
        border-bottom: 0.3125rem solid var(--bone-3);
    }

    .tri.down {
        border-top: 0.3125rem solid var(--bone-3);
    }

    /* Three hairlines: parameters */
    .bars {
        width: 0.625rem;
        height: 0.4375rem;
        border-top: 1px solid var(--bone-3);
        border-bottom: 1px solid var(--bone-3);
        position: relative;
    }

    .bars::after {
        content: "";
        position: absolute;
        left: 0;
        right: 0;
        top: 50%;
        border-top: 1px solid var(--bone-3);
        transform: translateY(-50%);
    }

    .entry-sliders {
        padding: 0.25rem 1rem 0.875rem 3.25rem;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .effect-name {
        font-family: var(--font-display);
        font-variant: small-caps;
        text-transform: lowercase;
        letter-spacing: 0.1em;
        font-size: 0.8125rem;
        color: var(--bone-3);
        margin-bottom: 0.25rem;
    }

    .stack-footer {
        display: flex;
        gap: 0.375rem;
        padding: 0.875rem 1rem;
    }

    .recast {
        flex: 1;
        padding: 0.5rem;
        font-size: var(--text-sm);
    }

    .stack-empty {
        padding: 1.5rem 1rem 1.25rem;
        text-align: center;
    }

    .verse {
        margin: 0 0 0.375rem;
        font-family: var(--font-display);
        font-style: italic;
        font-size: 1.0625rem;
        color: var(--bone-2);
    }
</style>
