/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
(function (exports, main_core, im_public, im_v2_lib_desktopApi) {
	'use strict';

	const MARKDOWN_PLACEHOLDER_SUFFIX = '####';
	const MARKDOWN_CODE_PREFIX = '####MD_CODE_';
	const MARKDOWN_ESCAPE_PREFIX = '####MD_ESC_';
	const MARKDOWN_INLINE_CODE_PREFIX = '####MD_INLINE_';
	const MARKDOWN_MENTION_PREFIX = '####MD_MENTION_';
	const MARKDOWN_TABLE_GUARD_PREFIX = '####MD_TABLEGUARD_';
	const MARKDOWN_LIST_TAG_PREFIX = '####MDLISTTAG';

	// Code/inline-code/table placeholders carry a per-render nonce
	// (####MD_CODE_<nonce>_<index>####, see createMarkdownNonce) so a sender cannot type a
	// literal copy of a placeholder and have the stored block replicated into it on restore
	// (client-side amplification DoS). This pattern only isolates code spans so applyHtmlRules
	// skips entity-decoding inside them — it needs to find ANY code placeholder, so it stays
	// nonce-agnostic ([a-z0-9]+ = the Math.random/base36 nonce); the exact per-render restore
	// patterns are built with the actual nonce by CodeProtector.
	const MARKDOWN_CODE_PATTERN = /(####MD_CODE_[a-z0-9]+_\d+####)/;

	// Canonical [table] BB-code block (single line). Used to stash genuine tables
	// during the inline/block/html rules (TableMarkerProtector) and again before the
	// global font/url decoders (NestedTagHandler.cutTableTag), so cells render once.
	const MARKDOWN_TABLE_PATTERN = /\[table][\s\S]*?\[\/table]/gi;

	class CodeProtector {
		#blocks = [];
		#nonce = '';
		#pattern;

		// The per-render nonce makes the placeholder (####MD_CODE_<nonce>_N####) unguessable, so
		// restore() never expands a literal copy the sender typed — only the blocks this instance
		// actually stored (amplification-DoS defense; see utils/nonce.js).
		constructor(nonce = '') {
			this.#nonce = nonce;
			this.#pattern = new RegExp(`${MARKDOWN_CODE_PREFIX}${nonce}_(\\d+)${MARKDOWN_PLACEHOLDER_SUFFIX}`, 'g');
		}
		protect(text, options = {}) {
			this.#blocks = [];

			// BBCode code blocks: [code]...[/code] — must be protected before markdown processing
			text = text.replaceAll(/\[code]([\s\S]*?)\[\/code]/gi, (match, code) => {
				return this.#addBlock(code);
			});

			// Fenced code blocks: ```lang\n...\n``` or ~~~lang\n...\n~~~
			text = text.replaceAll(/^(`{3,})([^\n]*)\n([\S\s]*?)^\1/gm, (match, fence, lang, code) => {
				return this.#addBlock(code);
			});
			text = text.replaceAll(/^(~{3,})([^\n]*)\n([\S\s]*?)^\1/gm, (match, fence, lang, code) => {
				return this.#addBlock(code);
			});
			if (options.looseFence) {
				// Inline-only "loose" fenced code (decodeInline path only). The strict pattern above
				// needs the closing fence at line start; a pasted multi-line block whose closing ```
				// sits mid-line (e.g. ```Foo\nbar\nbaz```: rest) slips past it and would otherwise fall
				// through to the single-backtick inline rule and fragment into orphaned backticks plus
				// per-line inline-code boxes. Here a 3+ backtick pair whose content spans newlines is
				// captured whole as ONE [code] block; text after the closing fence stays outside it.
				// Gated to inline-only so the full message path (#convert) keeps its existing behavior.
				text = text.replaceAll(/(`{3,})([\S\s]*?)\1/g, (match, fence, code) => {
					if (!code.includes('\n')) {
						return match;
					}
					return this.#addBlock(code);
				});
			}

			// Indented code blocks: line starting with 4 spaces or tab, preceded by empty line
			text = text.replaceAll(/(^|\n)\n((?:(?: {4}|\t).+(?:\n|$))+)/g, (match, prefix, block) => {
				const code = block.replaceAll(/^(?: {4}|\t)/gm, '');
				return `${prefix}\n${this.#addBlock(code)}`;
			});
			return text;
		}
		restore(text) {
			if (this.#blocks.length === 0) {
				return text;
			}
			const blocks = this.#blocks;
			const result = text.replaceAll(this.#pattern, (match, index) => {
				const block = blocks[Number(index)];

				// A user-typed literal "####MD_CODE_N####" (or an out-of-range index)
				// has no stored block — leave the marker untouched instead of emitting
				// [code]undefined[/code] or duplicating an unrelated block.
				return block === undefined ? match : `[code]${block}[/code]`;
			});
			this.#blocks = [];
			return result;
		}
		#addBlock(code) {
			const index = this.#blocks.length;
			this.#blocks.push(code.replace(/\n$/, ''));
			return `${MARKDOWN_CODE_PREFIX}${this.#nonce}_${index}${MARKDOWN_PLACEHOLDER_SUFFIX}`;
		}
	}

	const ESCAPE_PATTERN = /\\([!#()*+.>[\\\]_`{|}~\-])/g;

	// Built from the same constants used to protect, so the protect/restore pair can
	// never drift (parallels CodeProtector / restoreInlineCode).
	const ESCAPE_PLACEHOLDER_PATTERN = new RegExp(`${MARKDOWN_ESCAPE_PREFIX}(\\d+)${MARKDOWN_PLACEHOLDER_SUFFIX}`, 'g');

	// Emphasis delimiters are the only escapes that also show up inside symbol art like
	// the shrug ¯\_(ツ)_/¯. When such a delimiter sits between two "art" characters
	// (non-word AND non-space) the backslash is part of the drawing, not an escape, so
	// keep it literal; the placeholder still neutralises the delimiter so no emphasis
	// forms. A word- or space-adjacent \_ / \* / \~ (and any other escape) stays an
	// ordinary text escape — backslash dropped, as CommonMark.
	const EMPHASIS_ESCAPES = new Set(['_', '*', '~']);

	// A non-ASCII word char = a Unicode letter or digit. The web runtime supports Unicode property
	// escapes, so we use \p{L}/\p{N} directly (no bundle-heavy range table). The mobile copy of this
	// file bakes the equivalent \p{L}∪\p{N} ranges instead, because the Android runtime has no property
	// escapes (see inline-rules.js) — that table belongs to the mobile bundle only, not this web one.
	const NON_ASCII_WORD_CHAR = /[\p{L}\p{N}]/u;

	// A neighbour glyph may be an astral character (a UTF-16 surrogate pair), so classify the whole code
	// point rather than a lone surrogate half — otherwise a math-bold letter like 𝐀 (a letter) would be
	// read as a lone surrogate and mistaken for a symbol. These return the full code point at a boundary.
	function codePointEndingAt(source, index) {
		const low = source.charCodeAt(index);
		if (low >= 0xDC00 && low <= 0xDFFF && index - 1 >= 0) {
			const high = source.charCodeAt(index - 1);
			if (high >= 0xD800 && high <= 0xDBFF) {
				return source.slice(index - 1, index + 1);
			}
		}
		return source[index] ?? '';
	}
	function codePointStartingAt(source, index) {
		const high = source.charCodeAt(index);
		if (high >= 0xD800 && high <= 0xDBFF) {
			const low = source.charCodeAt(index + 1);
			if (low >= 0xDC00 && low <= 0xDFFF) {
				return source.slice(index, index + 2);
			}
		}
		return source[index] ?? '';
	}

	// "Art" = a visible glyph that is neither a word character (\p{L}/\p{N}) nor whitespace: ASCII
	// punctuation/symbols, the shrug's ¯, and every Unicode symbol/punctuation glyph. ASCII is decided
	// by cheap charCode ranges; a non-ASCII neighbour is art iff it is not whitespace and not a word
	// char. This matches the parser's documented "not letter, not digit, not space" rule exactly.
	function isArtChar(char) {
		if (!char) {
			return false;
		}
		const code = char.charCodeAt(0);
		if (code < 0x80) {
			// ASCII: whitespace/controls and letters/digits are not art; every other glyph is.
			return !(code <= 32 || code >= 48 && code <= 57 || code >= 65 && code <= 90 || code >= 97 && code <= 122);
		}

		// Non-ASCII: Unicode whitespace is content; otherwise art iff it is not a \p{L}/\p{N} word char.
		return !(/\s/.test(char) || NON_ASCII_WORD_CHAR.test(char));
	}
	class EscapeHandler {
		#escapes = [];
		protect(text) {
			this.#escapes = [];
			return text.replaceAll(ESCAPE_PATTERN, (match, char, offset, source) => {
				// Keep the backslash literal for an emphasis delimiter drawn inside symbol art. The
				// neighbours are read as whole code points so astral letters/symbols classify correctly.
				const keepBackslash = EMPHASIS_ESCAPES.has(char) && isArtChar(codePointEndingAt(source, offset - 1)) && isArtChar(codePointStartingAt(source, offset + 2));
				const index = this.#escapes.length;
				this.#escapes.push(keepBackslash ? `\\${char}` : char);
				return `${MARKDOWN_ESCAPE_PREFIX}${index}${MARKDOWN_PLACEHOLDER_SUFFIX}`;
			});
		}
		restore(text) {
			if (this.#escapes.length === 0) {
				return text;
			}
			const escapes = this.#escapes;
			const result = text.replaceAll(ESCAPE_PLACEHOLDER_PATTERN,
			// A user-typed literal "####MD_ESC_N####" (or an out-of-range index) has no
			// stored char — leave the marker untouched instead of emitting "undefined".
			(match, index) => escapes[Number(index)] ?? match);
			this.#escapes = [];
			return result;
		}
	}

	// Container tags ([context]) are matched BEFORE the nested [USER]/[CHAT] they may
	// wrap, so the whole container is stored as one unit; matching a nested mention first
	// would leave its placeholder inside the stored container and single-pass restore
	// would not expand it. The `(?!\[opener)` guard bounds each lazy scan at the next
	// same-tag opener, so malformed input (many unclosed openers) stays O(n) instead of
	// rescanning the tail from every opener.
	const MENTION_PATTERNS = [/\[context=(?:chat\d+|\d+:\d+)\/\d+](?:(?!\[context=)[\s\S])*?\[\/context]/gi, /\[USER=(?:all|\d+)(?: REPLACE)?](?:(?!\[USER=).)*?\[\/USER]/gi, /\[CHAT=(?:imol\|)?\d+](?:(?!\[CHAT=).)*?\[\/CHAT]/gi];
	class MentionProtector {
		#mentions = [];
		#nonce = '';
		#pattern;
		constructor(nonce = '') {
			this.#nonce = nonce;
			this.#pattern = new RegExp(`${MARKDOWN_MENTION_PREFIX}${nonce}_(\\d+)${MARKDOWN_PLACEHOLDER_SUFFIX}`, 'g');
		}
		protect(text) {
			this.#mentions = [];
			for (const pattern of MENTION_PATTERNS) {
				text = text.replaceAll(pattern, match => {
					return this.#addMention(match);
				});
			}
			return text;
		}
		restore(text) {
			if (this.#mentions.length === 0) {
				return text;
			}
			const mentions = this.#mentions;
			const result = text.replaceAll(this.#pattern, (match, index) => {
				const mention = mentions[Number(index)];
				return mention === undefined ? match : mention;
			});
			this.#mentions = [];
			return result;
		}
		#addMention(mention) {
			const index = this.#mentions.length;
			this.#mentions.push(mention);
			return `${MARKDOWN_MENTION_PREFIX}${this.#nonce}_${index}${MARKDOWN_PLACEHOLDER_SUFFIX}`;
		}
	}

	/**
	 * A per-render, unpredictable token mixed into every Markdown protector placeholder
	 * (####MD_CODE_<nonce>_N####, ####MD_INLINE_<nonce>_N####, ####MD_TABLEGUARD_<nonce>_N####).
	 *
	 * Without it the placeholder format is guessable, so a sender could paste many literal
	 * copies of a placeholder plus one real [code] / `inline` / [table] and have the single
	 * stored block replicated into every copy on restore — a client-side memory/DOM
	 * amplification DoS that re-triggers on every render for every recipient. With a random
	 * nonce the sender cannot predict the recipient's placeholder, so restore only ever expands
	 * the placeholders the protector actually created. Mirrors NestedTagHandler.getNonce().
	 *
	 * Not a secret — Math.random is enough to be unguessable by a remote sender. The base-36
	 * alphabet is [a-z0-9] (matched generically by MARKDOWN_CODE_PATTERN); the 'n' fallback
	 * keeps the placeholder well-formed on the astronomically rare empty slice.
	 *
	 * @returns {string}
	 */
	function createMarkdownNonce() {
		return Math.random().toString(36).slice(2, 12) || 'n';
	}

	// BB-code [size=N] values for each heading level. Tightened scale: H1 starts at
	// the former H2 size, the series steps down by 2px, and H5/H6 share the floor (14).
	const HEADING_SIZES = {
		h1: 22,
		h2: 20,
		h3: 18,
		h4: 16,
		h5: 14,
		h6: 14
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
	function formatHeading(text, level) {
		if (level === 1 || level === 2) {
			return `[h${level}]${text}[/h${level}]`;
		}
		return `[size=${HEADING_SIZES[`h${level}`]}][b]${text}[/b][/size]`;
	}

	/**
	 * @param {string} line
	 * @returns {boolean}
	 */
	function isCodePlaceholder(line) {
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
	function isStructuralPlaceholder(line) {
		return line.startsWith(MARKDOWN_LIST_TAG_PREFIX) || line.startsWith(MARKDOWN_TABLE_GUARD_PREFIX);
	}

	// Bitrix quote separators use exactly 54 dashes.
	// Limit Markdown constructs to avoid collisions with them.
	const MAX_MARKDOWN_RULE_LENGTH = 20;

	/**
	 * @param {string} line
	 * @returns {boolean}
	 */
	function isHorizontalRuleLine(line) {
		const trimmed = line.trim();
		if (trimmed.length > MAX_MARKDOWN_RULE_LENGTH) {
			return false;
		}

		// Pure: ---, ***, ___ (3+ of same char)
		if (/^-{3,}$/.test(trimmed) || /^\*{3,}$/.test(trimmed) || /^_{3,}$/.test(trimmed)) {
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
	function getSetextMarkerType(line) {
		const trimmed = line.trim();
		if (trimmed.length > MAX_MARKDOWN_RULE_LENGTH) {
			return null;
		}
		if (/^={3,}$/.test(trimmed)) {
			return 'h1';
		}
		if (/^-{3,}$/.test(trimmed)) {
			return 'h2';
		}
		return null;
	}

	/**
	 * Check if a line is valid text for a setext heading (non-empty, not a rule/heading/placeholder)
	 * @param {string} line
	 * @returns {boolean}
	 */
	function isValidSetextContent(line) {
		if (!line || line.trim() === '') {
			return false;
		}
		if (isCodePlaceholder(line) || isStructuralPlaceholder(line)) {
			return false;
		}
		if (/^#{1,6}\s/.test(line)) {
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
	function applyBlockRules(text) {
		if (!main_core.Type.isStringFilled(text)) {
			return '';
		}
		const lines = text.split('\n');
		const result = [];
		let i = 0;
		// True while the previous emitted line was a Markdown single-'>' quote, so the next
		// '>>' line knows whether to nest (see the blockquote branch below).
		let quoteSingleContext = false;
		while (i < lines.length) {
			const line = lines[i];
			const nextLine = i + 1 < lines.length ? lines[i + 1] : null;
			if (isCodePlaceholder(line)) {
				result.push(line);
				quoteSingleContext = false;
				i++;
				continue;
			}
			if (nextLine !== null && !isCodePlaceholder(nextLine)) {
				const setextType = getSetextMarkerType(nextLine);
				if (setextType && isValidSetextContent(line)) {
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
			if (isDoubleQuote) {
				result.push(quoteSingleContext ? `>>${line}` : line);
				i++;
				continue;
			}
			if (isSingleQuote) {
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
	function applyLineRules(line) {
		// ATX headings: # through ######, must have space after #
		const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
		if (headingMatch) {
			const level = headingMatch[1].length;
			const content = headingMatch[2].replace(/\s+#+\s*$/, '').trim(); // remove trailing # markers

			return formatHeading(content, level);
		}

		// Horizontal rule: line that is only dashes, asterisks, underscores (3+), with optional
		// spaces. Emitted as a block [hr] marker that ParserHeading.decodeHeading renders as a
		// thin rule line (parser.css), the same hairline style as the H1/H2 underline.
		if (isHorizontalRuleLine(line)) {
			return '[hr]';
		}

		// Blockquotes are handled in applyBlockRules (they need cross-line state for nesting).
		// Lists ([list]/[list=1]) are handled earlier by convertLists, not here.

		return line;
	}

	/**
	 * Encode a value into a token whose alphabet is restricted to the
	 * Markdown-/Text.encode-inert set `[A-Za-z0-9.%-]`.
	 *
	 * `encodeURIComponent` already removes `< > & " '` and newlines, but leaves a few
	 * Markdown-significant characters raw (`! ' ( ) * _ ~`); those are percent-escaped
	 * too, so the token cannot be re-parsed by the inline/block rules that run after
	 * it, nor broken by Text.encode or the `[img …]` delimiters.
	 * `decodeURIComponent` restores the original value on render.
	 *
	 * Single source of truth for the inert-token alphabet, used by the image alt
	 * token (inline-rules.js).
	 *
	 * @param {string} value
	 * @returns {string}
	 */
	function toMarkdownInertToken(value) {
		return encodeURIComponent(value).replaceAll(/[!'()*_~]/g, char => `%${char.charCodeAt(0).toString(16).toUpperCase()}`);
	}

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
	function inlineCodeRestorePattern(nonce) {
		return new RegExp(`${MARKDOWN_INLINE_CODE_PREFIX}${nonce}_(\\d+)${MARKDOWN_PLACEHOLDER_SUFFIX}`, 'g');
	}
	function inlineCodePlaceholderOnlyPattern(nonce) {
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
	function hasWordCharBefore(text, offset) {
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
	function applyInlineRules(text, deferredCodeStorage = null, nonce = null) {
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
		if (deferredCodeStorage === null) {
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
	function applyCellInlineRules(text) {
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
	function protectInlineCode(text, storage, nonce) {
		if (!text.includes('`')) {
			return text;
		}
		const placeholderOnly = inlineCodePlaceholderOnlyPattern(nonce);
		const makePlaceholder = index => `${MARKDOWN_INLINE_CODE_PREFIX}${nonce}_${index}${MARKDOWN_PLACEHOLDER_SUFFIX}`;

		// Triple backticks first: ```code```
		text = text.replaceAll(/```(.+?)```/g, (match, code) => {
			const index = storage.length;
			storage.push(code.trim());
			return makePlaceholder(index);
		});

		// Double backticks: ``code``
		text = text.replaceAll(/``(.+?)``/g, (match, code) => {
			if (placeholderOnly.test(code)) {
				return match;
			}
			const index = storage.length;
			storage.push(code.trim());
			return makePlaceholder(index);
		});

		// Single backticks: `code`
		text = text.replaceAll(/`([^`]+)`/g, (match, code) => {
			if (placeholderOnly.test(code)) {
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
	function restoreInlineCode(text, storage, nonce) {
		if (storage.length === 0) {
			return text;
		}
		return text.replaceAll(inlineCodeRestorePattern(nonce), (match, index) => {
			const code = storage[Number(index)];
			if (code === undefined) {
				return match;
			}

			// Inline code must stay literal: a zero-width space after every '[' stops the
			// downstream BB decoders (ParserFont, decodeInlineCode) from rendering tags like
			// [b] inside the span or closing it early on a literal [/icode].
			return `[icode]${code.replaceAll('[', '[\u200B')}[/icode]`;
		});
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
	function applyImage(text) {
		// A Markdown image always contains "](" — without it the pattern cannot match, so
		// bail early. This also caps cost: a crafted run of unmatched "[" (no "](") can drive
		// the [^\]]+ alternation into quadratic backtracking, a reachable client-side DoS.
		if (!text.includes('](')) {
			return text;
		}
		return text.replaceAll(IMAGE_PATTERN, (match, alt, url) => {
			const altToken = toMarkdownInertToken(alt);
			if (altToken === '') {
				return `[img size=${MARKDOWN_IMAGE_DEFAULT_SIZE}]${url}[/img]`;
			}
			return `[img size=${MARKDOWN_IMAGE_DEFAULT_SIZE} alt=${altToken}]${url}[/img]`;
		});
	}

	/**
	 * Bold+Italic: ***text*** or ___text___ → [b][i]text[/i][/b]
	 */
	function applyBoldItalic(text) {
		if (!text.includes('*') && !text.includes('_')) {
			return text;
		}

		// Asterisk variant
		text = text.replaceAll(ASTERISK_BOLD_ITALIC_PATTERN, (match, content) => {
			return `[b][i]${content}[/i][/b]`;
		});

		// Underscore variant (word boundaries — don't match inside words)
		text = text.replaceAll(BOLD_ITALIC_UNDERSCORE_PATTERN, (match, content, offset, sourceText) => {
			if (hasWordCharBefore(sourceText, offset)) {
				return match;
			}
			return `[b][i]${content}[/i][/b]`;
		});
		return text;
	}

	/**
	 * Bold: **text** or __text__ → [b]text[/b]
	 */
	function applyBold(text) {
		if (!text.includes('*') && !text.includes('_')) {
			return text;
		}

		// Asterisk variant
		text = text.replaceAll(ASTERISK_BOLD_PATTERN, (match, content) => {
			return `[b]${content}[/b]`;
		});

		// Underscore variant (word boundaries — don't match some__var__name or _____)
		text = text.replaceAll(BOLD_UNDERSCORE_PATTERN, (match, content, offset, sourceText) => {
			if (hasWordCharBefore(sourceText, offset)) {
				return match;
			}
			return `[b]${content}[/b]`;
		});
		return text;
	}

	/**
	 * Italic: *text* or _text_ → [i]text[/i]
	 * Content must not start or end with space for * variant.
	 * Underscore variant requires word boundary.
	 */
	function applyItalic(text) {
		if (!text.includes('*') && !text.includes('_')) {
			return text;
		}

		// Asterisk variant: content must not start/end with space
		text = text.replaceAll(ASTERISK_ITALIC_PATTERN, (match, content) => {
			return `[i]${content}[/i]`;
		});

		// Underscore variant (word boundaries — don't match some_var_name)
		text = text.replaceAll(ITALIC_UNDERSCORE_PATTERN, (match, content, offset, sourceText) => {
			if (hasWordCharBefore(sourceText, offset)) {
				return match;
			}
			return `[i]${content}[/i]`;
		});
		return text;
	}

	/**
	 * Strikethrough: ~~text~~ → [s]text[/s]
	 */
	function applyStrikethrough(text) {
		if (!text.includes('~')) {
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
	function stripUrlBBWrapper(url) {
		return url.replace(/^\[url](.*)\[\/url]$/i, '$1');
	}

	/**
	 * Link: [text](url) → [URL=url]text[/URL]
	 * Must not match images (preceded by !)
	 */
	function applyLink(text) {
		// A Markdown link always contains "](" — without it the pattern cannot match, so bail
		// early. This also caps cost: a crafted run of unmatched "[" (no "](") can drive the
		// [^\]]+ alternation into quadratic backtracking — a client-side DoS reachable from
		// MarkdownConverter.decode before Text.encode.
		if (!text.includes('](')) {
			return text;
		}
		return text.replaceAll(LINK_PATTERN, (match, linkText, url, offset, sourceText) => {
			if (offset > 0 && sourceText[offset - 1] === '!') {
				return match;
			}
			url = stripUrlBBWrapper(url);
			return `[URL=${url}]${linkText}[/URL]`;
		});
	}

	/**
	 * Autolink URL: <https://example.com> → [URL]https://example.com[/URL]
	 */
	function applyAutolinkUrl(text) {
		return text.replaceAll(AUTOLINK_URL_PATTERN, (match, url) => {
			return `[URL]${url}[/URL]`;
		});
	}

	/**
	 * Autolink email: <user@example.com> → [URL]mailto:user@example.com[/URL]
	 */
	function applyAutolinkEmail(text) {
		return text.replaceAll(AUTOLINK_EMAIL_PATTERN, (match, email) => {
			return `[URL]mailto:${email}[/URL]`;
		});
	}

	const NAMED_ENTITIES = {
		amp: '&',
		lt: '<',
		gt: '>',
		quot: '"',
		apos: '\'',
		nbsp: ' ',
		copy: '©',
		reg: '®',
		trade: '™',
		mdash: '—',
		ndash: '–',
		laquo: '«',
		raquo: '»',
		bull: '•',
		hellip: '…',
		rarr: '→',
		larr: '←',
		hearts: '♥',
		check: '✓',
		times: '×',
		divide: '÷',
		plusmn: '±',
		deg: '°',
		euro: '€',
		pound: '£',
		yen: '¥',
		cent: '¢'
	};
	const HTML_TAG_MAP = {
		u: 'u',
		b: 'b',
		strong: 'b',
		i: 'i',
		em: 'i',
		s: 's',
		del: 's',
		strike: 's'
	};
	const HTML_TAG_PATTERN = new RegExp(`<(${Object.keys(HTML_TAG_MAP).join('|')})(\\s[^>]*)?>([\\s\\S]*?)<\\/\\1>`, 'gi');

	/**
	 * A '[' produced by decoding an HTML entity (&#91; / &#x5B; / &lbrack;) must NOT be able to
	 * open a BB-code tag: the BB-code decoders run after this step and Text.encode does not
	 * escape '['. Without this, entity-encoded user text like
	 * `&#91;send=/cmd&#93;click&#91;/send&#93;` — which passes server-side BB sanitization as
	 * plain text — would be decoded into an ACTIVE [send]/[put]/[url]/… element on the
	 * recipient (CRITICAL: HTML-entity -> active BB-code injection). A zero-width space after
	 * '[' keeps it visually a '[' but inert. This is the root defang; per-construct defangs
	 * elsewhere (lists, table cells) no longer need to handle the entity case.
	 *
	 * @param {string} char
	 * @returns {string}
	 */
	function defangDecodedBracket(char) {
		return char === '[' ? '[\u200B' : char;
	}

	/**
	 * Decode HTML entities (named, decimal, hex) to their Unicode equivalents. A decoded '['
	 * is defanged so an entity can never assemble an active BB-code tag (see above).
	 *
	 * @param {string} text
	 * @returns {string}
	 */
	function decodeHtmlEntities(text) {
		return text.replaceAll(/&(#x?[\dA-Fa-f]+|[A-Za-z]+);/g, (match, entity) => {
			if (entity.startsWith('#x') || entity.startsWith('#X')) {
				const codePoint = parseInt(entity.slice(2), 16);
				if (codePoint === 0 || Number.isNaN(codePoint)) {
					return match;
				}
				try {
					return defangDecodedBracket(String.fromCodePoint(codePoint));
				} catch {
					return match;
				}
			}
			if (entity.startsWith('#')) {
				const codePoint = parseInt(entity.slice(1), 10);
				if (codePoint === 0 || Number.isNaN(codePoint)) {
					return match;
				}
				try {
					return defangDecodedBracket(String.fromCodePoint(codePoint));
				} catch {
					return match;
				}
			}
			const decoded = NAMED_ENTITIES[entity];
			return decoded === undefined ? match : defangDecodedBracket(decoded);
		});
	}

	// Cap for the backtracking-prone tag-pair regex below. The lazy `[\s\S]*?` plus the
	// `\1` backreference make HTML_TAG_PATTERN quadratic on adversarial input
	// (e.g. '<b>'.repeat(50000)); bound the work so it cannot freeze the render thread.
	// The cheap `</` pre-check skips the regex for the common opener-only DoS shape, and
	// the length cap covers the rest. decodeHtmlEntities below is linear and uncapped.
	const HTML_TAG_MAX_LENGTH = 20000;
	const MAX_NESTING_DEPTH = 10;

	/**
	 * Convert HTML formatting tags to BB-codes and decode HTML entities.
	 * Skips content inside code block placeholders (####MD_CODE_N####).
	 *
	 * @param {string} text
	 * @returns {string}
	 */
	function applyHtmlRules(text) {
		if (!main_core.Type.isStringFilled(text)) {
			return '';
		}
		let current = text;
		if (current.length <= HTML_TAG_MAX_LENGTH && current.includes('</')) {
			let iterations = 0;
			let changed = true;
			while (changed && iterations < MAX_NESTING_DEPTH) {
				changed = false;
				current = current.replaceAll(HTML_TAG_PATTERN, (match, tag, attrs, content) => {
					changed = true;
					const bbTag = HTML_TAG_MAP[tag.toLowerCase()];
					return `[${bbTag}]${content}[/${bbTag}]`;
				});
				iterations++;
			}
		}
		text = current;
		const parts = text.split(MARKDOWN_CODE_PATTERN);
		const decoded = parts.map(part => {
			if (part.startsWith(MARKDOWN_CODE_PREFIX)) {
				return part;
			}
			return decodeHtmlEntities(part);
		});
		return decoded.join('');
	}

	const LIST_ITEM_PATTERN = /^([ \t]*)([*+-]|\d+\.)[ \t]+(.*)$/;
	const HAS_LIST_ITEM_PATTERN = /^[ \t]*(?:[*+-]|\d+\.)[ \t]+/m;
	const MAX_RULE_LENGTH = 20;
	// Cap parsed items symmetric to the render cap (functions/list.js MAX_LIST_ITEMS) so a
	// crafted [list] with thousands of [*] doesn't burn applyCellInlineRules on items that
	// ParserList.decodeList will never render.
	const MAX_LIST_ITEMS$1 = 200;

	// Structural list tags ([list]/[list=1]/[/list]/[*]) are hidden behind inert
	// placeholders during the inline/block/html rules, so the `*` in `[*]` is not
	// eaten by the bold/italic rules; restore() brings them back afterwards. The
	// item CONTENT stays exposed, so it still picks up the normal inline formatting.
	const LIST_TAG_PATTERN = /\[\/?list(?:=1)?(?:\s+start=\d+)?]|\[\*]/gi;
	const LIST_TAG_GUARD_PATTERN = new RegExp(`${MARKDOWN_LIST_TAG_PREFIX}(\\d+)${MARKDOWN_PLACEHOLDER_SUFFIX}`, 'g');
	class ListTagProtector {
		#tags = [];
		protect(text) {
			this.#tags = [];
			if (!text.includes('[list') && !text.includes('[*]')) {
				return text;
			}
			return text.replaceAll(LIST_TAG_PATTERN, tag => {
				const index = this.#tags.length;
				this.#tags.push(tag);
				return `${MARKDOWN_LIST_TAG_PREFIX}${index}${MARKDOWN_PLACEHOLDER_SUFFIX}`;
			});
		}
		restore(text) {
			if (this.#tags.length === 0) {
				return text;
			}
			const tags = this.#tags;
			const result = text.replaceAll(LIST_TAG_GUARD_PATTERN, (match, index) => tags[Number(index)] ?? match);
			this.#tags = [];
			return result;
		}
	}

	/**
	 * A horizontal rule (`* * *`, `- - -`, `---`, …) would otherwise match the list
	 * item pattern (`- ` / `* ` with content) — exclude it so a divider never turns
	 * into a single-item list.
	 *
	 * @param {string} line
	 * @returns {boolean}
	 */
	function isHorizontalRule(line) {
		const trimmed = line.trim();
		if (trimmed.length > MAX_RULE_LENGTH) {
			return false;
		}
		return /^-{3,}$/.test(trimmed) || /^\*{3,}$/.test(trimmed) || /^_{3,}$/.test(trimmed) || /^(- ?){3,}$/.test(trimmed) || /^(\* ?){3,}$/.test(trimmed) || /^(_ ?){3,}$/.test(trimmed);
	}
	function normalizeIndent(indent) {
		return indent.replace(/\t/g, '    ').length;
	}

	// Defang literal list-structure BB tags ([list]/[list=1]/[/list]/[*]) in an item's
	// own content so they cannot be confused with the structural tags this converter
	// emits. A zero-width space after '[' breaks the tag match; the text still reads as
	// the literal tag the user typed.
	function defangListTags(text) {
		// Second pass defangs an ESCAPED structural tag (\\[*] becomes
		// ####MD_ESC_N####*] before convertLists, since EscapeHandler.protect runs
		// first) so escapeHandler.restore cannot re-form a real [*] and split the item.
		return text.replace(/\[(\/?list(?:=1)?(?:\s+start=\d+)?|\*)]/gi, (match, tag) => `[\u200B${tag}]`).replace(/(####MD_ESC_\d+####)(\/?list(?:=1)?(?:\s+start=\d+)?|\*)]/gi, (match, esc, tag) => `${esc}\u200B${tag}]`);
	}

	/**
	 * @param {string} line
	 * @returns {{ indent: number, ordered: boolean, content: string } | null}
	 */
	function parseListItem(line) {
		if (isHorizontalRule(line)) {
			return null;
		}
		const match = line.match(LIST_ITEM_PATTERN);
		if (!match) {
			return null;
		}
		const marker = match[2];
		const ordered = /\d/.test(marker);
		return {
			indent: normalizeIndent(match[1]),
			ordered,
			// First item's number seeds <ol start> (CommonMark: later item numbers are ignored).
			start: ordered ? parseInt(marker, 10) : null,
			content: defangListTags(applyCellInlineRules(match[3]))
		};
	}

	/**
	 * Build nested [list] BB-code from a flat list of items with indent levels.
	 * Items deeper than baseIndent are recursed into a nested [list] attached to the
	 * preceding item; the list type ([list] vs [list=1]) follows the first item.
	 *
	 * @param {Array<Object>} items
	 * @param {number} startIndex
	 * @param {number} baseIndent
	 * @returns {[string, number]}
	 */
	function buildList(items, startIndex, baseIndent) {
		const first = items[startIndex];
		const ordered = first.ordered;
		// Carry a non-default start (e.g. a list beginning at "5.") on the list tag so the
		// decoder can emit <ol start="5">. A start of 1 stays the canonical bare [list=1].
		let bbcode = ordered ? '[list=1]' : '[list]';
		// Only carry a start we can round-trip as plain digits: Number.isSafeInteger rejects
		// values >= 2^53 whose String() form is either imprecise or exponential ("1e+21"),
		// which would leak as raw BB (no `start=\d+` regex matches it). Such an absurd start
		// degrades to bare [list=1] (renders from 1) rather than breaking the list.
		if (ordered && Number.isSafeInteger(first.start) && first.start !== 1) {
			bbcode = `[list=1 start=${first.start}]`;
		}
		let i = startIndex;
		while (i < items.length && items[i].indent >= baseIndent) {
			if (items[i].indent > baseIndent) {
				const [nested, next] = buildList(items, i, items[i].indent);
				bbcode += nested;
				i = next;
			} else {
				// A marker-type change at the same level starts a NEW list (CommonMark: an
				// ordered item can't extend a bullet list and vice versa). Stop here so the
				// caller emits the remaining items as the next sibling [list] instead of
				// renumbering "- item" into the ordered run.
				if (items[i].ordered !== ordered) {
					break;
				}
				bbcode += `[*]${items[i].content}`;
				i++;
			}
		}
		bbcode += '[/list]';
		return [bbcode, i];
	}

	/**
	 * @param {string[]} lines
	 * @param {number} startIndex
	 * @returns {{ bbcode: string, endIndex: number } | null}
	 */
	function tryParseList(lines, startIndex) {
		if (!parseListItem(lines[startIndex])) {
			return null;
		}

		// Stop at MAX_LIST_ITEMS so the list ENDS here: convertLists then re-parses any further
		// list lines as the next [list] block. This caps the size of a single list without
		// dropping items — an earlier "consume the rest but skip them" cap silently lost every
		// item past the limit.
		const items = [];
		let i = startIndex;
		while (i < lines.length && items.length < MAX_LIST_ITEMS$1) {
			const item = parseListItem(lines[i]);
			if (!item) {
				break;
			}
			items.push(item);
			i++;
		}
		return {
			items,
			endIndex: i
		};
	}

	/**
	 * Format parsed list items for the current mode.
	 * - decode: canonical nested [list]/[list=1] BB-code.
	 * - simplify: plain `• item` lines for preview/notification surfaces.
	 *
	 * @param {Array<Object>} items
	 * @param {string} mode
	 * @returns {string}
	 */
	function formatList(items, mode) {
		if (mode === 'simplify') {
			return items.map(item => `• ${item.content}`).join('\n');
		}

		// buildList stops as soon as it meets an item shallower than its base indent and returns
		// how many items it consumed. When the FIRST item is deeper than a later one (e.g. a
		// pasted list whose first line has stray leading spaces), that leaves items unconsumed —
		// emit them as the next sibling [list] instead of dropping them. Looping to items.length
		// guarantees every parsed item reaches the output (no silent data loss); a well-formed
		// list whose first item is the shallowest is consumed in a single pass, unchanged.
		let bbcode = '';
		let i = 0;
		while (i < items.length) {
			const [chunk, next] = buildList(items, i, items[i].indent);
			bbcode += chunk;
			i = next;
		}
		return bbcode;
	}

	/**
	 * Group consecutive Markdown list lines into canonical [list]/[list=1] BB-code,
	 * one single-line block per list (so decodeNewLine never splits it). Nesting is
	 * derived from indentation. Item content is converted to inline BB here, then
	 * protected with the rest of the structure by ListTagProtector.
	 *
	 * @param {string} text
	 * @param {object} [options]
	 * @param {string} [options.mode] - 'decode' or 'simplify'
	 * @returns {string}
	 */
	function convertLists(text, options = {}) {
		const {
			mode = 'decode'
		} = options;
		if (!HAS_LIST_ITEM_PATTERN.test(text)) {
			return text;
		}
		const lines = text.split('\n');
		const result = [];
		let i = 0;
		while (i < lines.length) {
			const list = tryParseList(lines, i);
			if (list) {
				result.push(formatList(list.items, mode));
				i = list.endIndex;
			} else {
				result.push(lines[i]);
				i++;
			}
		}
		return result.join('\n');
	}

	// GFM allows one or more dashes per delimiter cell (`| - |` is valid), so accept `-+`
	// rather than `-{3,}`. Safe against false positives: this is only tested as the row
	// directly under a pipe header, with matching column count.
	const SEPARATOR_PATTERN = /^\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)*\|?\s*$/;

	// Hard caps so a single crafted table cannot materialize an unbounded DOM grid on
	// the web (or an unbounded URL payload on mobile). A table that exceeds either cap
	// is NOT converted — its raw GFM lines pass through as plain text (visible but
	// cheap) instead of becoming [table] BB-code. ParserTable.decodeTable applies the
	// same row/column ceiling defensively for legacy [table] BB-code (migration-IN).
	const MAX_TABLE_ROWS = 200;
	const MAX_TABLE_COLUMNS = 24;

	// Genuine [table] blocks (emitted below, or arriving as legacy BB-code) are
	// stashed behind this inert placeholder before the inline/block/html rules run,
	// so those rules cannot reparse the cell content or break the BB structure;
	// restore() brings them back afterwards. Per-call instance — no shared state.
	class TableMarkerProtector {
		#tables = [];
		#nonce = '';
		#pattern;

		// The per-render nonce makes the placeholder (####MD_TABLEGUARD_<nonce>_N####)
		// unguessable, so restore() never expands a literal copy the sender typed — only the
		// tables this instance actually stored (amplification-DoS defense; see utils/nonce.js).
		constructor(nonce = '') {
			this.#nonce = nonce;
			this.#pattern = new RegExp(`${MARKDOWN_TABLE_GUARD_PREFIX}${nonce}_(\\d+)${MARKDOWN_PLACEHOLDER_SUFFIX}`, 'g');
		}
		protect(text) {
			this.#tables = [];
			if (!text.includes('[table]')) {
				return text;
			}
			return text.replaceAll(MARKDOWN_TABLE_PATTERN, whole => {
				const index = this.#tables.length;
				this.#tables.push(whole);
				return `${MARKDOWN_TABLE_GUARD_PREFIX}${this.#nonce}_${index}${MARKDOWN_PLACEHOLDER_SUFFIX}`;
			});
		}
		restore(text) {
			if (this.#tables.length === 0) {
				return text;
			}
			const tables = this.#tables;
			const result = text.replaceAll(this.#pattern, (match, index) => tables[Number(index)] ?? match);
			this.#tables = [];
			return result;
		}
	}

	/**
	 * @param {string} line
	 * @returns {string[]}
	 */
	function parseRow(line) {
		let trimmed = line.trim();
		if (trimmed.startsWith('|')) {
			trimmed = trimmed.slice(1);
		}
		if (trimmed.endsWith('|')) {
			trimmed = trimmed.slice(0, -1);
		}
		return trimmed.split('|').map(cell => cell.trim());
	}

	/**
	 * @param {string} line
	 * @returns {boolean}
	 */
	function isSeparatorRow(line) {
		return SEPARATOR_PATTERN.test(line.trim());
	}

	/**
	 * Try to parse a GFM table starting at the given line index. Short rows are
	 * padded and long rows truncated to the header width.
	 *
	 * @param {string[]} lines
	 * @param {number} startIndex
	 * @returns {{ headers: string[], rows: string[][], endIndex: number } | null}
	 */
	function tryParseTable(lines, startIndex) {
		if (startIndex + 1 >= lines.length) {
			return null;
		}
		if (!lines[startIndex].includes('|') || !isSeparatorRow(lines[startIndex + 1])) {
			return null;
		}
		const headers = parseRow(lines[startIndex]);
		const separatorCells = parseRow(lines[startIndex + 1]);
		if (headers.length !== separatorCells.length) {
			return null;
		}

		// Over-wide table: bail to raw text rather than convert (see MAX_TABLE_COLUMNS).
		if (headers.length > MAX_TABLE_COLUMNS) {
			return null;
		}
		const rows = [];
		let i = startIndex + 2;
		while (i < lines.length && lines[i].includes('|')) {
			const cells = parseRow(lines[i]);
			while (cells.length < headers.length) {
				cells.push('');
			}
			rows.push(cells.slice(0, headers.length));
			i++;

			// Over-tall table: bail to raw text rather than convert (see MAX_TABLE_ROWS).
			if (rows.length > MAX_TABLE_ROWS) {
				return null;
			}
		}
		return {
			headers,
			rows,
			endIndex: i
		};
	}

	// Defang literal table-structure BB tags ([table]/[tr]/[th]/[td] + closings) in a
	// cell's own content so a user-typed closer can't prematurely end the cell/row/
	// table on decode (Text.encode does not escape [ ]). A zero-width space after '['
	// breaks the tag match; the text still reads as the literal tag the user typed.
	function defangCellTableTags(text) {
		// Two passes: the bare regex defangs a literal [/td]; the second defangs an
		// ESCAPED structural tag (\\[/td] becomes ####MD_ESC_N####/td] because
		// EscapeHandler.protect runs before convertTables) — otherwise
		// escapeHandler.restore would later re-form a real [/td] and break the cell.
		return text.replace(/\[(\/?(?:table|tr|th|td))]/gi, (match, tag) => `[\u200B${tag}]`).replace(/(####MD_ESC_\d+####)(\/?(?:table|tr|th|td))]/gi, (match, esc, tag) => `${esc}\u200B${tag}]`);
	}
	function encodeCell(cell) {
		return defangCellTableTags(applyCellInlineRules(cell));
	}

	/**
	 * Build canonical Bitrix [table] BB-code from parsed GFM data. Header cells
	 * become [th], body cells [td]; each cell's inline Markdown (inline code, bold/
	 * italic/strikethrough, links, autolinks) is converted to BB inside the cell.
	 * Emitted on a single line so decodeNewLine never injects <br> between the
	 * structural tags, and so the whole block survives Text.encode (the tags carry
	 * no encodable chars).
	 *
	 * @param {{ headers: string[], rows: string[][] }} tableData
	 * @returns {string}
	 */
	function encodeTableBb(tableData) {
		const {
			headers,
			rows
		} = tableData;
		const head = `[tr]${headers.map(cell => `[th]${encodeCell(cell)}[/th]`).join('')}[/tr]`;
		const body = rows.map(cells => `[tr]${cells.map(cell => `[td]${encodeCell(cell)}[/td]`).join('')}[/tr]`).join('');
		return `[table]${head}${body}[/table]`;
	}

	/**
	 * - decode: a canonical [table] BB-code block (rendered later by
	 *   ParserTable.decodeTable as an HTML-grid).
	 * - simplify: a localized plain placeholder for preview surfaces.
	 *
	 * @param {{ headers: string[], rows: string[][] }} tableData
	 * @param {object} options
	 * @param {string} options.mode
	 * @returns {string}
	 */
	function formatTable(tableData, options) {
		if (options.mode === 'simplify') {
			return `[${main_core.Loc.getMessage('IM_PARSER_MARKDOWN_TABLE_PLACEHOLDER')}]`;
		}
		return encodeTableBb(tableData);
	}

	/**
	 * Find and convert GFM tables in text to canonical [table] BB-code.
	 *
	 * @param {string} text
	 * @param {object} [options]
	 * @param {string} [options.mode] - 'decode' or 'simplify'
	 * @returns {string}
	 */
	function convertTables(text, options = {}) {
		const {
			mode = 'decode'
		} = options;

		// A GFM table is impossible without a pipe — skip the per-line scan otherwise.
		if (!text.includes('|')) {
			return text;
		}
		const lines = text.split('\n');
		const result = [];
		let i = 0;
		while (i < lines.length) {
			const table = tryParseTable(lines, i);
			if (table) {
				result.push(formatTable({
					headers: table.headers,
					rows: table.rows
				}, {
					mode
				}));
				i = table.endIndex;
			} else {
				result.push(lines[i]);
				i++;
			}
		}
		return result.join('\n');
	}

	// Fast-path: skip the whole pipeline when the text carries no Markdown-significant shape.
	// Deliberately NOT triggered by a bare "[" or "=" — those appear in ordinary BB-code
	// ([USER=…], [URL=…], [DISK=…]) which has no Markdown to convert. Instead each real shape
	// is matched precisely: link/image via "](", setext-H1 via "={3}", list bullets/ordered
	// markers via the line-anchored alternation, rules/setext-H2/table separators via "-{3}".
	const MARKDOWN_TRIGGER = /[\t!#&*+<>\\_`|~]|\]\(|^[ \t]*(?:-|\d+\.)[ \t]|-{3}|={3}/m;
	class MarkdownConverter {
		/**
		 * Apply the base placeholder protectors (code -> mention -> escape). The single
		 * source of truth for the protect order shared by #convert and decodeInline.
		 *
		 * @param {string} text
		 * @param {{codeProtector: CodeProtector, mentionProtector: MentionProtector, escapeHandler: EscapeHandler}} protectors
		 * @param {{ looseFence?: boolean }} [options] Forwarded to CodeProtector.protect; looseFence is
		 *   inline-only (decodeInline) and captures multi-line "loose" fenced code as one [code] block.
		 * @returns {string}
		 */
		static #protectBase(text, protectors, options = {}) {
			const {
				codeProtector,
				mentionProtector,
				escapeHandler
			} = protectors;
			text = codeProtector.protect(text, options);
			text = mentionProtector.protect(text);
			text = escapeHandler.protect(text);
			return text;
		}

		/**
		 * Restore the base placeholder protectors in LIFO order (escape -> mention -> code).
		 * Mirror of #protectBase, shared by #convert and decodeInline.
		 *
		 * @param {string} text
		 * @param {{codeProtector: CodeProtector, mentionProtector: MentionProtector, escapeHandler: EscapeHandler}} protectors
		 * @returns {string}
		 */
		static #restoreBase(text, protectors) {
			const {
				codeProtector,
				mentionProtector,
				escapeHandler
			} = protectors;
			text = escapeHandler.restore(text);
			text = mentionProtector.restore(text);
			text = codeProtector.restore(text);
			return text;
		}

		/**
		 * Convert Markdown to BB-codes for full message rendering.
		 *
		 * @param {string} text
		 * @returns {string}
		 */
		static decode(text) {
			return MarkdownConverter.#convert(text, {
				mode: 'decode'
			});
		}

		/**
		 * Convert Markdown to BB-codes for preview/notification text.
		 *
		 * @param {string} text
		 * @returns {string}
		 */
		static simplify(text) {
			return MarkdownConverter.#convert(text, {
				mode: 'simplify'
			});
		}

		/**
		 * Convert Markdown to BB-codes keeping only inline markup: bold / italic /
		 * strikethrough, links, autolinks and inline code. Block constructs whose
		 * meaning comes from a leading line marker (lists, tables, headings, quotes,
		 * rules) are NOT produced - their markers stay literal text. Images are left
		 * out too (applyCellInlineRules), so a `![alt](url)` never grows into a block
		 * <img>.
		 *
		 * Code blocks are the deliberate exception: fenced (```/~~~, including the
		 * "loose" multi-line form whose closing fence sits mid-line), indented and
		 * legacy [code]...[/code] are INTENTIONALLY rendered as one block code box
		 * (bx-im-message-content-code), never as inline code. This mirrors the legacy
		 * [code] behavior and keeps a pasted multi-line block from fragmenting into
		 * orphaned backticks + per-line inline boxes. Single/double/triple-backtick
		 * single-line spans stay inline code as before.
		 *
		 * Used for list items / table cells / headings / quotes / rules content of the
		 * Copilot rich-answer constructor (Parser.decodeInlineText).
		 *
		 * @param {string} text
		 * @returns {string}
		 */
		static decodeInline(text) {
			if (!main_core.Type.isStringFilled(text)) {
				return '';
			}
			if (!MARKDOWN_TRIGGER.test(text)) {
				return text;
			}
			const nonce = createMarkdownNonce();
			const escapeHandler = new EscapeHandler();
			const codeProtector = new CodeProtector(nonce);
			const mentionProtector = new MentionProtector(nonce);
			const protectors = {
				codeProtector,
				mentionProtector,
				escapeHandler
			};
			text = MarkdownConverter.#protectBase(text, protectors, {
				looseFence: true
			});

			// Inline-only: no block rules and no table/list protectors. applyCellInlineRules
			// runs its own self-contained inline-code protect->restore (no images), so the
			// restored [icode] is in place BEFORE applyHtmlRules. This order is deliberate:
			// it reproduces the table-cell precedent (#convert -> convertTables ->
			// applyCellInlineRules, whose [icode] also reaches the global applyHtmlRules already
			// restored), NOT the full non-cell path (applyInlineRules defers restoreInlineCode
			// until AFTER applyHtmlRules). Consequence: whitelist HTML inside inline code (<b> etc.)
			// is converted by applyHtmlRules; non-whitelist HTML (<script>) is left inert and gets
			// escaped by the downstream Text.encode - no XSS either way.
			text = applyCellInlineRules(text);
			text = applyHtmlRules(text);
			text = MarkdownConverter.#restoreBase(text, protectors);
			return text;
		}

		/**
		 * @param {string} text
		 * @param {object} tableOptions
		 * @returns {string}
		 */
		static #convert(text, tableOptions) {
			if (!main_core.Type.isStringFilled(text)) {
				return '';
			}
			if (!MARKDOWN_TRIGGER.test(text)) {
				return text;
			}

			// One per-render nonce shared by the placeholder protectors so a sender cannot type a
			// literal placeholder copy and have a stored block replicated into it on restore
			// (amplification DoS; see utils/nonce.js). convertTables/convertLists run their own
			// self-contained cell protect→restore (applyCellInlineRules) with their own nonce.
			const nonce = createMarkdownNonce();
			const escapeHandler = new EscapeHandler();
			const codeProtector = new CodeProtector(nonce);
			const mentionProtector = new MentionProtector(nonce);
			const tableMarkerProtector = new TableMarkerProtector(nonce);
			const listTagProtector = new ListTagProtector();
			const protectors = {
				codeProtector,
				mentionProtector,
				escapeHandler
			};
			text = MarkdownConverter.#protectBase(text, protectors);
			text = convertTables(text, tableOptions);
			text = convertLists(text, tableOptions);
			text = tableMarkerProtector.protect(text);
			text = listTagProtector.protect(text);
			text = applyBlockRules(text);
			const inlineCodeBlocks = [];
			text = applyInlineRules(text, inlineCodeBlocks, nonce);
			text = applyHtmlRules(text);
			text = restoreInlineCode(text, inlineCodeBlocks, nonce);
			text = listTagProtector.restore(text);
			text = tableMarkerProtector.restore(text);
			text = MarkdownConverter.#restoreBase(text, protectors);
			return text;
		}
	}

	const settings = main_core.Extension.getSettings('im.v2.lib.parser');
	const v2 = settings.get('v2');

	// Prefer the namespace the v2 flag selects, but fall back to whichever is actually present, so
	// the extension does not throw if it is evaluated before the selected namespace is set up.
	const resolveNamespace = () => {
		const messenger = BX.Messenger ?? {};
		return (v2 ? messenger.v2 : messenger.Embedding) ?? messenger.v2 ?? messenger.Embedding ?? {};
	};
	const CoreProxy = {
		getCore() {
			return resolveNamespace().Application?.Core;
		},
		getUtils() {
			return resolveNamespace().Lib?.Utils;
		},
		getLogger() {
			return resolveNamespace().Lib?.Logger;
		},
		getConst() {
			return resolveNamespace().Const ?? {};
		},
		getSmileManager() {
			return resolveNamespace().Lib?.SmileManager;
		},
		getBigSmileOption() {
			if (v2) {
				const settingName = BX.Messenger.v2.Const.Settings.message.bigSmiles;
				return CoreProxy.getCore().getStore().getters['application/settings/get'](settingName);
			}
			return CoreProxy.getCore().getStore().getters['application/getOption']('bigSmileEnable');
		},
		// Read the Markdown feature flag straight from the Core application data the
		// parser already reaches for everything else, instead of pulling the heavier
		// im.v2.lib.feature extension into every parser consumer just for this boolean
		// (FeatureManager.isFeatureAvailable resolves the same featureOptions value).
		isMarkdownFeatureEnabled() {
			const applicationData = CoreProxy.getCore().getApplicationData?.() ?? {};
			const {
				featureOptions = {}
			} = applicationData;
			return featureOptions.isMarkdownAvailable ?? false;
		}
	};
	const getCore = () => CoreProxy.getCore();
	const getUtils = () => CoreProxy.getUtils();
	const getLogger = () => CoreProxy.getLogger();
	const getConst = () => CoreProxy.getConst();
	const getSmileManager = () => CoreProxy.getSmileManager();
	const getBigSmileOption = () => CoreProxy.getBigSmileOption();
	const isMarkdownFeatureEnabled = () => CoreProxy.isMarkdownFeatureEnabled();

	const RECURSIVE_LIMIT = 10;
	const ParserUtils = {
		recursiveReplace(text, pattern, replacement) {
			if (!main_core.Type.isStringFilled(text)) {
				return text;
			}
			let count = 0;
			let deep = true;
			do {
				deep = false;
				count++;
				text = text.replace(pattern, (...params) => {
					deep = true;
					return replacement(...params);
				});
			} while (deep && count <= RECURSIVE_LIMIT);
			return text;
		},
		getFinalContextTag(contextTag) {
			const match = contextTag.match(/(chat\d+|(\d+):(\d+))\/(\d+)/i);
			if (!match) {
				return '';
			}
			let [, dialogId, user1, user2, messageId] = match;
			if (dialogId.toString().startsWith('chat')) {
				if (dialogId === 'chat0') {
					return '';
				}
				return contextTag;
			}
			user1 = Number.parseInt(user1, 10);
			user2 = Number.parseInt(user2, 10);
			if (getCore().getUserId() === user1) {
				return `${user2}/${messageId}`;
			}
			if (getCore().getUserId() === user2) {
				return `${user1}/${messageId}`;
			}
			return '';
		},
		getDialogIdFromFinalContextTag(finalContextTag) {
			if (!/^(chat\d+|\d+)\/\d+$/.test(finalContextTag)) {
				return '';
			}
			const [dialogId] = finalContextTag.split('/');
			return dialogId;
		},
		getDialogIdByChatId(chatId) {
			const dialog = getCore().getStore().getters['chats/getByChatId'](chatId);
			if (!dialog) {
				return '';
			}
			return dialog.dialogId;
		}
	};

	const ParserFont = {
		decode(text) {
			text = ParserUtils.recursiveReplace(text, /\[b]([^[]*(?:\[(?!b]|\/b])[^[]*)*)\[\/b]/gi, (whole, text) => '<b>' + text + '</b>');
			text = ParserUtils.recursiveReplace(text, /\[u]([^[]*(?:\[(?!u]|\/u])[^[]*)*)\[\/u]/gi, (whole, text) => '<u>' + text + '</u>');
			text = ParserUtils.recursiveReplace(text, /\[i]([^[]*(?:\[(?!i]|\/i])[^[]*)*)\[\/i]/gi, (whole, text) => '<i>' + text + '</i>');
			text = ParserUtils.recursiveReplace(text, /\[s]([^[]*(?:\[(?!s]|\/s])[^[]*)*)\[\/s]/gi, (whole, text) => '<s>' + text + '</s>');
			text = ParserUtils.recursiveReplace(text, /\[size=(\d+)(?:pt|px)?](.*?)\[\/size]/gis, (whole, number, text) => {
				number = Number.parseInt(number, 10);
				if (number <= 8) {
					number = 8;
				} else if (number >= 30) {
					number = 30;
				}
				return main_core.Dom.create({
					tag: 'span',
					style: {
						fontSize: `${number}px`
					},
					html: text
				}).outerHTML;
			});
			text = ParserUtils.recursiveReplace(text, /\[color=#([0-9a-f]{3}|[0-9a-f]{6})](.*?)\[\/color]/gis, (whole, hex, text) => {
				return main_core.Dom.create({
					tag: 'span',
					style: {
						color: '#' + hex
					},
					html: text
				}).outerHTML;
			});
			return text;
		},
		purify(text, removeStrike = true) {
			if (removeStrike) {
				text = ParserUtils.recursiveReplace(text, /\[s]([^[]*(?:\[(?!s]|\/s])[^[]*)*)\[\/s]/gi, () => ' ');
			}
			text = ParserUtils.recursiveReplace(text, /\[b]([^[]*(?:\[(?!b]|\/b])[^[]*)*)\[\/b]/gi, (whole, text) => text);
			text = ParserUtils.recursiveReplace(text, /\[u]([^[]*(?:\[(?!u]|\/u])[^[]*)*)\[\/u]/gi, (whole, text) => text);
			text = ParserUtils.recursiveReplace(text, /\[i]([^[]*(?:\[(?!i]|\/i])[^[]*)*)\[\/i]/gi, (whole, text) => text);
			text = ParserUtils.recursiveReplace(text, /\[s]([^[]*(?:\[(?!s]|\/s])[^[]*)*)\[\/s]/gi, (whole, text) => text);
			text = ParserUtils.recursiveReplace(text, /\[size=(\d+)(?:pt|px)?](.*?)\[\/size]/gis, (whole, number, text) => text);
			text = ParserUtils.recursiveReplace(text, /\[color=#([0-9a-f]{3}|[0-9a-f]{6})](.*?)\[\/color]/gis, (whole, hex, text) => text);
			return text;
		}
	};

	const CLASS_HEADING = 'bx-im-message-heading';
	const CLASS_RULE = 'bx-im-message-hr';

	// Canonical block markers emitted by the Markdown block rules (markdown/rules/block-rules):
	// H1/H2 headings ([h1]/[h2], ATX and setext) and horizontal rules ([hr]). decodeBlocks runs
	// late in the decode chain — after Text.encode and the font/url/etc. decoders — so a heading's
	// inline content (bold, links, …) is already HTML here; we only wrap it in a block element
	// that CSS styles (parser.css). A heading and a rule are block elements with their own vertical
	// margins, so every adjacent <br> is swallowed — the spacing comes from the margins, not breaks.
	const HEADING_PATTERN = /(?:<br \/>)*\[(h[12])]([\s\S]*?)\[\/\1](?:<br \/>)*/gi;
	const RULE_PATTERN = /(?:<br \/>)*\[hr](?:<br \/>)*/gi;

	// Preview/notification/quote surfaces reach purify with the bare block markers ([h1]…[/h1],
	// [hr]) — no surrounding <br> (those surfaces keep '\n', they don't run the <br> decoder).
	const HEADING_PURIFY_PATTERN = /\[(h[12])]([\s\S]*?)\[\/\1]/gi;
	const RULE_PURIFY_PATTERN = /\[hr]/gi;
	const ParserHeading = {
		/**
		 * Render canonical [h1]/[h2] block headings and [hr] horizontal rules (produced by the
		 * Markdown converter) into styled block elements. Single-line markers, so they survive
		 * Text.encode and the line/newline decoders untouched.
		 *
		 * @param {string} text
		 * @returns {string}
		 */
		decodeHeading(text) {
			if (!/\[(?:h[12]|hr)]/i.test(text)) {
				return text;
			}
			let result = text.replace(HEADING_PATTERN, (whole, tag, content, offset, full) => {
				const level = tag.toLowerCase();

				// Only the very first content of a message gets no top margin. A CSS :first-child
				// would be wrong here: a leading text node is not an element sibling, so a heading
				// that follows plain text would still match :first-child and lose its top margin.
				const isFirst = full.slice(0, offset).trim() === '';
				const firstClass = isFirst ? ` ${CLASS_HEADING}--first` : '';
				return `<div class="${CLASS_HEADING} ${CLASS_HEADING}--${level}${firstClass}">${content.trim()}</div>`;
			});
			result = result.replace(RULE_PATTERN, () => `<hr class="${CLASS_RULE}">`);
			return result;
		},
		/**
		 * Strip the block markers to plain text for preview/notification/quote surfaces (mirrors
		 * ParserFont.purify). Nothing else in the purify chain removes [h1]/[h2]/[hr], so without
		 * this they leak as raw BB-code. The [h1]/[h2] wrapper is unwrapped to its inner text (any
		 * inner inline BB like [b] is stripped afterwards by ParserFont.purify, so call this
		 * BEFORE it); [hr] becomes a single space so adjacent words don't glue together.
		 *
		 * @param {string} text
		 * @returns {string}
		 */
		purify(text) {
			if (!/\[(?:h[12]|hr)]/i.test(text)) {
				return text;
			}
			let result = text.replace(HEADING_PURIFY_PATTERN, (whole, tag, content) => content.trim());
			result = result.replace(RULE_PURIFY_PATTERN, ' ');
			return result;
		}
	};

	const ImageBbCodeSizes = Object.freeze({
		small: 'small',
		medium: 'medium',
		large: 'large'
	});
	const imageBbCodeSizesFragment = Object.values(ImageBbCodeSizes).join('|');
	// Allow extra attributes after size= (e.g. the Markdown `alt=` token) so the preview
	// placeholder also matches `[img size=medium alt=…]…[/img]` instead of leaking raw BB-code.
	const purifyImageTagRegex = new RegExp(`\\[img\\s+size=(${imageBbCodeSizesFragment})(?:\\s+[a-z]+=[^\\]\\s]+)*]([\\s\\S]*?)\\[\\/img]`, 'gi');
	const ParserImage = {
		decodeLink(text) {
			return text.replaceAll(/>((https|http):\/\/(\S+)\.(jpg|jpeg|png|gif|webp)(\?\S+[^<])?)<\/a>/gi, (whole, urlParsed) => {
				const url = main_core.Text.decode(urlParsed);
				if (!/(\.(jpg|jpeg|png|gif|webp)\?|\.(jpg|jpeg|png|gif|webp)$)/i.test(url) || url.toLowerCase().indexOf('/docs/pub/') > 0 || url.toLowerCase().indexOf('logout=yes') > 0) {
					return whole;
				}
				if (!getUtils().text.checkUrl(url)) {
					return whole;
				}
				const result = main_core.Dom.create({
					tag: 'span',
					attrs: {
						className: 'bx-im-message-image'
					},
					children: [main_core.Dom.create({
						tag: 'img',
						attrs: {
							className: 'bx-im-message-image-source',
							src: url
						},
						events: {
							error() {
								ParserImage.hideErrorImage(this);
							}
						}
					})]
				}).outerHTML;
				return `>${result}</a>`;
			});
		},
		purifyLink(text) {
			return text.replaceAll(/(.)?(https?:\/\/\S+)/gi, (whole, symbolBeforeUrl, url) => {
				if (!canPurifyLink(symbolBeforeUrl, url)) {
					return whole;
				}
				const firstSymbol = symbolBeforeUrl || '';
				return `${firstSymbol}${this.getImagePrefix()}`;
			});
		},
		// eslint-disable-next-line max-lines-per-function,sonarjs/cognitive-complexity
		decodeIcon(text) {
			let textElementSize = 0;
			const enableBigSmile = getBigSmileOption();
			if (enableBigSmile) {
				textElementSize = text.replaceAll(/\[icon=([^\]]*)]/gi, '').trim().length;
			}
			return text.replaceAll(/\[icon=([^\]]*)]/gi, whole => {
				let url = whole.match(/icon=(\S+[^\s!"'),.;>?\]])/i);
				if (url && url[1]) {
					url = url[1];
				} else {
					return '';
				}
				if (!getUtils().text.checkUrl(url)) {
					return whole;
				}
				const attrs = {
					src: url,
					border: 0
				};
				const size = whole.match(/size=(\d+)/i);
				if (size && size[1]) {
					attrs.width = size[1];
					attrs.height = size[1];
				} else {
					const width = whole.match(/width=(\d+)/i);
					if (width && width[1]) {
						attrs.width = width[1];
					}
					const height = whole.match(/height=(\d+)/i);
					if (height && height[1]) {
						attrs.height = height[1];
					}
					if (attrs.width && !attrs.height) {
						attrs.height = attrs.width;
					} else if (attrs.height && !attrs.width) {
						attrs.width = attrs.height;
					} else if (attrs.height && attrs.width) ; else {
						attrs.width = 20;
						attrs.height = 20;
					}
				}
				attrs.width = attrs.width > 100 ? 100 : attrs.width;
				attrs.height = attrs.height > 100 ? 100 : attrs.height;
				if (enableBigSmile && textElementSize === 0 && attrs.width === attrs.height && attrs.width === 20) {
					attrs.width = 40;
					attrs.height = 40;
				}
				let title = whole.match(/title=(.*[^\s\]])/i);
				if (title && title[1]) {
					title = title[1];
					if (title.includes('width=')) {
						title = title.slice(0, Math.max(0, title.indexOf('width=')));
					}
					if (title.includes('height=')) {
						title = title.slice(0, Math.max(0, title.indexOf('height=')));
					}
					if (title.includes('size=')) {
						title = title.slice(0, Math.max(0, title.indexOf('size=')));
					}
					if (title) {
						attrs.title = main_core.Text.decode(title).trim();
						attrs.alt = attrs.title;
					}
				}
				return main_core.Dom.create({
					tag: 'img',
					attrs: {
						className: 'bx-smile bx-icon',
						...attrs
					}
				}).outerHTML;
			});
		},
		purifyIcon(text) {
			return text.replaceAll(/\[icon=([^\]]*)]/gi, whole => {
				let title = whole.match(/title=(.*[^\s\]])/i);
				if (title && title[1]) {
					title = title[1];
					if (title.includes('width=')) {
						title = title.slice(0, Math.max(0, title.indexOf('width=')));
					}
					if (title.includes('height=')) {
						title = title.slice(0, Math.max(0, title.indexOf('height=')));
					}
					if (title.includes('size=')) {
						title = title.slice(0, Math.max(0, title.indexOf('size=')));
					}
					if (title) {
						title = `(${title.trim()})`;
					}
				} else {
					title = `(${main_core.Loc.getMessage('IM_PARSER_IMAGE_ICON')})`;
				}
				return title;
			});
		},
		purifyImageBbCode(text) {
			return text.replaceAll(purifyImageTagRegex, () => this.getImagePrefix());
		},
		hideErrorImage(element) {
			const result = element;
			if (result && result.parentNode) {
				result.parentNode.innerHTML = `<a href="${encodeURI(element.src)}" target="_blank">${element.src}</a>`;
			}
		},
		decodeImageBbCode(text, {
			contextDialogId = ''
		} = {}) {
			if (!main_core.Type.isStringFilled(text)) {
				return '';
			}
			return text.replaceAll(/\[img((?:\s+[a-z]+=[^\]\s]+)*)]\s*(?:\[url])?([\S\s]*?)(?:\[\/url])?\s*\[\/img]/gi, (whole, attrs, urlParsed) => {
				const url = main_core.Text.decode(urlParsed);
				const size = parseImageAttribute(attrs, 'size');
				const alt = decodeAltToken(parseImageAttribute(attrs, 'alt'));
				const isValidSize = size && Object.values(ImageBbCodeSizes).includes(size.toLowerCase());
				const isInvalidUrl = ['/docs/pub/', 'logout=yes'].some(part => url.toLowerCase().includes(part));
				const isSafeUrl = getUtils().text.checkUrl(url);
				const isImage = getUtils().text.isUrlImageLike(url);
				const hasNestedItems = hasNestedImgBbCodes(url);
				if (!isValidSize || isInvalidUrl || !isSafeUrl || !isImage || hasNestedItems) {
					return whole.replace(/\[img((?:\s+[a-z]+=[^\]\s]+)*)]/i, (imgTag, imgAttrs) => {
						return `[img${imgAttrs.replace(/\s+alt=[^\]\s]+/i, '')}]`;
					}).replaceAll(/\[url]([\S\s]*?)\[\/url]/gi, '$1');
				}
				const classModifier = `--${size.toLowerCase()}`;
				const {
					file
				} = getUtils();
				const dialog = getCore().getStore().getters['chats/get'](contextDialogId, true);
				const viewerGroupBy = dialog.chatId;
				const viewerAttributes = file.getViewerDataForImageSrc({
					src: url,
					viewerGroupBy
				});
				const layout = main_core.Tag.render`
					<a class='bx-im-message-image ${classModifier}'>
						<img class='bx-im-message-image-source' alt='' />
					</a>
				`;
				main_core.Dom.attr(layout.firstChild, {
					src: url,
					alt,
					...viewerAttributes
				});
				return layout.outerHTML;
			});
		},
		getImagePrefix() {
			return `[${main_core.Loc.getMessage('IM_PARSER_ICON_TYPE_IMAGE')}]`;
		}
	};
	function isLinkFromDisk(url) {
		return url.toLowerCase().indexOf('/docs/pub/') > 0;
	}
	function isLogoutLink(url) {
		return url.toLowerCase().indexOf('logout=yes') > 0;
	}
	function hasImageFileExtension(url) {
		const [urlWithoutQueryString] = url.split('?');
		return /\.(jpg|jpeg|png|gif|webp)$/i.test(urlWithoutQueryString);
	}
	function hasLeadingTextBeforeUrl(symbolBeforeUrl) {
		const AllowedSymbolsBeforeImageUrl = new Set(['>', ']', ' ']);
		return main_core.Type.isStringFilled(symbolBeforeUrl) && !AllowedSymbolsBeforeImageUrl.has(symbolBeforeUrl);
	}
	function canPurifyLink(symbolBeforeUrl, url) {
		return hasImageFileExtension(url) && !isLinkFromDisk(url) && !isLogoutLink(url) && !hasLeadingTextBeforeUrl(symbolBeforeUrl);
	}
	function hasNestedImgBbCodes(url) {
		return /\[img/i.test(url.trim());
	}

	/**
	 * Extract a single `name=value` attribute from the `[img ...]` attribute string.
	 * Values are whitespace-delimited (the Markdown converter emits inert tokens),
	 * so a value never contains spaces or `]`.
	 *
	 * @param {string} attrs - raw attribute string captured between `[img` and `]`
	 * @param {string} name
	 * @return {string} attribute value, or '' when absent
	 */
	function parseImageAttribute(attrs, name) {
		if (!main_core.Type.isStringFilled(attrs)) {
			return '';
		}
		const match = attrs.match(new RegExp(`(?:^|\\s)${name}=([^\\]\\s]+)`, 'i'));
		return match ? match[1] : '';
	}

	/**
	 * Decode the inert alt token emitted by the Markdown converter
	 * (`toMarkdownInertToken` from markdown/utils/inert-token.js, called in
	 * `applyImage`) back to the original alt
	 * text. The token alphabet is [A-Za-z0-9.%-], so it reaches here untouched by
	 * Text.encode. A malformed token (manual/legacy [img alt=...]) is returned as-is.
	 *
	 * @param {string} token
	 * @return {string}
	 */
	function decodeAltToken(token) {
		if (token === '') {
			return '';
		}
		try {
			return decodeURIComponent(token);
		} catch (error) {
			return token;
		}
	}

	const ParserDisk = {
		decode(text) {
			const diskText = `[${main_core.Loc.getMessage('IM_PARSER_ICON_TYPE_FILE')}]`;
			return text.replaceAll(/\[disk=\d+]/gi, diskText);
		},
		purify(text) {
			return this.decode(text);
		}
	};

	const ParserDate = {
		decode(text) {
			return handleTimestampCode(text);
		},
		purify(text) {
			return handleTimestampCode(text);
		}
	};
	const handleTimestampCode = text => {
		// [timestamp=1645844720 format=SHORT_TIME_FORMAT]
		const regex = /\[timestamp=(?<timestamp>\d+)\s+format=(?<format>[_a-z]+)]/gi;
		return text.replaceAll(regex, (initialText, ...args) => {
			const {
				timestamp,
				format
			} = args.at(-1);
			const DateFormatter = main_core.Reflection.getClass('BX.Messenger.v2.Lib.DateFormatter');
			const DateFormat = main_core.Reflection.getClass('BX.Messenger.v2.Lib.DateFormat');
			const DateCode = main_core.Reflection.getClass('BX.Messenger.v2.Lib.DateCode');
			if (!DateFormatter) {
				return initialText;
			}
			const timestampInMilliseconds = Number(timestamp) * 1000;
			const date = new Date(timestampInMilliseconds);
			const preparedFormat = main_core.Text.toCamelCase(format);
			const availableFormats = Object.keys(DateFormat);
			if (!availableFormats.includes(preparedFormat)) {
				return initialText;
			}
			return DateFormatter.formatByCode(date, DateCode[preparedFormat]);
		});
	};

	const {
		EventType: EventType$2
	} = getConst();
	const ActionType = {
		put: 'put',
		send: 'send'
	};
	const ParserAction = {
		decodePut(text) {
			text = text.replace(/\[PUT(?:=(?:.+?))?](?:.+?)?\[\/PUT]/gi, match => {
				return match.replace(/\[PUT(?:=(.+))?](.+?)?\[\/PUT]/gi, (whole, command, text) => {
					text = text ? text : command;
					command = command ? command : text;
					text = main_core.Text.decode(text);
					command = main_core.Text.decode(command).replace('<br />', '\n');
					if (!text.trim()) {
						return '';
					}
					text = text.replace(/<(\w+)[^>]*>(.*?)<\/\1>/i, "$2", text);
					text = text.replace(/\[(\w+)[^\]]*](.*?)\[\/\1]/i, "$2", text);
					return this._getHtmlForAction('put', text, command);
				});
			});
			return text;
		},
		purifyPut(text) {
			text = text.replace(/\[PUT(?:=(?:.+?))?](?:.+?)?\[\/PUT]/gi, match => {
				return match.replace(/\[PUT(?:=(.+))?](.+?)?\[\/PUT]/gi, (whole, command, text) => {
					return text ? text : command;
				});
			});
			return text;
		},
		decodeSend(text) {
			text = text.replace(/\[SEND(?:=(?:.+?))?](?:.+?)?\[\/SEND]/gi, match => {
				return match.replace(/\[SEND(?:=(.+))?](.+?)?\[\/SEND]/gi, (whole, command, text) => {
					text = text ? text : command;
					command = command ? command : text;
					text = main_core.Text.decode(text);
					command = main_core.Text.decode(command).replace('<br />', '\n');
					if (!text.trim()) {
						return '';
					}
					text = text.replace(/<(\w+)[^>]*>(.*?)<\\1>/i, "$2", text);
					text = text.replace(/\[(\w+)[^\]]*](.*?)\[\/\1]/i, "$2", text);
					command = command.split('####REPLACEMENT_PUT_').join('####REPLACEMENT_SP_');
					return this._getHtmlForAction('send', text, command);
				});
			});
			return text;
		},
		purifySend(text) {
			text = text.replace(/\[SEND(?:=(?:.+?))?](?:.+?)?\[\/SEND]/gi, match => {
				return match.replace(/\[SEND(?:=(.+))?](.+?)?\[\/SEND]/gi, (whole, command, text) => {
					return text ? text : command;
				});
			});
			return text;
		},
		_getHtmlForAction(method, text, data) {
			return main_core.Dom.create({
				tag: 'span',
				attrs: {
					className: 'bx-im-message-command-wrap'
				},
				children: [main_core.Dom.create({
					tag: 'span',
					attrs: {
						className: 'bx-im-message-command',
						'data-entity': method
					},
					text
				}), main_core.Dom.create({
					tag: 'span',
					attrs: {
						className: 'bx-im-message-command-data'
					},
					text: data
				})]
			}).outerHTML;
		},
		executeClickEvent(event, context) {
			if (!main_core.Dom.hasClass(event.target, 'bx-im-message-command')) {
				return;
			}
			const {
				emitter
			} = context;
			const element = event.target;
			const messageId = getMessageIdForClickElement(element);
			const dialogId = getDialogIdByMessageId(messageId) ?? '';
			if (element.dataset.entity === ActionType.put) {
				const {
					innerText: textToInsert = ''
				} = element.parentElement.querySelector('.bx-im-message-command-data');
				if (!textToInsert) {
					return;
				}
				emitter.emit(EventType$2.textarea.insertText, {
					text: textToInsert,
					dialogId
				});
			} else if (element.dataset.entity === ActionType.send) {
				const {
					innerText: textToSend = ''
				} = element.parentElement.querySelector('.bx-im-message-command-data');
				if (!textToSend) {
					return;
				}
				emitter.emit(EventType$2.textarea.sendMessage, {
					text: textToSend,
					dialogId
				});
			}
		}
	};
	const getMessageIdForClickElement = element => {
		const messageElement = element.closest('.bx-im-message-base__wrap');
		if (!messageElement || !messageElement.dataset.id) {
			return null;
		}
		return messageElement.dataset.id;
	};
	const getDialogIdByMessageId = messageId => {
		const message = getCore().getStore().getters['messages/getById'](messageId);
		if (!message) {
			return null;
		}
		const dialog = getCore().getStore().getters['chats/getByChatId'](message.chatId);
		if (!dialog) {
			return null;
		}
		return dialog.dialogId;
	};

	const ParserSlashCommand = {
		decode(text) {
			if (text.startsWith('/me')) {
				return `[i]${text.substr(4)}[/i]`;
			}
			if (text.startsWith('/loud')) {
				return `[size=20]${text.substr(6)}[/size]`;
			}
			return text;
		},
		purify(text) {
			if (text.startsWith('/me')) {
				return text.substr(4);
			}
			if (text.startsWith('/loud')) {
				return text.substr(6);
			}
			return text;
		}
	};

	const {
		MessageMentionType: MessageMentionType$2
	} = getConst();
	const ParserCall = {
		decode(text) {
			let result = text;
			result = result.replaceAll(/\[call(?:=([\d #()+./-]+))?](.+?)\[\/call]/gi, (whole, number, text) => {
				if (!text) {
					return whole;
				}
				let destination = '';
				if (number) {
					destination = number;
				} else if (getUtils.call.isNumber(text)) {
					destination = text;
				} else {
					return whole;
				}
				return main_core.Dom.create({
					tag: 'span',
					attrs: {
						className: 'bx-im-mention',
						'data-type': MessageMentionType$2.call,
						'data-destination': destination
					},
					text: main_core.Text.decode(text)
				}).outerHTML;
			});
			result = result.replaceAll(/\[pch=(\d+)](.*?)\[\/pch]/gi, (whole, historyId, text) => '');
			return result;
		},
		purify(text) {
			let result = text;
			result = result.replaceAll(/\[call(?:=([\d #()+./-]+))?](.+?)\[\/call]/gi, (whole, number, text) => {
				return text || number;
			});
			result = result.replaceAll(/\[pch=(\d+)](.*?)\[\/pch]/gi, (whole, historyId, text) => text);
			return result;
		}
	};

	const ParserCommon = {
		decodeNewLine(text) {
			text = text.replace(/\n/gi, '<br />');
			text = text.replace(/\[BR]/gi, '<br />');
			return text;
		},
		purifyNewLine(text, replaceSymbol = ' ') {
			if (replaceSymbol !== "\n") {
				text = text.replace(/\n/gi, replaceSymbol);
			}
			text = text.replace(/\[BR]/gi, replaceSymbol);
			return text;
		},
		purifyBreakLine(text, replaceLetter = ' ') {
			text = text.replace(/<br><br \/>/gi, '<br />');
			text = text.replace(/<br \/><br>/gi, '<br />');
			text = text.replace(/\[BR]/gi, '<br />');
			text = text.replace(/<br \/>/gi, replaceLetter);

			// text = text.replace(/<\/?[^>]+>/gi, '');

			return text;
		},
		decodeTabulation(text) {
			text = text.replace(/( ){4}/gi, '\t');
			text = text.replace(/\t/gi, '&nbsp;&nbsp;&nbsp;&nbsp;');
			return text;
		},
		purifyTabulation(text) {
			text = text.replace(/&nbsp;&nbsp;&nbsp;&nbsp;/gi, " ");
			return text;
		},
		purifyNbsp(text) {
			text = text.replace(/&nbsp;/gi, " ");
			return text;
		},
		removeDuplicateTags(text) {
			if (text.substr(-6) === '<br />') {
				text = text.substr(0, text.length - 6);
			}
			text = text.replace(/<br><br \/>/gi, '<br />');
			text = text.replace(/<br \/><br>/gi, '<br />');
			return text;
		}
	};

	const ParserLines = {
		decode(text) {
			let result = text;
			result = result.replaceAll(/\[like]/gi, `<span class="bx-im-lines-vote-like" title="${main_core.Loc.getMessage('IM_PARSER_LINES_RATING_LIKE')}"></span>`);
			result = result.replaceAll(/\[dislike]/gi, `<span class="bx-im-lines-vote-dislike" title="${main_core.Loc.getMessage('IM_PARSER_LINES_RATING_DISLIKE')}"></span>`);
			result = result.replaceAll(/\[rating=([1-5])]/gi, (whole, rating) => {
				const tag = main_core.Tag.render`
				<span class="bx-im-lines-rating" title="${main_core.Loc.getMessage('IM_PARSER_LINES_RATING')} - ${rating}">
					<span class="bx-im-lines-rating-selected" style="width: ${rating * 20}%"></span>
				</span>
			`;
				return tag.outerHTML;
			});
			return result;
		},
		purify(text) {
			let result = text;
			result = result.replaceAll(/\[like]/gi, main_core.Loc.getMessage('IM_PARSER_LINES_RATING_LIKE'));
			result = result.replaceAll(/\[dislike]/gi, main_core.Loc.getMessage('IM_PARSER_LINES_RATING_DISLIKE'));
			result = result.replaceAll(/\[rating=([1-5])]/gi, () => {
				return `[${main_core.Loc.getMessage('IM_PARSER_LINES_RATING')}] `;
			});
			return result;
		}
	};

	const {
		EventType: EventType$1,
		MessageMentionType: MessageMentionType$1,
		SidebarDetailBlock,
		SpecialMentionDialogId: SpecialMentionDialogId$1,
		ChatType
	} = getConst();
	const MENTION_CSS_CLASS = 'bx-im-mention';
	class MentionHandler {
		#handlersByMentionType = {
			[MessageMentionType$1.user]: dataset => this.#handleChat(dataset),
			[MessageMentionType$1.chat]: dataset => this.#handleChat(dataset),
			[MessageMentionType$1.lines]: dataset => this.#handleLines(dataset),
			[MessageMentionType$1.context]: dataset => this.#handleContext(dataset),
			[MessageMentionType$1.call]: dataset => this.#handleCall(dataset)
		};
		#handlersByDialogId = {
			[this.#getCopilotBotDialogId()]: () => this.#handleCopilot(),
			[SpecialMentionDialogId$1.allParticipants]: () => this.#handleAllParticipants()
		};
		constructor(context) {
			const {
				emitter
			} = context;
			this.emitter = emitter;
		}
		handleClick(event) {
			if (!main_core.Dom.hasClass(event.target, MENTION_CSS_CLASS)) {
				return;
			}
			const dataset = event.target.dataset;
			const handlerByDialogId = this.#handlersByDialogId[dataset.value];
			if (handlerByDialogId) {
				handlerByDialogId();
				return;
			}
			const handlerByMentionType = this.#handlersByMentionType[dataset.type];
			if (!handlerByMentionType) {
				return;
			}
			handlerByMentionType(dataset);
		}
		#getCopilotBotDialogId() {
			return getCore().getStore().getters['users/bots/getCopilotBotDialogId'];
		}
		#handleCopilot() {
			void im_public.Messenger.openCopilot();
		}
		#handleChat(dataset) {
			void im_public.Messenger.openChat(dataset.value);
		}
		#handleLines(dataset) {
			const dialogId = dataset.value;
			if (getUtils().dialog.isLinesHistoryId(dialogId)) {
				void im_public.Messenger.openLinesHistory(dialogId);
			} else if (getUtils().dialog.isLinesExternalId(dialogId)) {
				void im_public.Messenger.openLines(dialogId);
			}
		}
		#handleContext(dataset) {
			const messageId = Number.parseInt(dataset.messageId, 10);
			this.emitter.emit(EventType$1.dialog.goToMessageContext, {
				messageId,
				dialogId: dataset.dialogId
			});
		}
		#handleCall(dataset) {
			const destination = dataset.destination;
			if (getUtils().call.isNumber(destination)) {
				void im_public.Messenger.startPhoneCall(destination);
			}
		}
		#handleAllParticipants() {
			const {
				entityId
			} = getCore().getStore().getters['application/getLayout'];
			const {
				type
			} = getCore().getStore().getters['chats/get'](entityId, true);
			if (!entityId) {
				return;
			}
			if (type === ChatType.user) {
				return;
			}
			this.emitter.emit(EventType$1.sidebar.open, {
				panel: SidebarDetailBlock.members,
				dialogId: entityId
			});
		}
	}

	const {
		UserType,
		MessageMentionType,
		SpecialMentionDialogId = {}
	} = getConst();
	const SpecialMentionHandlers = {
		[SpecialMentionDialogId.allParticipants]: userName => ParserMention.renderAllParticipantsMention(userName)
	};
	const MENTION_BASE_CLASS = 'bx-im-mention';
	const MentionModifier = {
		highlight: '--highlight',
		extranet: '--extranet'
	};
	const ParserMention = {
		decode(text) {
			text = text.replace(/\[USER=(all|[0-9]+)( REPLACE)?](.*?)\[\/USER]/gi, (whole, userId, replace, userName) => {
				if (SpecialMentionHandlers[userId]) {
					return SpecialMentionHandlers[userId](userName);
				}
				userId = Number.parseInt(userId, 10);
				if (!main_core.Type.isNumber(userId) || userId === 0) {
					return userName;
				}
				const user = getCore().getStore().getters['users/get'](userId);
				if (replace || !userName) {
					if (user) {
						userName = user.name;
					}
				} else {
					userName = main_core.Text.decode(userName);
				}
				if (!userName) {
					userName = `User ${userId}`;
				}
				let className = MENTION_BASE_CLASS;
				if (getCore().getUserId() === userId) {
					className += ` ${MentionModifier.highlight}`;
				}
				if (user && user.type === UserType.extranet) {
					className += ` ${MentionModifier.extranet}`;
				}
				return main_core.Dom.create({
					tag: 'span',
					attrs: {
						className,
						'data-type': MessageMentionType.user,
						'data-value': userId
					},
					text: userName
				}).outerHTML;
			});
			text = text.replace(/\[chat=(imol\|)?(\d+)](.*?)\[\/chat]/gi, (whole, isLines, chatId, chatNameParsed) => {
				if (chatId === 0) {
					return chatNameParsed;
				}
				let chatName = chatNameParsed;
				if (chatName) {
					chatName = main_core.Text.decode(chatName);
				} else {
					const dialog = getCore().getStore().getters['chats/get'](`chat${chatId}`);
					chatName = dialog ? dialog.name : `Chat ${chatId}`;
				}
				return main_core.Dom.create({
					tag: 'span',
					attrs: {
						className: MENTION_BASE_CLASS,
						'data-type': isLines ? MessageMentionType.lines : MessageMentionType.chat,
						'data-value': isLines ? `imol|${chatId}` : `chat${chatId}`
					},
					text: chatName
				}).outerHTML;
			});
			text = text.replace(/\[context=((?:chat\d+|\d+:\d+)\/(\d+))](.*?)\[\/context]/gis, (whole, contextTag, messageId, text) => {
				if (!text) {
					return '';
				}
				text = main_core.Text.decode(text);
				contextTag = ParserUtils.getFinalContextTag(contextTag);
				if (!contextTag) {
					return text;
				}
				const dialogId = contextTag.split('/')[0];
				return main_core.Dom.create({
					tag: 'span',
					attrs: {
						className: MENTION_BASE_CLASS,
						'data-type': MessageMentionType.context,
						'data-dialog-id': dialogId,
						'data-message-id': messageId,
						title: main_core.Loc.getMessage('IM_PARSER_MENTION_DIALOG')
					},
					text
				}).outerHTML;
			});
			return text;
		},
		purify(text) {
			text = text.replace(/\[USER=(all|[0-9]+)( REPLACE)?](.*?)\[\/USER]/gi, (whole, userId, replace, userName) => {
				userId = Number.parseInt(userId, 10);
				if (!main_core.Type.isNumber(userId) || userId === 0) {
					return userName;
				}
				if (replace || !userName) {
					const user = getCore().getStore().getters['users/get'](userId);
					if (user) {
						userName = user.name;
					}
				} else {
					userName = main_core.Text.decode(userName);
				}
				if (!userName) {
					userName = `User ${userId}`;
				}
				return userName;
			});
			text = text.replace(/\[CHAT=(imol\|)?(\d+)](.*?)\[\/CHAT]/gi, (whole, openlines, chatId, chatName) => {
				chatId = Number.parseInt(chatId, 10);
				if (!chatName) {
					const dialog = getCore().getStore().getters['chats/get']('chat' + chatId);
					chatName = dialog ? dialog.name : 'Chat ' + chatId;
				}
				return chatName;
			});
			text = text.replace(/\[context=(chat\d+|\d+:\d+)\/(\d+)](.*?)\[\/context]/gis, (whole, dialogId, messageId, text) => {
				if (!text) {
					const dialog = getCore().getStore().getters['chats/get'](dialogId);
					text = dialog ? dialog.name : 'Dialog ' + dialogId;
				}
				return text;
			});
			return text;
		},
		executeClickEvent(event, context) {
			const mentionHandler = new MentionHandler(context);
			mentionHandler.handleClick(event);
		},
		renderAllParticipantsMention(userName) {
			const className = `${MENTION_BASE_CLASS} ${MentionModifier.highlight}`;
			return main_core.Dom.create({
				tag: 'span',
				attrs: {
					className,
					'data-type': MessageMentionType.user,
					'data-value': SpecialMentionDialogId.allParticipants
				},
				text: userName
			}).outerHTML;
		}
	};

	const {
		EventType
	} = getConst();
	const QUOTE_SIGN = '&gt;&gt;';
	const NO_CONTEXT_TAG = 'none';
	const PREVIEW_LINE_LIMIT = 4;
	const PREVIEW_CHARS_PER_LINE = 80;
	const BR_HTML_TAG = '<br />';
	const CLASS_QUOTE_BASE = 'bx-im-message-quote';
	const CLASS_QUOTE_WRAP = 'bx-im-message-quote__wrap';
	const CLASS_QUOTE_TEXT = 'bx-im-message-quote__text';
	const CLASS_QUOTE_TOGGLE = 'bx-im-message-quote__toggle';
	const CLASS_EXPANDED = '--expanded';
	const CLASS_COLLAPSED = '--collapsed';
	const CLASS_CLICKABLE = '--clickable';
	const ParserQuote = {
		decodeArrowQuote(text) {
			if (!text.includes(QUOTE_SIGN)) {
				return text;
			}
			const lines = text.split(BR_HTML_TAG);
			const parts = [];
			let i = 0;
			while (i < lines.length) {
				if (!lines[i].startsWith(QUOTE_SIGN)) {
					parts.push({
						html: lines[i],
						isQuote: false
					});
					i++;
					continue;
				}
				const runLines = [];
				while (i < lines.length && lines[i].startsWith(QUOTE_SIGN)) {
					// Strip exactly one quote marker; any markers left over are a deeper level
					// and become a nested quote via the recursive call inside renderArrowQuote.
					runLines.push(lines[i].replace(QUOTE_SIGN, ''));
					i++;
				}
				parts.push({
					html: renderArrowQuote(runLines),
					isQuote: true
				});
			}
			let result = '';
			for (let j = 0; j < parts.length; j++) {
				result += parts[j].html;
				const isLast = j === parts.length - 1;

				// A <br> is added between plain lines, but never right after a quote block
				// (the quote container already ends the line) — mirrors the old join logic.
				if (!isLast && !parts[j].isQuote) {
					result += BR_HTML_TAG;
				}
			}
			return result;
		},
		purifyArrowQuote(text, spaceLetter = ' ') {
			return text.replaceAll(new RegExp(`^(${QUOTE_SIGN}(.*))`, 'gim'), getQuotePrefix() + spaceLetter);
		},
		decodeQuote(text, {
			contextDialogId = ''
		} = {}) {
			return text.replaceAll(/-{54}(<br \/>(.*?)\[(.*?)]( #(?:chat\d+|\d+:\d+)\/\d+)?)?<br \/>(.*?)-{54}(<br \/>)?/gs, (whole, userBlock, userName, timeTag, contextTag, quoteText) => {
				const preparedQuoteText = getQuoteText(userName, timeTag, quoteText);
				const userContainer = getUserBlock(userName, timeTag);
				const finalContextTag = getFinalContextTag(contextTag, contextDialogId);
				const clickableClass = finalContextTag === NO_CONTEXT_TAG ? '' : ` ${CLASS_CLICKABLE}`;
				const collapsedClass = isQuoteExpandableByText(preparedQuoteText) ? ` ${CLASS_COLLAPSED}` : '';
				const layout = main_core.Tag.render`
					<div class='${CLASS_QUOTE_BASE}${collapsedClass}${clickableClass}' data-context='${finalContextTag}'>
						<div class='${CLASS_QUOTE_WRAP}'>
							${userContainer}
							<div class='${CLASS_QUOTE_TEXT}'>${preparedQuoteText}</div>
							${getToggleButton({
				quoteText: preparedQuoteText
			})}
						</div>
					</div>
				`;
				return layout.outerHTML;
			});
		},
		purifyQuote(text, spaceLetter = ' ') {
			return text.replaceAll(/-{54}(.*?)-{54}/gims, getQuotePrefix() + spaceLetter);
		},
		decodeCode(text) {
			return text.replaceAll(/\[code](<br \/>)?([\0-\uFFFF]*?)\[\/code](<br \/>)?/gis, (whole, br, code) => {
				return main_core.Dom.create({
					tag: 'div',
					attrs: {
						className: 'bx-im-message-content-code'
					},
					html: code
				}).outerHTML;
			});
		},
		purifyCode(text, spaceLetter = ' ') {
			return text.replaceAll(/\[code](<br \/>)?([\0-\uFFFF]*?)\[\/code]/gis, `[${main_core.Loc.getMessage('IM_PARSER_ICON_TYPE_CODE')}]${spaceLetter}`);
		},
		decodeInlineCode(text) {
			return text.replaceAll(/\[icode]([\0-\uFFFF]*?)\[\/icode]/gi, (whole, code) => {
				return main_core.Dom.create({
					tag: 'code',
					attrs: {
						className: 'bx-im-message-content-code-inline'
					},
					html: code
				}).outerHTML;
			});
		},
		purifyInlineCode(text) {
			return text.replaceAll(/\[icode]([\0-\uFFFF]*?)\[\/icode]/gi, (whole, code) => code);
		},
		executeClickEvent(event, context) {
			const target = getUtils().dom.recursiveBackwardNodeSearch(event.target, CLASS_QUOTE_BASE);
			if (!target) {
				return;
			}
			if (shouldStopQuoteClick(event)) {
				event.stopPropagation();
				return;
			}
			const isExpandable = isQuoteExpandable(target);
			updateToggleButtonVisibility(target, isExpandable);
			if (target.dataset.context === NO_CONTEXT_TAG) {
				handleQuoteToggle(target, isExpandable);
				return;
			}
			const isToggleClick = isToggleButtonClick(event.target);
			if (isToggleClick) {
				if (!isExpandable) {
					return;
				}
				toggleQuoteState(target);
				return;
			}
			const [dialogId, messageId] = target.dataset.context.split('/');
			const {
				emitter
			} = context;
			emitter.emit(EventType.dialog.goToMessageContext, {
				messageId: Number.parseInt(messageId, 10),
				dialogId: dialogId.toString()
			});
		}
	};
	const getQuotePrefix = () => {
		return `[${main_core.Loc.getMessage('IM_PARSER_ICON_TYPE_QUOTE')}]`;
	};
	const getQuoteText = (userName, timeTag, text) => {
		const hasUserBlock = userName && timeTag;
		if (!hasUserBlock && !text) {
			// the case, when inside the quote we have only some string in square brackets
			return String(timeTag);
		}
		if (text.endsWith(BR_HTML_TAG)) {
			return text.slice(0, -BR_HTML_TAG.length);
		}
		return text;
	};
	const getUserBlock = (userName, timeTag) => {
		const hasDataForUserBlock = userName && timeTag;
		if (!hasDataForUserBlock) {
			return '';
		}
		return main_core.Tag.render`
		<div class='bx-im-message-quote__name'>
			<div class="bx-im-message-quote__name-text">${userName.trim()}</div>
			<div class="bx-im-message-quote__name-time">${timeTag.trim()}</div>
		</div>
	`;
	};
	const getFinalContextTag = (contextTag, contextDialogId) => {
		if (!contextTag) {
			return NO_CONTEXT_TAG;
		}
		const tagWithoutHashSign = contextTag.trim().slice(1);
		const finalContextTag = ParserUtils.getFinalContextTag(tagWithoutHashSign);
		if (!isQuoteFromTheSameChat(finalContextTag, contextDialogId)) {
			return NO_CONTEXT_TAG;
		}
		return finalContextTag;
	};
	const renderArrowQuote = runLines => {
		// runLines already had one quote marker stripped; recurse so any remaining markers
		// (a deeper level) render as a nested quote inside this one. A single-level run has
		// no remaining markers, so `inner` is just the joined text and the output is
		// byte-identical to the previous flat implementation.
		const inner = ParserQuote.decodeArrowQuote(runLines.join(BR_HTML_TAG));
		const collapsedClass = isQuoteExpandableByText(inner) ? ` ${CLASS_COLLAPSED}` : '';
		return `<div data-context="${NO_CONTEXT_TAG}" class="${CLASS_QUOTE_BASE}${collapsedClass}">` + `<div class="${CLASS_QUOTE_WRAP}">` + `<div class="${CLASS_QUOTE_TEXT}">${inner}</div>` + getToggleButton({
			quoteText: inner
		}) + '</div></div>';
	};
	const getToggleButton = ({
		quoteText,
		isExpanded = false
	}) => {
		if (!main_core.Type.isStringFilled(quoteText)) {
			return '';
		}
		if (!isQuoteExpandableByText(quoteText)) {
			return '';
		}
		const label = getToggleLabel(isExpanded);
		return `<button type="button" class="${CLASS_QUOTE_TOGGLE}">${label}</button>`;
	};
	const getToggleLabel = isExpanded => {
		const phraseCode = isExpanded ? 'IM_PARSER_QUOTE_COLLAPSE' : 'IM_PARSER_QUOTE_EXPAND';
		return main_core.Loc.getMessage(phraseCode);
	};
	const isQuoteFromTheSameChat = (finalContextTag, dialogId) => {
		const contextDialogId = ParserUtils.getDialogIdFromFinalContextTag(finalContextTag);
		return contextDialogId === dialogId;
	};
	const isQuoteExpandable = target => {
		const textNode = target.querySelector(`.${CLASS_QUOTE_TEXT}`);
		if (!textNode) {
			return false;
		}
		const isExpanded = main_core.Dom.hasClass(target, CLASS_EXPANDED);
		return isExpanded || textNode.scrollHeight > textNode.clientHeight + 1;
	};
	const isQuoteExpandableByText = quoteText => {
		const lines = quoteText.split(BR_HTML_TAG);
		let virtualLineCount = 0;
		for (const line of lines) {
			const plainText = line.replaceAll(/<[^>]+>/g, '').trim();
			virtualLineCount += Math.max(1, Math.ceil(plainText.length / PREVIEW_CHARS_PER_LINE));
			if (virtualLineCount > PREVIEW_LINE_LIMIT) {
				return true;
			}
		}
		return false;
	};
	const isToggleButtonClick = target => {
		const targetElement = target instanceof HTMLElement ? target : null;
		if (!targetElement) {
			return false;
		}
		return Boolean(targetElement.closest(`.${CLASS_QUOTE_TOGGLE}`));
	};
	const shouldStopQuoteClick = event => {
		const isInteractiveClick = event.target instanceof HTMLElement && event.target.closest('a');
		if (isInteractiveClick) {
			return true;
		}
		const selection = window.getSelection().toString().trim();
		return main_core.Type.isStringFilled(selection);
	};
	const handleQuoteToggle = (target, isExpandable) => {
		if (isExpandable) {
			main_core.Dom.addClass(target, CLASS_CLICKABLE);
		} else {
			main_core.Dom.removeClass(target, CLASS_CLICKABLE);
		}
		if (!main_core.Dom.hasClass(target, CLASS_CLICKABLE) || !isExpandable) {
			return true;
		}
		toggleQuoteState(target);
		return true;
	};
	const toggleQuoteState = target => {
		const isExpanded = main_core.Dom.hasClass(target, CLASS_EXPANDED);
		if (isExpanded) {
			main_core.Dom.removeClass(target, CLASS_EXPANDED);
			main_core.Dom.addClass(target, CLASS_COLLAPSED);
		} else {
			main_core.Dom.addClass(target, CLASS_EXPANDED);
			main_core.Dom.removeClass(target, CLASS_COLLAPSED);
		}
		const toggleButton = target.querySelector(`.${CLASS_QUOTE_TOGGLE}`);
		if (toggleButton) {
			toggleButton.textContent = getToggleLabel(!isExpanded);
		}
	};
	const updateToggleButtonVisibility = (target, isExpandable) => {
		const toggleButton = target.querySelector(`.${CLASS_QUOTE_TOGGLE}`);
		if (!toggleButton) {
			return;
		}
		main_core.Dom.style(toggleButton, 'display', isExpandable ? '' : 'none');
	};

	const ParserUrl = {
		decode(text, config = {}) {
			const {
				urlTarget = '_blank',
				removeLinks = false
			} = config;

			// base pattern for urls
			text = text.replace(/\[url(?:=([^[\]]+))?](.*?)\[\/url]/gis, (whole, link, text) => {
				const url = main_core.Text.decode(link || text);
				if (!getUtils().text.checkUrl(url)) {
					return text;
				}
				return this.getLinkHtml(url, urlTarget, text);
			});

			// url like https://bitrix24.com/?params[1]="test"
			text = text.replace(/\[url(?:=(.+?[^[\]]))?](.*?)\[\/url]/gis, (whole, link, text) => {
				let url = main_core.Text.decode(link || text);
				if (!getUtils().text.checkUrl(url)) {
					return text;
				}
				if (!url.slice(url.lastIndexOf('[')).includes(']')) {
					if (text.startsWith(']')) {
						url = `${url}]`;
						text = text.slice(1);
					} else if (text.startsWith('=')) {
						const urlPart = main_core.Text.decode(text.slice(1, text.lastIndexOf(']')));
						url = `${url}]=${urlPart}`;
						text = text.slice(text.lastIndexOf(']') + 1);
					}
				}
				return this.getLinkHtml(url, urlTarget, text);
			});
			if (removeLinks) {
				text = text.replace(/<a.*?href="([^"]*)".*?>(.*?)<\/a>/gi, '$2');
			}
			return text;
		},
		purify(text) {
			text = text.replace(/\[url(?:=([^\[\]]+))?](.*?)\[\/url]/gis, (whole, link, text) => {
				return text ? text : link;
			});
			text = text.replace(/\[url(?:=(.+))?](.*?)\[\/url]/gis, (whole, link, text) => {
				return text ? text : link;
			});
			return text;
		},
		removeSimpleUrlTag(text) {
			text = text.replace(/\[url](.*?)\[\/url]/gis, (whole, link) => link);
			return text;
		},
		getLinkHtml(url, urlTarget, text) {
			const {
				DataAttribute
			} = getConst();
			return main_core.Dom.create({
				tag: 'a',
				attrs: {
					href: url,
					target: urlTarget,
					[DataAttribute.useNativeContextMenu]: true
				},
				html: text
			}).outerHTML;
		}
	};

	const {
		FileType,
		FileIconType,
		AttachDescription
	} = getConst();
	const Purifier = {
		purifyMessage(message) {
			const messageFiles = getCore().getStore().getters['messages/getMessageFiles'](message.id);
			const isSticker = getCore().getStore().getters['stickers/messages/isSticker'](message.id);
			return this.purify({
				text: message.text,
				attach: message.attach,
				files: messageFiles,
				isSticker
			});
		},
		purifyNotification(notification) {
			const messageFiles = getCore().getStore().getters['messages/getMessageFiles'](notification.id);
			return this.purify({
				text: notification.text,
				attach: notification.params.attach ?? false,
				files: messageFiles
			});
		},
		purifyRecent(recentMessage) {
			const settings = main_core.Extension.getSettings('im.v2.lib.parser');
			const v2 = settings.get('v2');
			if (!v2) {
				const {
					files,
					attach,
					text
				} = prepareLegacyConfigForRecent(recentMessage);
				return this.purify({
					text,
					attach,
					files,
					showPhraseMessageWasDeleted: recentMessage.message.id !== 0
				});
			}
			const {
				files,
				attach,
				text,
				isSticker
			} = prepareConfigForRecent(recentMessage);
			return this.purify({
				text,
				attach,
				files,
				showPhraseMessageWasDeleted: recentMessage.messageId !== 0,
				isSticker
			});
		},
		purifyText(text) {
			return this.purify({
				text
			});
		},
		purify(config) {
			if (!main_core.Type.isPlainObject(config)) {
				getLogger().error('Parser.purify: the first parameter must be a object', config);
				return 'Parser.purify: the first parameter must be a parameter object';
			}
			let {
				text
			} = config;
			const {
				attach = false,
				files = false,
				isSticker = false,
				showPhraseMessageWasDeleted = true,
				removeNewLines = true
			} = config;
			if (!main_core.Type.isString(text)) {
				text = main_core.Type.isNumber(text) ? text.toString() : '';
			}
			if (!text || isSticker) {
				text = this.addTextPrefix({
					text,
					attach,
					files,
					isSticker
				});
				return text.trim();
			}
			const isMarkdownAvailable = isMarkdownFeatureEnabled();
			if (isMarkdownAvailable) {
				text = MarkdownConverter.simplify(text);
			}
			text = main_core.Text.encode(text.trim());
			text = ParserCommon.purifyNewLine(text, '\n');
			text = ParserSlashCommand.purify(text);
			text = ParserQuote.purifyArrowQuote(text);
			text = ParserQuote.purifyQuote(text);
			text = ParserQuote.purifyCode(text);
			if (isMarkdownAvailable) {
				text = ParserQuote.purifyInlineCode(text);
				// Unwrap [h1]/[h2] to plain text and drop [hr] — these block markers exist only
				// with Markdown on, and nothing else in this chain removes them (they would leak
				// raw into the preview). Runs BEFORE ParserFont.purify so it can strip any inner
				// inline BB (e.g. a bold heading) left behind by the unwrap.
				text = ParserHeading.purify(text);
			}
			text = ParserAction.purifyPut(text);
			text = ParserAction.purifySend(text);
			text = ParserMention.purify(text);
			text = ParserFont.purify(text);
			text = ParserLines.purify(text);
			text = ParserCall.purify(text);
			text = ParserUrl.purify(text);
			text = ParserImage.purifyLink(text);
			text = ParserImage.purifyIcon(text);
			text = ParserImage.purifyImageBbCode(text);
			text = ParserDisk.purify(text);
			text = ParserDate.purify(text);
			if (removeNewLines) {
				text = ParserCommon.purifyNewLine(text);
			}
			text = this.addTextPrefix({
				text,
				attach,
				files
			});
			if (text.length > 0) {
				text = main_core.Text.decode(text);
			} else if (showPhraseMessageWasDeleted) {
				text = main_core.Loc.getMessage('IM_PARSER_MESSAGE_DELETED');
			}
			return text.trim();
		},
		addTextPrefix(payload) {
			const {
				text,
				attach,
				files,
				isSticker
			} = payload;
			if (isSticker) {
				return getTextForSticker();
			}
			if (isFile(payload)) {
				return getTextForFile(text, files);
			}
			if (isAttach(payload)) {
				return getTextForAttach(text, attach);
			}
			return text.trim();
		}
	};
	const prepareLegacyConfigForRecent = recentMessage => {
		let files = false;
		const fileField = recentMessage.message.params.withFile;
		if (main_core.Type.isBoolean(fileField)) {
			files = fileField;
		} else if (main_core.Type.isPlainObject(fileField)) {
			files = [fileField];
		}
		let attach = false;
		const attachField = recentMessage.message.params.withAttach;
		if (main_core.Type.isBoolean(attachField) || main_core.Type.isStringFilled(attachField) || main_core.Type.isArray(attachField)) {
			attach = attachField;
		} else if (main_core.Type.isPlainObject(attachField)) {
			attach = [attachField];
		}
		return {
			files,
			attach,
			text: recentMessage.message.text
		};
	};
	const prepareConfigForRecent = recentMessage => {
		let files = getCore().getStore().getters['messages/getMessageFiles'](recentMessage.messageId);
		if (files.length === 0) {
			files = false;
		}
		const message = getCore().getStore().getters['messages/getById'](recentMessage.messageId);
		let attach = false;
		if (main_core.Type.isBoolean(message?.attach) || main_core.Type.isStringFilled(message?.attach) || main_core.Type.isArray(message?.attach)) {
			attach = message.attach;
		} else if (main_core.Type.isPlainObject(message?.attach)) {
			attach = [message.attach];
		}
		const isSticker = getCore().getStore().getters['stickers/messages/isSticker'](recentMessage.messageId);
		return {
			files,
			attach,
			text: message.text,
			isSticker
		};
	};
	const isFile = payload => {
		const {
			files
		} = payload;
		return main_core.Type.isArrayFilled(files) || files === true;
	};
	const isAttach = payload => {
		const {
			attach
		} = payload;
		return attach === true || main_core.Type.isArrayFilled(attach) || main_core.Type.isStringFilled(attach);
	};
	const getTextForFile = (rawText, files) => {
		let preparedText = rawText;
		if (main_core.Type.isArray(files) && files.length > 0) {
			preparedText = getTextByFile(rawText, files);
		} else if (files === true) {
			preparedText = getTextByFileType(rawText, FileIconType.file);
		}
		return preparedText.trim();
	};
	const getTextForAttach = (text, attach) => {
		let attachDescription = extractAttachDescription(attach);
		if (main_core.Type.isStringFilled(attachDescription)) {
			const shouldSkipDescription = attachDescription === AttachDescription.skipMessage;
			if (shouldSkipDescription) {
				return text.trim();
			}
			attachDescription = Purifier.purifyText(attachDescription);
		} else {
			attachDescription = `[${main_core.Loc.getMessage('IM_PARSER_ICON_TYPE_ATTACH')}]`;
		}
		return `${text} ${attachDescription}`.trim();
	};
	const extractAttachDescription = attach => {
		let attachDescription = '';
		if (main_core.Type.isArray(attach) && attach.length > 0) {
			const [firstAttach] = attach;
			if (main_core.Type.isStringFilled(firstAttach.description)) {
				attachDescription = firstAttach.description;
			}
		} else if (main_core.Type.isStringFilled(attach)) {
			attachDescription = attach;
		}
		return attachDescription;
	};
	const getTextForSticker = () => {
		return `[${main_core.Loc.getMessage('IM_PARSER_ICON_TYPE_STICKER')}]`;
	};
	const getTextByFileType = (text, type = FileIconType.file) => {
		const iconText = main_core.Loc.getMessage(`IM_PARSER_ICON_TYPE_${type.toUpperCase()}`);
		return `[${iconText}] ${text}`.trim();
	};
	const getTextByFile = (text, files) => {
		const [file] = files;

		// todo: remove this hack after fix receiving messages with files on P&P
		if (!file || !file.type) {
			return text;
		}
		const isGallery = files.every(item => [FileIconType.image, FileIconType.video].includes(item.type));
		if (file.type === FileType.image && files.length === 1) {
			return getTextByFileType(text, FileIconType.image);
		}
		if (isGallery && files.length > 1) {
			return getTextByFileType(text, FileIconType.gallery);
		}
		if (file.type === FileType.audio) {
			return getTextByFileType(text, FileIconType.audio);
		}
		if (file.type === FileType.video) {
			return getTextByFileType(text, FileIconType.video);
		}
		return `${main_core.Loc.getMessage('IM_PARSER_ICON_TYPE_FILE')}: ${file.name} ${text}`.trim();
	};

	const RatioConfig = Object.freeze({
		Default: 1,
		Big: 1.6
	});
	const getSmileRatio = (text, pattern, config = RatioConfig) => {
		const replacedText = text.replaceAll(new RegExp(pattern, 'g'), '');
		const hasOnlySmiles = replacedText.trim().length === 0;
		const matchOnlySmiles = new RegExp(`(?:(?:${pattern})\\s*){4,}`);
		if (hasOnlySmiles && !matchOnlySmiles.test(text)) {
			return config.Big;
		}
		return config.Default;
	};
	const mapTypings = smiles => {
		const typings = smiles.reduce((acc, smile) => {
			const {
				image,
				typing,
				definition,
				name,
				width,
				height
			} = smile;
			const smileImg = main_core.Tag.render`
			<img
				src="${image}"
				data-code="${typing}"
				data-definition="${definition}"
				title="${name ?? typing}"
				alt="${typing}"
				class="bx-smile bx-im-message-base__text_smile"
				style="width: ${width}px; height: ${height}px;"
				draggable="false"
			/>
		`;
			return {
				...acc,
				[typing]: smileImg
			};
		}, {});
		return typings;
	};
	const lookBehind = function (text, match, offset) {
		const substring = text.slice(0, offset + match.length);
		const escaped = getUtils().text.escapeRegex(match);
		// A BBCode tag close "]" bounds a smile just like an HTML ">" — decodeSmile runs while
		// [list]/[*]/[b]… tags are still present, so a smile right after one (e.g. "[*]:)") must
		// be recognised.
		const regExp = new RegExp(`(?:^|&quot;|>|]|(?:${this.pattern})|\\s|<)(?:${escaped})$`);
		return substring.match(regExp);
	};
	const ParserSmile = {
		typings: null,
		pattern: '',
		loadSmilePatterns() {
			if (!getSmileManager()) {
				return;
			}
			const smileManager = getSmileManager().getInstance();
			const smiles = smileManager.smileList?.smiles ?? [];
			if (smiles.length === 0) {
				return;
			}
			const sortedSmiles = [...smiles].sort((a, b) => {
				return b.typing.localeCompare(a.typing);
			});
			this.pattern = sortedSmiles.map(smile => {
				return getUtils().text.escapeRegex(smile.typing);
			}).join('|');
			this.typings = mapTypings(sortedSmiles);
		},
		decodeSmile(text, options = {})
		// TODO add options types
		{
			if (!this.typings) {
				this.loadSmilePatterns();
			}
			if (!this.pattern) {
				return text;
			}
			let enableBigSmile;
			if (main_core.Type.isBoolean(options.enableBigSmile)) {
				enableBigSmile = options.enableBigSmile;
			} else {
				enableBigSmile = getBigSmileOption();
			}
			const ratioConfig = main_core.Type.isObjectLike(options.ratioConfig) ? options.ratioConfig : RatioConfig;
			const ratio = enableBigSmile ? getSmileRatio(text, this.pattern, ratioConfig) : ratioConfig.Default;

			// "[" (BBCode tag open) bounds a smile just like "<" (HTML tag open): decodeSmile runs
			// before decodeList, so a smile ending an item — "...:D[*]" / "...:D[/list]" — sits right
			// before a "[" and would otherwise be missed.
			const pattern = `(?:(?:${this.pattern})(?=(?:(?:${this.pattern})|\\s|&quot;|<|\\[|$)))`;
			const regExp = new RegExp(pattern, 'g');
			const replacedText = text.replaceAll(regExp, (match, offset) => {
				const behindMatching = lookBehind.call(this, text, match, offset);
				if (!behindMatching) {
					return match;
				}
				const image = this.typings[match].cloneNode();
				const {
					width,
					height
				} = image.style;
				main_core.Dom.style(image, 'width', `${Number.parseInt(width, 10) * ratio}px`);
				main_core.Dom.style(image, 'height', `${Number.parseInt(height, 10) * ratio}px`);
				return image.outerHTML;
			});
			return replacedText;
		}
	};

	const CLASS_LIST = 'bx-im-message-content-list';
	const CLASS_LI = 'bx-im-message-content-list-item';

	// Defensive cap on rendered list items per [list], mirroring the table render caps:
	// a huge legacy/hand-typed [list] must not materialize thousands of <li> in the feed.
	const MAX_LIST_ITEMS = 200;

	// Canonical Bitrix list BB-code: [list] / [list=1] with [*] items, optionally
	// nested. decodeList runs last in the decode chain; an item's inline content has
	// already been turned into HTML by the global font/url/icode decoders, so here we
	// only build the <ul>/<ol> structure.
	//
	// Nesting is resolved innermost-first: this pattern only matches a [list] whose
	// body carries no further [list] (negative lookahead), so each pass renders the
	// deepest lists to <ul>/<ol> HTML — which makes their parent the innermost list
	// on the next pass. The loop repeats until no [list] remains.
	//
	// Global flag: one decodeList pass rebuilds EVERY innermost list at the current
	// depth (siblings included) instead of just the first, so a message with many
	// adjacent lists converges in O(depth) passes rather than O(list count) — and
	// cannot leave a literal BB-code tail once the 100-pass guard trips. The pattern
	// is used only with String.replace (lastIndex is reset by replace), and the loop
	// guard uses a separate non-global .test() regex, so there is no shared-state hazard.
	const INNERMOST_LIST_PATTERN = /\[(list(?:=1)?(?:\s+start=\d+)?)]((?:(?!\[list)[\s\S])*?)\[\/list]/gi;
	const ParserList = {
		/**
		 * Render canonical [list]/[list=1] BB-code (produced by the Markdown
		 * converter, or arriving as legacy BB-code content) into native HTML lists.
		 *
		 * @param {string} text
		 * @returns {string}
		 */
		decodeList(text) {
			if (!/\[list(?:=1)?(?:\s+start=\d+)?]/i.test(text)) {
				return text;
			}
			let previous = null;
			let guard = 0;
			while (text !== previous && /\[list(?:=1)?(?:\s+start=\d+)?]/i.test(text) && guard < 100) {
				previous = text;
				text = text.replace(INNERMOST_LIST_PATTERN, (whole, tag, body) => renderList(tag, body) || whole);
				guard++;
			}
			return text;
		}
	};
	function renderList(tag, body) {
		const ordered = tag.toLowerCase().startsWith('list=1');

		// Each [*] starts one item (its already-decoded inline/nested-list content runs up to
		// the next [*] or the end). A bounded exec loop stops at MAX_LIST_ITEMS WITHOUT first
		// materializing every segment, so a crafted [list] with thousands of [*] can't turn
		// into a long task / memory spike before the cap is applied.
		const items = [];
		const itemPattern = /\[\*]([\s\S]*?)(?=\[\*]|$)/gi;
		let itemMatch;
		while (items.length < MAX_LIST_ITEMS && (itemMatch = itemPattern.exec(body)) !== null) {
			items.push(itemMatch[1].trim());
		}
		if (items.length === 0) {
			return '';
		}
		const listItems = items.map(item => `<li class="${CLASS_LI}">${item}</li>`).join('');
		const listTag = ordered ? 'ol' : 'ul';
		const listClass = CLASS_LIST;

		// A start offset ("[list=1 start=N]") renders as <ol start="N"> so a list that begins
		// at, say, 5 shows 5, 6, 7 instead of restarting at 1. A start of 1 needs no attribute.
		let startAttr = '';
		if (ordered) {
			const startMatch = tag.match(/start=(\d+)/i);
			const startNum = startMatch ? parseInt(startMatch[1], 10) : 1;
			// Emit for any non-default start, incl. 0 (CommonMark: "0." → <ol start="0">).
			if (startNum !== 1) {
				startAttr = ` start="${startNum}"`;
			}
		}
		return `<${listTag} class="${listClass}"${startAttr}>${listItems}</${listTag}>`;
	}

	const CLASS_TABLE_CONTAINER = 'bx-im-message-content-table';
	const CLASS_TABLE = 'bx-im-message-content-table__table';

	// Defensive render ceiling, mirroring the converter caps (markdown/rules/table-rules):
	// the converter already refuses to emit an over-sized [table], but legacy [table]
	// BB-code (migration-IN) reaches decodeTable directly, so cap rows/columns here too
	// to bound the materialized DOM grid. Excess rows/columns are dropped.
	const MAX_RENDER_ROWS = 200;
	const MAX_RENDER_COLUMNS = 24;

	// Canonical Bitrix table BB-code (single line), emitted by convertTables:
	//   [table][tr][th]cell[/th]…[/tr][tr][td]cell[/td]…[/tr][/table]
	// decodeTable runs last in the decode chain (decoder.js), after Text.encode and
	// after the table was stashed away from the global font/url decoders
	// (cutTableTag). Cell text is therefore already Text.encode'd; the only
	// un-decoded things left inside a cell are the inline tags ([b]/[i]/[s]/[url])
	// the converter allowed there — decoded here and inserted as innerHTML.
	const TABLE_PATTERN = /\[table]([\s\S]*?)\[\/table]/gi;
	const ROW_PATTERN = /\[tr]([\s\S]*?)\[\/tr]/gi;
	const CELL_PATTERN = /\[(th|td)]([\s\S]*?)\[\/(?:th|td)]/gi;
	const ParserTable = {
		/**
		 * Render canonical [table] BB-code (produced by the Markdown converter, or
		 * arriving as legacy BB-code content) into a native HTML-grid. Runs after
		 * Text.encode / recover, mirroring ParserQuote.decodeCode.
		 *
		 * @param {string} text
		 * @returns {string}
		 */
		decodeTable(text, options = {}) {
			if (!/\[table]/i.test(text)) {
				return text;
			}

			// urlTarget is threaded down to the cell links so they match the rest of the
			// message (e.g. notifications decode with '_self', not always '_blank').
			const {
				urlTarget = '_blank'
			} = options;
			return text.replace(TABLE_PATTERN, (whole, inner) => renderTable(inner, urlTarget) || whole);
		}
	};

	// Stop scanning at the render caps INSIDE the loops: a huge legacy/hand-typed [table]
	// must not first run ParserFont/ParserUrl over thousands of cells only to be sliced
	// down to MAX_RENDER_ROWS×MAX_RENDER_COLUMNS afterwards (message-render hot path).
	function parseRows(inner, urlTarget) {
		const rows = [];
		let scannedRows = 0;
		ROW_PATTERN.lastIndex = 0;
		let rowMatch;
		while (scannedRows < MAX_RENDER_ROWS && (rowMatch = ROW_PATTERN.exec(inner)) !== null) {
			scannedRows++;
			const cells = [];
			let isHeader = false;
			CELL_PATTERN.lastIndex = 0;
			let cellMatch;
			while (cells.length < MAX_RENDER_COLUMNS && (cellMatch = CELL_PATTERN.exec(rowMatch[1])) !== null) {
				if (cellMatch[1].toLowerCase() === 'th') {
					isHeader = true;
				}
				cells.push(decodeCell(cellMatch[2], urlTarget));
			}
			if (cells.length > 0) {
				rows.push({
					isHeader,
					cells
				});
			}
		}
		return rows;
	}

	// Web table cells get the full single-line inline pipeline: smiles, slash-commands,
	// links, font BB-code ([b]/[i]/[s]/[u]…), mentions, icons, disk tags, dates and inline
	// code. Images are intentionally left out so a cell never grows into a block <img>. The
	// content arrives already Text.encode'd (the whole table was stashed by cutTableTag after
	// encode), so this step only turns BB-code into HTML — the XSS invariant is preserved.
	function decodeCell(content, urlTarget) {
		let html = ParserSmile.decodeSmile(content);
		html = ParserSlashCommand.decode(html);
		html = ParserUrl.decode(html, {
			urlTarget,
			removeLinks: false
		});
		html = ParserFont.decode(html);
		html = ParserMention.decode(html);
		html = ParserImage.decodeIcon(html);
		html = ParserDisk.decode(html);
		html = ParserDate.decode(html);
		html = ParserQuote.decodeInlineCode(html);
		return html.trim();
	}
	function renderRow(row, columnCount) {
		const tag = row.isHeader ? 'th' : 'td';
		const attrs = row.isHeader ? ' scope="col" role="columnheader"' : ' role="cell"';
		let cellsHtml = '';
		for (let i = 0; i < columnCount; i++) {
			cellsHtml += `<${tag}${attrs}>${row.cells[i] ?? ''}</${tag}>`;
		}
		return `<tr role="row">${cellsHtml}</tr>`;
	}
	function renderTable(inner, urlTarget) {
		const rows = parseRows(inner, urlTarget);
		if (rows.length === 0) {
			return '';
		}
		const columnCount = Math.min(MAX_RENDER_COLUMNS, rows.reduce((max, row) => Math.max(max, row.cells.length), 0));
		if (columnCount === 0) {
			return '';
		}
		const headHtml = rows.filter(row => row.isHeader).map(row => renderRow(row, columnCount)).join('');
		const bodyHtml = rows.filter(row => !row.isHeader).map(row => renderRow(row, columnCount)).join('');
		const table = main_core.Dom.create({
			tag: 'div',
			attrs: {
				className: CLASS_TABLE_CONTAINER,
				style: `--im-message-content-table-cols: ${columnCount};`,
				// String '0', not number 0: Dom.create drops attrs whose value `== ''`,
				// and `0 == ''` is true — a numeric 0 silently removes the attribute, so
				// the scroll container would never become keyboard-focusable.
				tabIndex: '0',
				role: 'group',
				'aria-label': main_core.Loc.getMessage('IM_PARSER_MARKDOWN_TABLE_PLACEHOLDER')
			},
			html: `<table class="${CLASS_TABLE}" role="table">` + (headHtml ? `<thead role="rowgroup">${headHtml}</thead>` : '') + (bodyHtml ? `<tbody role="rowgroup">${bodyHtml}</tbody>` : '') + '</table>'
		});
		return table.outerHTML;
	}

	const NestedTagHandler = {
		putReplacement: [],
		sendReplacement: [],
		codeReplacement: [],
		tableReplacement: [],
		nonce: '',
		clean() {
			this.putReplacement = [];
			this.sendReplacement = [];
			this.codeReplacement = [];
			this.tableReplacement = [];
			this.nonce = '';
		},
		// Unpredictable per-render token mixed into the [code]/[table] placeholders. The
		// placeholder format used to be guessable (####REPLACEMENT_CODE_0####), so a sender
		// could paste many literal copies plus one real [code]/[table] and have the single
		// stored block replicated into every copy on recover — a client-side DOM-bloat DoS.
		// With a random nonce the sender cannot predict the recipient's placeholder, so the
		// recover only ever hits the one position the cut actually created. (Not a secret —
		// Math.random is enough to be unguessable by a remote sender; cleared per pass.)
		getNonce() {
			if (!this.nonce) {
				this.nonce = Math.random().toString(36).slice(2, 12);
			}
			return this.nonce;
		},
		cutPutTag(text) {
			return text.replaceAll(/\[put(?:=(.+?))?](.+?)?\[\/put]/gi, whole => {
				const id = this.putReplacement.length;
				this.putReplacement.push(whole);
				return `####REPLACEMENT_PUT_${id}####`;
			});
		},
		recoverPutTag(text) {
			this.putReplacement.forEach((value, index) => {
				text = text.split(`####REPLACEMENT_PUT_${index}####`).join(value);
			});
			return text;
		},
		cutSendTag(text) {
			text = text.replaceAll(/\[send(?:=(.+?))?](.+?)?\[\/send]/gi, whole => {
				const id = this.sendReplacement.length;
				this.sendReplacement.push(whole);
				return `####REPLACEMENT_SEND_${id}####`;
			});
			return text;
		},
		recoverSendTag(text) {
			this.sendReplacement.forEach((value, index) => {
				const placeholder = `####REPLACEMENT_SEND_${index}####`;
				text = text.split(placeholder).join(value);
			});
			return text;
		},
		cutCodeTag(text) {
			const nonce = this.getNonce();
			text = text.replaceAll(/\[code](<br \/>)?(.*?)\[\/code]/gis, whole => {
				const id = this.codeReplacement.length;
				this.codeReplacement.push(whole);
				return `####REPLACEMENT_CODE_${nonce}_${id}####`;
			});
			return text;
		},
		recoverCodeTag(text) {
			const nonce = this.getNonce();
			this.codeReplacement.forEach((value, index) => {
				text = text.split(`####REPLACEMENT_CODE_${nonce}_${index}####`).join(value);
			});
			this.sendReplacement.forEach((value, index) => {
				text = text.replaceAll(`####REPLACEMENT_SEND_${index}####`, value);
			});
			return text;
		},
		cutTableTag(text) {
			const nonce = this.getNonce();
			return text.replaceAll(MARKDOWN_TABLE_PATTERN, whole => {
				const id = this.tableReplacement.length;
				this.tableReplacement.push(whole);
				return `####REPLACEMENT_TABLE_${nonce}_${id}####`;
			});
		},
		recoverTableTag(text) {
			const nonce = this.getNonce();
			this.tableReplacement.forEach((value, index) => {
				text = text.split(`####REPLACEMENT_TABLE_${nonce}_${index}####`).join(value);
			});
			return text;
		},
		recoverRecursionTag(text) {
			if (this.sendReplacement.length > 0) {
				this.sendReplacement.forEach((value, index) => {
					text = text.replaceAll(`####REPLACEMENT_SEND_${index}####`, value);
				});
			}
			text = text.split('####REPLACEMENT_SP_').join('####REPLACEMENT_PUT_');
			if (this.putReplacement.length > 0) {
				do {
					this.putReplacement.forEach((value, index) => {
						text = text.replace(`####REPLACEMENT_PUT_${index}####`, value);
					});
				} while (text.includes('####REPLACEMENT_PUT_'));
			}
			return text;
		}
	};

	const Decoder = {
		decodeMessage(message) {
			const messageFiles = getCore().getStore().getters['messages/getMessageFiles'](message.id);
			const contextDialogId = ParserUtils.getDialogIdByChatId(message.chatId);
			return this.decode({
				text: message.text,
				attach: message.attach,
				files: messageFiles,
				showIconIfEmptyText: false,
				contextDialogId
			});
		},
		decodeNotification(notification) {
			return this.decode({
				text: notification.text,
				attach: notification.params.attach ?? false,
				showIconIfEmptyText: false,
				showImageFromLink: false,
				urlTarget: im_v2_lib_desktopApi.DesktopApi.isDesktop() ? '_blank' : '_self'
			});
		},
		decodeNotificationParam(text) {
			return this.decode({
				text,
				urlTarget: im_v2_lib_desktopApi.DesktopApi.isDesktop() ? '_blank' : '_self'
			});
		},
		decodeText(text) {
			return this.decode({
				text
			});
		},
		decodeInlineText(text) {
			return this.decode({
				text,
				inlineOnlyMarkdown: true
			});
		},
		decodeHtml(text) {
			return this.decode({
				text
			});
		},
		decodeSmile(text, options) {
			return ParserSmile.decodeSmile(text, options);
		},
		decodeSmileForLegacyCore(text, options) {
			const legacyConfig = {
				...options
			};
			legacyConfig.ratioConfig = Object.freeze({
				Default: 1,
				Big: 1.6
			});
			return ParserSmile.decodeSmile(text, legacyConfig);
		},
		decode(config) {
			if (!main_core.Type.isPlainObject(config)) {
				getLogger().error('Parser.decode: the first parameter must be object', config);
				return '<b style="color:red">Parser.decode: the first parameter must be a parameter object</b';
			}
			let {
				text
			} = config;
			const {
				attach = false,
				files = false,
				removeLinks = false,
				showIconIfEmptyText = true,
				showImageFromLink = true,
				contextDialogId = '',
				urlTarget = '_blank',
				inlineOnlyMarkdown = false
			} = config;
			if (!main_core.Type.isString(text)) {
				if (main_core.Type.isNumber(text)) {
					return text.toString();
				}
				return '';
			}
			if (!text) {
				return showIconIfEmptyText ? Purifier.addTextPrefix({
					text,
					attach,
					files
				}) : '';
			}
			const isMarkdownAvailable = isMarkdownFeatureEnabled();
			if (isMarkdownAvailable) {
				text = inlineOnlyMarkdown ? MarkdownConverter.decodeInline(text) : MarkdownConverter.decode(text);
			}
			text = main_core.Text.encode(text.trim());
			text = ParserCommon.decodeNewLine(text);
			text = ParserCommon.decodeTabulation(text);
			text = NestedTagHandler.cutPutTag(text);
			text = NestedTagHandler.cutSendTag(text);
			text = NestedTagHandler.cutCodeTag(text);
			if (isMarkdownAvailable) {
				text = NestedTagHandler.cutTableTag(text);
			}
			text = ParserSmile.decodeSmile(text);
			text = ParserSlashCommand.decode(text);
			text = ParserImage.decodeImageBbCode(text, {
				contextDialogId
			});
			text = ParserUrl.decode(text, {
				urlTarget,
				removeLinks
			});
			text = ParserFont.decode(text);
			text = ParserLines.decode(text);
			text = ParserMention.decode(text);
			text = ParserCall.decode(text);
			text = ParserImage.decodeIcon(text);
			if (showImageFromLink) {
				text = ParserImage.decodeLink(text);
			}
			text = ParserDisk.decode(text);
			text = ParserDate.decode(text);
			text = ParserQuote.decodeArrowQuote(text);
			text = ParserQuote.decodeQuote(text, {
				contextDialogId
			});
			text = NestedTagHandler.recoverSendTag(text);
			text = ParserAction.decodeSend(text);
			text = NestedTagHandler.recoverPutTag(text);
			text = ParserAction.decodePut(text);

			// Structural decode (inline-code / table / list) MUST run while [code] blocks
			// are still cut away, and before they are recovered + rendered below:
			//  - Direction A: a literal [table]/[list]/[icode] typed inside a code block
			//    stays inert — it is hidden in the code placeholder here, so decodeTable/
			//    decodeList/decodeInlineCode never see it and never render a live element
			//    inside <code>.
			//  - Direction B: a [code] block nested in a table cell is recovered AFTER the
			//    table is rebuilt (recoverCodeTag below), so its placeholder renders as a
			//    real code block instead of leaking raw ####REPLACEMENT_CODE_N#### text.
			if (isMarkdownAvailable) {
				text = ParserQuote.decodeInlineCode(text);
				text = NestedTagHandler.recoverTableTag(text);
				text = ParserTable.decodeTable(text, {
					urlTarget
				});
				text = ParserList.decodeList(text);
				text = ParserHeading.decodeHeading(text);

				// A list keeps a single blank line's worth of spacing from adjacent content, like
				// tables below: collapse 2+ adjacent <br> down to one. (Lists no longer carry the
				// large typography margins that once justified dropping every <br>, so stripping
				// them all would glue a following paragraph straight onto the list.)
				text = text.replace(/(<\/(?:ul|ol)>)(?:<br \/>){2,}/gi, '$1<br />');
				text = text.replace(/(?:<br \/>){2,}(<(?:ul|ol)\b)/gi, '<br />$1');

				// Tables keep a SINGLE blank line's worth of spacing — like plain text — never a
				// double one: collapse 2+ adjacent <br> down to one (headings/rules strip their
				// own in decodeHeading).
				text = text.replace(/(<\/table><\/div>)(?:<br \/>){2,}/gi, '$1<br />');
				text = text.replace(/(?:<br \/>){2,}(<div class="bx-im-message-content-table")/gi, '<br />$1');
			}
			text = NestedTagHandler.recoverCodeTag(text);
			text = ParserQuote.decodeCode(text);
			text = NestedTagHandler.recoverRecursionTag(text);
			text = ParserCommon.removeDuplicateTags(text);
			NestedTagHandler.clean();
			return text;
		}
	};

	const SOURCE_REGEX = /\[source=(?<sourceId>\d+)](?<sourceText>.*?)\[\/source]/gi;
	const ParserInlineSourceLink = {
		purify(text) {
			return text.replaceAll(SOURCE_REGEX, (whole, sourceId, sourceText) => sourceText);
		},
		getSegments(text) {
			const result = [];
			let lastIndex = 0;
			for (const match of text.matchAll(SOURCE_REGEX)) {
				const hasTextBeforeSource = match.index > lastIndex;
				if (hasTextBeforeSource) {
					const textSegment = getTextSegment(text, lastIndex, match.index);
					if (textSegment) {
						result.push(textSegment);
					}
				}
				result.push(getSourceSegment(match));
				lastIndex = match.index + match[0].length;
			}
			const hasTrailingText = lastIndex < text.length;
			if (hasTrailingText) {
				const segment = getTextSegment(text, lastIndex, text.length);
				if (segment) {
					result.push(segment);
				}
			}
			return result;
		}
	};
	function getTextSegment(text, from, to) {
		const value = text.slice(from, to);
		if (value.trim().length > 0) {
			return {
				type: 'text',
				value
			};
		}
		return null;
	}
	function getSourceSegment(match) {
		return {
			type: 'source',
			id: match.groups.sourceId,
			text: match.groups.sourceText
		};
	}

	const Parser = {
		purify: config => Purifier.purify(config),
		purifyText: text => Purifier.purifyText(text),
		purifyRecent: recentMessage => Purifier.purifyRecent(recentMessage),
		purifyMessage: message => Purifier.purifyMessage(message),
		purifyNotification: notification => Purifier.purifyNotification(notification),
		decode: config => Decoder.decode(config),
		decodeText: text => Decoder.decodeText(text),
		decodeInlineText: text => Decoder.decodeInlineText(text),
		decodeMessage: message => Decoder.decodeMessage(message),
		decodeNotification: notification => Decoder.decodeNotification(notification),
		decodeNotificationParam: text => Decoder.decodeNotificationParam(text),
		decodeHtml: text => Decoder.decodeHtml(text),
		decodeSmile: (text, options) => Decoder.decodeSmile(text, options),
		decodeSmileForLegacyCore: (text, options) => Decoder.decodeSmileForLegacyCore(text, options),
		prepareQuote(message, quoteText = '') {
			const {
				id,
				attach
			} = message;
			let text = quoteText === '' ? message.text : quoteText;
			const files = getCore().getStore().getters['messages/getMessageFiles'](id);
			const isSticker = getCore().getStore().getters['stickers/messages/isSticker'](id);
			const isMarkdownAvailable = isMarkdownFeatureEnabled();
			if (isMarkdownAvailable) {
				text = MarkdownConverter.simplify(text);
			}
			text = main_core.Text.encode(text.trim());
			if (isMarkdownAvailable) {
				text = ParserQuote.purifyInlineCode(text);
			}
			text = ParserMention.purify(text);
			text = ParserCall.purify(text);
			text = ParserLines.purify(text);
			text = ParserCommon.purifyBreakLine(text, '\n');
			text = ParserCommon.purifyNbsp(text);
			text = ParserUrl.removeSimpleUrlTag(text);
			text = ParserQuote.purifyCode(text, ' ');
			text = ParserQuote.purifyQuote(text, ' ');
			text = ParserQuote.purifyArrowQuote(text, ' ');
			if (quoteText === '' || isSticker) {
				text = Purifier.addTextPrefix({
					text,
					attach,
					files,
					isSticker
				});
			}
			text = text.length > 0 ? main_core.Text.decode(text) : main_core.Loc.getMessage('IM_PARSER_MESSAGE_DELETED');
			return text.trim();
		},
		prepareEdit(message) {
			let {
				text
			} = message;
			text = ParserUrl.removeSimpleUrlTag(text);
			text = ParserMention.purify(text);
			return text.trim();
		},
		prepareCopy(message) {
			let {
				text
			} = message;
			text = ParserUrl.removeSimpleUrlTag(text);
			return text.trim();
		},
		prepareCopyFile(message) {
			const {
				id
			} = message;
			const files = getCore().getStore().getters['messages/getMessageFiles'](id).map(file => {
				return `[DISK=${file.id}]\n`;
			});
			return files.join('\n').trim();
		},
		executeClickEvent(event, context) {
			ParserMention.executeClickEvent(event, context);
			ParserQuote.executeClickEvent(event, context);
			ParserAction.executeClickEvent(event, context);
		},
		getContextCodeFromForwardId(forwardId) {
			return ParserUtils.getFinalContextTag(forwardId);
		},
		getInlineSourceLinkSegments(text) {
			return ParserInlineSourceLink.getSegments(text);
		}
	};

	exports.Parser = Parser;

})(this.BX.Messenger.v2.Lib = this.BX.Messenger.v2.Lib || {}, BX, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib);
//# sourceMappingURL=parser.bundle.js.map
