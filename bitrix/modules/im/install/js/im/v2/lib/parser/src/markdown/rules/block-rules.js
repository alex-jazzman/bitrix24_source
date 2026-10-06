import { Type } from 'main.core';

import { MARKDOWN_CODE_PREFIX, MARKDOWN_LIST_TAG_PREFIX, MARKDOWN_TABLE_GUARD_PREFIX } from '../const.js';

// BB-code [size=N] values for each heading level. Tightened scale: H1 starts at
// the former H2 size, the series steps down by 2px, and H5/H6 share the floor (14).
const HEADING_SIZES = {
	h1: 22,
	h2: 20,
	h3: 18,
	h4: 16,
	h5: 14,
	h6: 14,
};

/**
 * H1/H2 become a block-level [h1]/[h2] tag (rendered later by ParserHeading.decodeHeading
 * as a styled block with a subtle bottom rule). H3–H6 stay inline as [size][b], which is
 * enough visual hierarchy for the smaller levels and keeps them on the message line.
 *
 * @param {string} text
 * @param {number} level
 * @returns {string}
 */
function formatHeading(text: string, level: number): string
{
	if (level === 1 || level === 2)
	{
		return `[h${level}]${text}[/h${level}]`;
	}

	return `[size=${HEADING_SIZES[`h${level}`]}][b]${text}[/b][/size]`;
}

/**
 * @param {string} line
 * @returns {boolean}
 */
function isCodePlaceholder(line: string): boolean
{
	return line.startsWith(MARKDOWN_CODE_PREFIX);
}

/**
 * A line produced by convertLists / convertTables (a whole list or table already collapsed
 * behind a guard placeholder) is opaque structure, not setext-able prose. Without this, a
 * Markdown list or table directly followed by `---` (no blank line) — a common shape in
 * pasted / AI-generated GFM — is mis-promoted to an [h2] setext heading wrapping the whole
 * block, and the `---` thematic break is swallowed instead of rendering as [hr] (MDQ-2).
 *
 * @param {string} line
 * @returns {boolean}
 */
function isStructuralPlaceholder(line: string): boolean
{
	return line.startsWith(MARKDOWN_LIST_TAG_PREFIX) || line.startsWith(MARKDOWN_TABLE_GUARD_PREFIX);
}

// Bitrix quote separators use exactly 54 dashes.
// Limit Markdown constructs to avoid collisions with them.
const MAX_MARKDOWN_RULE_LENGTH = 20;

/**
 * @param {string} line
 * @returns {boolean}
 */
function isHorizontalRuleLine(line: string): boolean
{
	const trimmed = line.trim();
	if (trimmed.length > MAX_MARKDOWN_RULE_LENGTH)
	{
		return false;
	}

	// Pure: ---, ***, ___ (3+ of same char)
	if (/^-{3,}$/.test(trimmed) || /^\*{3,}$/.test(trimmed) || /^_{3,}$/.test(trimmed))
	{
		return true;
	}

	// Spaced variants: - - -, * * *, _ _ _ (3+ of same char with optional spaces)
	return /^(- ?){3,}$/.test(trimmed) || /^(\* ?){3,}$/.test(trimmed) || /^(_ ?){3,}$/.test(trimmed);
}

/**
 * Check if a line could be a setext heading marker
 * @param {string} line
 * @returns {'h1'|'h2'|null}
 */
function getSetextMarkerType(line: string): string | null
{
	const trimmed = line.trim();
	if (trimmed.length > MAX_MARKDOWN_RULE_LENGTH)
	{
		return null;
	}

	if (/^={3,}$/.test(trimmed))
	{
		return 'h1';
	}

	if (/^-{3,}$/.test(trimmed))
	{
		return 'h2';
	}

	return null;
}

/**
 * Check if a line is valid text for a setext heading (non-empty, not a rule/heading/placeholder)
 * @param {string} line
 * @returns {boolean}
 */
function isValidSetextContent(line: string): boolean
{
	if (!line || line.trim() === '')
	{
		return false;
	}

	if (isCodePlaceholder(line) || isStructuralPlaceholder(line))
	{
		return false;
	}

	if (/^#{1,6}\s/.test(line))
	{
		return false;
	}

	return !isHorizontalRuleLine(line);
}

/**
 * Apply all block-level Markdown rules to text.
 * Handles multi-line constructs (setext headings) first, then per-line rules.
 *
 * @param {string} text
 * @returns {string}
 */
export function applyBlockRules(text: string): string
{
	if (!Type.isStringFilled(text))
	{
		return '';
	}

	const lines = text.split('\n');
	const result = [];

	let i = 0;
	// True while the previous emitted line was a Markdown single-'>' quote, so the next
	// '>>' line knows whether to nest (see the blockquote branch below).
	let quoteSingleContext = false;
	while (i < lines.length)
	{
		const line = lines[i];
		const nextLine = i + 1 < lines.length ? lines[i + 1] : null;

		if (isCodePlaceholder(line))
		{
			result.push(line);
			quoteSingleContext = false;
			i++;
			continue;
		}

		if (nextLine !== null && !isCodePlaceholder(nextLine))
		{
			const setextType = getSetextMarkerType(nextLine);
			if (setextType && isValidSetextContent(line))
			{
				const level = setextType === 'h1' ? 1 : 2;
				result.push(formatHeading(line.trim(), level));
				quoteSingleContext = false;
				i += 2; // skip both lines
				continue;
			}
		}

		// Blockquote nesting. A single '>' is a level-1 quote (encoded '>>'). A '>>' line
		// is a level-2 (nested) quote — encoded '>>>>' — ONLY when it directly follows a
		// single-'>' Markdown quote; otherwise it stays level-1, preserving the legacy
		// old-chat '>>' quote format. decodeArrowQuote renders the extra level as nesting.
		const isDoubleQuote = /^>>/.test(line);
		const isSingleQuote = !isDoubleQuote && line.startsWith('>');
		if (isDoubleQuote)
		{
			result.push(quoteSingleContext ? `>>${line}` : line);
			i++;
			continue;
		}
		if (isSingleQuote)
		{
			result.push(`>${line}`);
			quoteSingleContext = true;
			i++;
			continue;
		}

		result.push(applyLineRules(line));
		quoteSingleContext = false;
		i++;
	}

	return result.join('\n');
}

/**
 * Apply per-line block rules to a single line.
 *
 * @param {string} line
 * @returns {string}
 */
function applyLineRules(line: string): string
{
	// ATX headings: # through ######, must have space after #
	const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
	if (headingMatch)
	{
		const level = headingMatch[1].length;
		const content = headingMatch[2].replace(/\s+#+\s*$/, '').trim(); // remove trailing # markers

		return formatHeading(content, level);
	}

	// Horizontal rule: line that is only dashes, asterisks, underscores (3+), with optional
	// spaces. Emitted as a block [hr] marker that ParserHeading.decodeHeading renders as a
	// thin rule line (parser.css), the same hairline style as the H1/H2 underline.
	if (isHorizontalRuleLine(line))
	{
		return '[hr]';
	}

	// Blockquotes are handled in applyBlockRules (they need cross-line state for nesting).
	// Lists ([list]/[list=1]) are handled earlier by convertLists, not here.

	return line;
}
