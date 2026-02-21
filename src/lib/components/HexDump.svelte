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
        background: rgba(0, 0, 0, 0.7);
        color: #fff;
        font-family: var(--font-mono, monospace);
        font-size: 0.9rem;
        font-weight: bold;
        display: flex;
        justify-content: center;
        align-items: center;
        pointer-events: none;
        z-index: 100;
        mix-blend-mode: hard-light;
    }

    .hex-container {
        display: flex;
        flex-direction: column;
        align-items: center; /* Centers lines within the box */
        gap: 0.125rem;
    }

    .hex-line {
        white-space: pre;
        opacity: 0.8;
        text-shadow: 0 0 0.3125rem #fff;
        font-weight: bold;
        text-align: center;
        line-height: 1.2;
    }
</style>
