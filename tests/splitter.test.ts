import { describe, it, expect } from 'vitest';
import { splitCommand } from '../src/lib/utils/commandSplitter';

describe('splitCommand', () => {
    // ── Basic Splitting ──
    it('splits simple commands into atoms', () => {
        const result = splitCommand('-edge 1 -negate');
        expect(result).toHaveLength(2);

        expect(result[0].label).toBe('Edge 1');
        expect(result[0].command).toBe('-edge 1');

        expect(result[1].label).toBe('Negate');
        expect(result[1].command).toBe('-negate');
    });

    it('handles multiple arguments', () => {
        const result = splitCommand('-evaluate Sin 2');
        expect(result).toHaveLength(1);
        expect(result[0].label).toBe('Evaluate Sin 2');
        expect(result[0].command).toBe('-evaluate Sin 2');
    });

    // ── Channel Grouping ──
    it('groups -channel ... +channel blocks', () => {
        const cmd = '-channel RGB -negate -blur 0x5 +channel';
        const result = splitCommand(cmd);

        expect(result).toHaveLength(1);
        expect(result[0].command).toBe(cmd);
        // Label should reflect content
        expect(result[0].label).toContain('Channel');
    });

    it('handles mixed standalone and grouped commands', () => {
        const cmd = '-edge 1 -channel R -roll +10+0 +channel -negate';
        const result = splitCommand(cmd);

        expect(result).toHaveLength(3);

        expect(result[0].label).toBe('Edge 1');
        expect(result[1].label).toContain('Channel'); // The group
        expect(result[2].label).toBe('Negate');
    });

    it('handles nested structures gracefully (parentheses)', () => {
        const cmd = '( -clone 0 -negate ) -delete 0';
        const result = splitCommand(cmd);

        expect(result).toHaveLength(2);
        expect(result[0].label).toBe('Layer Group');
        expect(result[0].command).toBe('( -clone 0 -negate )');

        expect(result[1].label).toBe('Delete 0');
    });

    // ── Edge Cases ──
    it('handles mismatched +channel (treats as individual flags)', () => {
        const cmd = '-channel RGB -negate'; // No closing +channel
        const result = splitCommand(cmd);

        // Should fall back to splitting normally
        expect(result.length).toBeGreaterThan(1);
        expect(result[0].command).toBe('-channel RGB');
        expect(result[1].command).toBe('-negate');
    });
});
