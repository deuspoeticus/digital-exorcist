<script lang="ts">
    import { aiStatus, isNeuralLinkPresent, nanoState } from "$lib/stores/appStore";
    import { auditStore } from "$lib/stores/auditStore";
    import { aiAgent } from "$lib/services/aiAgent";
    import { CLAUDE_LABEL } from "$lib/ai/claude";
    import NanoSummoner from "./NanoSummoner.svelte";
    import { base } from "$app/paths";

    $: linkPresent = $isNeuralLinkPresent;
    $: isClaude = $aiStatus === "claude";
    $: isNano = linkPresent && !isClaude;
    $: model = isClaude ? CLAUDE_LABEL : isNano ? "Gemini Nano" : "none";
    $: uplink = isClaude ? "anthropic" : isNano ? "local" : "severed";
    $: stateLabel = isClaude ? "bound" : $aiStatus === "initializing" ? "waking" : linkPresent ? $aiStatus : "severed";

    // Bring-your-own Anthropic key
    let showKeyForm = false;
    let keyInput = "";
    let binding = false;
    let keyError = "";

    async function bindKey() {
        if (binding || !keyInput.trim()) return;
        binding = true;
        keyError = "";
        try {
            await aiAgent.bindClaudeKey(keyInput);
            keyInput = "";
            showKeyForm = false;
        } catch (err) {
            keyError = err instanceof Error ? err.message : String(err);
        } finally {
            binding = false;
        }
    }

    $: nanoOffer = $nanoState === "downloadable" || $nanoState === "downloading";
    $: noLocalModel = $nanoState === "unsupported" || $nanoState === "unavailable";
</script>

<div class="pane">
    <div class="section-head">
        <span class="seal" class:live={linkPresent}></span>
        <span class="rubric-label">oracle</span>
        <span class="state" class:severed={!linkPresent}>{stateLabel}</span>
    </div>

    <dl class="ledger" class:dim={!linkPresent}>
        <dt>model</dt>
        <dd>{model}</dd>
        <dt>uplink</dt>
        <dd>{uplink}</dd>
        {#if linkPresent}
            <dt>tokens in</dt>
            <dd>{$auditStore.inputTokens.toLocaleString()}</dd>
            <dt>tokens out</dt>
            <dd>{$auditStore.outputTokens.toLocaleString()}</dd>
        {/if}
    </dl>

    {#if !linkPresent && noLocalModel}
        <p class="fine-print no-local">
            {$nanoState === "unsupported"
                ? "No built-in AI in this browser."
                : "This device can't host Gemini Nano."}
            <a href="{base}/setup">Setup guide</a>
        </p>
    {/if}

    {#if isClaude}
        <div class="pane-actions">
            <button class="btn-sm btn-rubric" on:click={() => aiAgent.severClaudeKey()}>
                Sever uplink
            </button>
        </div>
    {/if}
</div>

{#if nanoOffer && (!linkPresent || isClaude)}
    <div class="pane">
        <div class="sub-label rubric-label">
            {isClaude ? "go local instead" : "local spirit"}
        </div>
        <NanoSummoner compact />
    </div>
{/if}

{#if !linkPresent}
    <div class="pane">
        <button
            class="disclosure"
            aria-expanded={showKeyForm}
            on:click={() => (showKeyForm = !showKeyForm)}
        >
            <span class="tri" class:open={showKeyForm}></span>
            <span class="rubric-label">bind an anthropic key</span>
        </button>

        {#if showKeyForm}
            <form class="key-form" on:submit|preventDefault={bindKey}>
                <div class="key-row">
                    <input
                        id="anthropic-key"
                        type="password"
                        autocomplete="off"
                        spellcheck="false"
                        placeholder="sk-ant-…"
                        aria-label="Anthropic API key"
                        bind:value={keyInput}
                        disabled={binding}
                    />
                    <button
                        type="submit"
                        class="btn-sm btn-emboss"
                        disabled={binding || !keyInput.trim()}
                    >
                        {binding ? "…" : "Bind"}
                    </button>
                </div>
                {#if keyError}
                    <p class="key-error">{keyError}</p>
                {/if}
                <p class="fine-print">
                    Uses {CLAUDE_LABEL}, billed to your key. Stored only in
                    this browser. Prompts go to Anthropic; images never leave.
                </p>
            </form>
        {/if}
    </div>
{/if}

<style>
    .no-local {
        margin-top: 0.75rem;
    }

    .no-local a {
        color: var(--bone-3);
        text-decoration: none;
        border-bottom: 1px solid var(--bone-5);
        white-space: nowrap;
    }

    .no-local a:hover {
        color: var(--bone);
    }

    .state.severed {
        color: var(--rubric-hi);
    }

    .ledger.dim dd {
        color: var(--bone-4);
    }

    .sub-label {
        font-size: 0.8125rem;
        margin-bottom: 0.5rem;
    }

    .disclosure {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        width: 100%;
        padding: 0;
        border: none;
        background: none;
        text-transform: none;
        letter-spacing: normal;
    }

    .disclosure:hover:not(:disabled) {
        background: none;
    }

    .disclosure .rubric-label {
        font-size: 0.8125rem;
    }

    .disclosure:hover .rubric-label {
        color: var(--bone);
    }

    /* A plain triangle, rotated when open */
    .tri {
        width: 0;
        height: 0;
        border-left: 0.3rem solid var(--bone-3);
        border-top: 0.25rem solid transparent;
        border-bottom: 0.25rem solid transparent;
        transition: transform var(--dur) var(--ease);
    }

    .tri.open {
        transform: rotate(90deg);
    }

    .key-form {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        margin-top: 0.75rem;
    }

    .key-row {
        display: flex;
        gap: 0.375rem;
    }

    .key-row input {
        flex: 1;
        min-width: 0;
        font-size: var(--text-sm);
        padding: 0.3rem 0.5rem;
    }

    .key-error {
        margin: 0;
        font-size: var(--text-xs);
        color: var(--rubric-hi);
    }
</style>
