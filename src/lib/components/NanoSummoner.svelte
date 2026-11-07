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
        <button class="summon-btn" on:click={summon} disabled={summoning}>
            {summoning ? "SUMMONING..." : "SUMMON GEMINI NANO"}
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
            <button class="summon-btn" on:click={summon}>WATCH PROGRESS</button>
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
        gap: 0.4rem;
        font-family: var(--font-mono);
        font-size: 0.8rem;
    }

    .summoner.compact {
        font-size: 0.7rem;
    }

    .line {
        line-height: 1.4;
    }

    .compact .line.dim {
        font-size: 0.6rem;
    }

    .dim {
        color: var(--text-dim);
        opacity: 0.8;
    }

    .ok {
        color: var(--color-cyan);
    }

    .err {
        color: var(--color-magenta);
        word-break: break-word;
    }

    code {
        color: var(--color-magenta);
    }

    .summon-btn {
        background: color-mix(in srgb, var(--color-cyan), transparent 88%);
        border: 0.0625rem solid var(--color-cyan);
        color: var(--color-cyan);
        font-family: var(--font-mono);
        font-weight: 700;
        font-size: inherit;
        letter-spacing: 0.05em;
        padding: 0.4rem 0.75rem;
        cursor: pointer;
        transition: all 0.2s;
    }

    .summon-btn:hover:not(:disabled) {
        background: var(--color-cyan);
        color: var(--bg-void);
        box-shadow: 0 0 0.625rem var(--color-cyan);
    }

    .summon-btn:disabled {
        opacity: 0.5;
        cursor: wait;
    }

    .progress {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .bar-bg {
        flex: 1;
        height: 0.375rem;
        background: rgba(255, 255, 255, 0.05);
        border: 0.0625rem solid rgba(255, 255, 255, 0.1);
        overflow: hidden;
    }

    .bar-fill {
        height: 100%;
        background: var(--color-cyan);
        box-shadow: 0 0 0.5rem var(--color-cyan);
        transition: width 0.3s ease;
    }

    .bar-fill.indeterminate {
        animation: pulse 1s infinite;
    }

    .pct {
        color: var(--text-bright);
        font-variant-numeric: tabular-nums;
        min-width: 2.5rem;
        text-align: right;
    }

    .setup-link {
        color: var(--color-cyan);
        font-size: 0.6rem;
        text-decoration: none;
        opacity: 0.8;
    }

    .setup-link:hover {
        opacity: 1;
        text-decoration: underline;
    }

    @keyframes pulse {
        0%,
        100% {
            opacity: 0.3;
        }
        50% {
            opacity: 0.9;
        }
    }
</style>
