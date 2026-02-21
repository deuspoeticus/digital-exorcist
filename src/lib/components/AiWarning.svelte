<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import { isAiReady, status, logs, addLog } from "$lib/stores/appStore";
    import { gemini } from "$lib/ai/gemini";

    const dispatch = createEventDispatcher<{ retry: void }>();

    async function checkAgain() {
        addLog("[System] Re-checking AI availability...");
        await gemini.init();
        if (gemini.status === "ready") {
            addLog("[System] AI Core: ONLINE (Gemini Nano)");
            isAiReady.set(true);
        } else if (gemini.status === "cloud") {
            addLog("[System] Still using Cloud Fallback.");
        } else {
            addLog(`[System] AI Core: ${gemini.status.toUpperCase()}`);
        }
    }
</script>

{#if !$isAiReady && $status !== "Initializing..."}
    <div class="ai-warning floating">
        <span>
            {#if gemini.status === "cloud"}
                ☁️ <strong>Using Cloud Fallback</strong>
            {:else if gemini.status === "offline"}
                🔴 <strong>AI Offline</strong>
            {:else}
                ⚠️ <strong>Gemini Nano Not Detected</strong>
            {/if}
        </span>
        <div class="actions">
            <button on:click={checkAgain}>Check Again</button>
            <a href="/setup" class="setup-link">Setup</a>
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
