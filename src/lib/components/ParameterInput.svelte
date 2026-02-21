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
        grid-template-columns: 5rem 1fr;
        align-items: center;
        gap: 0.75rem;
        margin-bottom: 0.5rem;
    }

    .param-row:last-child {
        margin-bottom: 0;
    }

    .param-label {
        font-size: 0.65rem;
        color: var(--color-cyan);
        opacity: 0.7;
        text-transform: uppercase;
        letter-spacing: 0.0625rem;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .param-cltl {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    /* Range Slider */
    input[type="range"] {
        flex: 1;
        height: 0.25rem;
        background: rgba(255, 255, 255, 0.1);
        accent-color: var(--color-cyan);
        cursor: pointer;
        appearance: none;
        border-radius: 0.125rem;
    }

    input[type="range"]::-webkit-slider-thumb {
        appearance: none;
        width: 0.625rem;
        height: 0.625rem;
        background: var(--color-cyan);
        box-shadow: 0 0 0.3125rem var(--color-cyan);
        border-radius: 0;
        cursor: pointer;
        transition: transform 0.1s;
    }

    input[type="range"]::-webkit-slider-thumb:hover {
        transform: scale(1.2);
    }

    /* Color Input */
    input[type="color"] {
        width: 1.5rem;
        height: 1.5rem;
        background: none;
        border: 1px solid rgba(255, 255, 255, 0.2);
        cursor: pointer;
        padding: 0;
    }

    .color-wrap {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        flex: 1;
    }

    /* Select */
    select {
        flex: 1;
        background: rgba(0, 0, 0, 0.5);
        border: 1px solid rgba(255, 255, 255, 0.1);
        color: var(--text-bright);
        font-family: var(--font-mono);
        font-size: 0.7rem;
        padding: 0.125rem 0.25rem;
    }

    /* Text Input */
    .text-input {
        flex: 1;
        background: rgba(0, 0, 0, 0.5);
        border: 1px solid rgba(255, 255, 255, 0.1);
        color: var(--text-bright);
        font-family: var(--font-mono);
        font-size: 0.7rem;
        padding: 0.125rem 0.25rem;
    }

    .param-value {
        font-size: 0.65rem;
        color: var(--text-bright);
        text-align: right;
        font-family: var(--font-mono);
        min-width: 2.5rem;
    }
</style>
