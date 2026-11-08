<script lang="ts">
    export let label: string;
    export let numeral = "";
    export let presets: Record<string, string>;
    export let disabled = false;
    export let chipStyle = "";
    export let category = "";

    import { createEventDispatcher } from "svelte";

    // Deterministic hand-applied tilt per label, between about -1.6° and +1.6°.
    function tilt(name: string): number {
        let h = 0;
        for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) | 0;
        return ((Math.abs(h) % 7) - 3) * 0.55;
    }
    const dispatch = createEventDispatcher<{
        select: { label: string; command: string };
    }>();
</script>

<section class="presets-row">
    <h3 class="presets-label">
        {#if numeral}<span class="numeral">{numeral}</span>{/if}
        <span class="rubric-label">{label}</span>
    </h3>
    <div class="chips" class:spellbook-chips={category === "spellbook"}>
        {#each Object.entries(presets) as [name, command]}
            <button
                class="chip {category}"
                style="{chipStyle}{category === 'spellbook' ? `--tilt: ${tilt(name)}deg;` : ''}"
                {disabled}
                title={command}
                on:click={() => dispatch("select", { label: name, command })}
                >{category === "spellbook" ? name.toUpperCase() : name.toLowerCase()}</button
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
        font-family: var(--font-pixel);
        font-size: var(--text-xs);
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

    .chip {
        position: relative;
        padding: 0.25rem 0.5rem;
        font-size: var(--text-sm);
        text-transform: lowercase;
        letter-spacing: 0.02em;
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

    /* Spellbook: DYMO tape. Red plastic, raised letters, stuck on by hand.
       The punk label-maker meets the embossed rubric. */
    .spellbook-chips {
        gap: 0.5rem 0.4rem;
    }

    .chip.spellbook {
        overflow: hidden;
        padding: 0.3rem 0.6rem 0.28rem;
        border: none;
        font-family: var(--font-mono);
        font-weight: 700;
        font-size: 0.625rem;
        letter-spacing: 0.16em;
        text-transform: uppercase;
        /* stressed plastic turns the raised letters whitish */
        color: rgba(255, 236, 230, 0.94);
        background: linear-gradient(180deg, #d0352a 0%, #ad2219 48%, #8a170f 100%);
        text-shadow:
            0 1px 0 rgba(60, 4, 0, 0.75),
            0 -1px 0 rgba(255, 255, 255, 0.28);
        box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.32),
            inset 0 -1px 0 rgba(0, 0, 0, 0.4),
            0 1px 0 rgba(0, 0, 0, 0.8),
            0 3px 6px rgba(0, 0, 0, 0.55);
        transform: rotate(var(--tilt, 0deg));
        transition:
            transform 220ms var(--ease),
            box-shadow 220ms var(--ease),
            filter 220ms var(--ease);
    }

    /* Gloss on the upper half of the tape */
    .chip.spellbook::before {
        content: "";
        position: absolute;
        inset: 0 0 52% 0;
        background: linear-gradient(180deg, rgba(255, 255, 255, 0.22), rgba(255, 255, 255, 0.04));
        pointer-events: none;
    }

    /* A glint that sweeps across on hover */
    .chip.spellbook::after {
        content: "";
        position: absolute;
        top: 0;
        bottom: 0;
        left: -60%;
        width: 40%;
        background: linear-gradient(100deg, transparent, rgba(255, 255, 255, 0.45), transparent);
        transform: skewX(-18deg);
        opacity: 0;
        pointer-events: none;
    }

    .chip.spellbook:hover:not(:disabled) {
        color: #fff;
        background: linear-gradient(180deg, #e0423a 0%, #bd281e 48%, #951910 100%);
        transform: rotate(0deg) translateY(-2px) scale(1.04);
        text-shadow:
            0 1px 0 rgba(60, 4, 0, 0.75),
            -1px 0 0 rgba(110, 200, 220, 0.55),
            1px 0 0 rgba(255, 240, 120, 0.35);
        box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.4),
            inset 0 -1px 0 rgba(0, 0, 0, 0.4),
            0 0 0.9rem rgba(224, 55, 44, 0.55),
            0 6px 12px rgba(0, 0, 0, 0.6);
    }

    .chip.spellbook:hover:not(:disabled)::after {
        opacity: 1;
        animation: glint 0.7s var(--ease) forwards;
    }

    @keyframes glint {
        to { left: 130%; }
    }

    .chip.spellbook:active:not(:disabled) {
        transform: rotate(0deg) translateY(0) scale(0.98);
        filter: brightness(0.85);
        box-shadow:
            inset 0 2px 3px rgba(0, 0, 0, 0.5),
            0 1px 0 rgba(0, 0, 0, 0.8);
    }

    .chip.spellbook:disabled {
        opacity: 0.45;
        filter: saturate(0.4);
    }
</style>
