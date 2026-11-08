<script lang="ts">
    export let label: string;
    export let numeral = "";
    export let presets: Record<string, string>;
    export let disabled = false;
    export let chipStyle = "";
    export let category = "";

    import { createEventDispatcher } from "svelte";
    const dispatch = createEventDispatcher<{
        select: { label: string; command: string };
    }>();
</script>

<section class="presets-row">
    <h3 class="presets-label">
        {#if numeral}<span class="numeral">{numeral}</span>{/if}
        <span class="rubric-label">{label}</span>
    </h3>
    <div class="chips">
        {#each Object.entries(presets) as [name, command]}
            <button
                class="chip {category}"
                style={chipStyle}
                {disabled}
                title={command}
                on:click={() => dispatch("select", { label: name, command })}
                >{name.toLowerCase()}</button
            >
        {/each}
    </div>
</section>

<style>
    .presets-row {
        padding: 0.875rem 1rem;
    }

    .presets-row + :global(.presets-row) {
        border-top: var(--hairline);
    }

    .presets-label {
        display: flex;
        align-items: baseline;
        gap: 0.5rem;
        margin: 0 0 0.625rem;
        font-weight: normal;
    }

    .numeral {
        font-family: var(--font-display);
        font-style: italic;
        font-size: 0.9375rem;
        color: var(--rubric-hi);
    }

    .presets-label .rubric-label {
        font-size: 0.9375rem;
        color: var(--bone-2);
    }

    .chips {
        display: flex;
        flex-wrap: wrap;
        gap: 0.3125rem;
    }

    /* The rite's name is sacred (Fell italic); the command it becomes,
       in the stack and terminal, is profane (mono). */
    .chip {
        position: relative;
        padding: 0.125rem 0.55rem 0.2rem;
        font-family: var(--font-display);
        font-style: italic;
        font-size: 0.9375rem;
        line-height: 1.25;
        text-transform: lowercase;
        letter-spacing: 0.01em;
        color: var(--bone-2);
        border: var(--hairline-strong);
        white-space: nowrap;
    }

    /* Glitch detail: a 1px chromatic split on hover */
    .chip:hover:not(:disabled) {
        color: var(--bone);
        border-color: var(--bone-3);
        text-shadow: var(--split);
    }

    .chip:active:not(:disabled) {
        background: var(--bone);
        color: var(--ink-0);
        text-shadow: none;
    }

    /* Codex: marked with a rubric square */
    .chip.codex::before {
        content: "";
        position: absolute;
        top: -1px;
        left: -1px;
        width: 3px;
        height: 3px;
        background: var(--rubric-hi);
    }

    /* Spellbook: the higher rite — embossed ink with a gilt edge. */
    .chip.spellbook {
        color: var(--bone);
        background: var(--emboss-bg);
        border: 1px solid transparent;
        border-image: linear-gradient(135deg, #6f5322 0%, #e3c27a 30%, #8f6d2c 52%, #f2dc9e 74%, #7a5c25 100%) 1;
        box-shadow: var(--emboss-shadow);
    }

    .chip.spellbook:hover:not(:disabled) {
        background: var(--emboss-bg);
        border-image: linear-gradient(135deg, #8a6a2c 0%, #f5d98f 30%, #b08a3c 52%, #fff0bf 74%, #957233 100%) 1;
    }

    .chip.spellbook:active:not(:disabled) {
        background: var(--ink-1);
        color: var(--bone);
        box-shadow: var(--emboss-pressed);
    }
</style>
