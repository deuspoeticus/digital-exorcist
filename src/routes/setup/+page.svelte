<script lang="ts">
    import { onMount } from "svelte";
    import { base } from "$app/paths";
    import { nanoState } from "$lib/stores/appStore";
    import { gemini } from "$lib/ai/gemini";
    import NanoSummoner from "$lib/components/NanoSummoner.svelte";

    const MIN_CHROME = 148;

    let chromeVersion: number | null = null;
    let isMobile = false;
    let hasApi = false;
    let checking = false;

    async function recheck() {
        checking = true;
        try {
            await gemini.checkAvailability();
        } finally {
            checking = false;
        }
    }

    onMount(() => {
        const match = navigator.userAgent.match(/Chrome\/(\d+)/);
        chromeVersion = match ? parseInt(match[1], 10) : null;
        isMobile = /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent);
        // @ts-ignore — Prompt API global
        hasApi = typeof LanguageModel !== "undefined";
        recheck();
    });

    type Verdict = "ok" | "bad" | "wait";

    $: browserVerdict = (
        chromeVersion === null || isMobile
            ? "bad"
            : chromeVersion >= MIN_CHROME
              ? "ok"
              : "bad"
    ) as Verdict;

    $: deviceVerdict = (
        $nanoState === "ready" || $nanoState === "downloadable"
            ? "ok"
            : $nanoState === "downloading" || $nanoState === "checking"
              ? "wait"
              : "bad"
    ) as Verdict;

    $: modelVerdict = (
        $nanoState === "ready"
            ? "ok"
            : $nanoState === "downloading" || $nanoState === "checking"
              ? "wait"
              : "bad"
    ) as Verdict;

    const MARK: Record<Verdict, string> = { ok: "✦", bad: "✕", wait: "…" };
</script>

<svelte:head>
    <title>Neural Link Setup · The Digital Exorcist</title>
</svelte:head>

<main class="container">
    <h1 class="misreg" data-text="Neural Link Setup">Neural Link Setup</h1>
    <p class="intro">
        The Exorcist hears your vibes through <strong>Gemini Nano</strong>, the
        AI model built into desktop Chrome. It runs entirely on your machine,
        costs nothing, and your words never leave the browser.
    </p>

    <section class="panel">
        <h2>Diagnostics</h2>
        <ul class="checks">
            <li class={browserVerdict}>
                <span class="mark">{MARK[browserVerdict]}</span>
                <span class="label">Browser</span>
                <span class="detail">
                    {#if chromeVersion === null}
                        Not Chrome. Gemini Nano needs desktop Chrome {MIN_CHROME}+.
                    {:else if isMobile}
                        Mobile Chrome ({chromeVersion}) has no built-in AI. Use a desktop.
                    {:else if chromeVersion < MIN_CHROME}
                        Chrome {chromeVersion}. Update to {MIN_CHROME}+ at <code>chrome://settings/help</code>.
                    {:else}
                        Chrome {chromeVersion}
                    {/if}
                </span>
            </li>
            <li class={hasApi ? "ok" : "bad"}>
                <span class="mark">{MARK[hasApi ? "ok" : "bad"]}</span>
                <span class="label">Prompt API</span>
                <span class="detail">
                    {hasApi ? "Present" : "Missing in this browser"}
                </span>
            </li>
            <li class={deviceVerdict}>
                <span class="mark">{MARK[deviceVerdict]}</span>
                <span class="label">Device</span>
                <span class="detail">
                    {#if $nanoState === "unavailable"}
                        Chrome says this device can't run the model.
                    {:else if $nanoState === "unsupported"}
                        —
                    {:else if deviceVerdict === "ok"}
                        Qualifies
                    {:else}
                        Checking...
                    {/if}
                </span>
            </li>
            <li class={modelVerdict}>
                <span class="mark">{MARK[modelVerdict]}</span>
                <span class="label">Model</span>
                <span class="detail">
                    {#if $nanoState === "ready"}
                        Installed
                    {:else if $nanoState === "downloading"}
                        Downloading
                    {:else if $nanoState === "downloadable"}
                        Not downloaded yet
                    {:else}
                        —
                    {/if}
                </span>
            </li>
        </ul>
        <button class="ghost" on:click={recheck} disabled={checking}>
            {checking ? "Checking..." : "Check again"}
        </button>
    </section>

    <section class="panel">
        <h2>Summon</h2>
        <NanoSummoner />
    </section>

    <section class="panel">
        <h2>If it won't bind</h2>
        <ul class="tips">
            <li>
                Open <code>chrome://on-device-internals</code> to see the model
                status and why a device doesn't qualify.
            </li>
            <li>
                The download needs plenty of free disk space (Chrome asks for
                about 22 GB on the drive holding your profile) and an unmetered
                connection.
            </li>
            <li>
                Weak hardware is refused by default. You can force it with
                <code>chrome://flags/#optimization-guide-on-device-model</code>
                set to <em>Enabled BypassPerfRequirement</em>, then relaunch.
                Expect it to be slow.
            </li>
            <li>
                No luck? Bind your own Anthropic API key in the Neural Link
                panel instead.
            </li>
        </ul>
    </section>

    <a href="{base}/" class="btn">&larr; Return to the Altar</a>
</main>

<style>
    .container {
        padding: 2rem 1rem;
        font-family: var(--font-mono);
        max-width: 48rem;
        margin: 0 auto;
        color: var(--text-bright);
        line-height: 1.6;
    }

    h1 {
        font-family: var(--font-blackletter);
        font-weight: 400;
        font-size: clamp(2.25rem, 7vw, 3.25rem);
        line-height: 1.05;
        color: var(--bone);
        margin: 0 0 1rem;
    }

    h2 {
        font-family: var(--font-sc);
        text-transform: lowercase;
        font-weight: 500;
        font-size: 1.125rem;
        letter-spacing: 0.12em;
        color: var(--bone-2);
        margin: 0 0 1rem;
    }

    .intro {
        color: var(--text-dim);
        margin-bottom: 2rem;
    }

    .panel {
        background: var(--bg-glass);
        border: var(--glass-border);
        backdrop-filter: blur(0.5rem);
        padding: 1.25rem;
        margin-bottom: 1.25rem;
    }

    .checks {
        list-style: none;
        padding: 0;
        margin: 0 0 1rem;
        display: grid;
        gap: 0.5rem;
        font-size: 0.8rem;
    }

    .checks li {
        display: grid;
        grid-template-columns: 1.5rem 7rem 1fr;
        align-items: baseline;
    }

    .mark {
        font-weight: 900;
    }

    .checks li.ok .mark {
        color: var(--bone);
    }

    .checks li.bad .mark {
        color: var(--color-magenta);
    }

    .checks li.wait .mark {
        color: var(--text-dim);
    }

    .label {
        color: var(--text-dim);
    }

    .tips {
        padding-left: 1.25rem;
        margin: 0;
        font-size: 0.8rem;
        color: var(--text-dim);
        display: grid;
        gap: 0.5rem;
    }

    code {
        color: var(--color-magenta);
        word-break: break-all;
    }

    .ghost {
        background: transparent;
        border: var(--glass-border);
        color: var(--text-dim);
        font-family: var(--font-mono);
        font-size: 0.7rem;
        padding: 0.25rem 0.75rem;
        cursor: pointer;
    }

    .ghost:hover:not(:disabled) {
        border-color: var(--color-cyan);
        color: var(--color-cyan);
    }

    .btn {
        display: inline-block;
        margin-top: 1rem;
        color: var(--bone);
        border: 1px solid var(--bone-3);
        padding: 0.6rem 1.25rem;
        text-decoration: none;
        font-weight: 700;
        letter-spacing: 0.05em;
    }

    .btn:hover {
        background: var(--bone);
        color: var(--ink-0);
    }

    @media (max-width: 30rem) {
        .checks li {
            grid-template-columns: 1.5rem 1fr;
        }
        .checks li .detail {
            grid-column: 2;
        }
    }
</style>
