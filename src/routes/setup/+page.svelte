<script lang="ts">
    // Simple setup page rendering content from SETUP_AI.md
</script>

<main class="container">
    <h1>🧠 Setup "window.ai"</h1>

    <div class="content">
        <p class="intro">
            The Digital Exorcist requires <strong>Gemini Nano</strong> (built
            into Chrome) to interpret your vibes locally. Currently, this is an
            <em>experimental feature</em>.
        </p>

        <div class="step">
            <h2>1. Use Chrome Canary or Dev</h2>
            <p>
                This feature is bleeding-edge. Standard Chrome might not have it
                yet.
            </p>
        </div>

        <div class="step">
            <h2>2. Enable Flags</h2>
            <ol>
                <li>Go to <code>chrome://flags</code></li>
                <li>
                    Set <strong>Enables optimization guide on device</strong> to
                    <code>Enabled BypassPerfRequirement</code>
                </li>
                <li>
                    Set <strong>Prompt API for Gemini Nano</strong> to
                    <code>Enabled</code>
                </li>
                <li><strong>Relaunch Chrome</strong></li>
            </ol>
        </div>

        <div class="step">
            <h2>3. Download the Brain</h2>
            <ol>
                <li>Go to <code>chrome://components</code></li>
                <li>
                    Find <strong>Optimization Guide On Device Model</strong>
                </li>
                <li>
                    Click <strong>Check for update</strong> to force the download.
                </li>
                <li>
                    Wait until you see a version number (e.g., <code
                        >2024.5.21...</code
                    >).
                </li>
            </ol>
        </div>

        <a href="/" class="btn">I've Done This! Take Me Back</a>
    </div>
</main>

<style>
    :global(body) {
        background-color: #111;
        color: #eee;
        margin: 0;
    }
    .container {
        padding: 2rem;
        font-family: monospace;
        max-width: 800px;
        margin: 0 auto;
    }
    h1 {
        color: #0f0;
        margin-bottom: 2rem;
    }
    h2 {
        color: #fff;
        border-bottom: 1px solid #333;
        padding-bottom: 0.5rem;
        margin-top: 2rem;
    }
    .content {
        line-height: 1.6;
    }
    .intro {
        font-size: 1.2rem;
        color: #ccc;
    }
    code {
        background: #222;
        padding: 0.2rem 0.4rem;
        border-radius: 4px;
        color: #f0f;
    }
    .step {
        background: #1a1a1a;
        padding: 1.5rem;
        border-radius: 8px;
        margin-bottom: 1.5rem;
        border: 1px solid #333;
    }
    ol {
        padding-left: 1.5rem;
    }
    li {
        margin-bottom: 0.5rem;
    }
    .btn {
        display: inline-block;
        background: #0f0;
        color: #000;
        padding: 1rem 2rem;
        text-decoration: none;
        font-weight: bold;
        border-radius: 4px;
        margin-top: 2rem;
        transition:
            transform 0.2s,
            box-shadow 0.2s;
    }
    .btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 0 15px rgba(0, 255, 0, 0.4);
    }
</style>
