<script lang="ts">
    /** Plain geometry: circle, square, cross. Drawn in hairlines. */
    export let size = 96;
    export let spinning = false;
</script>

<svg
    class="sigil"
    class:spinning
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    aria-hidden="true"
>
    <circle cx="50" cy="50" r="47" />
    <rect x="17" y="17" width="66" height="66" transform="rotate(45 50 50)" />
    <circle cx="50" cy="50" r="23" />
    <line x1="50" y1="3" x2="50" y2="97" />
    <line x1="3" y1="50" x2="97" y2="50" class="faint" />
    <circle cx="50" cy="50" r="2.5" class="core" />
</svg>

<style>
    .sigil {
        stroke: var(--bone-4);
        stroke-width: 0.6;
        vector-effect: non-scaling-stroke;
        overflow: visible;
    }

    .faint {
        stroke: var(--bone-5);
    }

    .core {
        fill: var(--rubric);
        stroke: none;
    }

    .spinning {
        animation: turn 40s linear infinite;
    }

    @keyframes turn {
        to {
            transform: rotate(360deg);
        }
    }
</style>
