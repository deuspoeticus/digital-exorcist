<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import EffectStack from "./EffectStack.svelte";

    export let disabled = false;

    const dispatch = createEventDispatcher<{
        export: void;
        audit: void;
        stackChanged: void;
    }>();
</script>

<div class="sidebar-content">
    <div class="stack-wrapper">
        <EffectStack
            on:stackChanged={() => dispatch("stackChanged")}
            on:export={() => dispatch("export")}
        />
    </div>
</div>

<style>
    .sidebar-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        height: 100%;
    }

    .actions-header {
        display: flex;
        gap: -0.0625rem;
        padding: 0;
        border-bottom: var(--glass-border);
        background: var(--bg-glass);
    }

    .action-btn {
        flex: 1;
        background: transparent;
        border: 0.0625rem solid transparent;
        color: var(--text-bright);
        padding: 0.8rem;
        border-radius: 0;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        font-size: 0.8rem;
        font-family: var(--font-mono);
        text-transform: uppercase;
        letter-spacing: 0.0625rem;
        transition: all 0.2s ease;
    }

    .action-btn:hover:not(:disabled) {
        background: var(--bg-panel-hover);
        color: var(--color-cyan);
        border-color: var(--color-cyan);
        box-shadow: var(--aberration-glow);
    }

    .action-btn:disabled {
        opacity: 0.3;
        cursor: not-allowed;
    }

    .export-btn {
        color: var(--color-magenta);
    }

    .export-btn:hover:not(:disabled) {
        color: var(--color-magenta);
        border-color: var(--color-magenta);
        box-shadow: 0 0 0.9375rem
            color-mix(in srgb, var(--color-magenta), transparent 50%);
    }

    .stack-wrapper {
        flex: 1;
        overflow-y: auto;
        padding: 0.5rem;
    }

    /* Custom Scrollbar */
    .stack-wrapper::-webkit-scrollbar {
        width: 0.25rem;
    }

    .stack-wrapper::-webkit-scrollbar-track {
        background: rgba(255, 255, 255, 0.02);
    }

    .stack-wrapper::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.2);
        border-radius: 0.125rem;
    }
</style>
