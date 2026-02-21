import { tokenize, isFlag, peekArgs, FLAG_RULES } from '$lib/ai/validator';

export interface SplitEntry {
    label: string;
    command: string;
}

/**
 * Split a complex ImageMagick command into granular stack entries.
 * Groups -channel ... +channel blocks into single entries.
 */
export function splitCommand(rawCommand: string): SplitEntry[] {
    const tokens = tokenize(rawCommand);
    const entries: SplitEntry[] = [];

    let i = 0;
    while (i < tokens.length) {
        const token = tokens[i];

        // 1. Handle Channel Grouping (-channel ... +channel)
        if (token === '-channel') {
            const channelStart = i;
            let channelEnd = -1;
            let depth = 0;

            // Scan forward for matching +channel
            for (let j = i; j < tokens.length; j++) {
                if (tokens[j] === '-channel') depth++;
                if (tokens[j] === '+channel') {
                    depth--;
                    if (depth === 0) {
                        channelEnd = j;
                        break;
                    }
                }
            }

            if (channelEnd !== -1) {
                // Found a complete block
                const blockTokens = tokens.slice(channelStart, channelEnd + 1);
                const blockCommand = blockTokens.join(' ');

                // Construct a label based on the content inside
                // e.g., "Red Channel: Negate, Blur"
                const innerTokens = tokens.slice(channelStart + 2, channelEnd); // Skip -channel ARG ... +channel
                const operations = innerTokens.filter(t => isFlag(t)).map(t => formatLabel(t));
                const channelName = tokens[channelStart + 1]; // The arg after -channel

                let label = `${channelName} Channel`;
                if (operations.length > 0) {
                    label += `: ${operations.slice(0, 2).join(', ')}`;
                    if (operations.length > 2) label += '...';
                }

                entries.push({ label, command: blockCommand });
                i = channelEnd + 1;
                continue;
            }
            // If no matching +channel, fall through to normal processing
        }

        // 2. Handle Parentheses (group them as one entry)
        if (token === '(') {
            let parenEnd = -1;
            let depth = 0;
            for (let j = i; j < tokens.length; j++) {
                if (tokens[j] === '(') depth++;
                if (tokens[j] === ')') {
                    depth--;
                    if (depth === 0) {
                        parenEnd = j;
                        break;
                    }
                }
            }

            if (parenEnd !== -1) {
                const blockTokens = tokens.slice(i, parenEnd + 1);
                entries.push({
                    label: 'Layer Group',
                    command: blockTokens.join(' ')
                });
                i = parenEnd + 1;
                continue;
            }
        }

        // 3. Normal Flag Processing
        if (isFlag(token)) {
            // Filter: Ignore stray +channel (it's a reset, not an effect)
            if (token === '+channel') {
                i++;
                continue;
            }

            const rule = FLAG_RULES[token];
            const argsToConsume = rule ? rule.argCount : 0;

            // Collect args
            const availableArgs = peekArgs(tokens, i + 1);
            const args = availableArgs.slice(0, argsToConsume);

            // Filter: Ignore -alpha opaque (system enforcement)
            if (token === '-alpha' && args[0] === 'opaque') {
                i += 1 + args.length;
                continue;
            }

            const atomTokens = [token, ...args];
            entries.push({
                label: formatLabel(token, args),
                command: atomTokens.join(' ')
            });

            i += 1 + args.length;
        } else {
            // Stray token, skip
            i++;
        }
    }

    return entries;
}

/**
 * Format a flag into a human-readable label.
 * e.g. "-edge" -> "Edge", "-liquid-rescale" -> "Liquid Rescale"
 */
function formatLabel(flag: string, args: string[] = []): string {
    // Remove leading dashes
    const raw = flag.replace(/^-+/, '');

    // Capitalize words
    const words = raw.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1));
    let name = words.join(' ');

    // Add key arguments for context
    if (args.length > 0) {
        // Truncate long args
        const argStr = args.map(a => a.length > 10 ? a.slice(0, 8) + '..' : a).join(' ');
        name += ` ${argStr}`;
    }

    return name;
}
