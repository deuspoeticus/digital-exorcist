<script lang="ts">
    export let label: string;
    export let presets: Record<string, string>;
    export let disabled = false;
    export let chipStyle = "";
    export let category = "";

    import { createEventDispatcher } from "svelte";
    const dispatch = createEventDispatcher<{
        select: { label: string; command: string };
    }>();
</script>

<div class="presets-row">
    <span class="presets-label">{label}</span>
    {#each Object.entries(presets) as [name, command]}
        <button
            class="preset-chip {category}"
            style={chipStyle}
            {disabled}
            on:click={() => dispatch("select", { label: name, command })}
            >{name}</button
        >
    {/each}
</div>

<style>
    .presets-row {
        display: flex;
        flex-wrap: wrap;
        gap: 0.375rem;
        align-items: center;
        padding: 0.5rem 0.75rem;
        background: transparent;
        border: none;
    }

    .presets-label {
        font-size: 0.65rem;
        color: var(--color-cyan);
        margin-right: 0.375rem; /* Same as gap */
        text-transform: uppercase;
        letter-spacing: 0.125rem;
        font-weight: 700;
        opacity: 0.7;
        white-space: nowrap;
    }

    .preset-chip {
        background: var(--bg-glass);
        border: 0.0625rem solid rgba(255, 255, 255, 0.1);
        color: var(--text-dim);
        font-size: 0.7rem;
        font-family: var(--font-mono);
        padding: 0.25rem; /* Horizontal padding equal to vertical */
        border-radius: 0; /* Rectangular look */
        border-style: solid;
        border-width: 0.0625rem;
        cursor: pointer;
        text-transform: lowercase;
        transition: all 0.2s cubic-bezier(0.23, 1, 0.32, 1);
        white-space: nowrap;
    }

    .preset-chip:hover:not(:disabled) {
        background: var(--bg-panel-hover);
        color: var(--color-cyan);
        border-color: var(--color-cyan);
        box-shadow: var(--aberration-glow);
        transform: translateY(-0.0625rem);
    }

    .preset-chip:active:not(:disabled) {
        transform: translateY(0);
        background: var(--color-magenta);
        color: var(--bg-void);
        border-color: var(--color-magenta);
    }

    .preset-chip:disabled {
        opacity: 0.3;
        cursor: not-allowed;
        border-color: rgba(255, 255, 255, 0.05);
        color: var(--text-dim);
    }

    /* Spellbook Special Styles */
    .preset-chip.spellbook {
        color: #ffffff;
        border-image: linear-gradient(
                45deg,
                #bf953f,
                #fcf6ba,
                #b38728,
                #fbf5b7,
                #aa771c
            )
            1;
        border-color: transparent;
    }

    .preset-chip.spellbook:hover:not(:disabled) {
        background: linear-gradient(
            90deg,
            rgba(191, 149, 63, 0.2),
            rgba(252, 246, 186, 0.4),
            rgba(191, 149, 63, 0.2)
        );
        background-size: 200% 100%;
        animation: gold-shimmer 2s infinite linear;
        border-color: #fcf6ba;
        color: #ffffff;
        box-shadow: 0 0 1rem rgba(191, 149, 63, 0.3);
    }

    @keyframes gold-shimmer {
        0% {
            background-position: 200% 0;
        }
        100% {
            background-position: -200% 0;
        }
    }

    /* Codex Special Styles */
    .preset-chip.codex {
        border-color: var(--color-magenta);
        color: var(--text-bright);
    }

    .preset-chip.codex:hover:not(:disabled) {
        background: var(--color-magenta);
        border-color: var(--color-magenta);
        color: #ffffff;
        box-shadow: 0 0 1rem rgba(255, 0, 255, 0.4);
    }
</style>
