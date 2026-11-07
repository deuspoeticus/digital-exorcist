import { gemini } from '$lib/ai/gemini';
import * as claude from '$lib/ai/claude';
import { validateCommand } from '$lib/ai/validator';
import { PRESET_COMMANDS } from '$lib/ai/config';
import { splitCommand } from '$lib/utils/commandSplitter';
import { pushEntry, addLog, isProcessing, isAiReady, aiStatus } from '$lib/stores/appStore';
import { auditStore } from '$lib/stores/auditStore';
import { get } from 'svelte/store';

/** Local Nano wins when present; a bound Anthropic key is the next uplink. */
function nanoPresent(): boolean {
    return gemini.status === 'ready' || gemini.status === 'downloading';
}

export class AiAgent {
    private claudeKey: string | null = null;

    constructor() { }

    /**
     * Initialize the underlying AI engine (Gemini) and report status.
     */
    async init(): Promise<void> {
        await gemini.init();

        if (gemini.status === "ready") {
            addLog("[System] AI Core: ONLINE (Gemini Nano)");
            isAiReady.set(true);
            return;
        } else if (gemini.status === "downloading") {
            addLog("[System] AI Core: DOWNLOADING MODEL...");
            isAiReady.set(true);
            return;
        }

        // No local model — fall back to a key the visitor bound earlier, if any.
        const savedKey = claude.loadKey();
        if (savedKey) {
            this.useClaude(savedKey);
            addLog(`[System] AI Core: BOUND TO ${claude.CLAUDE_LABEL} (your key)`);
            return;
        }

        addLog("[System] AI Core: NEURAL LINK SEVERED");
        isAiReady.set(false);
    }

    get hasClaudeKey(): boolean {
        return this.claudeKey !== null;
    }

    private useClaude(key: string) {
        this.claudeKey = key;
        aiStatus.set('claude');
        isAiReady.set(true);
        auditStore.update(s => ({ ...s, modelFamily: claude.CLAUDE_LABEL }));
    }

    /**
     * Verify and store a visitor's Anthropic API key. Throws a readable message on failure.
     */
    async bindClaudeKey(rawKey: string): Promise<void> {
        const key = rawKey.trim();
        if (!key) throw new Error('No key offered.');

        addLog('[System] Testing the seal...');
        try {
            await claude.verifyKey(key);
        } catch (err) {
            const msg = claude.describeError(err);
            addLog(`[Error] ${msg}`);
            throw new Error(msg);
        }

        claude.saveKey(key);
        if (!nanoPresent()) this.useClaude(key);
        else this.claudeKey = key; // Nano stays primary; key kept as backup
        addLog(`[System] Uplink bound: ${claude.CLAUDE_LABEL}.`);
    }

    /** Forget the stored key and drop back to whatever Gemini found. */
    severClaudeKey(): void {
        claude.clearKey();
        this.claudeKey = null;
        if (get(aiStatus) === 'claude') {
            aiStatus.set(gemini.status);
            isAiReady.set(nanoPresent());
        }
        addLog('[System] Uplink severed. Key forgotten.');
    }

    /** Get a raw command string from whichever uplink is live. */
    private async summon(vibe: string): Promise<string> {
        if (get(aiStatus) === 'claude' && this.claudeKey) {
            try {
                const result = await claude.summonVibe(this.claudeKey, vibe);
                auditStore.update(s => ({
                    ...s,
                    inputTokens: s.inputTokens + result.inputTokens,
                    outputTokens: s.outputTokens + result.outputTokens,
                }));
                return result.text;
            } catch (err) {
                throw new Error(claude.describeError(err));
            }
        }

        let magicCommand = '';
        for await (const chunk of gemini.streamVibe(vibe)) {
            magicCommand += chunk;
        }
        return magicCommand;
    }

    /**
     * Process a user text prompt ("vibe") and generate a stack of effects.
     */
    async processVibe(vibe: string): Promise<void> {
        if (get(isProcessing)) return;

        // 1. Check Presets
        const presetKey = vibe.toLowerCase().trim();
        const presetCommand = PRESET_COMMANDS[presetKey];

        if (presetCommand) {
            addLog(`[Preset] Matched: "${vibe}"`);
            pushEntry(vibe, presetCommand, 'preset');
            return;
        }

        // 2. AI Generation
        addLog('[System] Communing with the Machine Spirits...');
        let magicCommand = '';

        try {
            magicCommand = await this.summon(vibe);

            addLog(`[AI] Whispered: ${magicCommand}`);

            // 3. Validation
            const { command: validCommand, stripped } = validateCommand(magicCommand);

            if (stripped.length > 0) {
                addLog(`[Validator] Stripped: ${stripped.join(', ')}`);
            }

            if (!validCommand.trim()) {
                addLog('[Validator] Nothing valid remained. Using fallback.');
                magicCommand = '-charcoal 5 -colorspace Gray';
            } else {
                magicCommand = validCommand;
            }

            addLog(`[System] Processing command...`);

            // 4. Split and Push
            const splitEntries = splitCommand(magicCommand);
            for (const entry of splitEntries) {
                pushEntry(entry.label, entry.command, 'ai');
            }
            addLog(`[System] Pushed ${splitEntries.length} entries to stack.`);

        } catch (err: any) {
            addLog(`[Error] The Spirits remain silent: ${err.message || err}`);
            isProcessing.set(false);
            throw err;
        }
    }
}

export const aiAgent = new AiAgent();
