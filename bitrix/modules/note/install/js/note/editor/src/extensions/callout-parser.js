/**
 * Character-level parser for callout blocks (:::info / :::success / :::warning / :::tip / :::zefir).
 *
 * Zero external dependencies — safe for unit testing without @tiptap/core.
 *
 * `CALLOUT_TYPES` — public types shown in toolbar/slash menus.
 * `RECOGNIZED_CALLOUT_TYPES` — additionally accepted by the tokenizer/serializer
 * (e.g. system-only `zefir`, used by welcome content).
 */

export const CALLOUT_TYPES: string[] = ['info', 'success', 'warning', 'tip'];
export const RECOGNIZED_CALLOUT_TYPES: string[] = [...CALLOUT_TYPES, 'zefir'];

function isTypeTerminator(ch: string | undefined): boolean
{
	return !ch || ch === '\n' || ch === '\r' || ch === ' ' || ch === '\t';
}

/**
 * Scans `src` for the first line containing `:::type` (optionally indented).
 * Returns the character index of the line start, or -1.
 */
export function findCalloutStart(src: string): number
{
	let i = 0;
	while (i < src.length)
	{
		const lineStart = i;

		// Skip leading whitespace (spaces/tabs only)
		let j = i;
		while (j < src.length && (src[j] === ' ' || src[j] === '\t'))
		{
			j++;
		}

		// Check for :::
		if (src[j] === ':' && src[j + 1] === ':' && src[j + 2] === ':')
		{
			const afterColons = j + 3;
			for (const type of RECOGNIZED_CALLOUT_TYPES)
			{
				if (src.slice(afterColons, afterColons + type.length) === type
					&& isTypeTerminator(src[afterColons + type.length]))
				{
					return lineStart;
				}
			}
		}

		// Advance to next line
		while (i < src.length && src[i] !== '\n')
		{
			i++;
		}
		if (i < src.length)
		{
			i++; // skip \n
		}
	}

	return -1;
}

export type CalloutParseResult = {
	indent: string,
	calloutType: string,
	body: string,
	raw: string,
};

/**
 * Parses a callout block starting at position 0 of `src`.
 *
 * Expects:
 *   [indent]:::type[ws]\n
 *   body lines...
 *   [indent]:::[ws]\n
 *
 * Returns { indent, calloutType, body, raw } or null.
 * `raw` is the full matched text (opening through closing inclusive),
 * consumed by marked so subsequent text is not swallowed.
 * `body` is dedented if the opening was indented.
 */
export function parseCalloutBlock(src: string): CalloutParseResult | null
{
	let pos = 0;

	// Read leading indent (spaces/tabs)
	while (pos < src.length && (src[pos] === ' ' || src[pos] === '\t'))
	{
		pos++;
	}
	const indent = src.slice(0, pos);

	// Expect :::
	if (src[pos] !== ':' || src[pos + 1] !== ':' || src[pos + 2] !== ':')
	{
		return null;
	}
	pos += 3;

	// Read callout type
	let calloutType: string | null = null;
	for (const type of RECOGNIZED_CALLOUT_TYPES)
	{
		if (src.slice(pos, pos + type.length) === type && isTypeTerminator(src[pos + type.length]))
		{
			calloutType = type;
			pos += type.length;
			break;
		}
	}
	if (!calloutType)
	{
		return null;
	}

	// Skip rest of opening line (whitespace until newline)
	while (pos < src.length && src[pos] !== '\n')
	{
		pos++;
	}
	if (pos >= src.length)
	{
		return null; // no body — unclosed callout
	}
	pos++; // skip \n

	// Scan lines for closing :::
	const bodyStart = pos;
	let bodyEnd = -1;
	let closingEnd = -1;

	while (pos < src.length)
	{
		const lineStart = pos;

		// Skip leading whitespace on this line
		let contentStart = pos;
		while (contentStart < src.length && (src[contentStart] === ' ' || src[contentStart] === '\t'))
		{
			contentStart++;
		}

		// Check if this line is a closing :::
		if (src[contentStart] === ':' && src[contentStart + 1] === ':' && src[contentStart + 2] === ':')
		{
			// Verify nothing meaningful follows the :::
			let afterClose = contentStart + 3;
			while (afterClose < src.length && (src[afterClose] === ' ' || src[afterClose] === '\t'))
			{
				afterClose++;
			}

			if (afterClose >= src.length || src[afterClose] === '\n')
			{
				bodyEnd = lineStart > bodyStart ? lineStart - 1 : lineStart;
				closingEnd = afterClose < src.length ? afterClose + 1 : afterClose;
				break;
			}
		}

		// Advance to next line
		while (pos < src.length && src[pos] !== '\n')
		{
			pos++;
		}
		if (pos < src.length)
		{
			pos++;
		}
	}

	if (bodyEnd === -1)
	{
		return null; // no closing :::
	}

	let body = src.slice(bodyStart, bodyEnd);
	const raw = src.slice(0, closingEnd);

	body = dedentBody(body, indent.length);

	return { indent, calloutType, body, raw };
}

/**
 * Strips leading whitespace from all non-empty lines.
 *
 * When `indentSize` is provided (from the opening `:::` indent), each line
 * is stripped by exactly that many columns.  Lines with less indent are
 * stripped as far as possible (down to column 0).
 *
 * When `indentSize` is omitted, the minimum common leading whitespace
 * across all non-empty lines is used (original behaviour).
 */
export function dedentBody(body: string, indentSize?: number): string
{
	const lines = body.split('\n');
	let stripAmount: number;

	if (indentSize !== undefined && indentSize > 0)
	{
		stripAmount = indentSize;
	}
	else
	{
		stripAmount = Infinity;
		for (const line of lines)
		{
			if (line.trim().length === 0)
			{
				continue;
			}

			let spaces = 0;
			for (let k = 0; k < line.length; k++)
			{
				if (line[k] === ' ')
				{
					spaces++;
				}
				else if (line[k] === '\t')
				{
					spaces += 4;
				}
				else
				{
					break;
				}
			}

			if (spaces < stripAmount)
			{
				stripAmount = spaces;
			}
		}
	}

	if (stripAmount === 0 || stripAmount === Infinity)
	{
		return body;
	}

	return lines.map((line) => {
		if (line.trim().length === 0)
		{
			return line;
		}

		let removed = 0;
		let i = 0;
		while (i < line.length && removed < stripAmount)
		{
			if (line[i] === ' ')
			{
				removed++;
				i++;
			}
			else if (line[i] === '\t')
			{
				removed += 4;
				i++;
			}
			else
			{
				break;
			}
		}

		return line.slice(i);
	}).join('\n');
}
