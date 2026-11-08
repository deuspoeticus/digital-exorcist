<script lang="ts">
    import { onMount } from "svelte";

    let hexLines: string[] = [];
    let interval: any;

    function generateHexLine() {
        const chars = "ABCDEF0123456789";
        let line = "";
        for (let i = 0; i < 32; i++) {
            line += chars[Math.floor(Math.random() * chars.length)];
            if ((i + 1) % 2 === 0) line += " ";
        }
        return line;
    }

    onMount(() => {
        interval = setInterval(() => {
            hexLines = [...hexLines.slice(-15), generateHexLine()];
        }, 50);

        return () => clearInterval(interval);
    });
</script>

<div class="hex-dump">
    <div class="hex-container">
        {#each hexLines as line}
            <div class="hex-line">{line}</div>
        {/each}
    </div>
</div>

<style>
    .hex-dump {
        position: absolute;
        inset: 0;
        background: rgba(6, 6, 6, 0.35);
        display: flex;
        justify-content: center;
        align-items: center;
        pointer-events: none;
        z-index: 100;
    }

    .hex-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.125rem;
    }

    .hex-line {
        white-space: pre;
        font-family: var(--font-pixel);
        font-size: var(--text-xs);
        line-height: 1.3;
        color: #fff;
        text-shadow:
            0 0 2px rgba(255, 255, 255, 0.9),
            0 0 8px rgba(255, 255, 255, 0.6),
            0 0 18px rgba(255, 255, 255, 0.35);
    }
</style>
