/**
 * Sanitizer — cleans AI-generated commands and forces file mapping
 * for wasm-imagemagick's execute() API.
 *
 * The execute API requires explicit input/output filenames in the command.
 * We force: convert -size WxH -depth 8 source.rgba <flags...> out.jpg
 */

const INPUT_FILE = 'source.rgba';
const OUTPUT_FILE = 'out.rgba'; // Raw RGBA for display pipeline

/**
 * Clean a raw command string from Gemini and produce a safe
 * command string for wasm-imagemagick.
 *
 * @param raw - The raw AI-generated command string (flags only, no filenames)
 * @param width - Image width (required for raw input)
 * @param height - Image height (required for raw input)
 * @param exportMode - (Optional) If true, output JPEG with quality
 * @returns A complete commands string
 */
/**
 * Parse a shell command string into an array of arguments,
 * respecting quotes and stripping them.
 */
function parseShellArgs(raw: string): string[] {
    const args: string[] = [];
    let current = '';
    let quoteChar: string | null = null;
    let escape = false;

    for (let i = 0; i < raw.length; i++) {
        const char = raw[i];

        if (escape) {
            current += char;
            escape = false;
            continue;
        }

        if (char === '\\') {
            escape = true;
            continue;
        }

        if (quoteChar) {
            if (char === quoteChar) {
                quoteChar = null; // End quote
            } else {
                current += char;
            }
        } else {
            if (char === '"' || char === "'") {
                quoteChar = char;
            } else if (char === ' ' || char === '\t') {
                if (current.length > 0) {
                    args.push(current);
                    current = '';
                }
            } else {
                current += char;
            }
        }
    }

    if (current.length > 0) {
        args.push(current);
    }

    return args;
}

/**
 * Clean a raw command string from Gemini and produce a safe
 * command string for wasm-imagemagick.
 */
export function sanitizeCommand(raw: string, width: number, height: number, exportMode = false): string {
    let cleaned = raw;

    // 1. Strip markdown backticks
    cleaned = cleaned.replace(/```[a-z]*\n?/gi, '');
    cleaned = cleaned.replace(/`/g, '');

    // 2. Remove "magick" / "convert" / "magica" prefix
    cleaned = cleaned.replace(/^(magick|convert|magica)\s+/i, '');

    // 3. Remove hallucinated filenames
    cleaned = cleaned.replace(/\b(input|output|source|out|result)\.(png|jpg|jpeg|gif|webp|tiff|bmp|rgba)\b/gi, '');

    // 4. Remove placeholders
    cleaned = cleaned.replace(/<[^>]+>/g, '1');

    // 5. Remove newlines
    cleaned = cleaned.replace(/[\r\n]+/g, ' ').trim();

    if (!cleaned) {
        cleaned = '-negate';
    }

    // Parse the cleaned user command into args (stripping quotes)
    const userArgs = parseShellArgs(cleaned);

    // Build the full arg list
    const args = ['convert'];

    // Input args: -size WxH -depth 8 source.rgba
    args.push('-size', `${width}x${height}`, '-depth', '8', INPUT_FILE);

    // User args
    args.push(...userArgs);

    if (exportMode) {
        args.push('-quality', '90', 'out.jpg');
    } else {
        // Display mode: -filter Point -resize WxH! -depth 8 out.rgba
        args.push('-filter', 'Point', '-resize', `${width}x${height}!`, '-depth', '8', OUTPUT_FILE);
    }

    // Smart join: Quote arguments only if they contain spaces
    return args.map(arg => {
        if (arg.includes(' ') || arg.includes('\t')) {
            return `"${arg}"`;
        }
        return arg;
    }).join(' ');
}

export { INPUT_FILE, OUTPUT_FILE };
