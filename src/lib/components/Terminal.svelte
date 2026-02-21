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
                    <span class="prompt">></span>
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
            <span class="prompt">$</span>
            <input
                type="text"
                bind:value={input}
                placeholder="Commune with the machine..."
                disabled={isProcessing}
                on:focus={() => (isFocused = true)}
                on:blur={() => (isFocused = false)}
            />
            <button
                type="button"
                class="expand-toggle"
                on:click={toggleExpand}
                title={isExpanded ? "Minimize Log" : "Expand Log"}
            >
                {isExpanded ? "▼" : "▲"}
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
        height: auto;
        color: var(--text-bright);
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

    /* State B Gradient */
    .typing .backdrop {
        background: linear-gradient(
            to top,
            rgba(5, 0, 10, 0.9) 0%,
            transparent 100%
        );
    }

    /* State C Glass Pane */
    .expanded .backdrop {
        background: var(--bg-void);
        backdrop-filter: blur(1.25rem) saturate(140%);
        border-top: var(--glass-border);
        opacity: 0.95;
    }

    .history-layer {
        position: relative;
        z-index: 2;
        padding: 0.5rem 1.5rem 0;
        display: flex;
        flex-direction: column;
        justify-content: flex-end;
        transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1);
        max-height: 12.5rem;
    }

    .expanded .history-layer {
        flex: 1;
        max-height: 100%;
        overflow-y: auto;
        justify-content: flex-start;
        pointer-events: auto;
    }

    /* The Ascending Fade */
    .history-fade-container {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        -webkit-mask-image: none;
        mask-image: none;
    }

    .should-fade .history-fade-container {
        -webkit-mask-image: linear-gradient(
            to top,
            black 70%,
            transparent 100%
        );
        mask-image: linear-gradient(to top, black 70%, transparent 100%);
    }

    .expanded .history-fade-container {
        -webkit-mask-image: none;
        mask-image: none;
    }

    .log-line {
        font-size: 0.85rem;
        line-height: 1.4;
        word-break: break-all;
        text-shadow: 0 0 0.3125rem rgba(0, 0, 0, 0.5);
        color: var(--text-dim);
    }

    .log-line.old {
        opacity: 0.4;
    }

    .log-system {
        color: var(--color-cyan);
    }

    .log-ai {
        color: var(--color-magenta);
    }

    .log-user {
        color: var(--text-bright);
    }

    .log-error {
        color: #ff3333;
    }

    .log-tag {
        font-weight: bold;
        margin-right: 0.25rem;
        opacity: 0.8;
    }

    .log-content {
        color: var(--text-bright);
    }

    .input-anchor {
        position: relative;
        z-index: 10;
        padding: 0.25rem 0.5rem 0.5rem;
        pointer-events: auto;
    }

    .input-area {
        display: flex;
        align-items: center;
        background: var(--bg-glass);
        backdrop-filter: blur(1rem) saturate(140%);
        border: 0.0625rem solid var(--color-cyan);
        padding: 0 1rem;
        height: 3rem;
        box-shadow: var(--aberration-glow);
        transition: all 0.5s ease;
    }

    .ghost-terminal.unstable .input-area {
        border-color: var(--color-magenta);
    }

    .prompt {
        color: var(--color-cyan);
        margin-right: 0.75rem;
        font-weight: bold;
    }

    input {
        flex: 1;
        background: transparent;
        border: none;
        color: var(--text-bright);
        font-family: inherit;
        font-size: 0.95rem;
        outline: none;
        caret-color: var(--color-magenta);
    }

    input::placeholder {
        color: var(--text-dim);
        font-style: italic;
    }

    .expand-toggle {
        background: transparent;
        border: none;
        color: var(--text-dim);
        cursor: pointer;
        font-size: 1rem;
        padding: 0.5rem;
        transition: color 0.2s;
    }

    .expand-toggle:hover {
        color: var(--color-cyan);
    }

    .history-layer.scrollable::-webkit-scrollbar {
        width: 0.375rem;
    }
    .history-layer.scrollable::-webkit-scrollbar-thumb {
        background: var(--bg-glass);
        border: 0.0625rem solid var(--bg-void);
    }
</style>
