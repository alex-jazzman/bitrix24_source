/**
 * @module im/messenger/lib/parser/markdown/rules/inline-rules
 */
jn.define('im/messenger/lib/parser/markdown/rules/inline-rules', (require, exports, module) => {
	const { Loc } = require('im/messenger/loc');
	const { MARKDOWN_INLINE_CODE_PREFIX, MARKDOWN_PLACEHOLDER_SUFFIX } = require('im/messenger/lib/parser/const');
	const { isSafeUrl } = require('im/messenger/lib/parser/markdown/utils/url-safety');
	const { Color } = require('tokens');

	// Word-like characters for underscore boundary detection (ASCII + Latin Extended + Cyrillic).
	// Android doesn't support \p{L}/\p{N} Unicode property escapes.
	const WORD_CHAR = '[\\w\\u00C0-\\u024F\\u0400-\\u04FF]';
	const wordCharPattern = new RegExp(WORD_CHAR);

	const placeholderOnlyPattern = new RegExp(
		`^\\s*(?:${MARKDOWN_INLINE_CODE_PREFIX}\\d+${MARKDOWN_PLACEHOLDER_SUFFIX}\\s*)+$`,
	);
	const inlineCodeRestorePattern = new RegExp(`${MARKDOWN_INLINE_CODE_PREFIX}(\\d+)${MARKDOWN_PLACEHOLDER_SUFFIX}`, 'g');
	// The start of an HTML entity reference. applyHtmlRules decodes entities AFTER inline code is
	// restored, so a reference left inside a code span would grow a brand new '[' there - past the
	// literal protection below. CommonMark keeps entities literal inside code anyway.
	const htmlEntityStartPattern = /&(?=#x?[\dA-Fa-f]+;|[A-Za-z]+;)/g;
	const boldItalicUnderscorePattern = new RegExp(`_{3}([^_](?:[^_\n]*[^_])?)_{3}(?!${WORD_CHAR})`, 'g');
	const boldUnderscorePattern = new RegExp(`_{2}([^_](?:[^_\n]*[^_])?)_{2}(?!${WORD_CHAR})`, 'g');
	const italicUnderscorePattern = new RegExp(`_([^\\s_](?:[^_\n]*[^\\s_])?)_(?!${WORD_CHAR})`, 'g');

	// Characters that would let a URL value escape the tag it is emitted into: ']' closes
	// [URL=...] early, '[' opens a tag of the sender's choosing right after it, and a line break
	// splits the tag. An emphasis delimiter ('*', '_', '~') does not break out but is eaten from
	// inside: the emphasis rules run after the tag is written and read the address as ordinary text,
	// so they pair such a character with another one - a later delimiter in the message, or the
	// address' own second one - and drop [i]/[b]/[s] into the finished attribute. '_' reaches this
	// despite its word-boundary guard: a path segment like /_assets_/ has a non-word '/' before the
	// '_', so the italic rule fires. The percent-encoded form of all of these is what a URL is
	// supposed to carry anyway.
	const URL_TAG_ESCAPES = {
		'\n': '%0A',
		'\r': '%0D',
		'*': '%2A',
		'[': '%5B',
		']': '%5D',
		'_': '%5F',
		'~': '%7E',
	};
	const urlTagEscapePattern = /[\n\r*[\]_~]/g;
	// A numeric HTML reference for one of those same characters (`&#91;`, `&#x5D;`, `&#10;`, ...).
	// Entities are decoded AFTER the tag is emitted, so such a reference would grow a real bracket
	// inside the finished attribute; percent-encoding its '&' keeps it visible but undecodable.
	// A legitimate URL spells these as %5B / %5D and keeps `&amp;` working, which is left alone.
	const urlTagEntityPattern = /&(?=#(?:0*(?:10|13|91|93);|x0*(?:a|d|5b|5d);))/gi;
	// A protector placeholder still inside the value means the value is not final: a mention, code,
	// inline-code or list-tag placeholder is restored AFTER the tag is emitted and would drop working
	// BB-code into the attribute, and nothing legitimate looks like that. The escape placeholder is the
	// one legitimate kind and is resolved into the value before this runs (toFinalUrl), so by this
	// point only the illegitimate kinds are left and such a URL is dropped.
	const urlPlaceholderPattern = /####MD/;

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
	 * Self-contained: inline code is protected and restored within this single call, so it can
	 * be run in isolation (e.g. on one string) without leaking placeholders.
	 *
	 * @param {string} text
	 * @param {object} [options]
	 * @param {string} [options.mode] - 'decode' | 'simplify' (default 'decode'); simplify turns an image
	 *   into the photo label, because every consumer of that mode renders a flat string (see applyImage)
	 * @param {string} [options.renderMode] - 'canonical' | 'fallback' (default 'fallback')
	 * @param {boolean} [options.skipImage] - drop the image rule (default false); table cells set this
	 *   so `![alt](url)` never becomes an [img] the native renderer would load (security, not cosmetics)
	 * @param {function(string): string} [options.resolveEscapes] - put the characters the sender escaped
	 *   back into a URL value before it is checked (the converter's escape handler; see toFinalUrl)
	 * @return {string}
	 */
	function applyInlineRules(text, options = {})
	{
		const { mode = 'decode', renderMode = 'fallback', skipImage = false, resolveEscapes = null } = options;

		const inlineCodeBlocks = [];
		text = protectInlineCode(text, inlineCodeBlocks);
		// Image (before link - `![` is more specific than `[`). Skipped for table cells: with the
		// image rule off, applyLink leaves `![alt](url)` untouched (its leading `!` guard), so the
		// cell keeps the literal text instead of gaining a block image.
		if (!skipImage)
		{
			text = applyImage(text, resolveEscapes, mode);
		}
		// Link before bold/italic so [**text**](url) keeps the link
		text = applyLink(text, resolveEscapes);
		// URL autolink before the emphasis rules: an address like <https://h/_a_/x> carries its own
		// '_'/'*'/'~' pair that applyItalic/applyBold/applyStrikethrough would otherwise splice
		// [i]/[b]/[s] into (the address' word-boundary guard does not cover a '/_a_/'). Running it first
		// lets encodeUrlForTag percent-encode those delimiters, so the emphasis rules find no pair to act
		// on. Email autolink stays after emphasis: its address may hold a legitimate '_' that must not be
		// percent-encoded, and it emits no '<', so the URL move leaves its behaviour unchanged.
		text = applyAutolinkUrl(text, resolveEscapes);
		text = applyBoldItalic(text);
		text = applyBold(text);
		text = applyItalic(text);
		text = applyStrikethrough(text);
		text = applyAutolinkEmail(text);
		text = restoreInlineCode(text, inlineCodeBlocks, renderMode);

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
	 * Percent-encode the characters a URL value must not carry into a BB-code tag, and the numeric
	 * references that would decode into them, so the value inside [URL=...]/[img] is exactly the one
	 * isSafeUrl accepted. Without it a crafted `[t](https://a]x[/URL][URL=b24://open)` would close
	 * the checked attribute and append a second, unchecked link. Render-mode independent, like
	 * isSafeUrl itself.
	 *
	 * @param {string} url
	 * @returns {string}
	 */
	function encodeUrlForTag(url)
	{
		return url
			.replace(urlTagEscapePattern, (char) => URL_TAG_ESCAPES[char])
			.replace(urlTagEntityPattern, '%26');
	}

	/**
	 * Whether the value may be emitted as a URL at all: a value still holding a protector
	 * placeholder is restored after the tag is written, so what the tag would end up carrying is
	 * not what isSafeUrl checked.
	 *
	 * @param {string} url
	 * @returns {boolean}
	 */
	function canEmitUrl(url)
	{
		return isSafeUrl(url) && !urlPlaceholderPattern.test(url);
	}

	/**
	 * The value a URL rule has to decide on. The characters the sender escaped are put back first,
	 * because the placeholder standing for them is restored only after the tag is written: `\_` in a
	 * path is ordinary LLM output and must stay a working link, while `\]` has to reach
	 * encodeUrlForTag as a real bracket and leave as %5D. The scheme is then checked on the resolved
	 * address, so a dangerous scheme cannot hide behind a placeholder either. Without a resolver - a
	 * rule run in isolation, e.g. on a single table cell - the value is left as it is and the
	 * placeholder guard drops it.
	 *
	 * @param {string} url
	 * @param {?function(string): string} resolveEscapes
	 * @returns {string}
	 */
	function toFinalUrl(url, resolveEscapes)
	{
		return resolveEscapes ? resolveEscapes(url) : url;
	}

	/**
	 * The text a dropped link/image leaves behind. It may carry a '[' (alt and link text only exclude
	 * ']'), and the ']' that closed the construct came from the message, so `![[URL=b24://x](data:y)]tap`
	 * would otherwise rebuild an ACTIVE [URL=...] tag out of the alt - with the very scheme isSafeUrl
	 * just refused. A zero-width space after the bracket keeps the text the sender typed readable and
	 * the tag inert, exactly as html-rules does for a decoded `&#91;`.
	 *
	 * @param {string} text
	 * @returns {string}
	 */
	function defangDroppedText(text)
	{
		return text.replaceAll('[', '[\u200B');
	}

	/**
	 * Restore inline code from placeholders, wrapping with BB-code formatting.
	 *
	 * - canonical: [icode]...[/icode] renders as a monospace span in the native renderer.
	 * - fallback: interim [color][b]...[/b][/color] until the native [icode] renderer is enabled.
	 *
	 * @param {string} text
	 * @param {string[]} storage
	 * @param {string} [renderMode] - 'canonical' | 'fallback' (default 'fallback')
	 * @return {string}
	 */
	function restoreInlineCode(text, storage, renderMode = 'fallback')
	{
		if (storage.length === 0)
		{
			return text;
		}

		const isCanonical = renderMode === 'canonical';
		// Interim fallback style: chat accent colour + bold so inline code stays visually distinct.
		const colorHex = isCanonical ? '' : Color.chatMyPrimary1.toHex();

		return text.replaceAll(
			inlineCodeRestorePattern,
			(match, index) => {
				const code = storage[Number(index)];
				if (code === undefined)
				{
					return match;
				}

				// Keep inline code literal: a zero-width space after every '[' stops BB content
				// (e.g. a literal [/icode] or [b]) from closing the wrapper early, and one after
				// every '<' keeps an HTML tag (<b>, </b>) inert so applyHtmlRules cannot rewrite it
				// into a working [b] once inline code is restored. The same space after the '&' of an
				// entity reference keeps that guarantee for `&#91;` too: it would otherwise decode
				// into an unprotected '[' once applyHtmlRules runs.
				const literalCode = code
					.replaceAll('[', '[\u200B')
					.replaceAll('<', '<\u200B')
					.replace(htmlEntityStartPattern, '&\u200B');

				return isCanonical
					? `[icode]${literalCode}[/icode]`
					: `[color=${colorHex}][b]${literalCode}[/b][/color]`;
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
	 *
	 * @param {string} text
	 * @param {?function(string): string} [resolveEscapes]
	 * @param {string} [mode] - 'decode' | 'simplify' (default 'decode')
	 * @return {string}
	 */
	function applyImage(text, resolveEscapes = null, mode = 'decode')
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
			// The server wraps a bare URL into [URL]...[/URL] before delivery, so the address arrives
			// wrapped inside the destination too - strip it exactly as applyLink does. Left in place,
			// isSafeUrl reads `[URL]https://...` as a schemeless (and therefore safe) address and
			// encodeUrlForTag carries the percent-encoded brackets into the tag.
			const finalUrl = toFinalUrl(stripUrlBBWrapper(url), resolveEscapes);

			// Unsafe scheme (data:/javascript:/file:/...) or a value that is not final yet: drop the
			// image, keep alt as plain text (contract rev.3.1 sec. 5/7). Render-mode independent.
			if (!canEmitUrl(finalUrl))
			{
				return defangDroppedText(alt);
			}

			// Simplify feeds flat strings (chat list, pull preview, pinned message, draft, quote), where
			// an [img] is printed as typed: parserImage.simplifyImage only matches the legacy
			// `[img]url [/img]` spelling with a trailing space, so it never catches this one. Emit the
			// label an uploaded photo gets there, the way web im does. After the safety check on purpose:
			// a dropped image stays its alt text and must not gain a label it never earned.
			if (mode === 'simplify')
			{
				return `[${Loc.getMessage('IMMOBILE_PARSER_EMOJI_TYPE_IMAGE')}]`;
			}

			return `[img]${encodeUrlForTag(finalUrl)}[/img]`;
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
	function applyLink(text, resolveEscapes = null)
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

			url = toFinalUrl(stripUrlBBWrapper(url), resolveEscapes);

			// Unsafe scheme (javascript:/data:/file:/...) or a value that is not final yet: drop the
			// URL, keep only the link text (contract rev.3.1 sec. 5/7). Render-mode independent.
			if (!canEmitUrl(url))
			{
				return defangDroppedText(linkText);
			}

			return `[URL=${encodeUrlForTag(url)}]${linkText}[/URL]`;
		});
	}

	/**
	 * Autolink URL: <https://example.com> → [URL]https://example.com[/URL]
	 */
	function applyAutolinkUrl(text, resolveEscapes = null)
	{
		return text.replaceAll(/<(https?:\/\/[^>]+)>/g, (match, rawUrl) => {
			const url = toFinalUrl(rawUrl, resolveEscapes);

			// The captured value may hold '[' or ']', so it gets the same treatment as a Markdown
			// link: otherwise `<https://a[/URL][URL=b24://x]tap[/URL]>` closes the tag and appends a
			// second link. The `https?://` anchor already pins the scheme, so canEmitUrl only rejects a
			// value still holding a placeholder toFinalUrl cannot settle (mention, code, inline code,
			// list tag) - leave such an autolink unconverted. Mode independent.
			if (!canEmitUrl(url))
			{
				return match;
			}

			return `[URL]${encodeUrlForTag(url)}[/URL]`;
		});
	}

	/**
	 * Autolink email: <user@example.com> → [URL]mailto:user@example.com[/URL]
	 *
	 * The address character classes admit no '[', ']', line break or '#', so the value can neither
	 * escape the tag nor carry a protector placeholder - unlike an autolinked URL, it needs no
	 * encoding.
	 */
	function applyAutolinkEmail(text)
	{
		return text.replaceAll(/<([\w%+.-]+@[\d.A-Za-z-]+\.[A-Za-z]{2,})>/g, (match, email) => {
			return `[URL]mailto:${email}[/URL]`;
		});
	}

	module.exports = { applyInlineRules };
});
