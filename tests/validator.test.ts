import { describe, it, expect } from 'vitest';
import { validateCommand } from '../src/lib/ai/validator';

describe('validateCommand', () => {
    // ── Basic valid commands ──
    it('passes a simple -negate through unchanged', () => {
        const { command, stripped } = validateCommand('-negate');
        expect(command).toBe('-negate');
        expect(stripped).toHaveLength(0);
    });

    it('passes a multi-flag command through', () => {
        const { command } = validateCommand('-charcoal 5 -solarize 50%');
        expect(command).toBe('-charcoal 5 -solarize 50%');
    });

    it('passes -channel RGB ... +channel wrapper', () => {
        const { command } = validateCommand('-channel RGB -negate +channel');
        expect(command).toBe('-channel RGB -negate +channel');
    });

    // ── Stripping unknown flags ──
    it('strips unknown flags', () => {
        const { command, stripped } = validateCommand('-negate -unknownflag 42');
        expect(command).toBe('-negate');
        expect(stripped.length).toBeGreaterThan(0);
        expect(stripped[0]).toContain('unknownflag');
    });

    it('strips forbidden -ordered-dither even if it sneaks in', () => {
        const { command, stripped } = validateCommand('-negate -ordered-dither o4x4');
        expect(command).toBe('-negate');
        expect(stripped.length).toBeGreaterThan(0);
    });

    // ── Argument validation ──
    it('validates -colorspace argument', () => {
        const valid = validateCommand('-colorspace Gray');
        expect(valid.command).toBe('-colorspace Gray');

        const invalid = validateCommand('-colorspace FakeSpace');
        expect(invalid.command).toBe('');
        expect(invalid.stripped[0]).toContain('FakeSpace');
    });

    it('validates -channel argument', () => {
        const valid = validateCommand('-channel RGB');
        expect(valid.command).toBe('-channel RGB');

        const invalid = validateCommand('-channel Fake');
        expect(invalid.command).toBe('');
        expect(invalid.stripped[0]).toContain('Fake');
    });

    it('validates +noise argument', () => {
        const valid = validateCommand('+noise Gaussian');
        expect(valid.command).toBe('+noise Gaussian');

        const invalid = validateCommand('+noise FakeNoise');
        expect(invalid.command).toBe('');
    });

    it('validates -morphology method and kernel', () => {
        const valid = validateCommand('-morphology Erode Diamond:3');
        expect(valid.command).toBe('-morphology Erode Diamond:3');

        const badMethod = validateCommand('-morphology FakeMethod Diamond:3');
        expect(badMethod.command).toBe('');

        const badKernel = validateCommand('-morphology Erode FakeKernel:3');
        expect(badKernel.command).toBe('');
    });

    it('validates -evaluate argument', () => {
        const valid = validateCommand('-evaluate Sin 2');
        expect(valid.command).toBe('-evaluate Sin 2');

        const invalid = validateCommand('-evaluate FakeOp 2');
        expect(invalid.command).toBe('');
    });

    it('validates -function argument', () => {
        const valid = validateCommand('-function Sinusoid 4,-90');
        expect(valid.command).toBe('-function Sinusoid 4,-90');

        const invalid = validateCommand('-function FakeFunc 4,-90');
        expect(invalid.command).toBe('');
    });

    it('validates -distort argument', () => {
        const valid = validateCommand('-distort Barrel 0,0,0.5,1');
        expect(valid.command).toBe('-distort Barrel 0,0,0.5,1');

        const invalid = validateCommand('-distort FakeDistort 0,0');
        expect(invalid.command).toBe('');
    });

    it('validates -virtual-pixel argument', () => {
        const valid = validateCommand('-virtual-pixel Tile');
        expect(valid.command).toBe('-virtual-pixel Tile');

        const invalid = validateCommand('-virtual-pixel FakePixel');
        expect(invalid.command).toBe('');
    });

    // ── Missing arguments ──
    it('strips flags with missing required arguments', () => {
        const { command, stripped } = validateCommand('-colorspace');
        expect(command).toBe('');
        expect(stripped[0]).toContain('missing arguments');
    });

    it('strips -morphology with only 1 arg (needs 2)', () => {
        const { command, stripped } = validateCommand('-morphology Erode');
        expect(command).toBe('');
        expect(stripped[0]).toContain('missing arguments');
    });

    // ── Pre-cleaning ──
    it('strips markdown backticks', () => {
        const { command } = validateCommand('```\n-negate\n```');
        expect(command).toBe('-negate');
    });

    it('strips "magick" and "convert" prefixes', () => {
        expect(validateCommand('magick -negate').command).toBe('-negate');
        expect(validateCommand('convert -negate').command).toBe('-negate');
    });

    it('replaces <placeholder> hallucinations with "1"', () => {
        const { command } = validateCommand('-charcoal <radius>');
        expect(command).toBe('-charcoal 1');
    });

    // ── Stray tokens ──
    it('strips stray tokens that are not flags', () => {
        const { command, stripped } = validateCommand('hello -negate world');
        expect(command).toBe('-negate');
        expect(stripped.length).toBe(2); // "hello" and "world"
    });

    // ── Parentheses ──
    it('preserves parentheses for layer grouping', () => {
        const { command } = validateCommand('( -negate ) ( -charcoal 5 )');
        expect(command).toBe('( -negate ) ( -charcoal 5 )');
    });

    // ── Complex real-world commands ──
    it('validates a complex preset command', () => {
        const cmd = '-channel RGB -morphology Erode Diamond:3 -lat 15x15+5% -spread 3 -fill lime -tint 40% +noise Poisson +channel -alpha opaque';
        const { command, stripped } = validateCommand(cmd);
        expect(command).toBe(cmd);
        expect(stripped).toHaveLength(0);
    });

    it('validates a command with -wave and -distort', () => {
        const cmd = '-channel RGB -wave 7x63 -solarize 47% -distort Polar 0 -virtual-pixel Mirror +channel -alpha opaque';
        const { command } = validateCommand(cmd);
        expect(command).toBe(cmd);
    });
});
