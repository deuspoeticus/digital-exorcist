<script lang="ts">
    import { systemStability } from "$lib/stores/appStore";
    export let className = "";
</script>

<!-- A folio: flat ink, one hairline, a faint bevel. -->
<div
    class="folio {className}"
    class:unstable={$systemStability === "unstable"}
>
    <slot />
</div>

<style>
    .folio {
        position: relative;
        background: var(--bg-glass);
        border: var(--hairline);
        box-shadow:
            var(--bevel),
            0 1.5rem 3rem rgba(0, 0, 0, 0.55);
        color: var(--bone);
        overflow: hidden;
        transition: border-color 0.4s var(--ease);
    }

    .folio.unstable {
        border-color: var(--rubric);
    }
</style>
