<script lang="ts">
    import { base } from "$app/paths";
    import { isAiReady, status, nanoState } from "$lib/stores/appStore";
    import { aiAgent } from "$lib/services/aiAgent";

    let summoning = false;

    // Direct click handler — Chrome needs the gesture to start the download.
    async function summon() {
        if (summoning) return;
        summoning = true;
        try {
            await aiAgent.summonNano();
        } catch {
            // error is logged and shown in the Neural Link panel
        } finally {
            summoning = false;
        }
    }

    async function checkAgain() {
        await aiAgent.init();
    }
</script>

{#if !$isAiReady && $status !== "Initializing..." && $nanoState !== "checking"}
    <div class="ai-warning floating">
        <span>
            {#if $nanoState === "downloadable"}
                🜏 <strong>Gemini Nano can be summoned</strong>
            {:else if $nanoState === "downloading"}
                ⏳ <strong>Gemini Nano is downloading...</strong>
            {:else}
                🔴 <strong>Neural Link severed</strong>
            {/if}
        </span>
        <div class="actions">
            {#if $nanoState === "downloadable"}
                <button on:click={summon} disabled={summoning}>
                    {summoning ? "Summoning..." : "Summon"}
                </button>
            {:else}
                <button on:click={checkAgain}>Check Again</button>
            {/if}
            <a href="{base}/setup" class="setup-link">Setup</a>
        </div>
    </div>
{/if}

<style>
    .ai-warning.floating {
        position: fixed;
        top: 2rem;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(255, 68, 0, 0.15);
        border: 0.0625rem solid rgba(255, 68, 0, 0.4);
        color: #ffaa88;
        padding: 0.5rem 1rem;
        border-radius: 0.25rem;
        font-size: 0.8rem;
        z-index: 100;
        display: flex;
        gap: 1rem;
        align-items: center;
        backdrop-filter: blur(0.625rem);
    }

    .actions {
        display: flex;
        gap: 1rem;
        align-items: center;
    }

    .actions button {
        background: rgba(255, 68, 0, 0.2);
        border: 0.0625rem solid rgba(255, 68, 0, 0.5);
        color: #ffaa88;
        cursor: pointer;
        padding: 0.125rem 0.5rem;
        font-size: 0.7rem;
        border-radius: 0.25rem;
    }

    .setup-link {
        color: #ffaa88;
        text-decoration: underline;
        cursor: pointer;
    }
</style>
