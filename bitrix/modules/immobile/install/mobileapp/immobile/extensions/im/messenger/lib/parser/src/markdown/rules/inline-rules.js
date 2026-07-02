/**
 * @module im/messenger/lib/parser/markdown/rules/inline-rules
 */
jn.define('im/messenger/lib/parser/markdown/rules/inline-rules', (require, exports, module) => {
	const { Color } = require('tokens');
	const { MARKDOWN_INLINE_CODE_PREFIX, MARKDOWN_PLACEHOLDER_SUFFIX } = require('im/messenger/lib/parser/const');

	// Word-like characters for underscore boundary detection (ASCII + Latin Extended + Cyrillic).
	// Android doesn't support \p{L}/\p{N} Unicode property escapes.
	const WORD_CHAR = '[\\w\\u00C0-\\u024F\\u0400-\\u04FF]';
	const wordCharPattern = new RegExp(WORD_CHAR);

	/**
	 * @param {string} text
	 * @param {number} offset
	 * @return {boolean}
	 */
	function hasWordCharBefore(text, offset)
	{
		return offset > 0 && wordCharPattern.test(text[offset - 1]);
	}

	/**
	 * Applies inline Markdown rules to text, converting to BB-code equivalents.
	 *
	 * Assumes code blocks are already replaced with ####MD_CODE_N#### placeholders
	 * and escape sequences with ####MD_ESC_N#### placeholders.
	 *
	 * @param {string} text
	 * @return {string}
	 */
	function applyInlineRules(text)
	{
		const inlineCodeBlocks = [];
		text = protectInlineCode(text, inlineCodeBlocks);
		// Image (before link — `![` is more specific than `[`)
		text = applyImage(text);
		// Link before bold/italic so [**text**](url) keeps the link
		text = applyLink(text);
		text = applyBoldItalic(text);
		text = applyBold(text);
		text = applyItalic(text);
		text = applyStrikethrough(text);
		text = applyAutolinkUrl(text);
		text = applyAutolinkEmail(text);
		text = restoreInlineCode(text, inlineCodeBlocks);

		return text;
	}

	/**
	 * Replace inline code spans with placeholders to protect content from formatting rules.
	 *
	 * @param {string} text
	 * @param {string[]} storage - array to store original code content
	 * @return {string}
	 */
	function protectInlineCode(text, storage)
	{
		const placeholderOnlyPattern = new RegExp(
			`^\\s*(?:${MARKDOWN_INLINE_CODE_PREFIX}\\d+${MARKDOWN_PLACEHOLDER_SUFFIX}\\s*)+$`,
		);

		// Triple backticks first: ```code```
		text = text.replaceAll(/```(.+?)```/g, (match, code) => {
			const index = storage.length;
			storage.push(code.trim());

			return `${MARKDOWN_INLINE_CODE_PREFIX}${index}${MARKDOWN_PLACEHOLDER_SUFFIX}`;
		});

		// Double backticks: ``code``
		text = text.replaceAll(/``(.+?)``/g, (match, code) => {
			if (placeholderOnlyPattern.test(code))
			{
				return match;
			}

			const index = storage.length;
			storage.push(code.trim());

			return `${MARKDOWN_INLINE_CODE_PREFIX}${index}${MARKDOWN_PLACEHOLDER_SUFFIX}`;
		});

		// Single backticks: `code`
		text = text.replaceAll(/`([^`]+)`/g, (match, code) => {
			if (placeholderOnlyPattern.test(code))
			{
				return match;
			}

			const index = storage.length;
			storage.push(code);

			return `${MARKDOWN_INLINE_CODE_PREFIX}${index}${MARKDOWN_PLACEHOLDER_SUFFIX}`;
		});

		return text;
	}

	/**
	 * Restore inline code from placeholders, wrapping with BB-code formatting.
	 *
	 * @param {string} text
	 * @param {string[]} storage
	 * @return {string}
	 */
	function restoreInlineCode(text, storage)
	{
		if (storage.length === 0)
		{
			return text;
		}

		const colorHex = Color.chatMyPrimary1.toHex();

		const pattern = new RegExp(`${MARKDOWN_INLINE_CODE_PREFIX}(\\d+)${MARKDOWN_PLACEHOLDER_SUFFIX}`, 'g');

		return text.replaceAll(
			pattern,
			(match, index) => `[color=${colorHex}][b]${storage[Number(index)]}[/b][/color]`,
		);
	}

	/**
	 * Image: ![alt](url) → [img]url[/img]
	 */
	function applyImage(text)
	{
		return text.replaceAll(/!\[([^\]]*)]\(([^)]+)\)/g, (match, alt, url) => {
			return `[img]${url}[/img]`;
		});
	}

	/**
	 * Bold+Italic: ***text*** or ___text___ → [b][i]text[/i][/b]
	 */
	function applyBoldItalic(text)
	{
		// Asterisk variant
		text = text.replaceAll(/\*{3}(.+?)\*{3}/g, (match, content) => {
			return `[b][i]${content}[/i][/b]`;
		});

		// Underscore variant (word boundaries — don't match inside words)
		text = text.replaceAll(
			new RegExp(`_{3}([^_](?:.*?[^_])?)_{3}(?!${WORD_CHAR})`, 'g'),
			(match, content, offset, sourceText) => {
				if (hasWordCharBefore(sourceText, offset))
				{
					return match;
				}

				return `[b][i]${content}[/i][/b]`;
			},
		);

		return text;
	}

	/**
	 * Bold: **text** or __text__ → [b]text[/b]
	 */
	function applyBold(text)
	{
		// Asterisk variant
		text = text.replaceAll(/\*{2}(.+?)\*{2}/g, (match, content) => {
			return `[b]${content}[/b]`;
		});

		// Underscore variant (word boundaries — don't match some__var__name or _____)
		text = text.replaceAll(
			new RegExp(`_{2}([^_](?:.*?[^_])?)_{2}(?!${WORD_CHAR})`, 'g'),
			(match, content, offset, sourceText) => {
				if (hasWordCharBefore(sourceText, offset))
				{
					return match;
				}

				return `[b]${content}[/b]`;
			},
		);

		return text;
	}

	/**
	 * Italic: *text* or _text_ → [i]text[/i]
	 * Content must not start or end with space for * variant.
	 * Underscore variant requires word boundary.
	 */
	function applyItalic(text)
	{
		// Asterisk variant: content must not start/end with space
		text = text.replaceAll(/\*([^\s*](?:.*?[^\s*])?)\*/g, (match, content) => {
			return `[i]${content}[/i]`;
		});

		// Underscore variant (word boundaries — don't match some_var_name)
		text = text.replaceAll(
			new RegExp(`_([^\\s_](?:.*?[^\\s_])?)_(?!${WORD_CHAR})`, 'g'),
			(match, content, offset, sourceText) => {
				if (hasWordCharBefore(sourceText, offset))
				{
					return match;
				}

				return `[i]${content}[/i]`;
			},
		);

		return text;
	}

	/**
	 * Strikethrough: ~~text~~ → [s]text[/s]
	 */
	function applyStrikethrough(text)
	{
		return text.replaceAll(/~~(.+?)~~/g, (match, content) => {
			return `[s]${content}[/s]`;
		});
	}

	/**
	 * Strip server-added [URL]...[/URL] wrapper from a URL value.
	 * Server auto-wraps bare URLs in BB-code before client receives the message,
	 * e.g. `(https://google.com)` becomes `([URL]https://google.com[/URL])`.
	 * @param {string} url
	 * @returns {string}
	 */
	function stripUrlBBWrapper(url)
	{
		return url.replace(/^\[url](.*)\[\/url]$/i, '$1');
	}

	/**
	 * Link: [text](url) → [URL=url]text[/URL]
	 * Must not match images (preceded by !)
	 */
	function applyLink(text)
	{
		return text.replaceAll(/\[([^\]]+)]\(([^)]+)\)/g, (match, linkText, url, offset, sourceText) => {
			if (offset > 0 && sourceText[offset - 1] === '!')
			{
				return match;
			}

			url = stripUrlBBWrapper(url);

			return `[URL=${url}]${linkText}[/URL]`;
		});
	}

	/**
	 * Autolink URL: <https://example.com> → [URL]https://example.com[/URL]
	 */
	function applyAutolinkUrl(text)
	{
		return text.replaceAll(/<(https?:\/\/[^>]+)>/g, (match, url) => {
			return `[URL]${url}[/URL]`;
		});
	}

	/**
	 * Autolink email: <user@example.com> → [URL]mailto:user@example.com[/URL]
	 */
	function applyAutolinkEmail(text)
	{
		return text.replaceAll(/<([\w%+.-]+@[\d.A-Za-z-]+\.[A-Za-z]{2,})>/g, (match, email) => {
			return `[URL]mailto:${email}[/URL]`;
		});
	}

	module.exports = { applyInlineRules };
});
