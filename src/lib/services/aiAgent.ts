import { gemini } from '$lib/ai/gemini';
import { validateCommand } from '$lib/ai/validator';
import { PRESET_COMMANDS } from '$lib/ai/config';
import { splitCommand } from '$lib/utils/commandSplitter';
import { pushEntry, addLog, isProcessing } from '$lib/stores/appStore';
import { get } from 'svelte/store';

export class AiAgent {
    constructor() { }

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
            const stream = gemini.streamVibe(vibe);
            for await (const chunk of stream) {
                magicCommand += chunk;
            }

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
