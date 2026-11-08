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
            numeral="i"
            label="sigils"
            presets={PRIMITIVES}
            {disabled}
            on:select={onPresetSelect}
        />
        <PresetRow
            numeral="ii"
            label="codex"
            presets={READY_EFFECTS}
            {disabled}
            category="codex"
            on:select={onPresetSelect}
        />
        <PresetRow
            numeral="iii"
            label="spellbook"
            presets={SPELLBOOK}
            {disabled}
            category="spellbook"
            on:select={onPresetSelect}
        />
    </div>
</div>

<style>
    .sidebar-content {
        display: flex;
        flex-direction: column;
    }
</style>
