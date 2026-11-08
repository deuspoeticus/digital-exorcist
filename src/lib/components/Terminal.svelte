<script lang="ts">
    import { createEventDispatcher, onMount } from "svelte";
    import { slide, fade } from "svelte/transition";
    import { systemStability } from "$lib/stores/appStore";

    export let logs: string[] = [];
    export let isProcessing = false;

    const dispatch = createEventDispatcher();
    let input = "";
    let terminalEnd: HTMLDivElement;
    let isFocused = false;
    let isExpanded = false;

    function handleSubmit() {
        if (!input.trim() || isProcessing) return;
        dispatch("command", input);
        input = "";
    }

    function toggleExpand() {
        isExpanded = !isExpanded;
    }

    $: visibleLogs = isExpanded
        ? logs
        : isFocused
          ? logs.slice(-10)
          : logs.slice(-2);

    $: if (logs && terminalEnd && isExpanded) {
        setTimeout(() => terminalEnd.scrollIntoView({ behavior: "smooth" }), 0);
    }

    function parseLog(log: string) {
        const match = log.match(/^(\[.*?\])(.*)/);
        if (match) {
            const tag = match[1];
            const content = match[2];
            let type = "system";
            if (tag.includes("AI") || tag.includes("Spirits")) type = "ai";
            if (tag.includes("User")) type = "user";
            if (tag.includes("Error")) type = "error";
            return { tag, content, type };
        }
        return { tag: null, content: log, type: "system" };
    }
</script>

<div
    class="ghost-terminal"
    class:expanded={isExpanded}
    class:typing={isFocused}
    class:should-fade={isFocused && visibleLogs.length > 4}
    class:unstable={$systemStability === "unstable"}
>
    <!-- State B/C Gradient/Glass Backdrop -->
    {#if isFocused || isExpanded}
        <div class="backdrop" transition:fade={{ duration: 300 }}></div>
    {/if}

    <!-- The Ectoplasm (History) -->
    <div class="history-layer" class:scrollable={isExpanded}>
        <div class="history-fade-container">
            {#each visibleLogs as log, i (log + i)}
                {@const parsed = parseLog(log)}
                <div
                    class="log-line log-{parsed.type}"
                    class:old={!isExpanded && i < visibleLogs.length - 3}
                    transition:slide={{ duration: 200 }}
                >
                    <span class="mark" aria-hidden="true">∅</span>
                    {#if parsed.tag}
                        <strong class="log-tag">{parsed.tag}</strong>
                        <span class="log-content">{parsed.content}</span>
                    {:else}
                        {log}
                    {/if}
                </div>
            {/each}
            <div bind:this={terminalEnd}></div>
        </div>
    </div>

    <!-- The Anchor (Input Bar) -->
    <div class="input-anchor">
        <form on:submit|preventDefault={handleSubmit} class="input-area">
            <span class="mark input-mark" aria-hidden="true">∅</span>
            <input
                type="text"
                bind:value={input}
                placeholder="Commune with the machine…"
                aria-label="Describe an effect for the machine"
                disabled={isProcessing}
                on:focus={() => (isFocused = true)}
                on:blur={() => (isFocused = false)}
            />
            <button
                type="button"
                class="expand-toggle"
                on:click={toggleExpand}
                title={isExpanded ? "Collapse log" : "Expand log"}
                aria-label={isExpanded ? "Collapse log" : "Expand log"}
            >
                <span class="tri" class:open={isExpanded}></span>
            </button>
        </form>
    </div>
</div>

<style>
    .ghost-terminal {
        position: relative;
        display: flex;
        flex-direction: column;
        justify-content: flex-end;
        color: var(--bone);
        font-family: var(--font-mono);
        pointer-events: none;
    }

    .ghost-terminal.expanded {
        height: 100%;
    }

    .backdrop {
        position: absolute;
        inset: 0;
        z-index: 1;
        pointer-events: none;
    }

    .expanded .backdrop {
        background: rgba(8, 8, 8, 0.9);
        backdrop-filter: var(--glass-blur);
        border: var(--hairline);
    }

    .history-layer {
        position: relative;
        z-index: 2;
        padding: 0 0.25rem 0.5rem;
        display: flex;
        flex-direction: column;
        justify-content: flex-end;
        max-height: 12.5rem;
    }

    .expanded .history-layer {
        flex: 1;
        max-height: 100%;
        overflow-y: auto;
        justify-content: flex-start;
        pointer-events: auto;
        padding: 0.75rem;
    }

    .history-fade-container {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 2px;
    }

    .should-fade .history-fade-container {
        -webkit-mask-image: linear-gradient(to top, black 70%, transparent 100%);
        mask-image: linear-gradient(to top, black 70%, transparent 100%);
    }

    .expanded .history-fade-container {
        -webkit-mask-image: none;
        mask-image: none;
    }

    /* Subtitle strips: legible over any image */
    .log-line {
        max-width: 100%;
        padding: 0.125rem 0.5rem;
        background: rgba(6, 6, 6, 0.78);
        font-size: var(--text-md);
        line-height: 1.45;
        word-break: break-word;
        color: var(--bone-2);
    }

    .expanded .log-line {
        background: none;
        padding: 0.0625rem 0;
    }

    .log-line.old {
        opacity: 0.45;
    }

    .mark {
        display: inline-block;
        width: 1.4em;
        font-family: var(--font-mono);
        color: var(--rubric-hi);
    }

    .log-tag {
        font-family: var(--font-mono);
        font-weight: normal;
        font-size: var(--text-xs);
        letter-spacing: 0.06em;
        margin-right: 0.375rem;
        color: var(--bone-4);
    }

    .log-content {
        color: var(--bone-2);
    }

    .log-user .log-content,
    .log-ai .log-content {
        color: var(--bone);
    }

    .log-ai .log-tag {
        color: var(--bone-3);
    }

    .log-error .log-tag,
    .log-error .log-content {
        color: var(--rubric-hi);
    }

    .input-anchor {
        position: relative;
        z-index: 10;
        pointer-events: auto;
    }

    /* Liquid glass: the one place the UI turns physical */
    .input-area {
        position: relative;
        display: flex;
        align-items: center;
        height: 2.875rem;
        padding: 0 0.625rem 0 1rem;
        background: var(--glass-bg);
        backdrop-filter: var(--glass-blur);
        -webkit-backdrop-filter: var(--glass-blur);
        border: 1px solid rgba(255, 255, 255, 0.09);
        box-shadow: var(--glass-shadow);
        transition: border-color var(--dur) var(--ease), box-shadow var(--dur) var(--ease);
    }

    .input-area::before {
        content: "";
        position: absolute;
        inset: 0 0 50% 0;
        background: var(--glass-specular);
        pointer-events: none;
    }

    .input-area:focus-within {
        border-color: rgba(255, 255, 255, 0.2);
    }

    .ghost-terminal.unstable .input-area {
        border-color: var(--rubric);
    }

    .input-mark {
        font-size: var(--text-lg);
        margin-right: 0.5rem;
    }

    input {
        position: relative;
        flex: 1;
        background: transparent;
        border: none;
        color: var(--bone);
        font-family: var(--font-mono);
        font-size: var(--text-lg);
        outline: none;
        caret-color: var(--rubric-hi);
    }

    input:focus-visible {
        outline: none;
    }

    input::placeholder {
        font-family: var(--font-display);
        font-style: italic;
        font-size: 1.0625rem;
        color: var(--bone-4);
    }

    .expand-toggle {
        position: relative;
        display: grid;
        place-items: center;
        width: 1.75rem;
        height: 1.75rem;
        padding: 0;
        border: none;
        background: transparent;
    }

    .expand-toggle:hover:not(:disabled) {
        background: transparent;
    }

    .tri {
        width: 0;
        height: 0;
        border-left: 0.3rem solid transparent;
        border-right: 0.3rem solid transparent;
        border-bottom: 0.375rem solid var(--bone-3);
        transition: transform var(--dur) var(--ease);
    }

    .expand-toggle:hover .tri {
        border-bottom-color: var(--bone);
    }

    .tri.open {
        transform: rotate(180deg);
    }
</style>
