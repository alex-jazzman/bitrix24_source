/**
 * @module im/messenger/lib/parser/markdown/rules/block-rules
 */
jn.define('im/messenger/lib/parser/markdown/rules/block-rules', (require, exports, module) => {
	const { Type } = require('type');
	const { MARKDOWN_CODE_PREFIX } = require('im/messenger/lib/parser/const');

	// BB-code [size=N] values for each heading level.
	const HEADING_SIZES = {
		h1: 26,
		h2: 22,
		h3: 20,
		h4: 18,
		h5: 16,
		h6: 14,
	};

	/**
	 * @param {string} text
	 * @param {number} size
	 * @returns {string}
	 */
	function formatHeading(text, size)
	{
		return `[size=${size}][b]${text}[/b][/size]`;
	}

	/**
	 * @param {string} line
	 * @returns {boolean}
	 */
	function isCodePlaceholder(line)
	{
		return line.startsWith(MARKDOWN_CODE_PREFIX);
	}

	// Bitrix quote separators use exactly 54 dashes.
	// Limit Markdown constructs to avoid collisions with them.
	const MAX_MARKDOWN_RULE_LENGTH = 20;

	/**
	 * @param {string} line
	 * @returns {boolean}
	 */
	function isHorizontalRuleLine(line)
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
	function getSetextMarkerType(line)
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
	function isValidSetextContent(line)
	{
		if (!line || line.trim() === '')
		{
			return false;
		}

		if (isCodePlaceholder(line))
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
	function applyBlockRules(text)
	{
		if (!Type.isStringFilled(text))
		{
			return '';
		}

		const lines = text.split('\n');
		const result = [];

		let i = 0;
		while (i < lines.length)
		{
			const line = lines[i];
			const nextLine = i + 1 < lines.length ? lines[i + 1] : null;

			// Skip code placeholders entirely
			if (isCodePlaceholder(line))
			{
				result.push(line);
				i++;
				continue;
			}

			// Setext heading has priority over horizontal rule per CommonMark spec:
			// "text\n---" is setext H2, not a paragraph + hr.
			// Only when the preceding line is empty/invalid does --- become hr.
			if (nextLine !== null && !isCodePlaceholder(nextLine))
			{
				const setextType = getSetextMarkerType(nextLine);
				if (setextType && isValidSetextContent(line))
				{
					const size = HEADING_SIZES[setextType];
					result.push(formatHeading(line.trim(), size));
					i += 2; // skip both lines
					continue;
				}
			}

			result.push(applyLineRules(line));
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
	function applyLineRules(line)
	{
		// ATX headings: # through ######, must have space after #
		const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
		if (headingMatch)
		{
			const level = headingMatch[1].length;
			const content = headingMatch[2].replace(/\s+#+\s*$/, '').trim(); // remove trailing # markers
			const size = HEADING_SIZES[`h${level}`];

			return formatHeading(content, size);
		}

		// Horizontal rule: line that is only dashes, asterisks, underscores (3+), with optional spaces
		if (isHorizontalRuleLine(line))
		{
			return '____________';
		}

		// Blockquote: > text or >text → >> text (BB-quote).
		// Skip lines already starting with >> (existing BB-quotes).
		if (/^>[^>]/.test(line) || line === '>')
		{
			return `>${line}`;
		}

		// Unordered list: - item, * item, + item (must have space after marker)
		const ulMatch = line.match(/^([*+-])\s(.*)$/);
		if (ulMatch)
		{
			return `\u2022 ${ulMatch[2]}`;
		}

		// Ordered list: passthrough (no changes needed)

		return line;
	}

	module.exports = {
		applyBlockRules,
	};
});
