import { SYSTEM_PROMPT, SAFETY_SETTINGS, PRIMITIVES, READY_EFFECTS, SPELLBOOK } from './config';
import { aiStatus, type AiStatus } from '$lib/stores/appStore';
import { auditStore } from '$lib/stores/auditStore';

// Helper for Dum-Dum mode (fallback)
function getRandomEffect(): string {
    const keys = Object.keys(READY_EFFECTS);
    const randomKey = keys[Math.floor(Math.random() * keys.length)];
    return READY_EFFECTS[randomKey];
}

export class GeminiService {
    private session: AILanguageModel | null = null;
    public isAvailable = false;
    private _status: AiStatus = 'initializing';

    get status() {
        return this._status;
    }

    set status(value: AiStatus) {
        this._status = value;
        aiStatus.set(value);
    }

    constructor() { }

    async init() {
        // 1. Try window.ai (Standard Draft)
        if (window.ai) {
            console.log('[Gemini] window.ai detected');
            try {
                const caps = await window.ai.languageModel.capabilities();
                console.log('[Gemini] Capabilities:', caps);
                if (caps.available !== 'no') {
                    this.isAvailable = true;
                    this.status = caps.available === 'after-download' ? 'downloading' : 'ready';

                    // Count initial system prompt tokens immediately
                    const sysTokens = Math.ceil(SYSTEM_PROMPT.length / 4);
                    auditStore.update(s => ({
                        ...s,
                        inputTokens: sysTokens
                    }));

                    return true;
                }
            } catch (e) {
                console.warn('window.ai found but failed:', e);
            }
        }

        // 2. Try global LanguageModel (Correction for some contexts)
        // @ts-ignore
        if (typeof LanguageModel !== 'undefined') {
            try {
                // The user reported: await LanguageModel.availability(["en"]) -> "available"
                // We'll try to check availability.
                // @ts-ignore
                const avail = await LanguageModel.availability();
                console.log('[Gemini] LanguageModel availability:', avail);
                if (avail === 'available' || avail === 'readily' || avail === 'after-download') {
                    console.log('Found global LanguageModel API');
                    this.isAvailable = true;
                    this.status = avail === 'after-download' ? 'downloading' : 'ready';

                    // Count initial system prompt tokens immediately
                    const sysTokens = Math.ceil(SYSTEM_PROMPT.length / 4);
                    auditStore.update(s => ({
                        ...s,
                        inputTokens: sysTokens
                    }));

                    return true;
                }
            } catch (e) {
                console.warn('Global LanguageModel found but failed:', e);
            }
        }

        // 3. Fallback
        console.warn('No local AI found (checked window.ai and LanguageModel)');
        this.status = 'cloud';
        return false;
    }

    async createSession() {
        if (this.session) return;

        try {
            if (window.ai) {
                // Safely track max tokens (experimental API might change)
                try {
                    const caps = await window.ai.languageModel.capabilities();
                    // @ts-ignore
                    const max = caps.maxTokens || caps.defaultTopK || 4096;
                    auditStore.update(s => ({
                        ...s,
                        maxTokens: max,
                        modelFamily: 'Gemini Nano (window.ai)'
                    }));
                } catch (err) {
                    console.warn('[Gemini] Failed to read capabilities:', err);
                }

                this.session = await window.ai.languageModel.create({
                    // @ts-ignore
                    initialPrompts: [{ role: 'system', content: SYSTEM_PROMPT }],
                    // @ts-ignore
                    temperature: SAFETY_SETTINGS.temperature,
                    // @ts-ignore
                    topK: 3,
                });

                this.status = 'ready';
            }
            // @ts-ignore
            else if (typeof LanguageModel !== 'undefined') {
                try {
                    // @ts-ignore
                    const caps = await LanguageModel.capabilities();
                    // @ts-ignore
                    const max = caps.maxTokens || 4096;
                    auditStore.update(s => ({
                        ...s,
                        maxTokens: max,
                        modelFamily: 'Gemini Nano (LanguageModel)'
                    }));
                } catch (err) {
                    console.warn('[Gemini] Failed to read LanguageModel capabilities:', err);
                }

                // @ts-ignore
                this.session = await LanguageModel.create({
                    // @ts-ignore
                    initialPrompts: [{ role: 'system', content: SYSTEM_PROMPT }],
                    // @ts-ignore
                    temperature: SAFETY_SETTINGS.temperature,
                    // @ts-ignore
                    topK: 3,
                    // @ts-ignore
                    expectedOutputLanguage: 'en'
                });

                this.status = 'ready';
            } else {
                throw new Error('No AI provider available');
            }
        } catch (e) {
            console.error('Failed to create AI session, falling back to cloud', e);
            this.status = 'cloud';
        }
    }

    async *streamVibe(prompt: string) {
        // If explicitly set to cloud, or initializing failed to find any local AI
        // (Note: With Mock mode, this block is less likely to be hit unless we explicitly set 'cloud')
        if (this.status === 'cloud') {
            yield* this.streamCloud(prompt);
            return;
        }

        if (!this.session) {
            await this.createSession();
        }

        if (this.session) {
            // - [x] Fix AI "Broken Completely" State <!-- id: 0 -->
            //     - [x] Restore `initialPrompts` in `gemini.ts` (Required for Chrome's built-in AI). <!-- id: 1 -->
            //     - [x] Remove `systemPrompt` top-level property to avoid potential double-passing/double-counting. <!-- id: 2 -->
            // - [x] Verify System Prompt Effectiveness <!-- id: 3 -->
            //     - [x] Confirm AI outputs correct ImageMagick commands again. <!-- id: 4 -->
            // - [/] Fix Initial Token Count Display <!-- id: 5 -->
            //     - [ ] Update `init()` in `gemini.ts` to set initial token count immediately. <!-- id: 6 -->
            try {
                const robustPrompt = `Input: ${prompt}\nOutput:`;

                const stream = this.session.promptStreaming(robustPrompt);
                let fullResponse = '';

                for await (const chunk of stream) {
                    fullResponse += chunk;
                    // Real-time validation could happen here, but for now we validate the final/accumulated chunks
                    // To keep the UI responsive, we yield chunks as they come, but we might want to filter bad chars?
                    // For now, let's yield raw and let the worker handle execution, OR sanitize before yielding if we want strict UI.
                    // Given the requirement for "valid magick-wasm commands", let's be safe.

                    // Simple sanitation: remove backticks and "magick " prefix if present, and "magica "
                    let sanitized = chunk.replace(/`|^magick\s+|^magica\s+/g, '');

                    // Fallback Sanitization for Placeholders (Hallucination Fix)
                    // If the model yields "-blur <radius>", we replace it with safe defaults.
                    sanitized = sanitized.replace(/<[^>]+>/g, (match) => {
                        console.warn(`[Gemini] Hallucination detected: ${match}, replacing with default.`);
                        // Return safe defaults based on context if possible, or just a generic number
                        if (match.includes('radius')) return '0'; // -blur 0 is safe (no blur) or 1
                        if (match.includes('kernel')) return '1';
                        if (match.includes('degree')) return '180';
                        if (match.includes('factor')) return '0.5';
                        if (match.includes('percent')) return '50';
                        return '1'; // Blind default
                    });

                    yield sanitized;
                }

                // Approximate token counting (since API doesn't return usage stats yet)
                // 1 token ~= 4 chars typically
                const inputEst = (prompt.length) / 4;
                const outputEst = fullResponse.length / 4;

                auditStore.update(s => ({
                    ...s,
                    inputTokens: s.inputTokens + Math.ceil(inputEst),
                    outputTokens: s.outputTokens + Math.ceil(outputEst)
                }));

            } catch (e) {
                console.error('Glossolalia error (Nano), attempting cloud exorcism...', e);
                // Fallback to cloud if session crashes
                yield* this.streamCloud(prompt);
            }
        } else {
            console.warn('[Gemini] No session created, falling back to cloud');
            // If session creation failed, try cloud
            yield* this.streamCloud(prompt);
        }
    }

    async *streamCloud(prompt: string) {
        try {
            const response = await fetch('/api/ai', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt })
            });

            if (!response.ok) {
                console.error(`[Gemini] Cloud API failed: ${response.status} ${response.statusText}`);
                throw new Error(`Cloud API error: ${response.statusText}`);
            }

            const reader = response.body?.getReader();
            if (!reader) throw new Error('No response body');

            const decoder = new TextDecoder();
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                yield decoder.decode(value, { stream: true });
            }
        } catch (e) {
            console.error('Cloud exorcism failed:', e);
            this.status = 'offline';

            // Dum-Dum Mode: Return a random valid effect from the library
            console.log('[Gemini] Activating Dum-Dum Protocol (Random Local Effect)');
            yield getRandomEffect();
        }
    }

    destroy() {
        if (this.session) {
            this.session.destroy();
            this.session = null;
        }
    }
}

export const gemini = new GeminiService();
