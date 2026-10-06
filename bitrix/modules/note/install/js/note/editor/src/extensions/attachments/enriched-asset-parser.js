// @flow

import { isEscapedAt } from './note-asset-parser';

type AssetType = 'image' | 'file' | 'video';

type ParseResult = {
	isImage: boolean,
	label: string,
	url: string,
	attrsRaw: string,
	raw: string,
};

type AssetMatch = {
	match: ParseResult,
	start: number,
	end: number,
};

export const ASSET_TYPE_TO_NODE: { [AssetType]: string } = Object.assign(Object.create(null), {
	image: 'imageAttachment',
	file: 'fileAttachment',
	video: 'video',
});

export function parseAttrs(str: string): { [string]: string }
{
	const attrs: { [string]: string } = {};
	const re = /(\w+)=(?:"([^"]*)"|(\S+))/g;
	let match = re.exec(str);
	while (match)
	{
		attrs[match[1]] = match[2] ?? match[3];
		match = re.exec(str);
	}

	return attrs;
}

/**
 * Scans `src` from `pos` forward, looking for a balanced pair of the given
 * open/close characters. Handles `\`-escaping and nesting via depth counter.
 *
 * Returns the index **after** the closing character, or -1 if unmatched.
 * `content` is written into `out.value`.
 */
function scanBalanced(
	src: string,
	pos: number,
	open: number,
	close: number,
	out: { value: string },
): number
{
	if (pos >= src.length || src.charCodeAt(pos) !== open)
	{
		return -1;
	}

	let depth = 1;
	const start = pos + 1;
	let i = start;

	while (i < src.length && depth > 0)
	{
		const ch = src.charCodeAt(i);
		if (ch === 0x5C) // backslash
		{
			i += 2; // skip escaped character
			continue;
		}

		if (ch === open)
		{
			depth++;
		}
		else if (ch === close)
		{
			depth--;
			if (depth === 0)
			{
				out.value = src.slice(start, i);

				return i + 1;
			}
		}

		i++;
	}

	return -1;
}

// Character codes
const CH_EXCL = 0x21; // !
const CH_OPEN_BRACKET = 0x5B; // [
const CH_OPEN_PAREN = 0x28; // (
const CH_CLOSE_PAREN = 0x29; // )
const CH_OPEN_BRACE = 0x7B; // {
const CH_CLOSE_BRACE = 0x7D; // }
const CH_CLOSE_BRACKET = 0x5D; // ]
const CH_SPACE = 0x20;
const CH_TAB = 0x09;
const CH_NEWLINE = 0x0A;

/**
 * Character-level parser for enriched asset syntax: `!?[label](url){attrs}`
 *
 * Properly handles nested brackets, parentheses, and braces via depth counters.
 * Recognises `\`-escaped delimiters inside each segment.
 *
 * @param {string} src   — source string
 * @param {number} pos   — position to start scanning from
 * @param {'block'|'inline'} mode
 *   - `'block'`: consumes 0-3 leading spaces/tabs and requires trailing
 *     `[ \t]*(\n|$)`.  `raw` spans from `pos` to end of trailing whitespace/newline.
 *   - `'inline'`: no leading-space limit, no trailing-newline requirement.
 *     `raw` spans exactly the `!?[label](url){attrs}` syntax, without surrounding whitespace.
 * @returns {ParseResult|null}
 */
export function parseEnrichedAssetSyntax(
	src: string,
	pos: number,
	mode: 'block' | 'inline',
): ParseResult | null
{
	let i = pos;

	// Block mode: consume 0-3 leading spaces/tabs
	if (mode === 'block')
	{
		let spaces = 0;
		while (i < src.length && spaces < 4)
		{
			const ch = src.charCodeAt(i);
			if (ch !== CH_SPACE && ch !== CH_TAB)
			{
				break;
			}

			spaces++;
			i++;
		}

		if (spaces >= 4)
		{
			return null; // code block territory
		}
	}

	// Optional `!` prefix (image marker)
	let isImage = false;
	if (i < src.length && src.charCodeAt(i) === CH_EXCL)
	{
		isImage = true;
		i++;
	}

	// [label]
	const labelOut = { value: '' };
	const afterLabel = scanBalanced(src, i, CH_OPEN_BRACKET, CH_CLOSE_BRACKET, labelOut);
	if (afterLabel === -1)
	{
		return null;
	}

	// (url) — must follow immediately
	const urlOut = { value: '' };
	const afterUrl = scanBalanced(src, afterLabel, CH_OPEN_PAREN, CH_CLOSE_PAREN, urlOut);
	if (afterUrl === -1)
	{
		return null;
	}

	// {attrs} — must follow immediately
	const attrsOut = { value: '' };
	const afterAttrs = scanBalanced(src, afterUrl, CH_OPEN_BRACE, CH_CLOSE_BRACE, attrsOut);
	if (afterAttrs === -1)
	{
		return null;
	}

	// Block mode: consume optional trailing spaces/tabs, then require \n or EOF
	let endPos = afterAttrs;
	if (mode === 'block')
	{
		while (endPos < src.length)
		{
			const ch = src.charCodeAt(endPos);
			if (ch !== CH_SPACE && ch !== CH_TAB)
			{
				break;
			}

			endPos++;
		}

		if (endPos < src.length && src.charCodeAt(endPos) !== CH_NEWLINE)
		{
			return null; // trailing content after attrs — not a standalone block
		}

		if (endPos < src.length)
		{
			endPos++; // consume the newline
		}
	}

	if (!urlOut.value)
	{
		return null; // empty URL
	}

	return {
		isImage,
		label: labelOut.value,
		url: urlOut.value,
		attrsRaw: attrsOut.value,
		raw: src.slice(pos, endPos),
	};
}

/**
 * Fast candidate finder for `markdownTokenizer.start()`.
 *
 * Scans `src` for positions where an enriched asset *might* begin,
 * without running the full parser. Returns the index of the line start
 * (including leading spaces) for the first viable candidate, or -1.
 *
 * Complexity: O(n) typical. Worst case O(n^2) when many `[` occur without
 * a matching `){` sequence — each `[` triggers a linear look-ahead to find
 * `){`. In practice, markdown documents are compact and this is not an issue,
 * but be aware of this on very large synthetic inputs.
 */
export function findEnrichedAssetStart(src: string): number
{
	let searchFrom = 0;

	while (searchFrom < src.length)
	{
		const bracketIdx = src.indexOf('[', searchFrom);
		if (bracketIdx === -1)
		{
			return -1;
		}

		// Walk back to find line start and count leading whitespace
		let lineStart = bracketIdx;
		let leadingSpaces = 0;
		while (lineStart > 0 && src.charCodeAt(lineStart - 1) !== CH_NEWLINE)
		{
			lineStart--;
		}

		// Count spaces/tabs from lineStart to bracketIdx (or bracketIdx-1 if `!` prefix)
		let prefixEnd = bracketIdx;
		if (prefixEnd > lineStart && src.charCodeAt(prefixEnd - 1) === CH_EXCL)
		{
			prefixEnd--;
		}

		let valid = true;
		for (let k = lineStart; k < prefixEnd; k++)
		{
			const ch = src.charCodeAt(k);
			if (ch === CH_SPACE || ch === CH_TAB)
			{
				leadingSpaces++;
			}
			else
			{
				valid = false;
				break;
			}
		}

		if (!valid || leadingSpaces > 3)
		{
			searchFrom = bracketIdx + 1;
			continue;
		}

		// Quick look-ahead: check that `){` appears somewhere after `[`
		const closeParen = src.indexOf('){', bracketIdx);
		if (closeParen === -1)
		{
			// No `){` anywhere after this point — no match possible
			return -1;
		}

		return lineStart;
	}

	return -1;
}

/**
 * Finds all enriched asset occurrences in a string.
 * Designed for mixed-content table cells where text and assets can be interleaved.
 *
 * Returns an array of `{ match, start, end }` where `start` and `end` are
 * positions in the original `src` string. Text between assets can be extracted
 * via `src.slice(prevEnd, nextStart)`.
 */
export function parseAllEnrichedAssets(src: string): AssetMatch[]
{
	const results: AssetMatch[] = [];
	const closingPositions = buildClosingPositions(src);
	let pos = 0;

	while (pos < src.length)
	{
		// Find next `[` or `![` candidate
		const bracketIdx = src.indexOf('[', pos);
		if (bracketIdx === -1)
		{
			break;
		}

		// Check for `!` prefix
		const startPos = (bracketIdx > 0 && src.charCodeAt(bracketIdx - 1) === CH_EXCL)
			? bracketIdx - 1
			: bracketIdx;

		// Don't re-scan positions we already covered
		if (startPos < pos)
		{
			pos = bracketIdx + 1;
			continue;
		}

		const result = parseEnrichedAssetSyntaxWithClosingPositions(src, startPos, closingPositions);
		if (result)
		{
			results.push({
				match: result,
				start: startPos,
				end: startPos + result.raw.length,
			});
			pos = startPos + result.raw.length;
		}
		else
		{
			pos = bracketIdx + 1;
		}
	}

	return results;
}

function buildClosingPositions(src: string): Int32Array
{
	const closingPositions = new Int32Array(src.length);
	closingPositions.fill(-1);
	const stacks = new Map([
		[CH_OPEN_BRACKET, []],
		[CH_OPEN_PAREN, []],
		[CH_OPEN_BRACE, []],
	]);
	const openingByClosing = new Map([
		[CH_CLOSE_BRACKET, CH_OPEN_BRACKET],
		[CH_CLOSE_PAREN, CH_OPEN_PAREN],
		[CH_CLOSE_BRACE, CH_OPEN_BRACE],
	]);

	for (let index = 0; index < src.length; index++)
	{
		const character = src.charCodeAt(index);
		if (character === 0x5C)
		{
			index++;
			continue;
		}

		if (stacks.has(character))
		{
			stacks.get(character).push(index);
			continue;
		}

		const opening = openingByClosing.get(character);
		const stack = stacks.get(opening);
		if (stack?.length > 0)
		{
			closingPositions[stack.pop()] = index;
		}
	}

	return closingPositions;
}

function parseEnrichedAssetSyntaxWithClosingPositions(
	src: string,
	pos: number,
	closingPositions: Int32Array,
): ParseResult | null
{
	let labelStart = pos;
	let isImage = false;
	if (src.charCodeAt(labelStart) === CH_EXCL)
	{
		isImage = true;
		labelStart++;
	}

	if (src.charCodeAt(labelStart) !== CH_OPEN_BRACKET)
	{
		return null;
	}

	const labelEnd = closingPositions[labelStart];
	const urlStart = labelEnd + 1;
	if (labelEnd < 0 || src.charCodeAt(urlStart) !== CH_OPEN_PAREN)
	{
		return null;
	}

	const urlEnd = closingPositions[urlStart];
	const attrsStart = urlEnd + 1;
	if (urlEnd < 0 || src.charCodeAt(attrsStart) !== CH_OPEN_BRACE)
	{
		return null;
	}

	const attrsEnd = closingPositions[attrsStart];
	if (attrsEnd < 0 || urlEnd === urlStart + 1)
	{
		return null;
	}

	const end = attrsEnd + 1;

	return {
		isImage,
		label: src.slice(labelStart + 1, labelEnd),
		url: src.slice(urlStart + 1, urlEnd),
		attrsRaw: src.slice(attrsStart + 1, attrsEnd),
		raw: src.slice(pos, end),
	};
}

export function findValidEnrichedAssetMatches(src: string): AssetMatch[]
{
	return parseAllEnrichedAssets(src).filter(({ match, start }) => {
		if (isEscapedAt(src, start))
		{
			return false;
		}

		const attrs = parseAttrs(match.attrsRaw);
		const fileId = Number(attrs.fileId);
		const hasAllowedType = Object.prototype.hasOwnProperty.call(ASSET_TYPE_TO_NODE, attrs.type);

		return hasAllowedType && Number.isInteger(fileId) && fileId > 0;
	});
}

/**
 * Pre-processes a markdown string so that enriched assets mixed with text
 * on the same line are split onto their own lines. This allows the block-level
 * EnrichedAssetTokenizer to recognise them.
 *
 * Example:
 *   "sad ![img](/url){f=1}" → "sad\n\n![img](/url){f=1}"
 *   "![img](/url){f=1} text" → "![img](/url){f=1}\n\ntext"
 *
 * Lines that are already a standalone enriched asset are left unchanged.
 * Lines with no enriched assets are left unchanged.
 */
export function splitInlineAssets(src: string): string
{
	const lines = src.split('\n');
	const result: string[] = [];

	for (const line of lines)
	{
		const assets = parseAllEnrichedAssets(line);
		if (assets.length === 0)
		{
			result.push(line);
			continue;
		}

		// Check if the entire line is already a single asset (with optional whitespace)
		if (assets.length === 1 && line.trim() === assets[0].match.raw)
		{
			result.push(line);
			continue;
		}

		// Split: emit text before, asset, text after, etc.
		let lastEnd = 0;
		for (const { match, start, end } of assets)
		{
			const before = line.slice(lastEnd, start).trim();
			if (before.length > 0)
			{
				result.push(before);
				result.push('');
			}
			else if (lastEnd > 0)
			{
				// Consecutive assets with only whitespace between them —
				// add a blank line so the block tokenizer sees them as separate blocks.
				result.push('');
			}

			result.push(match.raw);
			lastEnd = end;
		}

		const after = line.slice(lastEnd).trim();
		if (after.length > 0)
		{
			result.push('');
			result.push(after);
		}
	}

	return result.join('\n');
}
