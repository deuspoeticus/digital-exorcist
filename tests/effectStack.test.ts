import { describe, it, expect, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import {
    effectStack,
    pushEntry,
    removeEntry,
    toggleEntry,
    moveEntry,
    updateEntryEffects,
    clearStack,
    popEntry,
    buildStackCommand,
} from '../src/lib/stores/appStore';

beforeEach(() => {
    clearStack();
});

describe('effectStack store', () => {
    describe('pushEntry', () => {
        it('pushes an entry with correct fields', () => {
            const entry = pushEntry('Negate', '-negate', 'preset');
            expect(entry.id).toBeTruthy();
            expect(entry.label).toBe('Negate');
            expect(entry.command).toBe('-negate');
            expect(entry.enabled).toBe(true);
            expect(entry.source).toBe('preset');
        });

        it('parses effects for known flags', () => {
            const entry = pushEntry('Charcoal', '-charcoal 5', 'preset');
            expect(entry.effects).toHaveLength(1);
            expect(entry.effects[0].name).toBe('Charcoal');
            expect(entry.effects[0].args[0].value).toBe(5);
        });

        it('appends entries in order', () => {
            pushEntry('A', '-negate', 'preset');
            pushEntry('B', '-charcoal 5', 'ai');
            const stack = get(effectStack);
            expect(stack).toHaveLength(2);
            expect(stack[0].label).toBe('A');
            expect(stack[1].label).toBe('B');
        });

        it('assigns unique ids', () => {
            const a = pushEntry('A', '-negate', 'preset');
            const b = pushEntry('B', '-negate', 'preset');
            expect(a.id).not.toBe(b.id);
        });
    });

    describe('removeEntry', () => {
        it('removes an entry by id', () => {
            const entry = pushEntry('A', '-negate', 'preset');
            pushEntry('B', '-charcoal 5', 'preset');
            removeEntry(entry.id);
            const stack = get(effectStack);
            expect(stack).toHaveLength(1);
            expect(stack[0].label).toBe('B');
        });

        it('does nothing for unknown id', () => {
            pushEntry('A', '-negate', 'preset');
            removeEntry('nonexistent');
            expect(get(effectStack)).toHaveLength(1);
        });
    });

    describe('toggleEntry', () => {
        it('toggles enabled to false', () => {
            const entry = pushEntry('A', '-negate', 'preset');
            toggleEntry(entry.id);
            expect(get(effectStack)[0].enabled).toBe(false);
        });

        it('toggles back to true', () => {
            const entry = pushEntry('A', '-negate', 'preset');
            toggleEntry(entry.id);
            toggleEntry(entry.id);
            expect(get(effectStack)[0].enabled).toBe(true);
        });
    });

    describe('moveEntry', () => {
        it('moves an entry down', () => {
            const a = pushEntry('A', '-negate', 'preset');
            pushEntry('B', '-charcoal 5', 'preset');
            moveEntry(a.id, 1);
            const stack = get(effectStack);
            expect(stack[0].label).toBe('B');
            expect(stack[1].label).toBe('A');
        });

        it('moves an entry up', () => {
            pushEntry('A', '-negate', 'preset');
            const b = pushEntry('B', '-charcoal 5', 'preset');
            moveEntry(b.id, -1);
            const stack = get(effectStack);
            expect(stack[0].label).toBe('B');
            expect(stack[1].label).toBe('A');
        });

        it('does nothing when at boundary', () => {
            const a = pushEntry('A', '-negate', 'preset');
            pushEntry('B', '-charcoal 5', 'preset');
            moveEntry(a.id, -1); // already at top
            expect(get(effectStack)[0].label).toBe('A');
        });
    });

    describe('updateEntryEffects', () => {
        it('updates effects for an entry', () => {
            const entry = pushEntry('Charcoal', '-charcoal 5', 'preset');
            const modified = [{
                ...entry.effects[0],
                args: [{ ...entry.effects[0].args[0], value: 10 }]
            }];
            updateEntryEffects(entry.id, modified);
            expect(get(effectStack)[0].effects[0].args[0].value).toBe(10);
        });
    });

    describe('popEntry', () => {
        it('pops the last entry', () => {
            pushEntry('A', '-negate', 'preset');
            pushEntry('B', '-charcoal 5', 'preset');
            const popped = popEntry();
            expect(popped?.label).toBe('B');
            expect(get(effectStack)).toHaveLength(1);
        });

        it('returns undefined for empty stack', () => {
            expect(popEntry()).toBeUndefined();
        });
    });

    describe('clearStack', () => {
        it('clears all entries', () => {
            pushEntry('A', '-negate', 'preset');
            pushEntry('B', '-charcoal 5', 'preset');
            clearStack();
            expect(get(effectStack)).toHaveLength(0);
        });
    });

    describe('buildStackCommand', () => {
        it('returns empty string for empty stack', () => {
            expect(buildStackCommand()).toBe('');
        });

        it('concatenates enabled entries', () => {
            pushEntry('A', '-negate', 'preset');
            pushEntry('B', '-charcoal 5', 'preset');
            const cmd = buildStackCommand();
            expect(cmd).toContain('-negate');
            expect(cmd).toContain('-charcoal 5');
        });

        it('skips disabled entries', () => {
            const a = pushEntry('A', '-negate', 'preset');
            pushEntry('B', '-charcoal 5', 'preset');
            toggleEntry(a.id);
            const cmd = buildStackCommand();
            expect(cmd).not.toContain('-negate');
            expect(cmd).toContain('-charcoal 5');
        });

        it('uses reconstructed command for entries with slider effects', () => {
            const entry = pushEntry('Charcoal', '-charcoal 5', 'preset');
            updateEntryEffects(entry.id, [{
                ...entry.effects[0],
                args: [{ ...entry.effects[0].args[0], value: 10 }]
            }]);
            const cmd = buildStackCommand();
            expect(cmd).toContain('-charcoal 10');
        });

        it('preserves entry order', () => {
            pushEntry('A', '-negate', 'preset');
            pushEntry('B', '-charcoal 5', 'preset');
            const cmd = buildStackCommand();
            const negatePos = cmd.indexOf('-negate');
            const charcoalPos = cmd.indexOf('-charcoal');
            expect(negatePos).toBeLessThan(charcoalPos);
        });

        it('reflects reordering', () => {
            const a = pushEntry('A', '-negate', 'preset');
            pushEntry('B', '-charcoal 5', 'preset');
            moveEntry(a.id, 1); // A moves after B
            const cmd = buildStackCommand();
            const charcoalPos = cmd.indexOf('-charcoal');
            const negatePos = cmd.indexOf('-negate');
            expect(charcoalPos).toBeLessThan(negatePos);
        });
    });
});
