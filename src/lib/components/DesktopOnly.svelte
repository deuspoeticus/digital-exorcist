<script lang="ts">
    import Sigil from "./ui/Sigil.svelte";
</script>

<div class="desktop-only" role="alert">
    <Sigil size={88} />
    <h1>The Digital Exorcist</h1>
    <p class="verse">This rite requires a larger altar.</p>
    <p class="fine-print">
        Return on a desktop or laptop screen, at least 900 pixels wide.
    </p>
</div>

<style>
    .desktop-only {
        position: fixed;
        inset: 0;
        z-index: 10000;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 1rem;
        padding: 1.5rem 1rem;
        text-align: center;
        background: var(--ink-0);
    }

    h1 {
        margin: 0.75rem 0 0;
        font-family: var(--font-blackletter);
        font-weight: 400;
        font-size: clamp(2rem, 9vw, 3rem);
        line-height: 1.05;
        color: var(--bone);
    }

    .verse {
        margin: 0;
        font-family: var(--font-display);
        font-style: italic;
        font-size: 1.125rem;
        color: var(--bone-2);
    }
</style>
