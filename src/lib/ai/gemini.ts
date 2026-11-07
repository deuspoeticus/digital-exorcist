import { SYSTEM_PROMPT, SAFETY_SETTINGS, PRIMITIVES, READY_EFFECTS, SPELLBOOK } from './config';
import { aiStatus, nanoState, nanoProgress, nanoError, type AiStatus } from '$lib/stores/appStore';
import { auditStore } from '$lib/stores/auditStore';

// Helper for Dum-Dum mode (fallback)
function getRandomEffect(): string {
    const keys = Object.keys(READY_EFFECTS);
    const randomKey = keys[Math.floor(Math.random() * keys.length)];
    return READY_EFFECTS[randomKey];
}

// Language hints for Chrome's Prompt API. Chrome warns without them, and
// availability() should be asked with the same options create() will use.
const LANG_OPTIONS = {
    expectedInputs: [{ type: 'text', languages: ['en'] }],
    expectedOutputs: [{ type: 'text', languages: ['en'] }],
};

/** The current Prompt API global (Chrome 148+ on desktop). */
function getLM(): any {
    // @ts-ignore
    return typeof LanguageModel !== 'undefined' ? LanguageModel : undefined;
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
                    nanoState.set('ready');
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

        // 2. Current Prompt API (global LanguageModel)
        if (getLM()) {
            const avail = await this.checkAvailability();
            if (avail === 'ready') {
                this.isAvailable = true;
                this.status = 'ready';

                // Count initial system prompt tokens immediately
                const sysTokens = Math.ceil(SYSTEM_PROMPT.length / 4);
                auditStore.update(s => ({
                    ...s,
                    inputTokens: sysTokens
                }));

                return true;
            }
            // downloadable / downloading / unavailable: no usable local link yet.
            this.status = 'cloud';
            return false;
        }

        // 3. Fallback
        if (!window.ai) nanoState.set('unsupported');
        console.warn('No local AI found (checked window.ai and LanguageModel)');
        this.status = 'cloud';
        return false;
    }

    /** Ask Chrome whether Nano can run here and publish the answer to nanoState. */
    async checkAvailability(): Promise<'ready' | 'downloadable' | 'downloading' | 'unavailable' | 'unsupported'> {
        const LM = getLM();
        if (!LM) {
            nanoState.set('unsupported');
            return 'unsupported';
        }
        try {
            const avail = await LM.availability(LANG_OPTIONS);
            console.log('[Gemini] LanguageModel availability:', avail);
            if (avail === 'available' || avail === 'readily') {
                nanoState.set('ready');
                return 'ready';
            }
            if (avail === 'downloading') {
                // Already downloading (e.g. started in another tab); progress unknown here.
                nanoState.set('downloading');
                nanoProgress.set(null);
                return 'downloading';
            }
            if (avail === 'downloadable' || avail === 'after-download') {
                nanoState.set('downloadable');
                return 'downloadable';
            }
        } catch (e) {
            console.warn('[Gemini] availability() failed:', e);
        }
        nanoState.set('unavailable');
        return 'unavailable';
    }

    /** Create a Prompt API session with the system prompt. Sampling params (the chaos)
     *  may be gated on the open web, so if Chrome rejects them, retry without. */
    private async createLMSession(onProgress?: (fraction: number) => void): Promise<any> {
        const LM = getLM();
        const options: Record<string, unknown> = {
            ...LANG_OPTIONS,
            initialPrompts: [{ role: 'system', content: SYSTEM_PROMPT }],
        };
        if (onProgress) {
            options.monitor = (m: any) => {
                m.addEventListener('downloadprogress', (e: any) => onProgress(e.loaded));
            };
        }
        try {
            return await LM.create({ ...options, temperature: SAFETY_SETTINGS.temperature, topK: 3 });
        } catch (e) {
            console.warn('[Gemini] create() with sampling params failed, retrying without:', e);
            return await LM.create(options);
        }
    }

    private recordQuota() {
        const quota = (this.session as any)?.inputQuota;
        auditStore.update(s => ({
            ...s,
            maxTokens: typeof quota === 'number' && isFinite(quota) ? quota : 4096,
            modelFamily: 'Gemini Nano (LanguageModel)'
        }));
    }

    /**
     * Download (if needed) and bind Gemini Nano. Must be called from a user click:
     * Chrome only starts the model download with user activation.
     */
    async summon(): Promise<void> {
        if (!getLM()) throw new Error('This browser has no built-in AI.');
        nanoError.set(null);
        nanoState.set('downloading');
        nanoProgress.set(0);

        try {
            this.session?.destroy();
            this.session = null;
            this.session = await this.createLMSession(f => nanoProgress.set(Math.max(0, Math.min(1, f))));
        } catch (e) {
            nanoError.set(e instanceof Error ? `${e.name}: ${e.message}` : String(e));
            await this.checkAvailability();
            throw e;
        }

        nanoProgress.set(1);
        nanoState.set('ready');
        this.isAvailable = true;
        this.status = 'ready';
        this.recordQuota();
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
            else if (getLM()) {
                this.session = await this.createLMSession();
                this.recordQuota();
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
