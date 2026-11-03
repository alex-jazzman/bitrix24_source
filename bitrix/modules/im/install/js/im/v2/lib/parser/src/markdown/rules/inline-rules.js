import {
	MARKDOWN_ESCAPE_PREFIX,
	MARKDOWN_INLINE_CODE_DOUBLE_PATTERN,
	MARKDOWN_INLINE_CODE_PREFIX,
	MARKDOWN_INLINE_CODE_SINGLE_PATTERN,
	MARKDOWN_INLINE_CODE_TRIPLE_PATTERN,
	MARKDOWN_LIST_TAG_PREFIX,
	MARKDOWN_PLACEHOLDER_PREFIX,
	MARKDOWN_PLACEHOLDER_SUFFIX,
} from '../const.js';
import { BbTagProtector } from '../utils/bb-tag-protector.js';
import { EscapeHandler } from '../utils/escape-handler.js';
import { toMarkdownInertToken } from '../utils/inert-token.js';
import { scanLinkDestination } from '../utils/link-boundary-scanner.js';
import { createMarkdownNonce } from '../utils/nonce.js';
import { UrlProtector } from '../utils/url-protector.js';

// The link text / image alt taken from validateLabel, `start` being the index the caller cuts at.
type LinkLabel = {
	start: number,
	text: string,
};

// Shared contract of the label acceptors (createLinkLabelAcceptor): the label to build the tag
// from, or null to reject the fragment.
type LabelAcceptor = (label: string) => ?string;

type EscapeExpander = (label: string) => string;

type LinkTagBuilder = (label: string, href: string) => string;

// Hides a scanned destination behind a placeholder (createDestinationProtector).
type DestinationProtector = (url: string) => string;

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

// Placeholder: ####MD_INLINE_<nonce>_N#### (why a nonce - utils/nonce.js). It varies per render,
// so these patterns are built per call instead of hoisted.
function inlineCodeRestorePattern(nonce: string): RegExp
{
	return new RegExp(`${MARKDOWN_INLINE_CODE_PREFIX}${nonce}_(\\d+)${MARKDOWN_PLACEHOLDER_SUFFIX}`, 'g');
}

function inlineCodePlaceholderOnlyPattern(nonce: string): RegExp
{
	return new RegExp(`^\\s*(?:${MARKDOWN_INLINE_CODE_PREFIX}${nonce}_\\d+${MARKDOWN_PLACEHOLDER_SUFFIX}\\s*)+$`);
}

// Hoisted for the same reason as the underscore patterns above; these carry no template dependency.
const ASTERISK_BOLD_ITALIC_PATTERN = /\*{3}(.+?)\*{3}/g;
const ASTERISK_BOLD_PATTERN = /\*{2}(.+?)\*{2}/g;
const ASTERISK_ITALIC_PATTERN = /\*([^\s*](?:.*?[^\s*])?)\*/g;
const STRIKETHROUGH_PATTERN = /~~(.+?)~~/g;
const AUTOLINK_URL_PATTERN = /<(https?:\/\/[^>]+)>/g;
const AUTOLINK_EMAIL_PATTERN = /<([\w%+.-]+@[\d.A-Za-z-]+\.[A-Za-z]{2,})>/g;

// Longest link text / image alt the label validator walks back over - the {1,500}/{0,500}
// bound of the former LINK_PATTERN/IMAGE_PATTERN (a real link text / alt is never that long).
const MAX_LABEL_LENGTH = 500;

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
 * Per-render state the converter hands to the inline pass. Named rather than positional: as
 * arguments these were five interchangeable nulls, and a swapped pair raised nothing - the pass
 * simply stopped seeing the protector it was given.
 */
type InlineRulesContext = {
	// inline-code storage of the converter; passing it defers restoreInlineCode to the converter,
	// which runs it after applyHtmlRules, with `nonce` shared between the two
	deferredCodeStorage?: ?Array<string>,
	nonce?: ?string,
	// the converter's protector, restored once after applyHtmlRules; a standalone call makes its
	// own and restores it before returning
	urlProtector?: ?UrlProtector,
	// consulted by the label acceptors (createLinkLabelAcceptor)
	bbTagProtector?: ?BbTagProtector,
	// consulted by the image label acceptor alone, whose alt is built past the reach of the
	// converter's restore (createEscapeExpander)
	escapeHandler?: ?EscapeHandler,
};

/**
 * The cell pass takes only the two protectors of InlineRulesContext: it restores its own inline
 * code and renders no images, so a deferred storage, nonce or escape handler has nothing to do here.
 */
type CellInlineRulesContext = {
	urlProtector?: ?UrlProtector,
	bbTagProtector?: ?BbTagProtector,
};

/**
 * Applies inline Markdown rules to text, converting to BB-code equivalents.
 *
 * Assumes code blocks are already replaced with ####MD_CODE_N#### placeholders
 * and escape sequences with ####MD_ESC_N#### placeholders.
 *
 * @param {string} text
 * @param {InlineRulesContext} [context] - empty for a standalone call, which then owns every
 *   protect/restore of the pass itself
 * @return {string}
 */
export function applyInlineRules(text: string, context: InlineRulesContext = {}): string
{
	const {
		deferredCodeStorage = null,
		nonce = null,
		urlProtector = null,
		bbTagProtector = null,
		escapeHandler = null,
	} = context;
	const inlineCodeBlocks = deferredCodeStorage ?? [];
	// When the converter defers restore it passes its own per-render nonce so protect here
	// and its later restoreInlineCode share it; the standalone path makes its own.
	const codeNonce = nonce ?? createMarkdownNonce();
	// The converter passes its per-render UrlProtector and restores it once, after
	// applyHtmlRules; a standalone call makes its own and restores it here.
	const protector = urlProtector ?? new UrlProtector(codeNonce);
	const protectDestination = createDestinationProtector(protector, inlineCodeBlocks, codeNonce);
	const expandEscapes = createEscapeExpander(escapeHandler);
	const acceptLinkLabel = createLinkLabelAcceptor(bbTagProtector);
	const acceptImageLabel = createImageLabelAcceptor(acceptLinkLabel, codeNonce, expandEscapes);
	text = protectInlineCode(text, inlineCodeBlocks, codeNonce);
	text = applyImage(text, protectDestination, acceptImageLabel);
	text = applyLink(text, protectDestination, acceptLinkLabel);
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

	if (urlProtector === null)
	{
		text = protector.restore(text);
	}

	return text;
}

/**
 * Inline rules for table cells (web). Inline code is protected first so its content stays
 * literal; images are intentionally left out so a cell never grows into a block <img>. The
 * resulting BB-code is rendered by ParserTable.decodeCell.
 *
 * @param {string} text
 * @param {CellInlineRulesContext} [context] - the converter's per-render protectors: urlProtector
 *   is restored once after applyHtmlRules, bbTagProtector is consulted by the label acceptor
 *   (see createLinkLabelAcceptor); empty for a standalone call, which then protects and restores
 *   its own URLs
 * @return {string}
 */
export function applyCellInlineRules(text: string, context: CellInlineRulesContext = {}): string
{
	const { urlProtector = null, bbTagProtector = null } = context;
	const inlineCodeBlocks = [];
	// Self-contained protect→restore on one cell's content, so a fresh per-call nonce is
	// enough to keep the inline-code placeholder unguessable to the sender.
	const codeNonce = createMarkdownNonce();
	// The converter passes its per-render UrlProtector and restores it once, after
	// applyHtmlRules - a URL restored here would be re-parsed by the inline rules that run on
	// list-item content after convertLists (ListTagProtector hides only the [list]/[*] tags,
	// not the content). A standalone call makes its own and restores it before returning.
	const protector = urlProtector ?? new UrlProtector(codeNonce);
	const protectDestination = createDestinationProtector(protector, inlineCodeBlocks, codeNonce);
	const acceptLinkLabel = createLinkLabelAcceptor(bbTagProtector);
	text = protectInlineCode(text, inlineCodeBlocks, codeNonce);
	text = applyLink(text, protectDestination, acceptLinkLabel);
	text = applyBoldItalic(text);
	text = applyBold(text);
	text = applyItalic(text);
	text = applyStrikethrough(text);
	text = applyAutolinkUrl(text);
	text = applyAutolinkEmail(text);
	text = restoreInlineCode(text, inlineCodeBlocks, codeNonce);

	if (urlProtector === null)
	{
		text = protector.restore(text);
	}

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
	text = text.replaceAll(MARKDOWN_INLINE_CODE_TRIPLE_PATTERN, (match, code) => {
		const index = storage.length;
		storage.push(code.trim());

		return makePlaceholder(index);
	});

	// Double backticks: ``code``
	text = text.replaceAll(MARKDOWN_INLINE_CODE_DOUBLE_PATTERN, (match, code) => {
		if (placeholderOnly.test(code))
		{
			return match;
		}

		const index = storage.length;
		storage.push(code.trim());

		return makePlaceholder(index);
	});

	// Single backticks: `code`
	text = text.replaceAll(MARKDOWN_INLINE_CODE_SINGLE_PATTERN, (match, code) => {
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
 * Wraps UrlProtector.protect for the link / image rules. The destination is captured while the
 * inline-code spans are still placeholders, so a backtick fragment written inside "](...)"
 * ([t](`x`)) is swallowed whole by the destination. The inline-code storage dies before the URL is
 * restored - a cell restores its own inside applyCellInlineRules, the full pass in the converter -
 * so the marker is expanded here, at capture, or it reaches the href as raw text.
 *
 * @param {UrlProtector} protector
 * @param {string[]} storage - inline-code storage of the current pass
 * @param {string} nonce
 * @return {DestinationProtector}
 */
function createDestinationProtector(protector: UrlProtector, storage: string[], nonce: string): DestinationProtector
{
	return (url: string): string => {
		return protector.protect(restoreInlineCode(url, storage, nonce));
	};
}

/**
 * Rejects a label holding a tag hidden by BbTagProtector: every protected tag carries a ']'
 * ([url]...[/url], [img ...]...[/img], [URL=...]), which the ']' walk in validateLabel used to
 * reject - the placeholder standing in for it has none. Unwrapping instead is not an option: the
 * label would then carry the raw BB tag.
 *
 * @param {?BbTagProtector} protector - null when nothing is protected (standalone calls)
 * @return {LabelAcceptor} null rejects; '' is an accepted label ("![](url)" is a valid image),
 *   so never test the result by truthiness
 */
function createLinkLabelAcceptor(protector: ?BbTagProtector): LabelAcceptor
{
	if (protector === null)
	{
		return (label: string): ?string => label;
	}

	return (label: string): ?string => (protector.containsPlaceholder(label) ? null : label);
}

/**
 * Placeholder of ANY protector of the current render, matched by its full format. The
 * nonce-carrying protectors share the render nonce (converter.js), so one alternative covers them
 * all; the escape and list-tag placeholders carry no nonce, so a literal copy is indistinguishable
 * from a real one - their own restore() expands it either way.
 *
 * @param {string} nonce - nonce of the current render
 * @return {RegExp} non-global on purpose: .test() must not carry lastIndex between labels
 */
function renderPlaceholderPattern(nonce: string): RegExp
{
	return new RegExp([
		`${MARKDOWN_PLACEHOLDER_PREFIX}_[A-Z]+_${nonce}_\\d+${MARKDOWN_PLACEHOLDER_SUFFIX}`,
		`${MARKDOWN_ESCAPE_PREFIX}\\d+${MARKDOWN_PLACEHOLDER_SUFFIX}`,
		`${MARKDOWN_LIST_TAG_PREFIX}\\d+${MARKDOWN_PLACEHOLDER_SUFFIX}`,
	].join('|'));
}

/**
 * Expands the escape placeholders of an image label back into their characters. The same move
 * createDestinationProtector makes for inline code, and for the same reason: the alt is emitted
 * through toMarkdownInertToken, past which no restore() reaches, so an escape left as a marker
 * would be nailed into the attribute - and rejecting the label instead would drop the image of
 * every generated message that escapes a dot or an underscore (`![Fig\. 1](u)`), which master
 * rendered. Expanding is safe where unwrapping a structural placeholder is not: an escape always
 * stands for one ordinary character, and the alt is encoded whole afterwards.
 *
 * The storage is NOT consumed (EscapeHandler.expand), so the rest of the text is still restored
 * by the converter at the end of the pass.
 *
 * @param {?EscapeHandler} handler - null when nothing is protected (standalone calls)
 * @return {EscapeExpander}
 */
function createEscapeExpander(handler: ?EscapeHandler): EscapeExpander
{
	if (handler === null)
	{
		return (label: string): string => label;
	}

	return (label: string): string => handler.expand(label);
}

/**
 * Label acceptor for the image rule - a superset of the link one. The alt is emitted through
 * toMarkdownInertToken, which percent-encodes whatever it is given
 * (####MD_INLINE_... -> %23%23%23%23MD%5FINLINE%5F...), so a placeholder that lands there is out
 * of reach of every restore() and travels into the DOM attribute as is - read out by a screen
 * reader, and with the block it stood for (a table, a list, a code span) lost from the message.
 * A label carrying a placeholder of ANY protector of this render is therefore not an image label.
 * The one kind that is expanded instead of rejected is the escape (createEscapeExpander): it
 * stands for an ordinary character, so the alt comes out as the sender wrote it.
 *
 * The link rule deliberately keeps the narrow BB-tag rule: its label stays raw inside
 * [URL=...]...[/URL], where the ordinary restore does reach it, so there is nothing to leak -
 * while rejecting there would turn everyday labels into plain text ([`code`](u), or the escaped
 * punctuation a Copilot answer is full of, [Fig\. 1](u)).
 *
 * @param {LabelAcceptor} acceptLinkLabel - the link acceptor, kept as the first check
 * @param {string} nonce - nonce of the current render
 * @param {EscapeExpander} expandEscapes - applied before the placeholder test
 * @return {LabelAcceptor} what it accepts is the EXPANDED label
 */
function createImageLabelAcceptor(
	acceptLinkLabel: LabelAcceptor,
	nonce: string,
	expandEscapes: EscapeExpander,
): LabelAcceptor
{
	const placeholderPattern = renderPlaceholderPattern(nonce);

	return (label: string): ?string => {
		const linkLabel = acceptLinkLabel(label);
		if (linkLabel === null)
		{
			return null;
		}

		const expandedLabel = expandEscapes(linkLabel);

		return placeholderPattern.test(expandedLabel) ? null : expandedLabel;
	};
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
 *
 * That encoding is why the acceptor here is the strict one (createImageLabelAcceptor).
 */
function applyImage(text: string, protectDestination: DestinationProtector, acceptLabel: LabelAcceptor): string
{
	// A Markdown image always contains "](" - without it there is nothing to scan, so bail
	// early. This is also the outer cost cap of the pass (see the DoS finding).
	if (!text.includes(']('))
	{
		return text;
	}

	return replaceLinkLike(text, true, acceptLabel, (alt, url) => {
		const altToken = toMarkdownInertToken(alt);
		// The image URL is NOT unwrapped ([url]...[/url] stripping is link-only); protect the raw
		// destination so its Markdown-significant chars survive the inline rules that follow.
		const protectedUrl = protectDestination(url);
		if (altToken === '')
		{
			return `[img size=${MARKDOWN_IMAGE_DEFAULT_SIZE}]${protectedUrl}[/img]`;
		}

		return `[img size=${MARKDOWN_IMAGE_DEFAULT_SIZE} alt=${altToken}]${protectedUrl}[/img]`;
	});
}

/**
 * Shared driver of the link and image rules: find a "](" prefix, validate the label in
 * front of it, then let the boundary scanner decide where the destination ends.
 *
 * Linearity requirement: a failed scan may hold a valid "](" inside the region it walked
 * (an unclosed <...> form swallows the rest of the line), so the search re-enters the
 * region to give every candidate its own try - but only while the re-read debt of the pass
 * stays within the text length. Past that budget the search resumes at the point the
 * scanner reports (`resume`), never earlier: the total work stays O(text), where re-reading
 * a flood of "[a](" from every one of them would cost seconds (a hangable client).
 *
 * @param {string} text
 * @param {boolean} isImage - image labels require a '!' right before '[', links forbid it
 * @param {LabelAcceptor} acceptLabel - createLinkLabelAcceptor for a link, the stricter
 *   createImageLabelAcceptor for an image. What it returns is what buildTag is given - the raw
 *   label for a link, the expanded one for an image.
 * @param {LinkTagBuilder} buildTag
 * @return {string}
 */
function replaceLinkLike(
	text: string,
	isImage: boolean,
	acceptLabel: LabelAcceptor,
	buildTag: LinkTagBuilder,
): string
{
	let searchPos = 0;
	// Everything before this index is already in `result` - the label of the next match may
	// not reach back into it (String.replaceAll never re-matched consumed text either).
	let emittedTo = 0;
	let result = '';
	// Characters failed scans have left re-readable so far (the linearity requirement above).
	let rescanDebt = 0;

	for (;;)
	{
		const prefixPos = text.indexOf('](', searchPos);
		if (prefixPos === -1)
		{
			break;
		}

		const label = validateLabel(text, prefixPos, isImage, emittedTo, acceptLabel);
		if (label === null)
		{
			searchPos = prefixPos + 2;
			continue;
		}

		const scan = scanLinkDestination(text, prefixPos + 2);
		if (scan.fail === true)
		{
			const scanEnd = Math.max(scan.resume, prefixPos + 2);
			rescanDebt += scanEnd - (prefixPos + 2);
			searchPos = rescanDebt > text.length ? scanEnd : prefixPos + 2;
			continue;
		}

		result += text.slice(emittedTo, label.start) + buildTag(label.text, scan.href);
		emittedTo = scan.end + 1;
		searchPos = emittedTo;
	}

	return result + text.slice(emittedTo);
}

/**
 * Validate the link text / image alt that ends at the "](" prefix: walk back to the
 * opening '[' over at most MAX_LABEL_LENGTH characters. A ']' on the way means the
 * fragment is not a label; a link text must not be empty ({1,500}), an alt may be
 * ({0,500}); a placeholder the caller's acceptor rejects disqualifies it as well - a
 * protected BB tag carried a ']' of its own (see createLinkLabelAcceptor), and an image
 * alt takes no placeholder at all (see createImageLabelAcceptor).
 *
 * @param {string} text
 * @param {number} prefixPos - index of the "](" prefix
 * @param {boolean} isImage
 * @param {number} minPos - lower bound of the walk (start of the not yet emitted text)
 * @param {LabelAcceptor} acceptLabel
 * @return {?LinkLabel} null when this is not a label; `text` is what the acceptor returned, not
 *   the raw slice; `start` includes the '!' of an image, so the caller drops it together with
 *   the label
 */
function validateLabel(
	text: string,
	prefixPos: number,
	isImage: boolean,
	minPos: number,
	acceptLabel: LabelAcceptor,
): ?LinkLabel
{
	const lowestStart = Math.max(minPos, prefixPos - MAX_LABEL_LENGTH - 1);

	for (let i = prefixPos - 1; i >= lowestStart; i--)
	{
		if (text[i] === ']')
		{
			return null;
		}

		if (text[i] !== '[')
		{
			continue;
		}

		const hasBang = i > minPos && text[i - 1] === '!';
		if (hasBang !== isImage)
		{
			return null;
		}

		const label = text.slice(i + 1, prefixPos);
		if (!isImage && label === '')
		{
			return null;
		}

		const acceptedLabel = acceptLabel(label);
		if (acceptedLabel === null)
		{
			return null;
		}

		return { start: isImage ? i - 1 : i, text: acceptedLabel };
	}

	return null;
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
 * Strip the server-added [URL]...[/URL] wrapper from a URL value. Im\Text::parse auto-wraps bare
 * URLs before the client receives the message: `(https://google.com)` arrives as
 * `([URL]https://google.com[/URL])`. The scanner hands the destination back with the pair around
 * it whole (restoreWrapper), so one unwrapping rule serves every shape.
 *
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
function applyLink(text: string, protectDestination: DestinationProtector, acceptLabel: LabelAcceptor): string
{
	// A Markdown link always contains "](" - without it there is nothing to scan, so bail
	// early. This is also the outer cost cap of the pass: a client-side DoS reachable from
	// MarkdownConverter.decode before Text.encode.
	if (!text.includes(']('))
	{
		return text;
	}

	return replaceLinkLike(text, false, acceptLabel, (linkText, url) => {
		// Protect the destination after unwrapping so its Markdown-significant chars survive
		// the bold/italic/strike/autolink rules that follow; restored byte-for-byte later.
		return `[URL=${protectDestination(stripUrlBBWrapper(url))}]${linkText}[/URL]`;
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
