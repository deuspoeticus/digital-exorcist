<script lang="ts">
    import type { EffectArgument } from "$lib/stores/appStore";
    import { createEventDispatcher } from "svelte";

    export let arg: EffectArgument;
    export let disabled = false;

    const dispatch = createEventDispatcher<{
        change: number | string;
    }>();

    function onInput(e: Event) {
        const target = e.currentTarget as HTMLInputElement | HTMLSelectElement;
        let val: string | number = target.value;

        if (arg.type === "number") {
            val = parseFloat(val);
        }

        dispatch("change", val);
    }
</script>

<div class="param-row">
    <span class="param-label" title={arg.label}>{arg.label}</span>

    <div class="param-cltl">
        {#if arg.type === "number"}
            <input
                type="range"
                min={arg.min}
                max={arg.max}
                step={arg.step}
                value={arg.value}
                {disabled}
                on:input={onInput}
            />
            <span class="param-value">
                {typeof arg.value === "number"
                    ? arg.value.toFixed(2).replace(/\.00$/, "")
                    : arg.value}{arg.unit ?? ""}
            </span>
        {:else if arg.type === "color"}
            <div class="color-wrap">
                <input
                    type="color"
                    value={arg.value}
                    {disabled}
                    on:input={onInput}
                />
                <span class="param-value">{arg.value}</span>
            </div>
        {:else if arg.type === "select"}
            <select value={arg.value} {disabled} on:change={onInput}>
                {#each arg.options || [] as opt}
                    <option value={opt}>{opt}</option>
                {/each}
            </select>
        {:else}
            <input
                type="text"
                class="text-input"
                value={arg.value}
                {disabled}
                on:input={onInput}
            />
        {/if}
    </div>
</div>

<style>
    .param-row {
        display: grid;
        grid-template-columns: 4.5rem 1fr;
        align-items: center;
        gap: 0.75rem;
    }

    .param-label {
        font-family: var(--font-sc);
        text-transform: lowercase;
        letter-spacing: 0.08em;
        font-size: 0.8125rem;
        color: var(--bone-3);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .param-cltl {
        display: flex;
        align-items: center;
        gap: 0.625rem;
        min-width: 0;
    }

    /* Range: a hairline track and a small square */
    input[type="range"] {
        flex: 1;
        min-width: 0;
        height: 1rem;
        margin: 0;
        background: transparent;
        border: none;
        -webkit-appearance: none;
        appearance: none;
        cursor: pointer;
    }

    input[type="range"]::-webkit-slider-runnable-track {
        height: 1px;
        background: var(--bone-4);
    }

    input[type="range"]::-moz-range-track {
        height: 1px;
        background: var(--bone-4);
    }

    input[type="range"]::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: 0.5rem;
        height: 0.5rem;
        margin-top: calc(-0.25rem + 0.5px);
        background: var(--bone);
        border: none;
        border-radius: 0;
    }

    input[type="range"]::-moz-range-thumb {
        width: 0.5rem;
        height: 0.5rem;
        background: var(--bone);
        border: none;
        border-radius: 0;
    }

    input[type="range"]:hover::-webkit-slider-thumb {
        box-shadow: var(--split);
    }

    input[type="range"]:disabled {
        opacity: 0.35;
        cursor: not-allowed;
    }

    .param-value {
        min-width: 2.75rem;
        text-align: right;
        font-family: var(--font-mono);
        font-size: var(--text-xs);
        color: var(--bone-2);
        font-variant-numeric: tabular-nums;
        white-space: nowrap;
    }

    .color-wrap {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    input[type="color"] {
        width: 1.25rem;
        height: 1.25rem;
        padding: 0;
        border: var(--hairline-strong);
        background: none;
        cursor: pointer;
    }

    select {
        -webkit-appearance: none;
        appearance: none;
        padding-right: 1.25rem;
        cursor: pointer;
        /* plain triangle */
        background-image: linear-gradient(45deg, transparent 50%, var(--bone-3) 50%),
            linear-gradient(135deg, var(--bone-3) 50%, transparent 50%);
        background-position: calc(100% - 0.6rem) 55%, calc(100% - 0.375rem) 55%;
        background-size: 0.25rem 0.25rem;
        background-repeat: no-repeat;
    }

    select,
    .text-input {
        flex: 1;
        min-width: 0;
        padding: 0.2rem 0.375rem;
        font-family: var(--font-mono);
        font-size: var(--text-sm);
        color: var(--bone);
        background-color: var(--ink-0);
        border: var(--hairline-strong);
        border-radius: 0;
    }
</style>
