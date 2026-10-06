/**
 * @module im/messenger/lib/parser/markdown/rules/inline-rules
 */
jn.define('im/messenger/lib/parser/markdown/rules/inline-rules', (require, exports, module) => {
	const { MARKDOWN_INLINE_CODE_PREFIX, MARKDOWN_PLACEHOLDER_SUFFIX } = require('im/messenger/lib/parser/const');
	const { Color } = require('tokens');

	// Word-like characters for underscore boundary detection (ASCII + Latin Extended + Cyrillic).
	// Android doesn't support \p{L}/\p{N} Unicode property escapes.
	const WORD_CHAR = '[\\w\\u00C0-\\u024F\\u0400-\\u04FF]';
	const wordCharPattern = new RegExp(WORD_CHAR);

	const placeholderOnlyPattern = new RegExp(
		`^\\s*(?:${MARKDOWN_INLINE_CODE_PREFIX}\\d+${MARKDOWN_PLACEHOLDER_SUFFIX}\\s*)+$`,
	);
	const inlineCodeRestorePattern = new RegExp(`${MARKDOWN_INLINE_CODE_PREFIX}(\\d+)${MARKDOWN_PLACEHOLDER_SUFFIX}`, 'g');
	const boldItalicUnderscorePattern = new RegExp(`_{3}([^_](?:[^_\n]*[^_])?)_{3}(?!${WORD_CHAR})`, 'g');
	const boldUnderscorePattern = new RegExp(`_{2}([^_](?:[^_\n]*[^_])?)_{2}(?!${WORD_CHAR})`, 'g');
	const italicUnderscorePattern = new RegExp(`_([^\\s_](?:[^_\n]*[^\\s_])?)_(?!${WORD_CHAR})`, 'g');

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

		// Interim until MobileCore renders [icode] natively: style inline code with
		// the chat accent colour + bold so it stays visually distinct. Switch back to
		// [icode] once the native renderer lands (see child spec / CONTRACT).
		const colorHex = Color.chatMyPrimary1.toHex();

		return text.replaceAll(
			inlineCodeRestorePattern,
			(match, index) => {
				const code = storage[Number(index)];
				if (code === undefined)
				{
					return match;
				}

				// Keep inline code literal: a zero-width space after every '[' stops the BB
				// content (e.g. [/b], [url]) from breaking the interim [color][b] wrapper.
				return `[color=${colorHex}][b]${code.replaceAll('[', '[\u200B')}[/b][/color]`;
			},
		);
	}

	/**
	 * Image: ![alt](url) → [img]url[/img]
	 *
	 * Interim: alt is intentionally dropped here. The interim mobile image renderer
	 * (parserImage.decodeImageWithSize) only parses [img] / [img size=…] — emitting an
	 * [img alt=…] attribute would fall through both of its patterns and break image
	 * rendering. The alt text is reconstructed from the original `![alt](url)` by the
	 * native renderer once it lands (see child spec); no converter data is needed in
	 * the BB-code for that.
	 */
	function applyImage(text)
	{
		// A Markdown image always contains "](" — bail early without it, which also caps
		// cost: a crafted run of unmatched "[" can drive [^\]]+ into quadratic backtracking.
		if (!text.includes(']('))
		{
			return text;
		}

		// URL group allows one level of balanced parens so a link like
		// `(https://ru.wikipedia.org/wiki/Foo_(bar))` is captured whole, not cut at the first ')'.
		// Alt is bounded ({0,500}) so crafted "[" runs + "](" can't go quadratic.
		return text.replaceAll(/!\[([^\]]{0,500})]\(([^\s()]*(?:\([^\s()]*\)[^\s()]*)*)\)/g, (match, alt, url) => {
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
			boldItalicUnderscorePattern,
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
			boldUnderscorePattern,
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
			italicUnderscorePattern,
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
		// A Markdown link always contains "](" — bail early without it, which also caps cost:
		// a crafted run of unmatched "[" can drive [^\]]+ into quadratic backtracking (DoS).
		if (!text.includes(']('))
		{
			return text;
		}

		// URL group allows one level of balanced parens (e.g. wiki URLs ending in `(...)`).
		// Link text is bounded ({1,500}) so crafted "[" runs + "](" can't go quadratic.
		return text.replaceAll(/\[([^\]]{1,500})]\(([^\s()]*(?:\([^\s()]*\)[^\s()]*)*)\)/g, (match, linkText, url, offset, sourceText) => {
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
