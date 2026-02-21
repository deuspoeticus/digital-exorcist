import { describe, it, expect } from 'vitest';
import { sanitizeCommand, INPUT_FILE, OUTPUT_FILE } from '../src/lib/workers/sanitizer';

describe('sanitizeCommand', () => {
    const W = 800;
    const H = 600;

    // ── Basic output format ──
    it('produces a convert command with raw RGBA input args', () => {
        const result = sanitizeCommand('-negate', W, H);
        expect(result).toContain(`convert -size ${W}x${H} -depth 8 ${INPUT_FILE}`);
        expect(result).toContain(OUTPUT_FILE);
    });

    it('forces resize back to original dimensions', () => {
        const result = sanitizeCommand('-negate', W, H);
        expect(result).toContain(`-filter Point -resize ${W}x${H}!`);
    });

    it('outputs depth 8 RGBA', () => {
        const result = sanitizeCommand('-negate', W, H);
        expect(result).toContain('-depth 8');
        expect(result).toMatch(new RegExp(`-depth 8 ${OUTPUT_FILE}$`));
    });

    // ── Export mode ──
    it('uses JPEG output in export mode', () => {
        const result = sanitizeCommand('-negate', W, H, true);
        expect(result).toContain('out.jpg');
        expect(result).toContain('-quality 90');
        expect(result).not.toContain(OUTPUT_FILE);
    });

    // ── Cleaning ──
    it('strips markdown backticks', () => {
        const result = sanitizeCommand('```bash\n-negate\n```', W, H);
        expect(result).toContain('-negate');
        expect(result).not.toContain('```');
    });

    it('strips "magick" prefix', () => {
        const result = sanitizeCommand('magick -negate', W, H);
        expect(result).toContain('-negate');
        // Should not have double "convert" or "magick"
        expect(result.match(/convert/g)?.length).toBe(1);
    });

    it('strips "convert" prefix', () => {
        const result = sanitizeCommand('convert -negate', W, H);
        expect(result.match(/convert/g)?.length).toBe(1);
    });

    it('strips "magica" prefix', () => {
        const result = sanitizeCommand('magica -negate', W, H);
        expect(result).toContain('-negate');
    });

    it('strips hallucinated filenames', () => {
        const result = sanitizeCommand('input.png -negate output.png', W, H);
        expect(result).toContain('-negate');
        expect(result).not.toContain('input.png');
        expect(result).not.toContain('output.png');
    });

    it('replaces <placeholder> with "1"', () => {
        const result = sanitizeCommand('-charcoal <radius>', W, H);
        expect(result).toContain('-charcoal 1');
        expect(result).not.toContain('<radius>');
    });

    it('collapses multiple spaces and newlines', () => {
        const result = sanitizeCommand('-negate   \n  -solarize 50%', W, H);
        expect(result).toContain('-negate -solarize 50%');
    });

    // ── Fallback ──
    it('uses -negate as fallback when command is empty', () => {
        const result = sanitizeCommand('', W, H);
        expect(result).toContain('-negate');
    });

    it('uses -negate as fallback when only whitespace', () => {
        const result = sanitizeCommand('   ', W, H);
        expect(result).toContain('-negate');
    });

    // ── Different dimensions ──
    it('adapts to different image dimensions', () => {
        const result = sanitizeCommand('-negate', 1920, 1080);
        expect(result).toContain('-size 1920x1080');
        expect(result).toContain('-resize 1920x1080!');
    });
});
