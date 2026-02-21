/**
 * Command Validator for AI-generated ImageMagick commands.
 *
 * Tokenizes the raw command string, validates each flag against
 * ALLOWED_FLAGS, and checks arguments for flags with strict value sets.
 * Invalid tokens are stripped (not rejected), keeping valid parts.
 */
import {
    ALLOWED_FLAGS,
    VALID_MORPHOLOGY_METHODS,
    VALID_MORPHOLOGY_KERNELS,
    VALID_EVALUATE_FUNCTIONS,
    VALID_COLORSPACES,
    VALID_COMPOSE_METHODS,
    VALID_VIRTUAL_PIXEL,
    VALID_DISTORT_METHODS,
    VALID_NOISE_TYPES,
    VALID_CHANNELS,
    VALID_FUNCTION_METHODS,
} from './config';

// Build a Set for O(1) lookups
const allowedSet = new Set<string>(ALLOWED_FLAGS);

export interface ValidationResult {
    /** The cleaned, valid command string */
    command: string;
    /** List of human-readable descriptions of what was stripped */
    stripped: string[];
}

/**
 * Check if a token looks like a flag (starts with - or +, isn't a number).
 */
export function isFlag(token: string): boolean {
    if (token.length <= 1) return false;
    // Flags MUST start with - or +
    if (token[0] !== '-' && token[0] !== '+') return false;

    // If the second character is a digit, it's a number or offset (e.g., -10, +5+5, -.5)
    const secondChar = token[1];
    if (secondChar >= '0' && secondChar <= '9' || secondChar === '.') return false;

    // Ensure it's not a standalone NaN-like number (though rare in CLI)
    if (!isNaN(Number(token))) return false;

    return true;
}

/**
 * Tokenize a raw command string, respecting quoted strings and parentheses.
 */
export function tokenize(raw: string): string[] {
    const tokens: string[] = [];
    let i = 0;
    const s = raw.trim();

    while (i < s.length) {
        // Skip whitespace
        if (s[i] === ' ' || s[i] === '\t') {
            i++;
            continue;
        }

        // Quoted string — keep as one token (including the quotes)
        if (s[i] === '"' || s[i] === "'") {
            const quote = s[i];
            let j = i + 1;
            while (j < s.length && s[j] !== quote) j++;
            tokens.push(s.slice(i, j + 1)); // include quotes
            i = j + 1;
            continue;
        }

        // Parentheses — standalone tokens
        if (s[i] === '(' || s[i] === ')') {
            tokens.push(s[i]);
            i++;
            continue;
        }

        // Regular token (flag or argument)
        let j = i;
        while (j < s.length && s[j] !== ' ' && s[j] !== '\t' && s[j] !== ')' && s[j] !== '(') j++;
        tokens.push(s.slice(i, j));
        i = j;
    }

    return tokens;
}

/**
 * Peek ahead from position `start` and collect non-flag argument tokens.
 * Stops at flags, parens, or end of tokens. Returns the arg tokens.
 */
export function peekArgs(tokens: string[], start: number): string[] {
    const args: string[] = [];
    let j = start;
    while (j < tokens.length) {
        const t = tokens[j];
        // Stop at parens or flags
        if (t === '(' || t === ')') break;
        if (isFlag(t)) break;
        args.push(t);
        j++;
    }
    return args;
}

// ─── Flag-specific validation & argument rules ─────────────────────────

export interface FlagRule {
    /** How many args this flag expects */
    argCount: number;
    /** Optional: validate the first argument against a Set */
    argValidator?: Set<string>;
    /** Optional: validate the second argument against a Set */
    arg2Validator?: Set<string>;
    /** Optional: strip colon suffix before validation (e.g. Erode:3 → Erode) */
    stripColonForValidation?: boolean;
}

export const FLAG_RULES: Record<string, FlagRule> = {
    // ── Zero-arg (boolean) flags ──
    '-negate': { argCount: 0 },
    '-auto-level': { argCount: 0 },
    '-auto-gamma': { argCount: 0 },
    '-normalize': { argCount: 0 },
    '-despeckle': { argCount: 0 },
    '-strip': { argCount: 0 },
    '-flip': { argCount: 0 },
    '-flop': { argCount: 0 },
    '+repage': { argCount: 0 },
    '-composite': { argCount: 0 },
    '+channel': { argCount: 0 },
    '+clone': { argCount: 0 },

    // ── One-arg flags ──
    '-seed': { argCount: 1 },
    '-spread': { argCount: 1 },
    '-implode': { argCount: 1 },
    '-swirl': { argCount: 1 },
    '-resize': { argCount: 1 },
    '-filter': { argCount: 1 },
    '-charcoal': { argCount: 1 },
    '-solarize': { argCount: 1 },
    '-blue-shift': { argCount: 1 },
    '-sepia-tone': { argCount: 1 },
    '-posterize': { argCount: 1 },
    '-edge': { argCount: 1 },
    '-emboss': { argCount: 1 },
    '-blur': { argCount: 1 },
    '-gaussian-blur': { argCount: 1 },
    '-motion-blur': { argCount: 1 },
    '-radial-blur': { argCount: 1 },
    '-adaptive-blur': { argCount: 1 },
    '-adaptive-sharpen': { argCount: 1 },
    '-sharpen': { argCount: 1 },
    '-median': { argCount: 1 },
    '-paint': { argCount: 1 },
    '-sketch': { argCount: 1 },
    '-vignette': { argCount: 1 },
    '-threshold': { argCount: 1 },
    '-black-threshold': { argCount: 1 },
    '-white-threshold': { argCount: 1 },
    '-gamma': { argCount: 1 },
    '-rotate': { argCount: 1 },
    '-roll': { argCount: 1 },
    '-contrast-stretch': { argCount: 1 },
    '-brightness-contrast': { argCount: 1 },
    '-level': { argCount: 1 },
    '-canny': { argCount: 1 },
    '-define': { argCount: 1 },
    '-crop': { argCount: 1 },
    '-trim': { argCount: 0 },
    '-clone': { argCount: 1 },
    '-delete': { argCount: 1 },
    '-layers': { argCount: 1 },
    '-fx': { argCount: 1 },
    '-wave': { argCount: 1 },
    '-liquid-rescale': { argCount: 1 },
    '-sample': { argCount: 1 },
    '-attenuate': { argCount: 1 },
    '-colors': { argCount: 1 },
    '-dither': { argCount: 1 },
    '-sigmoidal-contrast': { argCount: 1 },
    '-monochrome': { argCount: 0 },
    '-lat': { argCount: 1 },
    '-alpha': { argCount: 1 },
    '-statistic': { argCount: 2 },

    // ── One-arg flags with argument validation ──
    '-colorspace': { argCount: 1, argValidator: VALID_COLORSPACES },
    '-channel': { argCount: 1, argValidator: VALID_CHANNELS },
    '-compose': { argCount: 1, argValidator: VALID_COMPOSE_METHODS },
    '-virtual-pixel': { argCount: 1, argValidator: VALID_VIRTUAL_PIXEL },
    '+noise': { argCount: 1, argValidator: VALID_NOISE_TYPES },

    // ── Two-arg flags ──
    '-fill': { argCount: 1 }, // -fill takes 1 (a color)
    '-tint': { argCount: 1 }, // -tint takes 1 (a percentage)
    '-modulate': { argCount: 1 }, // -modulate takes 1 (comma-separated values)
    '-opaque': { argCount: 1 }, // -opaque takes 1 (a color to replace)

    // ── Two-arg flags with argument validation ──
    '-morphology': { argCount: 2, argValidator: VALID_MORPHOLOGY_METHODS, arg2Validator: VALID_MORPHOLOGY_KERNELS, stripColonForValidation: true },
    '-evaluate': { argCount: 2, argValidator: VALID_EVALUATE_FUNCTIONS },
    '-distort': { argCount: 2, argValidator: VALID_DISTORT_METHODS },
    '-function': { argCount: 2, argValidator: VALID_FUNCTION_METHODS },
};

/**
 * Validate a raw AI-generated command string.
 * Returns the cleaned command and a list of what was stripped.
 */
export function validateCommand(raw: string): ValidationResult {
    // Pre-clean: remove backticks, "magick " / "convert " prefix
    let cleaned = raw.replace(/`/g, '');
    cleaned = cleaned.replace(/^(magick|convert)\s+/i, '');
    // Remove <placeholder> hallucinations
    cleaned = cleaned.replace(/<[^>]+>/g, '1');
    // Remove newlines
    cleaned = cleaned.replace(/[\r\n]+/g, ' ').trim();

    const tokens = tokenize(cleaned);
    const validTokens: string[] = [];
    const stripped: string[] = [];

    let i = 0;
    while (i < tokens.length) {
        const token = tokens[i];

        // Parentheses are always valid (layer grouping)
        if (token === '(' || token === ')') {
            validTokens.push(token);
            i++;
            continue;
        }

        // If it's a flag, validate it
        if (isFlag(token)) {
            if (!allowedSet.has(token)) {
                // Unknown flag — strip it and its non-flag arguments
                const strayArgs = peekArgs(tokens, i + 1);
                stripped.push(`${token}${strayArgs.length ? ' ' + strayArgs.join(' ') : ''} (unknown flag)`);
                i += 1 + strayArgs.length;
                continue;
            }

            // Look up the rule for this flag
            const rule = FLAG_RULES[token];

            if (!rule) {
                // Allowed but no rule defined — pass flag only (0 args)
                validTokens.push(token);
                i++;
                continue;
            }

            // Collect available non-flag args
            const availableArgs = peekArgs(tokens, i + 1);

            // Check if we have enough args
            if (availableArgs.length < rule.argCount) {
                // Not enough arguments — strip this flag
                stripped.push(`${token} (missing arguments, need ${rule.argCount}, got ${availableArgs.length})`);
                i += 1 + availableArgs.length; // consume whatever partial args exist
                continue;
            }

            // Take exactly the number of args we need
            const args = availableArgs.slice(0, rule.argCount);

            // Validate first argument
            if (rule.argValidator && args.length > 0) {
                let argToCheck = args[0];
                if (rule.stripColonForValidation) {
                    argToCheck = argToCheck.split(':')[0];
                }
                if (!rule.argValidator.has(argToCheck)) {
                    stripped.push(`${token} ${args.join(' ')} (invalid method "${argToCheck}")`);
                    i += 1 + rule.argCount;
                    continue;
                }
            }

            // Validate second argument (e.g. morphology kernel)
            if (rule.arg2Validator && args.length > 1) {
                const kernelArg = args[1];
                // Allow custom kernel patterns: quoted strings or NxM geometry format
                const isCustomKernel = kernelArg.startsWith("'") || kernelArg.startsWith('"') || /^\d+x\d+/.test(kernelArg);
                if (!isCustomKernel) {
                    let argToCheck = kernelArg.split(':')[0]; // named kernels can have :size
                    if (!rule.arg2Validator.has(argToCheck)) {
                        stripped.push(`${token} ${args.join(' ')} (invalid kernel "${argToCheck}")`);
                        i += 1 + rule.argCount;
                        continue;
                    }
                }
            }

            // Everything checks out — keep the flag and its args
            validTokens.push(token);
            for (const arg of args) {
                validTokens.push(arg);
            }
            i += 1 + rule.argCount;
        } else {
            // Not a flag, not a paren — stray argument. Skip it.
            stripped.push(`"${token}" (stray token)`);
            i++;
        }
    }

    return {
        command: validTokens.join(' '),
        stripped,
    };
}
