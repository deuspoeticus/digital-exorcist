<script lang="ts">
    import { base } from "$app/paths";
    import { nanoState, nanoProgress, nanoError } from "$lib/stores/appStore";
    import { aiAgent } from "$lib/services/aiAgent";

    /** Compact = one-liners for the Neural Link panel; full = setup page. */
    export let compact = false;

    let summoning = false;

    // Must be a direct click handler: Chrome only starts the download with a user gesture.
    async function summon() {
        if (summoning) return;
        summoning = true;
        try {
            await aiAgent.summonNano();
        } catch {
            // nanoError holds the message
        } finally {
            summoning = false;
        }
    }

    $: percent = $nanoProgress === null ? null : Math.round($nanoProgress * 100);
</script>

<div class="summoner" class:compact>
    {#if $nanoState === "checking"}
        <div class="line dim">Scanning for a local spirit...</div>
    {:else if $nanoState === "unsupported"}
        <div class="line dim">
            No built-in AI in this browser. Gemini Nano needs desktop Chrome
            148 or newer.
        </div>
    {:else if $nanoState === "unavailable"}
        <div class="line dim">
            Chrome says this device can't host Gemini Nano.
            {#if !compact}See <code>chrome://on-device-internals</code> for the
                reason.{/if}
        </div>
    {:else if $nanoState === "downloadable"}
        <button class="summon-btn btn-emboss" on:click={summon} disabled={summoning}>
            {summoning ? "Summoning…" : "Summon Gemini Nano"}
        </button>
        <div class="line dim">
            One-time download of a few GB. Free, and runs entirely on this
            device.
        </div>
    {:else if $nanoState === "downloading"}
        <div class="progress">
            <div class="bar-bg">
                <div
                    class="bar-fill"
                    class:indeterminate={percent === null}
                    style="width: {percent ?? 100}%"
                ></div>
            </div>
            <span class="pct">{percent === null ? "..." : `${percent}%`}</span>
        </div>
        <div class="line dim">
            Downloading Gemini Nano. Keep this tab open.
        </div>
        {#if percent === null && !summoning}
            <!-- Download started elsewhere (another tab / earlier visit): attach to it. -->
            <button class="summon-btn btn-sm" on:click={summon}>Watch progress</button>
        {/if}
    {:else if $nanoState === "ready" && !compact}
        <div class="line ok">Gemini Nano is bound. Fully local.</div>
    {/if}

    {#if $nanoError}
        <div class="line err">{$nanoError}</div>
    {/if}

    {#if compact && ($nanoState === "unsupported" || $nanoState === "unavailable" || $nanoError)}
        <a class="setup-link" href="{base}/setup">Setup guide &rarr;</a>
    {/if}
</div>

<style>
    .summoner {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        font-size: var(--text-md);
    }

    .summoner.compact {
        font-size: var(--text-sm);
    }

    .line {
        margin: 0;
        line-height: 1.5;
    }

    .compact .line.dim {
        font-size: var(--text-xs);
    }

    .dim {
        color: var(--bone-4);
    }

    .ok {
        color: var(--bone);
    }

    .err {
        color: var(--rubric-hi);
        word-break: break-word;
    }

    code {
        color: var(--bone-2);
    }

    .summon-btn {
        padding: 0.55rem 0.75rem;
        font-size: var(--text-sm);
    }

    .summon-btn:disabled {
        cursor: wait;
    }

    .progress {
        display: flex;
        align-items: center;
        gap: 0.625rem;
    }

    .bar-bg {
        flex: 1;
        height: 2px;
        background: var(--bone-5);
        overflow: hidden;
    }

    .bar-fill {
        height: 100%;
        background: var(--bone);
        transition: width 0.3s var(--ease);
    }

    .bar-fill.indeterminate {
        animation: pulse 1.2s infinite;
    }

    .pct {
        min-width: 2.5rem;
        text-align: right;
        font-family: var(--font-pixel);
        font-size: var(--text-xs);
        color: var(--bone-2);
        font-variant-numeric: tabular-nums;
    }

    .setup-link {
        font-size: var(--text-xs);
        color: var(--bone-3);
        text-decoration: none;
        border-bottom: 1px solid var(--bone-5);
        align-self: flex-start;
    }

    .setup-link:hover {
        color: var(--bone);
        border-bottom-color: var(--bone-3);
    }

    @keyframes pulse {
        0%, 100% { opacity: 0.25; }
        50% { opacity: 0.8; }
    }
</style>
