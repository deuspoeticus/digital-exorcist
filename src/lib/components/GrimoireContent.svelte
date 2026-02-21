<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import { PRIMITIVES, READY_EFFECTS, SPELLBOOK } from "$lib/ai/config";
    import PresetRow from "./PresetRow.svelte";

    export let disabled = false;

    const dispatch = createEventDispatcher<{
        pushPreset: { label: string; command: string };
    }>();

    function onPresetSelect(
        e: CustomEvent<{ label: string; command: string }>,
    ) {
        dispatch("pushPreset", e.detail);
    }
</script>

<div class="sidebar-content">
    <div class="scroll-area">
        <PresetRow
            label="SIGILS"
            presets={PRIMITIVES}
            {disabled}
            on:select={onPresetSelect}
        />
        <PresetRow
            label="CODEX"
            presets={READY_EFFECTS}
            {disabled}
            category="codex"
            on:select={onPresetSelect}
        />
        <PresetRow
            label="SPELLBOOK"
            presets={SPELLBOOK}
            {disabled}
            category="spellbook"
            on:select={onPresetSelect}
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

    .scroll-area {
        flex: 1;
        overflow-y: auto;
        padding: 0.5rem;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    /* Custom Scrollbar */
    .scroll-area::-webkit-scrollbar {
        width: 0.25rem;
    }

    .scroll-area::-webkit-scrollbar-track {
        background: rgba(255, 255, 255, 0.02);
    }

    .scroll-area::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.2);
        border-radius: 0.125rem;
    }
</style>
