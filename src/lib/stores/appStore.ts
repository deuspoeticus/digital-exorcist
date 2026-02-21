import { writable, get } from 'svelte/store';
import type { RawImageData } from '$lib/utils/image';
import { parseEffects, reconstructCommand } from '$lib/effects/parser';

// ─── Effect Interface ───────────────────────────────────────────────────
export type EffectArgType = 'number' | 'color' | 'select' | 'text';

export interface EffectArgument {
    type: EffectArgType;
    label: string;
    value: string | number;
    // For numbers
    min?: number;
    max?: number;
    step?: number;
    unit?: string;
    // For selects
    options?: string[];
}

export interface Effect {
    name: string;
    flag: string;
    args: EffectArgument[];
}

// ─── Stack Entry ────────────────────────────────────────────────────────
export interface StackEntry {
    id: string;
    label: string;
    command: string;
    enabled: boolean;
    effects: Effect[];
    source: 'preset' | 'ai' | 'manual';
}

let _idCounter = 0;

// ─── Image State ────────────────────────────────────────────────────────
export const imageUrl = writable<string | null>(null);
export const currentRawImage = writable<RawImageData | null>(null);

// ─── Processing State ───────────────────────────────────────────────────
export const isProcessing = writable(false);
export const status = writable('Initializing...');
export const processingId = writable(0);

export type SystemStability = 'stable' | 'unstable';
export const systemStability = writable<SystemStability>('stable');

// ─── AI State ───────────────────────────────────────────────────────────
export type AiStatus = 'initializing' | 'ready' | 'downloading' | 'cloud' | 'offline';
export const aiStatus = writable<AiStatus>('initializing');
export const isAiReady = writable(false);

// ─── Logs ───────────────────────────────────────────────────────────────
export const logs = writable<string[]>([]);

/** Append one or more log messages */
export function addLog(...messages: string[]) {
    logs.update(l => [...l, ...messages]);
}

// ─── Window Management ───────────────────────────────────────────────────
export const globalZIndex = writable(100);

export function getNextZIndex(): number {
    let next = 100;
    globalZIndex.update(n => {
        next = n + 1;
        return next;
    });
    return next;
}

// ─── Verification State ────────────────────────────────────────────────
/** Stringified JSON of the effect stack at the time of last process */
export const lastProcessedStack = writable('');

// ─── Effect Stack ───────────────────────────────────────────────────────
export const effectStack = writable<StackEntry[]>([]);

/** Push a new entry onto the stack */
export function pushEntry(
    label: string,
    command: string,
    source: 'preset' | 'ai' | 'manual',
): StackEntry {
    const entry: StackEntry = {
        id: `entry_${++_idCounter}`,
        label,
        command,
        enabled: true,
        effects: parseEffects(command),
        source,
    };
    effectStack.update(stack => [...stack, entry]);
    return entry;
}

/** Remove an entry by id */
export function removeEntry(id: string) {
    effectStack.update(stack => stack.filter(e => e.id !== id));
}

/** Toggle an entry's enabled state */
export function toggleEntry(id: string) {
    effectStack.update(stack =>
        stack.map(e => (e.id === id ? { ...e, enabled: !e.enabled } : e)),
    );
}

/** Move an entry up (-1) or down (+1) */
export function moveEntry(id: string, direction: -1 | 1) {
    effectStack.update(stack => {
        const idx = stack.findIndex(e => e.id === id);
        if (idx < 0) return stack;
        const targetIdx = idx + direction;
        if (targetIdx < 0 || targetIdx >= stack.length) return stack;
        const copy = [...stack];
        [copy[idx], copy[targetIdx]] = [copy[targetIdx], copy[idx]];
        return copy;
    });
}

/** Update effects (slider values) for an entry */
export function updateEntryEffects(id: string, effects: Effect[]) {
    effectStack.update(stack =>
        stack.map(e => (e.id === id ? { ...e, effects } : e)),
    );
}

/** Clear the entire stack */
export function clearStack() {
    effectStack.set([]);
}

/** Pop the last entry (undo) */
export function popEntry(): StackEntry | undefined {
    let popped: StackEntry | undefined;
    effectStack.update(stack => {
        if (stack.length === 0) return stack;
        popped = stack[stack.length - 1];
        return stack.slice(0, -1);
    });
    return popped;
}

/** Build the full command from all enabled stack entries */
export function buildStackCommand(): string {
    const stack = get(effectStack);
    return stack
        .filter(e => e.enabled)
        .map(e => {
            // If sliders were modified, use reconstructed command
            if (e.effects.length > 0) {
                return reconstructCommand(e.effects);
            }
            return e.command;
        })
        .filter(cmd => cmd.trim() !== '')
        .join(' ');
}
