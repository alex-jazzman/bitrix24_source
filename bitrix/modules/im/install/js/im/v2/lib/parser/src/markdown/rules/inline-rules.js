import { MARKDOWN_INLINE_CODE_PREFIX, MARKDOWN_PLACEHOLDER_SUFFIX } from '../const.js';
import { toMarkdownInertToken } from '../utils/inert-token.js';
import { createMarkdownNonce } from '../utils/nonce.js';

// Default render size for Markdown images. The web image renderer
// (ParserImage.decodeImageBbCode) only renders `[img]` BB-code that carries a
// valid size (small|medium|large); without it the tag is defanged and no <img>
// appears. Markdown `![alt](url)` has no size syntax, so we emit a product
// default here so the image renders as <img> with its alt (a11y F-3). Must stay
// one of ImageBbCodeSizes (functions/image.js).
const MARKDOWN_IMAGE_DEFAULT_SIZE = 'medium';

// Word-like characters for underscore boundary detection (ASCII + Latin Extended + Cyrillic).
const WORD_CHAR = '[\\w\\u00C0-\\u024F\\u0400-\\u04FF]';
const wordCharPattern = new RegExp(WORD_CHAR);

// Hoisted once: these depend only on WORD_CHAR / the placeholder constants, so there
// is no reason to recompile them from string templates on every applyInlineRules call.
// All are reused with replaceAll (no shared lastIndex hazard); the two non-global
// patterns are used only with stateless .test().
const BOLD_ITALIC_UNDERSCORE_PATTERN = new RegExp(`_{3}([^_](?:[^_\n]*[^_])?)_{3}(?!${WORD_CHAR})`, 'g');
const BOLD_UNDERSCORE_PATTERN = new RegExp(`_{2}([^_](?:[^_\n]*[^_])?)_{2}(?!${WORD_CHAR})`, 'g');
const ITALIC_UNDERSCORE_PATTERN = new RegExp(`_([^\\s_](?:[^_\n]*[^\\s_])?)_(?!${WORD_CHAR})`, 'g');

// The inline-code placeholder carries a per-render nonce (####MD_INLINE_<nonce>_N####), so
// the restore/placeholder-only patterns depend on it and are built per call rather than
// hoisted — a sender cannot type a literal placeholder copy and have the stored span
// replicated into it on restore (amplification-DoS defense; see utils/nonce.js).
function inlineCodeRestorePattern(nonce: string): RegExp
{
	return new RegExp(`${MARKDOWN_INLINE_CODE_PREFIX}${nonce}_(\\d+)${MARKDOWN_PLACEHOLDER_SUFFIX}`, 'g');
}

function inlineCodePlaceholderOnlyPattern(nonce: string): RegExp
{
	return new RegExp(`^\\s*(?:${MARKDOWN_INLINE_CODE_PREFIX}${nonce}_\\d+${MARKDOWN_PLACEHOLDER_SUFFIX}\\s*)+$`);
}

// Hoisted literal regexes (asterisk/strikethrough/image/link/autolink variants).
// These are plain literals with no template dependency; hoisting avoids recompiling
// them on every call. All are reused with replaceAll (no shared lastIndex hazard).
const ASTERISK_BOLD_ITALIC_PATTERN = /\*{3}(.+?)\*{3}/g;
const ASTERISK_BOLD_PATTERN = /\*{2}(.+?)\*{2}/g;
const ASTERISK_ITALIC_PATTERN = /\*([^\s*](?:.*?[^\s*])?)\*/g;
const STRIKETHROUGH_PATTERN = /~~(.+?)~~/g;
// The URL group allows one level of balanced parens so links like
// `(https://ru.wikipedia.org/wiki/Foo_(bar))` are captured whole instead of being cut
// at the first ')'.
// Link text / image alt are bounded ({0,500}/{1,500}) so a crafted run of unmatched "["
// followed by "](" can't drive the matcher into quadratic backtracking (a real link
// text / alt is never that long). With the "](" guard in applyLink/applyImage this keeps
// the link pass effectively linear; see the client-side DoS finding.
const IMAGE_PATTERN = /!\[([^\]]{0,500})]\(([^\s()]*(?:\([^\s()]*\)[^\s()]*)*)\)/g;
const LINK_PATTERN = /\[([^\]]{1,500})]\(([^\s()]*(?:\([^\s()]*\)[^\s()]*)*)\)/g;
const AUTOLINK_URL_PATTERN = /<(https?:\/\/[^>]+)>/g;
const AUTOLINK_EMAIL_PATTERN = /<([\w%+.-]+@[\d.A-Za-z-]+\.[A-Za-z]{2,})>/g;

/**
 * @param {string} text
 * @param {number} offset
 * @return {boolean}
 */
function hasWordCharBefore(text: string, offset: number): boolean
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
export function applyInlineRules(
	text: string,
	deferredCodeStorage: ?Array<string> = null,
	nonce: ?string = null,
): string
{
	const inlineCodeBlocks = deferredCodeStorage ?? [];
	// When the converter defers restore it passes its own per-render nonce so protect here
	// and its later restoreInlineCode share it; the standalone path makes its own.
	const codeNonce = nonce ?? createMarkdownNonce();
	text = protectInlineCode(text, inlineCodeBlocks, codeNonce);
	text = applyImage(text);
	text = applyLink(text);
	text = applyBoldItalic(text);
	text = applyBold(text);
	text = applyItalic(text);
	text = applyStrikethrough(text);
	text = applyAutolinkUrl(text);
	text = applyAutolinkEmail(text);

	if (deferredCodeStorage === null)
	{
		text = restoreInlineCode(text, inlineCodeBlocks, codeNonce);
	}

	return text;
}

/**
 * Inline rules for table cells (web): the full single-line inline set — inline code,
 * bold / italic / strikethrough, links and autolinks. Inline code is protected first so
 * its content stays literal; images are intentionally left out so a cell never grows into
 * a block <img>. The resulting BB-code is rendered by ParserTable.decodeCell.
 *
 * @param {string} text
 * @return {string}
 */
export function applyCellInlineRules(text: string): string
{
	const inlineCodeBlocks = [];
	// Self-contained protect→restore on one cell's content, so a fresh per-call nonce is
	// enough to keep the inline-code placeholder unguessable to the sender.
	const codeNonce = createMarkdownNonce();
	text = protectInlineCode(text, inlineCodeBlocks, codeNonce);
	text = applyLink(text);
	text = applyBoldItalic(text);
	text = applyBold(text);
	text = applyItalic(text);
	text = applyStrikethrough(text);
	text = applyAutolinkUrl(text);
	text = applyAutolinkEmail(text);
	text = restoreInlineCode(text, inlineCodeBlocks, codeNonce);

	return text;
}

/**
 * Replace inline code spans with placeholders to protect content from formatting rules.
 *
 * @param {string} text
 * @param {string[]} storage - array to store original code content
 * @return {string}
 */
function protectInlineCode(text: string, storage: string[], nonce: string): string
{
	if (!text.includes('`'))
	{
		return text;
	}

	const placeholderOnly = inlineCodePlaceholderOnlyPattern(nonce);
	const makePlaceholder = (index: number) => `${MARKDOWN_INLINE_CODE_PREFIX}${nonce}_${index}${MARKDOWN_PLACEHOLDER_SUFFIX}`;

	// Triple backticks first: ```code```
	text = text.replaceAll(/```(.+?)```/g, (match, code) => {
		const index = storage.length;
		storage.push(code.trim());

		return makePlaceholder(index);
	});

	// Double backticks: ``code``
	text = text.replaceAll(/``(.+?)``/g, (match, code) => {
		if (placeholderOnly.test(code))
		{
			return match;
		}

		const index = storage.length;
		storage.push(code.trim());

		return makePlaceholder(index);
	});

	// Single backticks: `code`
	text = text.replaceAll(/`([^`]+)`/g, (match, code) => {
		if (placeholderOnly.test(code))
		{
			return match;
		}

		const index = storage.length;
		storage.push(code);

		return makePlaceholder(index);
	});

	return text;
}

/**
 * Restore inline code from placeholders, wrapping with the [icode] BB-tag.
 *
 * The content stays raw (as captured in storage[]): it is escaped later by
 * Text.encode (XSS invariant) and only then rendered by
 * ParserQuote.decodeInlineCode into a monospace <code> element. Restoration
 * happens here, in the Markdown stage, before Text.encode.
 *
 * @param {string} text
 * @param {string[]} storage
 * @return {string}
 */
export function restoreInlineCode(text: string, storage: string[], nonce: string): string
{
	if (storage.length === 0)
	{
		return text;
	}

	return text.replaceAll(
		inlineCodeRestorePattern(nonce),
		(match, index) => {
			const code = storage[Number(index)];
			if (code === undefined)
			{
				return match;
			}

			// Inline code must stay literal: a zero-width space after every '[' stops the
			// downstream BB decoders (ParserFont, decodeInlineCode) from rendering tags like
			// [b] inside the span or closing it early on a literal [/icode].
			return `[icode]${code.replaceAll('[', '[\u200B')}[/icode]`;
		},
	);
}

/**
 * Image: ![alt](url) → [img size=<default> alt=<token>]url[/img]
 *
 * A default `size` is always emitted so the web renderer takes the <img> render
 * path instead of defanging the tag (see MARKDOWN_IMAGE_DEFAULT_SIZE).
 *
 * The alt text is preserved for accessibility (a11y F-3). It is emitted as an
 * `encodeURIComponent`-based token whose alphabet is restricted to [A-Za-z0-9.%-]
 * — the same proven-inert alphabet used by the table marker (see const.js):
 * it carries no Markdown-significant characters (so the alt is not re-parsed by
 * the bold/italic/link rules that run after applyImage), no characters touched
 * by Text.encode (< > & " '), no newlines, and nothing that could break the
 * `[img ...]url[/img]` BB delimiters. image.js decodes the token back to the
 * original alt and assigns it as a DOM attribute (decodeImageBbCode).
 */
function applyImage(text: string): string
{
	// A Markdown image always contains "](" — without it the pattern cannot match, so
	// bail early. This also caps cost: a crafted run of unmatched "[" (no "](") can drive
	// the [^\]]+ alternation into quadratic backtracking, a reachable client-side DoS.
	if (!text.includes(']('))
	{
		return text;
	}

	return text.replaceAll(IMAGE_PATTERN, (match, alt, url) => {
		const altToken = toMarkdownInertToken(alt);
		if (altToken === '')
		{
			return `[img size=${MARKDOWN_IMAGE_DEFAULT_SIZE}]${url}[/img]`;
		}

		return `[img size=${MARKDOWN_IMAGE_DEFAULT_SIZE} alt=${altToken}]${url}[/img]`;
	});
}

/**
 * Bold+Italic: ***text*** or ___text___ → [b][i]text[/i][/b]
 */
function applyBoldItalic(text: string): string
{
	if (!text.includes('*') && !text.includes('_'))
	{
		return text;
	}

	// Asterisk variant
	text = text.replaceAll(ASTERISK_BOLD_ITALIC_PATTERN, (match, content) => {
		return `[b][i]${content}[/i][/b]`;
	});

	// Underscore variant (word boundaries — don't match inside words)
	text = text.replaceAll(
		BOLD_ITALIC_UNDERSCORE_PATTERN,
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
function applyBold(text: string): string
{
	if (!text.includes('*') && !text.includes('_'))
	{
		return text;
	}

	// Asterisk variant
	text = text.replaceAll(ASTERISK_BOLD_PATTERN, (match, content) => {
		return `[b]${content}[/b]`;
	});

	// Underscore variant (word boundaries — don't match some__var__name or _____)
	text = text.replaceAll(
		BOLD_UNDERSCORE_PATTERN,
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
function applyItalic(text: string): string
{
	if (!text.includes('*') && !text.includes('_'))
	{
		return text;
	}

	// Asterisk variant: content must not start/end with space
	text = text.replaceAll(ASTERISK_ITALIC_PATTERN, (match, content) => {
		return `[i]${content}[/i]`;
	});

	// Underscore variant (word boundaries — don't match some_var_name)
	text = text.replaceAll(
		ITALIC_UNDERSCORE_PATTERN,
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
function applyStrikethrough(text: string): string
{
	if (!text.includes('~'))
	{
		return text;
	}

	return text.replaceAll(STRIKETHROUGH_PATTERN, (match, content) => {
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
function stripUrlBBWrapper(url: string): string
{
	return url.replace(/^\[url](.*)\[\/url]$/i, '$1');
}

/**
 * Link: [text](url) → [URL=url]text[/URL]
 * Must not match images (preceded by !)
 */
function applyLink(text: string): string
{
	// A Markdown link always contains "](" — without it the pattern cannot match, so bail
	// early. This also caps cost: a crafted run of unmatched "[" (no "](") can drive the
	// [^\]]+ alternation into quadratic backtracking — a client-side DoS reachable from
	// MarkdownConverter.decode before Text.encode.
	if (!text.includes(']('))
	{
		return text;
	}

	return text.replaceAll(LINK_PATTERN, (match, linkText, url, offset, sourceText) => {
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
function applyAutolinkUrl(text: string): string
{
	return text.replaceAll(AUTOLINK_URL_PATTERN, (match, url) => {
		return `[URL]${url}[/URL]`;
	});
}

/**
 * Autolink email: <user@example.com> → [URL]mailto:user@example.com[/URL]
 */
function applyAutolinkEmail(text: string): string
{
	return text.replaceAll(AUTOLINK_EMAIL_PATTERN, (match, email) => {
		return `[URL]mailto:${email}[/URL]`;
	});
}
