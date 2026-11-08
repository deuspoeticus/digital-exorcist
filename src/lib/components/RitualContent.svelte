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
        display: flex;
        flex-direction: column;
    }
</style>
