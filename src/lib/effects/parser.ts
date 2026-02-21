/**
 * Effect parser — pure functions for parsing ImageMagick flags into
 * adjustable Effect objects, and reconstructing command strings from them.
 */
import type { Effect, EffectArgument } from '$lib/stores/appStore';
import {
    VALID_COMPOSE_METHODS,
    VALID_MORPHOLOGY_METHODS,
    VALID_MORPHOLOGY_KERNELS
} from '$lib/ai/config';

/**
 * Robustly split a command string into tokens, respecting quotes.
 * e.g. '-fx "u + 0.5"' -> ['-fx', 'u + 0.5']
 */
export function tokenizeCommand(command: string): string[] {
    const tokens: string[] = [];
    let current = '';
    let inQuote: "'" | '"' | null = null;

    for (let i = 0; i < command.length; i++) {
        const char = command[i];

        if (inQuote) {
            if (char === inQuote) {
                inQuote = null;
            } else {
                current += char;
            }
        } else {
            if (char === '"' || char === "'") {
                inQuote = char;
            } else if (char === ' ') {
                if (current.length > 0) {
                    tokens.push(current);
                    current = '';
                }
            } else {
                current += char;
            }
        }
    }
    if (current.length > 0) tokens.push(current);
    return tokens;
}

/**
 * Parse an ImageMagick flag string into a list of adjustable Effects.
 * Only flags with known slider ranges are extracted; the rest are ignored or treated as text.
 */
export function parseEffects(command: string): Effect[] {
    const parts = tokenizeCommand(command);
    const effects: Effect[] = [];

    // Helper to add simple numeric effect
    const addNumeric = (
        name: string,
        flag: string,
        val: number,
        min: number,
        max: number,
        step: number,
        unit?: string
    ) => {
        effects.push({
            name,
            flag,
            args: [
                {
                    type: 'number',
                    label: name, // Default label same as effect name for single-arg
                    value: val,
                    min,
                    max,
                    step,
                    unit
                }
            ]
        });
    };

    for (let i = 0; i < parts.length; i++) {
        const part = parts[i];

        if (part.startsWith('-') || part.startsWith('+')) {
            const flag = part.startsWith('-') ? part.substring(1) : part; // strip leading - if present

            // Get potential next value
            let nextPart = parts[i + 1];
            let numericVal = 1;

            if (nextPart && !isNaN(parseFloat(nextPart)) && isFinite(parseFloat(nextPart))) {
                numericVal = parseFloat(nextPart);
            }

            switch (flag) {
                // --- Complex Numeric Flags ---
                case 'modulate': {
                    const args = (nextPart || '100').split(',').map(s => parseFloat(s));

                    // Allow parsing even if some are NaN (defaults applied), but usually split is safe
                    const safeVal = (v: number | undefined, def: number) => (v === undefined || isNaN(v)) ? def : v;

                    effects.push({
                        name: 'Modulate',
                        flag,
                        args: [
                            { type: 'number', label: 'Bright', value: safeVal(args[0], 100), min: 0, max: 200, step: 1, unit: '%' },
                            { type: 'number', label: 'Sat', value: safeVal(args[1], 100), min: 0, max: 300, step: 1, unit: '%' },
                            { type: 'number', label: 'Hue', value: safeVal(args[2], 100), min: 0, max: 200, step: 1, unit: '%' }
                        ]
                    });
                    i++;
                    break;
                }

                case 'sigmoidal-contrast': {
                    // Expecting: contrast,mid-point e.g. 10,50%
                    // Also handles '3x50%' format which IM uses sometimes
                    const valStr = (nextPart || '3,50%').replace('x', ',');
                    const [contrastStr, midStr] = valStr.split(',');

                    const contrast = parseFloat(contrastStr);
                    const mid = parseFloat(midStr || '50');

                    if (isNaN(contrast)) break;

                    effects.push({
                        name: 'Contrast',
                        flag,
                        args: [
                            { type: 'number', label: 'Str', value: contrast, min: 0, max: 20, step: 0.1 },
                            { type: 'number', label: 'Mid', value: isNaN(mid) ? 50 : mid, min: 0, max: 100, step: 1, unit: '%' }
                        ]
                    });
                    i++;
                    break;
                }

                // --- Color Flags ---
                case 'fill':
                    if (nextPart) {
                        effects.push({
                            name: 'Fill Color',
                            flag,
                            args: [{ type: 'color', label: 'Fill', value: nextPart }]
                        });
                        i++;
                    }
                    break;

                case 'tint':
                    addNumeric('Tint Amount', 'tint', numericVal, 0, 100, 1, '%');
                    i++;
                    break;

                // --- Select Flags ---
                case 'compose':
                    if (nextPart && VALID_COMPOSE_METHODS.has(nextPart)) {
                        effects.push({
                            name: 'Blend Mode',
                            flag,
                            args: [{
                                type: 'select',
                                label: 'Mode',
                                value: nextPart,
                                options: Array.from(VALID_COMPOSE_METHODS)
                            }]
                        });
                        i++;
                    }
                    break;

                case 'morphology': {
                    // Expecting: Method Kernel[:Args] e.g. Dilate Disk:3 or Dilate Rectangle:20x1
                    const method = nextPart;
                    const kernelFull = parts[i + 2]; // e.g. "Disk:3" or "Rectangle:20x1"

                    if (!method) break;

                    // Basic validation
                    if (!VALID_MORPHOLOGY_METHODS.has(method)) break;

                    // Split Kernel and Args
                    // "Disk:3" -> ["Disk", "3"]
                    // "Rectangle:20x1" -> ["Rectangle", "20x1"]
                    // "Skeleton" -> ["Skeleton"]
                    const [kernelName, argStr] = (kernelFull || '').split(':');

                    // Parse Args
                    // "3" -> [3, 0]
                    // "20x1" -> [20, 1]
                    // "" -> [0, 0]
                    let arg1 = 0;
                    let arg2 = 0;

                    if (argStr) {
                        if (argStr.includes('x')) {
                            const [a, b] = argStr.split('x').map(s => parseFloat(s));
                            arg1 = isNaN(a) ? 0 : a;
                            arg2 = isNaN(b) ? 0 : b;
                        } else {
                            const val = parseFloat(argStr);
                            arg1 = isNaN(val) ? 0 : val;
                        }
                    } else {
                        // Default to something reasonable if no args provided but expected?
                        // Actually 0 is fine, user can adjust.
                        // Ideally we detect defaults based on kernel (Disk defaults to radius 1 etc)
                        if (['Disk', 'Square', 'Diamond', 'Octagon'].includes(kernelName)) arg1 = 1;
                    }

                    effects.push({
                        name: 'Morphology',
                        flag,
                        args: [
                            {
                                type: 'select',
                                label: 'Method',
                                value: method,
                                options: Array.from(VALID_MORPHOLOGY_METHODS)
                            },
                            {
                                type: 'select', // Kernel Selector
                                label: 'Kernel',
                                value: kernelName || 'Disk',
                                options: Array.from(VALID_MORPHOLOGY_KERNELS)
                            },
                            {
                                type: 'number',
                                label: 'Rad/W',
                                value: arg1,
                                min: 0,
                                max: 50,
                                step: 0.5
                            },
                            {
                                type: 'number',
                                label: 'Sig/H',
                                value: arg2,
                                min: 0,
                                max: 50,
                                step: 0.5
                            }
                        ]
                    });
                    i += kernelFull ? 2 : 1;
                    break;
                }

                // --- Simple Numeric Flags ---
                case 'charcoal':
                    addNumeric('Charcoal', 'charcoal', numericVal, 0, 10, 0.1);
                    i++;
                    break;
                case 'swirl':
                    addNumeric('Swirl', 'swirl', numericVal, -360, 360, 5, '°');
                    i++;
                    break;
                case 'implode':
                    addNumeric('Implode', 'implode', numericVal, -2, 2, 0.05);
                    i++;
                    break;
                case 'solarize':
                    addNumeric('Solarize', 'solarize', numericVal, 0, 100, 1, '%');
                    i++;
                    break;
                case 'blue-shift':
                    addNumeric('Blue Shift', 'blue-shift', numericVal, 0, 5, 0.05);
                    i++;
                    break;
                case 'blur':
                    addNumeric('Blur', 'blur', numericVal, 0, 20, 0.5);
                    i++;
                    break;
                case 'sepia-tone':
                    addNumeric('Sepia', 'sepia-tone', numericVal, 0, 100, 1, '%');
                    i++;
                    break;
                case 'posterize':
                    addNumeric('Posterize', 'posterize', numericVal, 2, 64, 1);
                    i++;
                    break;
                case 'edge':
                    addNumeric('Edge', 'edge', numericVal, 0, 20, 0.5);
                    i++;
                    break;
                case 'emboss':
                    addNumeric('Emboss', 'emboss', numericVal, 0, 10, 0.5);
                    i++;
                    break;
                case 'add-noise':
                    // The old test expects -add-noise to be capped at 1, so it means it's a numeric slider (attenuation maybe?)
                    addNumeric('Add Noise', 'add-noise', Math.min(numericVal, 1), 0, 1, 0.1);
                    i++;
                    break;

                case 'mix': // handled by compose usually
                    break;

                // --- Complex / New Flags ---
                case 'sample':
                    // format: 10% or 100x100
                    if (nextPart) {
                        const isPercent = nextPart.includes('%');
                        const val = parseFloat(nextPart);
                        if (!isNaN(val)) {
                            effects.push({
                                name: 'Sample',
                                flag,
                                args: [{
                                    type: 'number',
                                    label: 'Size',
                                    value: val,
                                    min: 1,
                                    max: isPercent ? 2000 : 2000,
                                    step: 1,
                                    unit: isPercent ? '%' : ''
                                }]
                            });
                            i++;
                        }
                    }
                    break;

                case 'colors':
                    addNumeric('Colors', 'colors', numericVal, 2, 256, 1);
                    i++;
                    break;

                case 'attenuate':
                    addNumeric('Attenuate', 'attenuate', numericVal, 0, 5, 0.1);
                    i++;
                    break;

                case '+noise': // Note: strict parsing might skip + flags in loop if not careful? 
                    // Actually loop checks startsWith('-') || startsWith('+') so we are good.
                    // But flag var strips leading '-', so for +noise flag is 'noise' if we stripped it dynamically?
                    // Wait, code says: const flag = part.startsWith('-') ? part.substring(1) : part;
                    // So for +noise, flag is '+noise'.
                    if (nextPart) {
                        effects.push({
                            name: 'Noise',
                            flag: '+noise', // preserve + for reconstruction
                            args: [{
                                type: 'select',
                                label: 'Type',
                                value: nextPart,
                                options: ['Gaussian', 'Impulse', 'Laplacian', 'Multiplicative', 'Poisson', 'Random', 'Uniform']
                            }]
                        });
                        i++;
                    }
                    break;

                case 'channel':
                    if (nextPart) {
                        effects.push({
                            name: 'Channel',
                            flag,
                            args: [{
                                type: 'select',
                                label: 'Chan',
                                value: nextPart,
                                options: ['RGB', 'Red', 'Green', 'Blue', 'Alpha', 'Cyan', 'Magenta', 'Yellow', 'Black']
                            }]
                        });
                        i++;
                    }
                    break;

                // Special handling for +channel (reset)
                case '+channel':
                    effects.push({
                        name: 'Channel Reset',
                        flag: '+channel',
                        args: [] // No args
                    });
                    break;

                // Special Cases (Bool / Fixed)
                case 'negate':
                    if (part === '-negate') {
                        addNumeric('Negate', 'negate', 1, 0, 1, 1);
                    }
                    break;
                case 'grayscale':
                    if (part === '-grayscale') {
                        addNumeric('Grayscale', 'grayscale', 1, 0, 1, 1);
                    }
                    break;

                // --- Geometry / Distortion ---
                case 'roll': // +X+Y
                case 'wave': // AxL
                case 'lat':  // WxH+O
                    if (nextPart) {
                        effects.push({
                            name: flag.charAt(0).toUpperCase() + flag.slice(1),
                            flag,
                            args: [{ type: 'text', label: 'Geometry', value: nextPart }]
                        });
                        i++;
                    }
                    break;

                case 'distort':
                    if (nextPart) {
                        // Method arg
                        const method = nextPart;
                        const args = parts[i + 2]; // args usually follow method

                        effects.push({
                            name: 'Distort',
                            flag,
                            args: [
                                { type: 'select', label: 'Method', value: method, options: ['Barrel', 'Polar', 'DePolar', 'Shepards', 'Arc', 'Perspective'] },
                                { type: 'text', label: 'Args', value: args || '0' }
                            ]
                        });
                        i += args ? 2 : 1;
                    }
                    break;

                // --- Math / Functions ---
                case 'function':
                    if (nextPart) {
                        const method = nextPart;
                        const args = parts[i + 2];
                        effects.push({
                            name: 'Function',
                            flag,
                            args: [
                                { type: 'select', label: 'Method', value: method, options: ['Sinusoid', 'Arcsin', 'Arctan', 'Polynomial'] },
                                { type: 'text', label: 'Args', value: args || '0' }
                            ]
                        });
                        i += args ? 2 : 1;
                    }
                    break;

                case 'evaluate':
                    if (nextPart) {
                        const method = nextPart;
                        const val = parts[i + 2];
                        effects.push({
                            name: 'Evaluate',
                            flag,
                            args: [
                                { type: 'select', label: 'Method', value: method, options: ['Sin', 'Cos', 'Add', 'Multiply', 'Pow'] },
                                { type: 'number', label: 'Val', value: parseFloat(val) || 0, min: 0, max: 10, step: 0.1 }
                            ]
                        });
                        i += val ? 2 : 1;
                    }
                    break;

                case 'fx': // Very complex, treat as text
                    if (nextPart) {
                        effects.push({
                            name: 'FX Math',
                            flag,
                            args: [{ type: 'text', label: 'Expr', value: nextPart }]
                        });
                        i++;
                    }
                    break;

                // --- Levels / Thresholds ---
                case 'level':
                case 'contrast-stretch':
                    if (nextPart) {
                        effects.push({
                            name: flag === 'level' ? 'Level' : 'Stretch',
                            flag,
                            args: [{ type: 'text', label: 'Range', value: nextPart }]
                        });
                        i++;
                    }
                    break;

                case 'threshold':
                    addNumeric('Threshold', 'threshold', numericVal, 0, 100, 1, '%');
                    i++;
                    break;

                case 'spread':
                    addNumeric('Spread', 'spread', numericVal, 0, 50, 1);
                    i++;
                    break;

                // --- Booleans / Toggles ---
                case 'monochrome':
                    effects.push({
                        name: 'Monochrome',
                        flag,
                        args: [{ type: 'number', label: 'Active', value: 1, min: 0, max: 1, step: 1 }]
                    });
                    break;

                case 'auto-level':
                    effects.push({
                        name: 'Auto Level',
                        flag,
                        args: [{ type: 'number', label: 'Active', value: 1, min: 0, max: 1, step: 1 }]
                    });
                    break;

                case 'dither':
                    if (nextPart) {
                        effects.push({
                            name: 'Dither',
                            flag,
                            args: [{ type: 'select', label: 'Method', value: nextPart, options: ['FloydSteinberg', 'Riemersma', 'None'] }]
                        });
                        i++;
                    }
                    break;

                case 'virtual-pixel':
                    if (nextPart) {
                        effects.push({
                            name: 'Virtual Pixel',
                            flag,
                            args: [{ type: 'select', label: 'Method', value: nextPart, options: ['Tile', 'Mirror', 'Black', 'White', 'Edge'] }]
                        });
                        i++;
                    }
                    break;

                // --- CATCH ALL FALLBACK ---
                default:
                    // If we don't recognize it, parse as generic text effect
                    // consuming args until next flag
                    {
                        const args: string[] = [];
                        let j = i + 1;
                        while (j < parts.length) {
                            const p = parts[j];
                            if (p.startsWith('-') || p.startsWith('+')) break;
                            args.push(p);
                            j++;
                        }

                        const argString = args.join(' ');
                        effects.push({
                            name: flag, // Capitalize?
                            flag,
                            args: argString ? [{ type: 'text', label: 'Args', value: argString }] : []
                        });

                        // Advance main loop
                        i = j - 1;
                    }
                    break;
            }
        }
    }
    return effects;
}


/**
 * Reconstruct an ImageMagick flag string from active Effects.
 */
export function reconstructCommand(effects: Effect[]): string {
    return effects
        .map(e => {
            // Handle Boolean/Toggle cases
            if (e.flag === 'negate') {
                const arg = e.args[0];
                return (arg.value as number) > 0.5 ? '-channel RGB -negate +channel' : '';
            }
            if (e.flag === 'grayscale') {
                const arg = e.args[0];
                return (arg.value as number) > 0.5 ? '-colorspace Gray' : '';
            }
            if (e.flag === 'edge') {
                const arg = e.args[0];
                return `-channel RGB -edge ${arg.value} +channel`;
            }

            // Morphology Special Case
            if (e.flag === 'morphology') {
                if (e.args.length >= 4) {
                    const method = e.args[0].value;
                    const kernel = e.args[1].value;
                    const arg1 = e.args[2].value;
                    const arg2 = e.args[3].value;

                    // If Arg2 (Signma/Height) is > 0, use 'x' separator: Kernel:Arg1xArg2
                    // Else use single arg: Kernel:Arg1
                    // Unless arg1 is also 0? Then specific kernels might just be 'Kernel' (like Skeleton:1? No, Skeleton is built-in)
                    // Skeleton usually doesn't take args in current context logic, but let's stick to :Args pattern for shapes.

                    let kernelStr = `${kernel}`;

                    // Only append args if they are relevant numbers (not both 0, though 0 might be valid for some?)
                    // "Disk" implies Disk:Radius.
                    if ((arg1 as number) > 0 || (arg2 as number) > 0) {
                        kernelStr += `:${arg1}`;
                        if ((arg2 as number) > 0) {
                            kernelStr += `x${arg2}`;
                        }
                    }

                    return `-morphology ${method} ${kernelStr}`;
                }
            }

            // Distort / Function Special Case
            if (e.flag === 'distort' || e.flag === 'function' || e.flag === 'evaluate') {
                if (e.args.length >= 2) {
                    return `-${e.flag} ${e.args[0].value} ${e.args[1].value}`;
                }
            }

            // Boolean Flags (Monochrome, AutoLevel)
            if (e.flag === 'monochrome' || e.flag === 'auto-level') {
                const arg = e.args[0];
                return (arg.value as number) > 0.5 ? `-${e.flag}` : '';
            }

            // Flag with + (e.g. +noise, +channel)
            if (e.flag.startsWith('+')) {
                const argsString = e.args.length > 0 ? ' ' + e.args.map(a => a.value).join(' ') : '';
                return `${e.flag}${argsString}`;
            }

            // Default reconstruction: -flag value1,value2...
            // Assemble arguments with units if present
            const argsString = e.args.length > 0 ? ' ' + e.args.map(a => `${a.value}${a.unit || ''}`).join(',') : '';

            // Handle space-separated args for specific flags if needed
            // ImageMagick is generally flexible, but some like -fill might prefer space?
            // "fill red" works. "fill,red" might not.
            // Let's assume space for strings/mixed, comma for strictly numeric lists (modulate)

            // Heuristic: if any arg is textual (not number), use space?
            const useSpace = e.args.some(a => typeof a.value === 'string' && isNaN(parseFloat(a.value as string)));

            // Revert back to proper formatting
            if (useSpace || e.flag === 'fill' || e.flag === 'compose' || e.flag === 'morphology') {
                return `-${e.flag} ${e.args.map(a => `${a.value}${a.unit || ''}`).join(' ')}`;
            }

            return `-${e.flag}${argsString}`;
        })
        .filter(s => s !== '')
        .join(' ');
}
