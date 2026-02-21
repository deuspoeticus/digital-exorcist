<script lang="ts">
    import { systemStability } from "$lib/stores/appStore";
    export let className = "";
</script>

<div
    class="glass-panel {className}"
    class:unstable={$systemStability === "unstable"}
>
    <div class="noise-overlay"></div>
    <div class="scratch-overlay"></div>
    <div class="content">
        <slot />
    </div>
</div>

<style>
    .glass-panel {
        position: relative;
        background: var(--bg-glass);
        border: var(--glass-border);
        backdrop-filter: blur(1rem) saturate(140%);
        box-shadow: 0 0.25rem 1.875rem rgba(0, 0, 0, 0.5);
        overflow: hidden;
        color: var(--text-bright);
        transition: all 0.5s ease;
    }

    .glass-panel.unstable {
        border-color: #ff0000; /* Blood Red for unstable */
    }

    .noise-overlay {
        position: absolute;
        inset: 0;
        pointer-events: none;
        opacity: 0.08;
        background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
        z-index: 1;
    }

    .scratch-overlay {
        position: absolute;
        inset: 0;
        pointer-events: none;
        opacity: 0.15;
        background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 500 500' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='scrata'%3E%3CfeTurbulence type='turbulence' baseFrequency='0.05' numOctaves='2' seed='5'/%3E%3CfeDisplacementMap in='SourceGraphic' scale='20'/%3E%3C/filter%3E%3Cpath d='M0,100 L500,105 M50,0 L45,500 M400,0 L410,500' stroke='rgba(255,255,255,0.2)' stroke-width='1' filter='url(%23scrata)'/%3E%3C/svg%3E");
        background-size: 25rem;
        z-index: 1;
    }

    .content {
        position: relative;
        z-index: 2;
        height: 100%;
        width: 100%;
    }
</style>
