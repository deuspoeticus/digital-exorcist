/**
 * Claude uplink — bring-your-own Anthropic API key.
 *
 * The key lives only in this browser's localStorage and requests go straight
 * from the browser to Anthropic (no server in between). Only the prompt text
 * is sent; images never leave the page.
 */
import Anthropic from '@anthropic-ai/sdk';
import { SYSTEM_PROMPT } from './config';

export const CLAUDE_MODEL = 'claude-haiku-5-5';
export const CLAUDE_LABEL = 'CLAUDE HAIKU 5.5';

const KEY_STORAGE = 'digital-exorcist.anthropic-key';

export function loadKey(): string | null {
    try {
        return localStorage.getItem(KEY_STORAGE);
    } catch {
        return null;
    }
}

export function saveKey(key: string): void {
    try {
        localStorage.setItem(KEY_STORAGE, key);
    } catch {
        // Storage blocked (private mode etc.) — key works for this session only.
    }
}

export function clearKey(): void {
    try {
        localStorage.removeItem(KEY_STORAGE);
    } catch {
        // ignore
    }
}

function makeClient(apiKey: string): Anthropic {
    // The visitor supplies their own key, so exposing it to their own browser is intended.
    return new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
}

/** Turn SDK errors into short, in-world messages. */
export function describeError(err: unknown): string {
    if (err instanceof Anthropic.AuthenticationError) return 'Key rejected (401). The seal is false.';
    if (err instanceof Anthropic.PermissionDeniedError) return 'Key lacks permission (403).';
    if (err instanceof Anthropic.RateLimitError) return 'Rate limited (429). The spirits are exhausted — wait.';
    if (err instanceof Anthropic.APIConnectionError) return 'Cannot reach Anthropic. The ether is silent.';
    if (err instanceof Anthropic.APIError) return `Anthropic error ${err.status}: ${err.message}`;
    return err instanceof Error ? err.message : String(err);
}

/** Cheap key check: looks up the model (no tokens spent). Throws on failure. */
export async function verifyKey(apiKey: string): Promise<void> {
    await makeClient(apiKey).models.retrieve(CLAUDE_MODEL);
}

export interface VibeResult {
    text: string;
    inputTokens: number;
    outputTokens: number;
}

/** Ask Claude for a raw ImageMagick flag string. Output goes through the same
 *  validator/splitter as Gemini's — no extra taming here. */
export async function summonVibe(apiKey: string, prompt: string): Promise<VibeResult> {
    const response = await makeClient(apiKey).messages.create({
        model: CLAUDE_MODEL,
        max_tokens: 16000,
        system: SYSTEM_PROMPT,
        output_config: { effort: 'low' },
        messages: [{ role: 'user', content: `Input: ${prompt}\nOutput:` }],
    });

    if (response.stop_reason === 'refusal') {
        throw new Error('The spirit refused this vibe.');
    }

    const text = response.content
        .map((block) => (block.type === 'text' ? block.text : ''))
        .join('')
        .trim();

    return {
        text,
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
    };
}
