/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
(function (exports, main_core, im_public, im_v2_lib_desktopApi) {
	'use strict';

	const NEW_LINE = '\n';

	// Head and tail shared by every markdown placeholder. The per-kind prefixes below are built
	// from them, and so is the guard that has to recognize a placeholder of ANY kind
	// (renderPlaceholderPattern in rules/inline-rules.js) - renaming here must not leave that
	// guard matching the old shape.
	const MARKDOWN_PLACEHOLDER_PREFIX = '####MD';
	const MARKDOWN_PLACEHOLDER_SUFFIX = '####';
	const MARKDOWN_CODE_PREFIX = `${MARKDOWN_PLACEHOLDER_PREFIX}_CODE_`;
	const MARKDOWN_ESCAPE_PREFIX = `${MARKDOWN_PLACEHOLDER_PREFIX}_ESC_`;
	const MARKDOWN_INLINE_CODE_PREFIX = `${MARKDOWN_PLACEHOLDER_PREFIX}_INLINE_`;
	const MARKDOWN_MENTION_PREFIX = `${MARKDOWN_PLACEHOLDER_PREFIX}_MENTION_`;
	const MARKDOWN_URL_PREFIX = `${MARKDOWN_PLACEHOLDER_PREFIX}_URL_`;
	const MARKDOWN_BB_TAG_PREFIX = `${MARKDOWN_PLACEHOLDER_PREFIX}_BBTAG_`;
	const MARKDOWN_TABLE_GUARD_PREFIX = `${MARKDOWN_PLACEHOLDER_PREFIX}_TABLEGUARD_`;
	// The odd one out: no second underscore and no nonce.
	const MARKDOWN_LIST_TAG_PREFIX = `${MARKDOWN_PLACEHOLDER_PREFIX}LISTTAG`;

	// Not a placeholder of the render: the mask BbTagProtector lays over an inline code span for
	// the length of its own scan (####MDSPAN<nonce>-<index>####). It carries no '[', ']', '`', '*'
	// or '_', so no tag pattern can read it as markup, and it never leaves protect().
	const MARKDOWN_CODE_SPAN_MASK_PREFIX = `${MARKDOWN_PLACEHOLDER_PREFIX}SPAN`;

	// The inline code spans, longest fence first. protectInlineCode (rules/inline-rules.js) stores
	// them and BbTagProtector masks them before it looks for ready tags, so a tag typed inside a
	// span is never taken for a live one; both read the grammar from here. Global patterns shared
	// by two callers: use them through replaceAll only, which resets lastIndex.
	const MARKDOWN_INLINE_CODE_TRIPLE_PATTERN = /```(.+?)```/g;
	const MARKDOWN_INLINE_CODE_DOUBLE_PATTERN = /``(.+?)``/g;
	const MARKDOWN_INLINE_CODE_SINGLE_PATTERN = /`([^`]+)`/g;
	const MARKDOWN_INLINE_CODE_SPAN_PATTERNS = [MARKDOWN_INLINE_CODE_TRIPLE_PATTERN, MARKDOWN_INLINE_CODE_DOUBLE_PATTERN, MARKDOWN_INLINE_CODE_SINGLE_PATTERN];

	// Ceiling for the link/image destination scan (destination + optional title + the skipped
	// spaces around it), counted in source characters from the "](" prefix. Well above any real
	// URL (OAuth-redirect and tracking links run past 2000 chars) yet bounded, so a crafted
	// message cannot make the scanner walk the whole text from every "](" - a boundary test pins
	// the value.
	const MAX_URL_SCAN_LENGTH = 8192;

	// Characters a backslash can escape inside a destination: the pair `\X` yields a literal X
	// that takes no part in paren balancing or in the <...> boundaries.
	//
	// Only '<' is listed, and the reason is the stage order, not the grammar. EscapeHandler runs
	// first (MarkdownConverter.#protectBase) and turns every pair it owns into a placeholder, so a
	// backslash before one of its characters never reaches this scan; '<' is the one destination
	// character outside its set (escape-handler.js). Listing the others here would be dead weight
	// that reads as live logic. Revisit the moment escape protection stops running first.
	const ESCAPABLE_CHARS = ['<'];

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

	// BB-code tags that already carry a URL when the text reaches the converter: the server wraps
	// every bare URL in [URL]...[/URL], and a reply quotes a message through MarkdownConverter.simplify,
	// so the reply text arrives with ready [URL=...]...[/URL] / [img ...]...[/img] blocks. What must not
	// be reparsed is the URL they carry: an emphasis run inside a destination (...*%2527*...) grows an
	// [i] tag INSIDE the tag and tears it apart, which is what dropped the beginning of the URL in a
	// quoted metrika link.
	//
	// Five places encode "the server wraps a URL in [URL]...[/URL]", each with a DIFFERENT rule, on
	// purpose: this file rejects a ready block anywhere in the text; link-boundary-scanner.js reads the
	// tags as zero-width tokens inside a destination; stripUrlBBWrapper (inline-rules.js) strips a pair
	// only when it wraps the destination whole; on the render side ParserUrl (functions/url.js) makes an
	// anchor and ParserImage (functions/image.js) takes the wrapper off a src. Changing one of them does
	// not change the rest - walk the list before assuming otherwise.
	//
	// These two forms hold the URL as their CONTENT, so the whole block is stored as one unit. Either
	// may wrap the other ([img size=small][url]src[/url][/img] and [URL][img]src[/img][/URL]), which is
	// what #addTag has to expand for.
	const BB_URL_CONTENT_PATTERNS = [/\[img(?:\s[^\][\n]*)?](?:(?!\[img)[\s\S])*?\[\/img]/gi, /\[URL](?:(?!\[URL)[\s\S])*?\[\/URL]/gi];

	// [URL=...]text[/URL] holds the URL in its ATTRIBUTE, and `text` is the visible link text: ordinary
	// Markdown that the inline rules must still convert ([URL=x]**bold**[/URL] stays bold). Only the
	// opening and closing tags are stored, the text between them is left in place. An opener with no
	// closer is not a tag pair and goes to the ordinary rules, as before.
	//
	// `[\s\S]` and not `.`: the text of such a tag may span lines (validateLabel does not stop at a
	// newline, so simplify can build one), and the attribute of a two-line tag needs the same
	// protection as a one-line one. Linearity does not rest on that stop: the `(?!\[opener)` guard of
	// every pattern bounds its lazy scan at the next same-tag opener.
	//
	// The attribute admits a bracketed query parameter ("?a[0]=x", the form ParserUrl reassembles
	// on render) as one balanced [...] group per '[': a group is bounded by its own ']' and may not
	// open a tag, so an unclosed '[' still fails the opener where it stands and a run of malformed
	// openers stays O(n) instead of rescanning the tail from every one of them.
	const BB_URL_ATTRIBUTE_PATTERN = /(\[URL=(?:[^\][\n]|\[(?!\/?URL)[^\][\n]*])*])((?:(?!\[URL)[\s\S])*?)(\[\/URL])/gi;

	// A tag that opens a Markdown destination is left alone: applyLink unwraps such a
	// [URL]...[/URL] (stripUrlBBWrapper) and hands the bare destination to UrlProtector, so
	// protecting it here would nail the wrapper into the href instead.
	const DESTINATION_PREFIX = '](';
	function opensDestination(source, offset) {
		return source.startsWith(DESTINATION_PREFIX, offset - DESTINATION_PREFIX.length);
	}
	class BbTagProtector {
		#tags = [];
		#spans = [];
		#nonce = '';
		#pattern;
		#probePattern;
		#maskPattern;

		// Placeholder: ####MD_BBTAG_<nonce>_<index>####. Why it carries a nonce - utils/nonce.js.
		constructor(nonce = '') {
			this.#nonce = nonce;
			const placeholder = `${MARKDOWN_BB_TAG_PREFIX}${nonce}_(\\d+)${MARKDOWN_PLACEHOLDER_SUFFIX}`;
			this.#pattern = new RegExp(placeholder, 'g');
			// Non-global twin for containsPlaceholder: .test() on the global pattern would carry
			// lastIndex from call to call and start skipping matches.
			this.#probePattern = new RegExp(placeholder);
			this.#maskPattern = new RegExp(`${MARKDOWN_CODE_SPAN_MASK_PREFIX}${nonce}-(\\d+)${MARKDOWN_PLACEHOLDER_SUFFIX}`, 'g');
		}

		// A tag typed inside an inline code span is code, not a tag: the span is stored later, by
		// protectInlineCode, which would find the pair already replaced and put it back live inside
		// the [icode]. The spans are masked for the length of the scan (the offsets opensDestination
		// reads are taken on the same masked text) and lifted from the result and the stored tags.
		// Accepted boundary: spans are read on the raw text of the whole message, while protectInlineCode
		// reads a cell or item after EscapeHandler, so unpaired backticks around a wrapped address
		// (neighbouring cells, an escaped backtick before the tag) can close a span here and not there.
		protect(text) {
			this.#tags = [];
			let masked = this.#maskCodeSpans(text);
			for (const pattern of BB_URL_CONTENT_PATTERNS) {
				masked = masked.replaceAll(pattern, (match, offset, source) => {
					if (opensDestination(source, offset)) {
						return match;
					}
					return this.#addTag(match);
				});
			}
			masked = masked.replaceAll(BB_URL_ATTRIBUTE_PATTERN, (match, opener, linkText, closer, offset, source) => {
				if (opensDestination(source, offset)) {
					return match;
				}
				return `${this.#addTag(opener)}${linkText}${this.#addTag(closer)}`;
			});
			return this.#unmaskCodeSpans(masked);
		}
		restore(text) {
			const result = this.#expand(text);
			this.#tags = [];
			return result;
		}

		// Whether a fragment carries a tag this instance is holding. The full placeholder format
		// with the per-render nonce is compared, never a bare "MD_BBTAG" substring, so a literal
		// marker the sender typed is not taken for a protected tag (same rule as #expand).
		// The link/image rules use it to reject a label built around a hidden tag.
		containsPlaceholder(text) {
			return this.#tags.length > 0 && this.#probePattern.test(text);
		}

		// The value is expanded before it is stored: a tag matched later may hold the placeholder of
		// one matched earlier (nesting of the two content forms), and a stored value that still
		// carried a placeholder would never be expanded by the single-pass restore.
		#addTag(tag) {
			const index = this.#tags.length;
			this.#tags.push(this.#expand(tag));
			return `${MARKDOWN_BB_TAG_PREFIX}${this.#nonce}_${index}${MARKDOWN_PLACEHOLDER_SUFFIX}`;
		}
		#expand(text) {
			if (this.#tags.length === 0) {
				return text;
			}
			const tags = this.#tags;
			return text.replaceAll(this.#pattern, (match, index) => {
				const tag = tags[Number(index)];

				// Unknown index = a marker the sender typed, not one we stored (utils/nonce.js).
				return tag === undefined ? match : tag;
			});
		}

		// Mask: ####MDSPAN<nonce>-<index>#### (const.js). The masked span is stored expanded, as
		// #addTag does with a tag: the patterns run longest fence first, so a shorter fence handled
		// later can wrap the mask of a longer one (``a ```b``` c``), and a single pass lifts only the
		// outer mask.
		#maskCodeSpans(text) {
			this.#spans = [];
			if (!text.includes('`')) {
				return text;
			}
			let masked = text;
			for (const pattern of MARKDOWN_INLINE_CODE_SPAN_PATTERNS) {
				masked = masked.replaceAll(pattern, span => {
					const index = this.#spans.length;
					this.#spans.push(this.#unmask(span));
					return `${MARKDOWN_CODE_SPAN_MASK_PREFIX}${this.#nonce}-${index}${MARKDOWN_PLACEHOLDER_SUFFIX}`;
				});
			}
			return masked;
		}

		// The content patterns store a block whole, a span inside it included, so the stored tags
		// are unmasked along with the text.
		#unmaskCodeSpans(text) {
			if (this.#spans.length === 0) {
				return text;
			}
			this.#tags = this.#tags.map(tag => this.#unmask(tag));
			const result = this.#unmask(text);
			this.#spans = [];
			return result;
		}
		#unmask(text) {
			if (this.#spans.length === 0) {
				return text;
			}
			const spans = this.#spans;
			return text.replaceAll(this.#maskPattern, (match, index) => spans[Number(index)] ?? match);
		}
	}

	const BACKTICK = '`';
	const TILDE = '~';
	const FENCE_MIN_LENGTH = 3;
	const LOOSE_FENCE_OPENING = BACKTICK.repeat(FENCE_MIN_LENGTH);
	class CodeProtector {
		#blocks = [];
		#nonce = '';
		#pattern;
		#placeholderDetector;

		// Placeholder: ####MD_CODE_<nonce>_N####. Why it carries a nonce - utils/nonce.js.
		constructor(nonce = '') {
			this.#nonce = nonce;
			const placeholder = `${MARKDOWN_CODE_PREFIX}${nonce}_(\\d+)${MARKDOWN_PLACEHOLDER_SUFFIX}`;
			this.#pattern = new RegExp(placeholder, 'g');
			this.#placeholderDetector = new RegExp(placeholder);
		}
		protect(text, options = {}) {
			this.#blocks = [];

			// BBCode code blocks: [code]...[/code] — must be protected before markdown processing
			text = text.replaceAll(/\[code]([\s\S]*?)\[\/code]/gi, (match, code) => {
				return this.#addBlock(code);
			});

			// Fenced code blocks: ```lang\n...\n``` or ~~~lang\n...\n~~~
			text = this.#protectStrictFences(text, BACKTICK);
			text = this.#protectStrictFences(text, TILDE);
			if (options.looseFence) {
				text = this.#protectLooseFences(text);
			}

			// Indented code blocks: line starting with 4 spaces or tab, preceded by empty line
			text = text.replaceAll(/(^|\n)\n((?:(?: {4}|\t).+(?:\n|$))+)/g, (match, prefix, block) => {
				// The whole run is held back, not just the line carrying the placeholder: splitting it
				// would render one indented block as two code boxes around a bare line, and de-indenting
				// that line would expose it to the heading/quote/rule block rules. The indent staying
				// visible is the price of keeping both the text and the block it already holds intact.
				if (this.#holdsPlaceholder(block)) {
					return match;
				}
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

				// Unknown index = a marker the sender typed, not one we stored (utils/nonce.js).
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

		// Both fence forms are scanned instead of matched with /^(`{3,})([^\n]*)\n([\S\s]*?)^\1/gm.
		// A backreference to a series of variable length makes the engine retry every opening length
		// over the whole text, which is quadratic: a message of 12000 backticks cost 0.3 s per render,
		// and every message of every chat goes through this method.
		#protectStrictFences(text, fenceChar) {
			let result = '';
			let position = 0;
			let lineStart = 0;
			while (lineStart !== -1 && lineStart < text.length) {
				const openLength = CodeProtector.#fenceEnd(text, lineStart, fenceChar) - lineStart;
				if (openLength < FENCE_MIN_LENGTH) {
					lineStart = CodeProtector.#nextLineStart(text, lineStart);
					continue;
				}

				// The code starts on the line below the opening fence, so the rest of the opening line
				// (the language marker) is dropped together with the fence itself.
				const codeStart = CodeProtector.#nextLineStart(text, lineStart);
				if (codeStart === -1) {
					break;
				}
				const closing = CodeProtector.#findClosingLine(text, codeStart, openLength, fenceChar);
				if (closing === null) {
					// No line below opens with a fence at all, so no later opening can be closed either.
					break;
				}
				result += text.slice(position, lineStart);
				result += this.#addBlock(text.slice(codeStart, closing.start));
				position = closing.start + closing.length;
				lineStart = CodeProtector.#nextLineStart(text, position);
			}
			return result + text.slice(position);
		}

		// "Loose" fenced code, enabled by both markdown paths (#convert and decodeInline). The strict
		// pass above needs the closing fence at line start; a pasted multi-line block whose closing ```
		// sits mid-line (e.g. ```Foo\nbar\nbaz```: rest) slips past it and would otherwise fall through
		// to the single-backtick inline rule and fragment into orphaned backticks plus per-line
		// inline-code boxes. Here a 3+ backtick pair whose content spans newlines is captured whole as
		// ONE [code] block; text after the closing fence stays outside it. A single-line span has no
		// newline and keeps its inline-code rendering.
		#protectLooseFences(text) {
			let result = '';
			let position = 0;
			while (position < text.length) {
				const openStart = text.indexOf(LOOSE_FENCE_OPENING, position);
				if (openStart === -1) {
					break;
				}
				const openEnd = CodeProtector.#fenceEnd(text, openStart, BACKTICK);
				const closing = CodeProtector.#findClosingFence(text, openEnd, openEnd - openStart);
				if (closing === null) {
					result += text.slice(position, openEnd);
					position = openEnd;
					continue;
				}

				// A trimmed fence leaves the extra backticks of the opening series inside the code.
				const code = text.slice(openStart + closing.length, closing.start);
				const spanEnd = closing.start + closing.length;
				const isBlock = code.includes(NEW_LINE) && !this.#holdsPlaceholder(code);
				result += text.slice(position, openStart);
				result += isBlock ? this.#addBlock(code) : text.slice(openStart, spanEnd);
				position = spanEnd;
			}
			return result + text.slice(position);
		}

		// A span that already carries a placeholder of this instance is never stored as a block:
		// restore() runs over the text once, so a placeholder kept inside a block would reach the user
		// verbatim and the code it stands for would be lost. Only the full per-render format counts —
		// a bare "####MD_CODE_" typed by the sender is ordinary code and must stay convertible.
		#holdsPlaceholder(code) {
			return this.#placeholderDetector.test(code);
		}

		// The closing series must open a line and be at least as long as the opening one. When no line
		// below is that long, the opening series is trimmed to the longest one there is - the greedy
		// group of the old pattern did the same by backtracking to a shorter fence.
		static #findClosingLine(text, from, openLength, fenceChar) {
			let lineStart = from;
			let longestStart = -1;
			let longestLength = 0;
			while (lineStart !== -1 && lineStart < text.length) {
				const length = CodeProtector.#fenceEnd(text, lineStart, fenceChar) - lineStart;
				if (length >= openLength) {
					return {
						start: lineStart,
						length: openLength
					};
				}
				if (length > longestLength) {
					longestStart = lineStart;
					longestLength = length;
				}
				lineStart = CodeProtector.#nextLineStart(text, lineStart);
			}
			return longestLength < FENCE_MIN_LENGTH ? null : {
				start: longestStart,
				length: longestLength
			};
		}

		// Same rule for a loose fence, which may close anywhere rather than at a line start. Trimming
		// stops halfway through the opening series: a fence shorter than what it leaves behind would be
		// closed by that leftover right away and capture nothing.
		static #findClosingFence(text, from, openLength) {
			let index = from;
			let longestStart = -1;
			let longestLength = 0;
			while (index < text.length) {
				const start = text.indexOf(BACKTICK, index);
				if (start === -1) {
					break;
				}
				const end = CodeProtector.#fenceEnd(text, start, BACKTICK);
				const length = end - start;
				if (length >= openLength) {
					return {
						start,
						length: openLength
					};
				}
				if (length > longestLength) {
					longestStart = start;
					longestLength = length;
				}
				index = end;
			}
			if (longestLength < FENCE_MIN_LENGTH || longestLength <= openLength - longestLength) {
				return null;
			}
			return {
				start: longestStart,
				length: longestLength
			};
		}
		static #fenceEnd(text, start, fenceChar) {
			let end = start;
			while (end < text.length && text[end] === fenceChar) {
				end++;
			}
			return end;
		}
		static #nextLineStart(text, from) {
			const lineEnd = text.indexOf(NEW_LINE, from);
			return lineEnd === -1 ? -1 : lineEnd + 1;
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

		/**
		 * Expand the placeholders of a fragment WITHOUT consuming the storage: the image rule needs
		 * the escapes of a label back before toMarkdownInertToken encodes the alt out of restore's
		 * reach, while the rest of the text is still restored by the final restore() below.
		 *
		 * @param {string} text
		 * @return {string}
		 */
		expand(text) {
			if (this.#escapes.length === 0) {
				return text;
			}
			const escapes = this.#escapes;
			return text.replaceAll(ESCAPE_PLACEHOLDER_PATTERN,
			// A user-typed literal "####MD_ESC_N####" (or an out-of-range index) has no
			// stored char — leave the marker untouched instead of emitting "undefined".
			(match, index) => escapes[Number(index)] ?? match);
		}
		restore(text) {
			const result = this.expand(text);
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

	// Hides a link/image destination behind a placeholder for the span of the inline rules, then
	// restores it byte-for-byte. Without it a URL carrying Markdown-significant characters
	// (`*`, `_`, balanced parens, percent-escapes) is reparsed by the bold/italic/link rules that
	// run after applyImage/applyLink and corrupted before it reaches the [URL=...]/[img] tag.
	//
	// Unlike MentionProtector.protect (one call over the whole text), protect() here is invoked
	// once per matched destination and appends to the instance store; restore() expands every
	// placeholder of this instance and clears it. One instance is shared across a whole converter
	// call (full inline pass + table cells + list items) and restored once, after applyHtmlRules.
	class UrlProtector {
		#urls = [];
		#nonce = '';
		#pattern;

		// Placeholder: ####MD_URL_<nonce>_<index>####. Why it carries a nonce - utils/nonce.js.
		constructor(nonce = '') {
			this.#nonce = nonce;
			this.#pattern = new RegExp(`${MARKDOWN_URL_PREFIX}${nonce}_(\\d+)${MARKDOWN_PLACEHOLDER_SUFFIX}`, 'g');
		}
		protect(url) {
			const index = this.#urls.length;
			this.#urls.push(url);
			return `${MARKDOWN_URL_PREFIX}${this.#nonce}_${index}${MARKDOWN_PLACEHOLDER_SUFFIX}`;
		}
		restore(text) {
			if (this.#urls.length === 0) {
				return text;
			}
			const urls = this.#urls;
			const result = text.replaceAll(this.#pattern, (match, index) => {
				const url = urls[Number(index)];

				// Unknown index = a marker the sender typed, not one we stored (utils/nonce.js).
				return url === undefined ? match : url;
			});
			this.#urls = [];
			return result;
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

	// Finds where the destination of a Markdown link / image ends, starting right after the "]("
	// prefix. Replaces the destination group of the old LINK_PATTERN/IMAGE_PATTERN regexes, which
	// only knew one level of balanced parens and kept the <...> wrapper in the href.
	//
	// The grammar is normative, not a local implementation choice: the mobile copy of the parser still
	// runs the old regex and is to be ported to this one verbatim (separate task), so a divergence is a
	// parity defect. It is written down in
	// im/.ai/knowledge-base/notes/features/markdown-link-boundary-grammar.md and pinned by the
	// "link boundary" / "server [URL] wrapper" describe blocks of test/functions/markdown.test.js -
	// those two are checked, this comment is not, so they win on any disagreement.
	//
	// Anything the grammar rejects means "this is not a link": the caller falls back to plain text.
	// `resume` is how far the scan got; the caller re-enters the region behind it only within its
	// re-read budget (see replaceLinkLike), or a run of "](" turns the pass quadratic.

	// The tags of the server wrapper as the source spells them, empty until each is met (an empty
	// openTag means the destination is not wrapped at all).

	// A step of the destination loop also yields what the href takes from it - one literal character
	// for an escape pair, nothing for the zero-width tags of the wrapper.

	// The stop class of the plain form is the \s of the old regex (space, tab, NBSP, Unicode
	// spaces) - property escapes are avoided on purpose, the Android runtime of the port has none.
	const WHITESPACE_PATTERN = /\s/;

	// The server rewrites a bare url standing inside "(...)" into a BB anchor, cutting it at the
	// FIRST ')' and pulling an optional title along: "[t](url "hint")" comes back from Im\Text::parse
	// as "[t]([URL]url "hint"[/URL])", and "[t](a/(b))" as "[t]([URL]a/(b[/URL]))" - the wrapper covers
	// a prefix of the destination and its tail stands outside. Both tags are therefore read as
	// zero-width tokens: the scan steps over them and grades the characters around the cut as one
	// stream, which is what makes parens, escaping and titles survive the echo. An opener with no
	// closer before the ')' is as broken as an unclosed title - the fragment stays plain text.
	const URL_TAG_OPEN = '[url]';
	const URL_TAG_CLOSE = '[/url]';

	// What a title may stand behind: an address the renderer really turns into an anchor. ParserUrl
	// hands the destination to getUtils().text.checkUrl, which takes a leading '/' or one of the
	// schemes below - compared with startsWith, so the case matters there as it does here - and
	// nothing else, "www." included. Converting a fragment the renderer will not link ("[t](literally
	// "a quote")") drops its tail from the message instead of linking it. The list is copied and not
	// called on purpose: the scan keeps no runtime dependency of its own, so the port can take it as
	// it stands.
	const URL_LIKE_PATTERN = /^(?:\/|https?:|ftp:|file:|tel:|callto:|mailto:|skype:|viber:)/;

	/**
	 * @param {string} text
	 * @param {number} openPos - first character after "]("
	 * @return {LinkDestinationScan}
	 */
	function scanLinkDestination(text, openPos) {
		if (text[openPos] === '<') {
			return scanAngle(text, openPos + 1, openPos);
		}
		return scanPlain(text, openPos);
	}

	/**
	 * The plain form: parens of any depth, closed by the ')' that brings the depth back to zero or
	 * handed over to the title scan by the first whitespace. The tags of the server wrapper are
	 * stepped over wherever they stand (see URL_TAG_OPEN).
	 *
	 * @param {string} text
	 * @param {number} openPos
	 * @return {LinkDestinationScan}
	 */
	function scanPlain(text, openPos) {
		let wrapper = openWrapper(text, openPos);
		let i = openPos + wrapper.openTag.length;
		let depth = 0;
		let href = '';
		while (i < text.length) {
			if (exceedsScanLimit(i, openPos)) {
				return fail(i);
			}
			const step = readTransparentStep(text, i, wrapper);
			if (step !== null) {
				href += step.char;
				i = step.next;
				wrapper = step.wrapper;
				continue;
			}
			const char = text[i];
			if (char === '\n') {
				return fail(i);
			}
			if (WHITESPACE_PATTERN.test(char)) {
				// An open '(' can no longer balance once the destination has ended - not a link,
				// like the newline above (the old regex required balanced parens here too).
				if (depth > 0) {
					return fail(i);
				}
				return endDestinationAtSpace(text, i, href, openPos, wrapper);
			}
			if (char === ')' && depth === 0) {
				return closeDestination(href, i, wrapper);
			}
			depth = nextParenDepth(char, depth);
			href += char;
			i += 1;
		}
		return fail(i);
	}

	/**
	 * @param {string} text
	 * @param {number} spacePos
	 * @param {string} href
	 * @param {number} openPos
	 * @param {ServerWrapper} wrapper
	 * @return {LinkDestinationScan}
	 */
	function endDestinationAtSpace(text, spacePos, href, openPos, wrapper) {
		// A title with no destination in front of it ("[t]( \"x\")") is not a link.
		if (href === '') {
			return fail(spacePos);
		}
		return scanTitleThenClose(text, spacePos, href, openPos, wrapper);
	}

	/**
	 * The ')' that brings the paren depth back to zero ends the plain form - unless the wrapper the
	 * server opened has not been closed before it: an opener with no closer is as broken as an
	 * unclosed title, and the fragment carrying it stays plain text.
	 *
	 * @param {string} href
	 * @param {number} closePos
	 * @param {ServerWrapper} wrapper
	 * @return {LinkDestinationScan}
	 */
	function closeDestination(href, closePos, wrapper) {
		if (isWrapperPending(wrapper)) {
			return fail(closePos);
		}
		return {
			href: restoreWrapper(wrapper, href),
			titleDropped: false,
			end: closePos
		};
	}

	/**
	 * @return {number} the paren depth after `char`; the ')' that closes the destination is taken by
	 *   the caller and never reaches here
	 */
	function nextParenDepth(char, depth) {
		if (char === '(') {
			return depth + 1;
		}
		return char === ')' ? depth - 1 : depth;
	}

	/**
	 * The <...> form: an explicit wrapper that lets a destination carry spaces.
	 *
	 * @param {string} text
	 * @param {number} start - first character after '<'
	 * @param {number} openPos
	 * @return {LinkDestinationScan}
	 */
	function scanAngle(text, start, openPos) {
		// Im\Text::parse leaves the <...> form alone, so a "[url]" written inside it is the sender's
		// own text and takes no part in the scan: nothing is ever stepped over here, and the wrapper
		// comes back from readEscapePair the way it went in. The form survives because parse runs with
		// allow['HTML'] = 'Y' - '<' is never escaped to "&lt;", so the "&lt;"..."&gt;" boundary pair
		// (textparser.php:450) never fires, and the general autolink pattern (textparser.php:466) takes
		// only a wordSeparator character (textparser.php:102) before the scheme.
		const wrapper = noWrapper();
		let i = start;
		let href = '';
		while (i < text.length) {
			if (exceedsScanLimit(i, openPos)) {
				return fail(i);
			}
			const escape = readEscapePair(text, i, wrapper);
			if (escape !== null) {
				href += escape.char;
				i = escape.next;
				continue;
			}
			const char = text[i];
			if (char === '\n' || char === '<') {
				return fail(i);
			}
			if (char === '>') {
				// An empty wrapper ("[t](<>)") is an empty href, like the empty plain form.
				return scanTitleThenClose(text, i + 1, href, openPos, wrapper);
			}
			href += char;
			i += 1;
		}
		return fail(i);
	}

	/**
	 * Tail of both forms: optional title in quotes, then the closing ')'. The title is only skipped -
	 * it is never carried into the tag - and the server wrapper is stepped over here as well, since
	 * the cut may fall anywhere between the destination and the ')'.
	 *
	 * @param {string} text
	 * @param {number} start
	 * @param {string} href
	 * @param {number} openPos
	 * @param {ServerWrapper} wrapper
	 * @return {LinkDestinationScan}
	 */
	function scanTitleThenClose(text, start, href, openPos, wrapper) {
		let tail = skipTail(text, start, openPos, wrapper);
		if (exceedsScanLimit(tail.next, openPos)) {
			return fail(tail.next);
		}

		// A title, unlike a destination, is ordinary text: when the fragment turns out not to be a
		// link the caller has to re-read it from the opening quote, or a valid link standing inside
		// an unclosed title is lost with it. Resuming there keeps the pass linear - every retry
		// starts after the previous one, and a title scan ends at the next quote of the same kind.
		let resume = tail.next;
		if (text[tail.next] === '"' || text[tail.next] === "'") {
			resume = tail.next + 1;
			const title = skipQuotedTitle(text, tail.next, openPos, tail.wrapper);
			if (title === null) {
				return fail(resume);
			}
			if (!URL_LIKE_PATTERN.test(href)) {
				return fail(resume);
			}
			tail = skipTail(text, title.next, openPos, title.wrapper);
			if (exceedsScanLimit(tail.next, openPos)) {
				return fail(resume);
			}
		}

		// text[tail.next] is undefined at the end of the text - no ')', so not a link; neither is a
		// wrapper the server opened and never closed.
		if (text[tail.next] === ')' && !isWrapperPending(tail.wrapper)) {
			return {
				href: restoreWrapper(tail.wrapper, href),
				titleDropped: true,
				end: tail.next
			};
		}
		return fail(resume);
	}

	/**
	 * @param {string} text
	 * @param {number} quotePos - index of the opening quote
	 * @param {number} openPos
	 * @param {ServerWrapper} wrapper
	 * @return {?WrapperStep} `next` - first index after the closing quote; null when the title does
	 *   not close on this line or the scan ceiling is reached
	 */
	function skipQuotedTitle(text, quotePos, openPos, wrapper) {
		const quote = text[quotePos];
		let i = quotePos + 1;
		let current = wrapper;
		while (!exceedsScanLimit(i, openPos) && i < text.length && text[i] !== '\n') {
			const tag = readWrapperClose(text, i, current);
			if (tag !== null) {
				i = tag.next;
				current = tag.wrapper;
				continue;
			}
			const escape = readTitleEscapePair(text, i, quote, current);
			if (escape !== null) {
				i = escape.next;
				current = escape.wrapper;
				continue;
			}
			if (text[i] === quote) {
				return {
					next: i + 1,
					wrapper: current
				};
			}
			i += 1;
		}
		return null;
	}

	/**
	 * An escaped quote of the same kind (and an escaped backslash) does not close the title. The pair
	 * is read through the closing tag of the server wrapper the way readEscapePair reads it inside a
	 * destination, or a cut falling between the backslash and the quote would close the title on a
	 * quote the sender escaped.
	 *
	 * @return {?WrapperStep} `next` - first index after the pair
	 */
	function readTitleEscapePair(text, i, quote, wrapper) {
		if (text[i] !== '\\') {
			return null;
		}
		const afterBackslash = readWrapperClose(text, i + 1, wrapper) ?? {
			next: i + 1,
			wrapper
		};
		const charPos = afterBackslash.next;
		if (text[charPos] !== quote && text[charPos] !== '\\') {
			return null;
		}
		return {
			next: charPos + 1,
			wrapper: afterBackslash.wrapper
		};
	}

	/**
	 * Skips what may stand between the parts of the tail: spaces, tabs and the closing tag of the
	 * server wrapper, in whatever order the cut left them.
	 *
	 * The space class here is NARROWER than the destination stop class: only space and tab, so an
	 * NBSP between the destination and the title keeps the fragment plain text.
	 *
	 * @return {WrapperStep} `next` - first index of anything else; stops at the scan ceiling, which
	 *   the caller re-checks
	 */
	function skipTail(text, start, openPos, wrapper) {
		let i = start;
		let current = wrapper;
		while (!exceedsScanLimit(i, openPos)) {
			if (text[i] === ' ' || text[i] === '\t') {
				i += 1;
				continue;
			}
			const tag = readWrapperClose(text, i, current);
			if (tag === null) {
				break;
			}
			i = tag.next;
			current = tag.wrapper;
		}
		return {
			next: i,
			wrapper: current
		};
	}
	function noWrapper() {
		return {
			openTag: '',
			closeTag: ''
		};
	}

	/**
	 * The server wrapper only ever opens the destination (Im\Text::parse rewrites the url standing
	 * right after the "]("), so a "[url]" written anywhere else is the sender's own text and stays in
	 * the href as such. The tag is kept as the source spells it, case included: what comes back has to
	 * read as one wrapper to stripUrlBBWrapper and to the image renderer.
	 *
	 * @param {string} text
	 * @param {number} openPos
	 * @return {ServerWrapper}
	 */
	function openWrapper(text, openPos) {
		if (!matchesTag(text, openPos, URL_TAG_OPEN)) {
			return noWrapper();
		}
		return {
			openTag: text.slice(openPos, openPos + URL_TAG_OPEN.length),
			closeTag: ''
		};
	}
	function isWrapperPending(wrapper) {
		return wrapper.openTag !== '' && wrapper.closeTag === '';
	}

	/**
	 * Reads the closing tag of the server wrapper standing at `i`, keeping it as the source spells it.
	 * The step is offered, not applied: the escape readers take it only once a real pair turns out to
	 * stand behind the tag (readEscapePair, readTitleEscapePair).
	 *
	 * @return {?WrapperStep} null when no tag stands at `i` - the case every character of the
	 *   destination goes through, so it costs no object of its own
	 */
	function readWrapperClose(text, i, wrapper) {
		if (!isWrapperPending(wrapper) || !matchesTag(text, i, URL_TAG_CLOSE)) {
			return null;
		}
		return {
			next: i + URL_TAG_CLOSE.length,
			wrapper: {
				openTag: wrapper.openTag,
				closeTag: text.slice(i, i + URL_TAG_CLOSE.length)
			}
		};
	}

	/**
	 * The destination as the sender wrote it, with the wrapper put back around it whole. The rules
	 * downstream keep the policy they have for a wrapper the server did not cut: applyLink unwraps it
	 * (stripUrlBBWrapper), an image keeps it in the src (ParserImage.decodeImageBbCode takes it off).
	 */
	function restoreWrapper(wrapper, href) {
		return `${wrapper.openTag}${href}${wrapper.closeTag}`;
	}

	/**
	 * The two things the destination loop reads without grading them: the closing tag of the server
	 * wrapper, which is zero-width, and an escape pair, which stands for a single literal character.
	 *
	 * @return {?DestinationStep} null when the character at `i` is for the loop itself to grade
	 */
	function readTransparentStep(text, i, wrapper) {
		const tag = readWrapperClose(text, i, wrapper);
		if (tag !== null) {
			return {
				char: '',
				next: tag.next,
				wrapper: tag.wrapper
			};
		}
		return readEscapePair(text, i, wrapper);
	}

	/**
	 * The escape pair starting at `i`, or null when this backslash escapes nothing. The server may cut
	 * the pair in two ("foo\[/URL])bar" for "foo\)bar"), so the closing tag standing between the
	 * backslash and the character it escapes is looked past - and the step over it is taken only when
	 * a real pair turns out to be there, which is why the tag travels back in the return value.
	 *
	 * @return {?DestinationStep} `next` - first index after the pair
	 */
	function readEscapePair(text, i, wrapper) {
		if (text[i] !== '\\') {
			return null;
		}
		const afterBackslash = readWrapperClose(text, i + 1, wrapper) ?? {
			next: i + 1,
			wrapper
		};
		const charPos = afterBackslash.next;
		if (!ESCAPABLE_CHARS.includes(text[charPos])) {
			return null;
		}
		return {
			char: text[charPos],
			next: charPos + 1,
			wrapper: afterBackslash.wrapper
		};
	}

	/**
	 * @param {string} text
	 * @param {number} pos
	 * @param {string} tag - lower-case tag to compare against; the source keeps its own case
	 * @return {boolean}
	 */
	function matchesTag(text, pos, tag) {
		// The first character is compared before slicing: this runs on every step of the destination
		// loop, where a slice per character would be pure waste.
		return text[pos] === tag[0] && text.slice(pos, pos + tag.length).toLowerCase() === tag;
	}
	function exceedsScanLimit(i, openPos) {
		return i - openPos > MAX_URL_SCAN_LENGTH;
	}
	function fail(resume) {
		return {
			fail: true,
			resume
		};
	}

	// The link text / image alt taken from validateLabel, `start` being the index the caller cuts at.

	// Shared contract of the label acceptors (createLinkLabelAcceptor): the label to build the tag
	// from, or null to reject the fragment.

	// Hides a scanned destination behind a placeholder (createDestinationProtector).

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
	function inlineCodeRestorePattern(nonce) {
		return new RegExp(`${MARKDOWN_INLINE_CODE_PREFIX}${nonce}_(\\d+)${MARKDOWN_PLACEHOLDER_SUFFIX}`, 'g');
	}
	function inlineCodePlaceholderOnlyPattern(nonce) {
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
	function hasWordCharBefore(text, offset) {
		return offset > 0 && wordCharPattern.test(text[offset - 1]);
	}

	/**
	 * Per-render state the converter hands to the inline pass. Named rather than positional: as
	 * arguments these were five interchangeable nulls, and a swapped pair raised nothing - the pass
	 * simply stopped seeing the protector it was given.
	 */

	/**
	 * The cell pass takes only the two protectors of InlineRulesContext: it restores its own inline
	 * code and renders no images, so a deferred storage, nonce or escape handler has nothing to do here.
	 */

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
	function applyInlineRules(text, context = {}) {
		const {
			deferredCodeStorage = null,
			nonce = null,
			urlProtector = null,
			bbTagProtector = null,
			escapeHandler = null
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
		if (deferredCodeStorage === null) {
			text = restoreInlineCode(text, inlineCodeBlocks, codeNonce);
		}
		if (urlProtector === null) {
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
	function applyCellInlineRules(text, context = {}) {
		const {
			urlProtector = null,
			bbTagProtector = null
		} = context;
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
		if (urlProtector === null) {
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
	function protectInlineCode(text, storage, nonce) {
		if (!text.includes('`')) {
			return text;
		}
		const placeholderOnly = inlineCodePlaceholderOnlyPattern(nonce);
		const makePlaceholder = index => `${MARKDOWN_INLINE_CODE_PREFIX}${nonce}_${index}${MARKDOWN_PLACEHOLDER_SUFFIX}`;

		// Triple backticks first: ```code```
		text = text.replaceAll(MARKDOWN_INLINE_CODE_TRIPLE_PATTERN, (match, code) => {
			const index = storage.length;
			storage.push(code.trim());
			return makePlaceholder(index);
		});

		// Double backticks: ``code``
		text = text.replaceAll(MARKDOWN_INLINE_CODE_DOUBLE_PATTERN, (match, code) => {
			if (placeholderOnly.test(code)) {
				return match;
			}
			const index = storage.length;
			storage.push(code.trim());
			return makePlaceholder(index);
		});

		// Single backticks: `code`
		text = text.replaceAll(MARKDOWN_INLINE_CODE_SINGLE_PATTERN, (match, code) => {
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
	function createDestinationProtector(protector, storage, nonce) {
		return url => {
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
	function createLinkLabelAcceptor(protector) {
		if (protector === null) {
			return label => label;
		}
		return label => protector.containsPlaceholder(label) ? null : label;
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
	function renderPlaceholderPattern(nonce) {
		return new RegExp([`${MARKDOWN_PLACEHOLDER_PREFIX}_[A-Z]+_${nonce}_\\d+${MARKDOWN_PLACEHOLDER_SUFFIX}`, `${MARKDOWN_ESCAPE_PREFIX}\\d+${MARKDOWN_PLACEHOLDER_SUFFIX}`, `${MARKDOWN_LIST_TAG_PREFIX}\\d+${MARKDOWN_PLACEHOLDER_SUFFIX}`].join('|'));
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
	function createEscapeExpander(handler) {
		if (handler === null) {
			return label => label;
		}
		return label => handler.expand(label);
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
	function createImageLabelAcceptor(acceptLinkLabel, nonce, expandEscapes) {
		const placeholderPattern = renderPlaceholderPattern(nonce);
		return label => {
			const linkLabel = acceptLinkLabel(label);
			if (linkLabel === null) {
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
	function applyImage(text, protectDestination, acceptLabel) {
		// A Markdown image always contains "](" - without it there is nothing to scan, so bail
		// early. This is also the outer cost cap of the pass (see the DoS finding).
		if (!text.includes('](')) {
			return text;
		}
		return replaceLinkLike(text, true, acceptLabel, (alt, url) => {
			const altToken = toMarkdownInertToken(alt);
			// The image URL is NOT unwrapped ([url]...[/url] stripping is link-only); protect the raw
			// destination so its Markdown-significant chars survive the inline rules that follow.
			const protectedUrl = protectDestination(url);
			if (altToken === '') {
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
	function replaceLinkLike(text, isImage, acceptLabel, buildTag) {
		let searchPos = 0;
		// Everything before this index is already in `result` - the label of the next match may
		// not reach back into it (String.replaceAll never re-matched consumed text either).
		let emittedTo = 0;
		let result = '';
		// Characters failed scans have left re-readable so far (the linearity requirement above).
		let rescanDebt = 0;
		for (;;) {
			const prefixPos = text.indexOf('](', searchPos);
			if (prefixPos === -1) {
				break;
			}
			const label = validateLabel(text, prefixPos, isImage, emittedTo, acceptLabel);
			if (label === null) {
				searchPos = prefixPos + 2;
				continue;
			}
			const scan = scanLinkDestination(text, prefixPos + 2);
			if (scan.fail === true) {
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
	function validateLabel(text, prefixPos, isImage, minPos, acceptLabel) {
		const lowestStart = Math.max(minPos, prefixPos - MAX_LABEL_LENGTH - 1);
		for (let i = prefixPos - 1; i >= lowestStart; i--) {
			if (text[i] === ']') {
				return null;
			}
			if (text[i] !== '[') {
				continue;
			}
			const hasBang = i > minPos && text[i - 1] === '!';
			if (hasBang !== isImage) {
				return null;
			}
			const label = text.slice(i + 1, prefixPos);
			if (!isImage && label === '') {
				return null;
			}
			const acceptedLabel = acceptLabel(label);
			if (acceptedLabel === null) {
				return null;
			}
			return {
				start: isImage ? i - 1 : i,
				text: acceptedLabel
			};
		}
		return null;
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
	 * Strip the server-added [URL]...[/URL] wrapper from a URL value. Im\Text::parse auto-wraps bare
	 * URLs before the client receives the message: `(https://google.com)` arrives as
	 * `([URL]https://google.com[/URL])`. The scanner hands the destination back with the pair around
	 * it whole (restoreWrapper), so one unwrapping rule serves every shape.
	 *
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
	function applyLink(text, protectDestination, acceptLabel) {
		// A Markdown link always contains "](" - without it there is nothing to scan, so bail
		// early. This is also the outer cost cap of the pass: a client-side DoS reachable from
		// MarkdownConverter.decode before Text.encode.
		if (!text.includes('](')) {
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

	// A line opening with a long number ("255502. test") is an order id, a phone or a
	// contract number, not a list: turning it into <ol start=...> moves the number into the
	// marker, which then does not fit the list indent and looks truncated. Real chat lists
	// start small, so a marker that OPENS a list is capped at three digits ("1." to "999.").
	// The cap applies to the start of a list only - the lines startsNewList() answers yes for.
	// Inside an already open list a marker of any length is just the next item ("998./999./1000."
	// is one list), because only the first number is kept: the browser numbers the rest itself
	// from <ol start>. The <ol> indent (parser.css) is therefore sized for "999.", the widest
	// marker accepted as the START of a list; a long list started near the cap ("999." plus
	// MAX_LIST_ITEMS items reaches "1198.") can still outgrow that indent - an accepted
	// limitation, not a guarantee.
	// Exported because that indent is the other half of the cap and lives in a file this one
	// cannot see: the stylesheet declares the digit count it was measured for, and
	// test/functions/markdown-list-indent.test.js holds the two against each other.
	const MAX_ORDERED_MARKER_DIGITS = 3;
	// The capped source answers "can a list START here?" - it backs the opening-marker test, the
	// "is there any list line?" probe and the pipeline fast-path (MARKDOWN_TRIGGER in
	// ../converter.js), which can therefore never disagree on where a list may begin. The
	// per-line parse is deliberately uncapped: it also has to see continuation markers.
	const ORDERED_MARKER_SOURCE = `\\d{1,${MAX_ORDERED_MARKER_DIGITS}}\\.`;
	const LIST_ITEM_PATTERN = /^([\t ]*)([*+-]|\d+\.)[\t ]+(.*)$/;
	const OPENING_ORDERED_MARKER_PATTERN = new RegExp(`^${ORDERED_MARKER_SOURCE}$`);
	const HAS_LIST_ITEM_PATTERN = new RegExp(`^[ \\t]*(?:[*+-]|${ORDERED_MARKER_SOURCE})[ \\t]+`, 'm');
	const MAX_RULE_LENGTH = 20;
	// Largest number of items one emitted [list] may carry, symmetric to the render cap
	// (functions/list.js MAX_LIST_ITEMS): a longer run is split into sibling [list] blocks, so
	// every parsed item lands in a list ParserList.decodeList actually draws. The split is done
	// on OUTPUT (convertLists), after the whole run of list lines is parsed as one list - a
	// technical chunk must not look like a place where the user started a new list, or the item
	// behind it would be re-tested against the opening digit cap and fall out as plain text.
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
	 * Read one line as a list item. Its marker is reported in three parts, because the callers
	 * need different ones: `ordered` is the list type the item belongs to (tryParseList places it
	 * by that and `indent`), `canOpen` says whether such a marker may begin a list at all, and
	 * `start` is the number buildList puts on <ol start> when the item is the first of one.
	 *
	 * @param {string} line
	 * @param {?UrlProtector} [urlProtector] - UrlProtector of the current render; null lets
	 *   applyCellInlineRules protect and restore the URLs of the item on its own
	 * @param {?BbTagProtector} [bbTagProtector] - BbTagProtector of the current render, consulted by
	 *   the label acceptor of the item link rule (createLinkLabelAcceptor)
	 * @returns {{
	 *     indent: number, ordered: boolean, canOpen: boolean, start: number | null, content: string
	 * } | null}
	 */
	function parseListItem(line, urlProtector = null, bbTagProtector = null) {
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
			// Whether this marker may START a list; a bullet always may (see the digit cap above).
			canOpen: !ordered || OPENING_ORDERED_MARKER_PATTERN.test(marker),
			// First item's number seeds <ol start> (CommonMark: later item numbers are ignored).
			start: ordered ? parseInt(marker, 10) : null,
			content: defangListTags(applyCellInlineRules(match[3], {
				urlProtector,
				bbTagProtector
			}))
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
		// The MAX_LIST_ITEMS split (convertLists) hands the next chunk a continuation item, whose
		// number is not capped, so `first` is not always an opening marker. Only carry a start we
		// can round-trip as plain digits: Number.isSafeInteger rejects values >= 2^53 whose String()
		// form is either imprecise or exponential ("1e+21"), which would leak as raw BB (no
		// `start=\d+` regex matches it). Such an absurd start degrades to bare [list=1] rather than
		// breaking the list.
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
	 * Whether this item STARTS a list instead of continuing an open one - which is exactly where
	 * the opening digit cap has to be paid. Three cases, and buildList splits the output at the
	 * same three: nothing is open yet, the item is deeper than every open level, or its marker
	 * type differs from the level it lands on (CommonMark: an ordered item cannot extend a bullet
	 * list and vice versa, so the type change begins a new list of its own).
	 *
	 * @param {Array<Object>} openLevels
	 * @param {Object} item
	 * @returns {boolean}
	 */
	function startsNewList(openLevels, item) {
		const level = openLevels.at(-1);
		return !level || item.indent > level.indent || item.ordered !== level.ordered;
	}

	/**
	 * Close every level the item is too shallow to belong to.
	 *
	 * @param {Array<Object>} openLevels
	 * @param {Object} item
	 */
	function closeDeeperLevels(openLevels, item) {
		while (openLevels.length > 0 && openLevels.at(-1).indent > item.indent) {
			openLevels.pop();
		}
	}

	/**
	 * Put the level this item opens on the stack. A deeper item nests one inside the open levels;
	 * a type change replaces the level it happens on, since the list open there has just ended.
	 *
	 * @param {Array<Object>} openLevels
	 * @param {Object} item
	 */
	function openLevel(openLevels, item) {
		if (openLevels.length > 0 && openLevels.at(-1).indent === item.indent) {
			openLevels.pop();
		}
		openLevels.push({
			indent: item.indent,
			ordered: item.ordered
		});
	}

	/**
	 * Parse one uninterrupted run of list lines. The run is bounded by the text only: item
	 * count is capped when the output is built (MAX_LIST_ITEMS in convertLists), so the list
	 * stays open here for as long as the user kept writing it.
	 *
	 * Line by line: an item that only continues an open level is taken as is, while an item that
	 * starts a list (startsNewList) is taken only if its marker may open one - otherwise the run
	 * ends there and the line stays plain text.
	 *
	 * @param {string[]} lines
	 * @param {number} startIndex
	 * @param {?UrlProtector} [urlProtector] - UrlProtector of the current render, forwarded to every
	 *   item the run parses
	 * @param {?BbTagProtector} [bbTagProtector] - BbTagProtector of the current render, forwarded the
	 *   same way
	 * @returns {{ items: Array<Object>, endIndex: number } | null}
	 */
	function tryParseList(lines, startIndex, urlProtector = null, bbTagProtector = null) {
		const items = [];
		// The list levels open at this point, innermost last: indent and marker type of each.
		const openLevels = [];
		let i = startIndex;
		while (i < lines.length) {
			const item = parseListItem(lines[i], urlProtector, bbTagProtector);
			if (!item) {
				break;
			}
			closeDeeperLevels(openLevels, item);
			if (startsNewList(openLevels, item)) {
				if (!item.canOpen) {
					break;
				}
				openLevel(openLevels, item);
			}
			items.push(item);
			i++;
		}
		if (items.length === 0) {
			return null;
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
	 * @param {ConvertListsOptions} [options]
	 * @param {string} [options.mode] - 'decode' or 'simplify'
	 * @param {?UrlProtector} [options.urlProtector] - UrlProtector of the current render, forwarded to
	 *   every item; null lets each item protect and restore its own URLs
	 * @param {?BbTagProtector} [options.bbTagProtector] - BbTagProtector of the current render,
	 *   forwarded the same way
	 * @returns {string}
	 */
	function convertLists(text, options = {}) {
		const {
			mode = 'decode',
			urlProtector = null,
			bbTagProtector = null
		} = options;
		if (!HAS_LIST_ITEM_PATTERN.test(text)) {
			return text;
		}
		const lines = text.split('\n');
		const result = [];
		let i = 0;
		while (i < lines.length) {
			const list = tryParseList(lines, i, urlProtector, bbTagProtector);
			if (list) {
				// One entry per chunk: the entries are joined by '\n' below, so a split run reads
				// as consecutive list blocks, exactly as a run of separate lists would.
				for (let start = 0; start < list.items.length; start += MAX_LIST_ITEMS$1) {
					result.push(formatList(list.items.slice(start, start + MAX_LIST_ITEMS$1), mode));
				}
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

		// Placeholder: ####MD_TABLEGUARD_<nonce>_N####. Why it carries a nonce - utils/nonce.js.
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
	function encodeCell(cell, urlProtector, bbTagProtector) {
		return defangCellTableTags(applyCellInlineRules(cell, {
			urlProtector,
			bbTagProtector
		}));
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
	 * @param {?UrlProtector} urlProtector - UrlProtector of the current render; null lets every cell
	 *   protect and restore its own URLs (convertTables passes null in the standalone mode)
	 * @param {?BbTagProtector} bbTagProtector - BbTagProtector of the current render, consulted by the
	 *   label acceptor of the cell link rule (createLinkLabelAcceptor)
	 * @returns {string}
	 */
	function encodeTableBb(tableData, urlProtector, bbTagProtector) {
		const {
			headers,
			rows
		} = tableData;
		const encode = cell => encodeCell(cell, urlProtector, bbTagProtector);
		const head = `[tr]${headers.map(cell => `[th]${encode(cell)}[/th]`).join('')}[/tr]`;
		const body = rows.map(cells => `[tr]${cells.map(cell => `[td]${encode(cell)}[/td]`).join('')}[/tr]`).join('');
		return `[table]${head}${body}[/table]`;
	}

	/**
	 * - decode: a canonical [table] BB-code block (rendered later by
	 *   ParserTable.decodeTable as an HTML-grid).
	 * - simplify: a localized plain placeholder for preview surfaces.
	 *
	 * @param {{ headers: string[], rows: string[][] }} tableData
	 * @param {ConvertTablesOptions} options
	 * @param {string} options.mode
	 * @param {?UrlProtector} [options.urlProtector] - forwarded to encodeTableBb in the decode mode
	 * @param {?BbTagProtector} [options.bbTagProtector] - forwarded the same way
	 * @returns {string}
	 */
	function formatTable(tableData, options) {
		if (options.mode === 'simplify') {
			return `[${main_core.Loc.getMessage('IM_PARSER_MARKDOWN_TABLE_PLACEHOLDER')}]`;
		}
		return encodeTableBb(tableData, options.urlProtector, options.bbTagProtector);
	}

	/**
	 * Find and convert GFM tables in text to canonical [table] BB-code.
	 *
	 * @param {string} text
	 * @param {ConvertTablesOptions} [options]
	 * @param {string} [options.mode] - 'decode' or 'simplify'
	 * @param {?UrlProtector} [options.urlProtector] - UrlProtector of the current render, forwarded to
	 *   every cell; null lets each cell protect and restore its own URLs
	 * @param {?BbTagProtector} [options.bbTagProtector] - BbTagProtector of the current render,
	 *   forwarded the same way
	 * @returns {string}
	 */
	function convertTables(text, options = {}) {
		const {
			mode = 'decode',
			urlProtector = null,
			bbTagProtector = null
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
					mode,
					urlProtector,
					bbTagProtector
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
	// The ordered branch reuses ORDERED_MARKER_SOURCE, so this probe cannot let through a
	// marker convertLists would refuse anyway.
	const MARKDOWN_TRIGGER = new RegExp(`[\\t!#&*+<>\\\\_\`|~]|\\]\\(|^[ \\t]*(?:-|${ORDERED_MARKER_SOURCE})[ \\t]|-{3}|={3}`, 'm');
	class MarkdownConverter {
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
			const bbTagProtector = new BbTagProtector(nonce);
			const tableMarkerProtector = new TableMarkerProtector(nonce);
			const listTagProtector = new ListTagProtector();
			const urlProtector = new UrlProtector(nonce);
			const protectors = {
				codeProtector,
				mentionProtector,
				bbTagProtector,
				escapeHandler
			};
			text = MarkdownConverter.#protectBase(text, protectors, {
				looseFence: true
			});

			// One UrlProtector for the whole call: cell links (convertTables/convertLists) and the
			// full inline pass share it, so every destination is restored at the single point below.
			// The BbTagProtector rides along the same path: its placeholders live in cell content
			// too, and the label acceptors of the link/image rules have to recognize them there as well.
			text = convertTables(text, {
				...tableOptions,
				urlProtector,
				bbTagProtector
			});
			text = convertLists(text, {
				...tableOptions,
				urlProtector,
				bbTagProtector
			});
			text = tableMarkerProtector.protect(text);
			text = listTagProtector.protect(text);
			text = applyBlockRules(text);
			const inlineCodeBlocks = [];
			// escapeHandler rides along for the image rule alone: the alt is encoded past the reach of
			// the restore below, so the escapes of a label are expanded there instead (createEscapeExpander).
			text = applyInlineRules(text, {
				deferredCodeStorage: inlineCodeBlocks,
				nonce,
				urlProtector,
				bbTagProtector,
				escapeHandler
			});
			text = applyHtmlRules(text);
			text = restoreInlineCode(text, inlineCodeBlocks, nonce);
			text = listTagProtector.restore(text);
			text = tableMarkerProtector.restore(text);

			// Restore URLs AFTER the table is un-stashed (a cell's placeholder lives inside the
			// hidden [table]) and BEFORE #restoreBase (the URL may hold escape placeholders).
			text = urlProtector.restore(text);
			text = MarkdownConverter.#restoreBase(text, protectors);
			return text;
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
		 * "loose" multi-line form whose closing fence sits mid-line - protected on
		 * both paths, see #convert), indented and legacy [code]...[/code] are
		 * INTENTIONALLY rendered as one block code box (bx-im-message-content-code),
		 * never as inline code. This mirrors the legacy [code] behavior and keeps a
		 * pasted multi-line block from fragmenting into orphaned backticks + per-line
		 * inline boxes. Single/double/triple-backtick single-line spans stay inline
		 * code as before.
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
			const bbTagProtector = new BbTagProtector(nonce);
			const urlProtector = new UrlProtector(nonce);
			const protectors = {
				codeProtector,
				mentionProtector,
				bbTagProtector,
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
			text = applyCellInlineRules(text, {
				urlProtector,
				bbTagProtector
			});
			text = applyHtmlRules(text);

			// Single restore point, after applyHtmlRules and before #restoreBase (the URL may hold
			// escape placeholders): the destination stays a placeholder through the inline/html
			// rules and returns byte-for-byte here.
			text = urlProtector.restore(text);
			text = MarkdownConverter.#restoreBase(text, protectors);
			return text;
		}

		/**
		 * Apply the base placeholder protectors (code -> mention -> BB-tag -> escape). The single
		 * source of truth for the protect order shared by #convert and decodeInline.
		 *
		 * Code goes first so a [URL]/[img] typed inside [code] stays literal; mentions go before the
		 * BB-tag protector so MentionProtector keeps matching whole containers, and a [URL] nested in
		 * a mention is carried inside the stored mention instead of being stored twice.
		 *
		 * @param {string} text
		 * @param {{codeProtector: CodeProtector, mentionProtector: MentionProtector, bbTagProtector: BbTagProtector, escapeHandler: EscapeHandler}} protectors
		 * @param {{ looseFence?: boolean }} [options] Forwarded to CodeProtector.protect; looseFence
		 *   captures multi-line "loose" fenced code as one [code] block. Both #convert and decodeInline
		 *   enable it, so the two paths render such a block identically.
		 * @returns {string}
		 */
		static #protectBase(text, protectors, options = {}) {
			const {
				codeProtector,
				mentionProtector,
				bbTagProtector,
				escapeHandler
			} = protectors;
			text = codeProtector.protect(text, options);
			text = mentionProtector.protect(text);
			text = bbTagProtector.protect(text);
			text = escapeHandler.protect(text);
			return text;
		}

		/**
		 * Restore the base placeholder protectors in LIFO order (escape -> BB-tag -> mention -> code).
		 * Mirror of #protectBase, shared by #convert and decodeInline.
		 *
		 * @param {string} text
		 * @param {{
		 *     codeProtector: CodeProtector,
		 *     mentionProtector: MentionProtector,
		 *     bbTagProtector: BbTagProtector,
		 *     escapeHandler: EscapeHandler,
		 * }} protectors
		 * @returns {string}
		 */
		static #restoreBase(text, protectors) {
			const {
				codeProtector,
				mentionProtector,
				bbTagProtector,
				escapeHandler
			} = protectors;
			text = escapeHandler.restore(text);
			text = bbTagProtector.restore(text);
			text = mentionProtector.restore(text);
			text = codeProtector.restore(text);
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

	// Read feature flags straight from the Core application data the parser already reaches for
	// everything else, instead of pulling the heavier im.v2.lib.feature extension into every parser
	// consumer just for a boolean (FeatureManager.isFeatureAvailable resolves the same featureOptions value).
	const isFeatureOptionEnabled = featureName => {
		const applicationData = CoreProxy.getCore().getApplicationData?.() ?? {};
		const {
			featureOptions = {}
		} = applicationData;
		return featureOptions[featureName] ?? false;
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
		isMarkdownFeatureEnabled() {
			return isFeatureOptionEnabled('isMarkdownAvailable');
		},
		isVideoNoteCaptionFeatureEnabled() {
			return isFeatureOptionEnabled('isVideoNoteCaptionAvailable');
		}
	};
	const getCore = () => CoreProxy.getCore();
	const getUtils = () => CoreProxy.getUtils();
	const getLogger = () => CoreProxy.getLogger();
	const getConst = () => CoreProxy.getConst();
	const getSmileManager = () => CoreProxy.getSmileManager();
	const getBigSmileOption = () => CoreProxy.getBigSmileOption();
	const isMarkdownFeatureEnabled = () => CoreProxy.isMarkdownFeatureEnabled();
	const isVideoNoteCaptionFeatureEnabled = () => CoreProxy.isVideoNoteCaptionFeatureEnabled();

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
			const {
				EventType
			} = getConst();
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
				emitter.emit(EventType.textarea.insertText, {
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
				emitter.emit(EventType.textarea.sendMessage, {
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

	const ParserCall = {
		decode(text) {
			const {
				MessageMentionType
			} = getConst();
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
						'data-type': getConst().MessageMentionType.call,
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

	const MENTION_CSS_CLASS = 'bx-im-mention';
	class MentionHandler {
		#handlersByMentionType;
		#handlersByDialogId;
		constructor(context) {
			const {
				emitter
			} = context;
			this.emitter = emitter;
			const {
				MessageMentionType,
				SpecialMentionDialogId
			} = getConst();
			this.#handlersByMentionType = {
				[MessageMentionType.user]: dataset => this.#handleChat(dataset),
				[MessageMentionType.chat]: dataset => this.#handleChat(dataset),
				[MessageMentionType.lines]: dataset => this.#handleLines(dataset),
				[MessageMentionType.context]: dataset => this.#handleContext(dataset),
				[MessageMentionType.call]: dataset => this.#handleCall(dataset)
			};
			this.#handlersByDialogId = {
				[this.#getCopilotBotDialogId()]: () => this.#handleCopilot(),
				[SpecialMentionDialogId.allParticipants]: () => this.#handleAllParticipants()
			};
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
			const {
				EventType
			} = getConst();
			const messageId = Number.parseInt(dataset.messageId, 10);
			this.emitter.emit(EventType.dialog.goToMessageContext, {
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
				EventType,
				ChatType,
				SidebarDetailBlock
			} = getConst();
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
			this.emitter.emit(EventType.sidebar.open, {
				panel: SidebarDetailBlock.members,
				dialogId: entityId
			});
		}
	}

	let specialMentionHandlers = null;
	const getSpecialMentionHandlers = () => {
		if (specialMentionHandlers === null) {
			const {
				SpecialMentionDialogId = {}
			} = getConst();
			specialMentionHandlers = {
				[SpecialMentionDialogId.allParticipants]: userName => ParserMention.renderAllParticipantsMention(userName)
			};
		}
		return specialMentionHandlers;
	};
	const MENTION_BASE_CLASS = 'bx-im-mention';
	const MentionModifier = {
		highlight: '--highlight',
		extranet: '--extranet'
	};
	const ParserMention = {
		decode(text) {
			const specialMentionHandlers = getSpecialMentionHandlers();
			const {
				UserType,
				MessageMentionType
			} = getConst();
			text = text.replace(/\[USER=(all|[0-9]+)( REPLACE)?](.*?)\[\/USER]/gi, (whole, userId, replace, userName) => {
				if (specialMentionHandlers[userId]) {
					return specialMentionHandlers[userId](userName);
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
			const {
				MessageMentionType,
				SpecialMentionDialogId = {}
			} = getConst();
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
			const {
				EventType
			} = getConst();
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
		const {
			FileIconType
		} = getConst();
		let preparedText = rawText;
		if (main_core.Type.isArray(files) && files.length > 0) {
			preparedText = getTextByFile(rawText, files);
		} else if (files === true) {
			preparedText = getTextByFileType(rawText, FileIconType.file);
		}
		return preparedText.trim();
	};
	const getTextForAttach = (text, attach) => {
		const {
			AttachDescription
		} = getConst();
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
	const getTextByIconPhrase = (text, phraseCode, replacements = null) => {
		return `[${main_core.Loc.getMessage(phraseCode, replacements)}] ${text}`.trim();
	};
	const getTextByVoiceNote = text => {
		return getTextByIconPhrase(text, 'IM_PARSER_ICON_TYPE_VOICE_NOTE');
	};
	const getTextByFileType = (text, type = getConst().FileIconType.file) => {
		return getTextByIconPhrase(text, `IM_PARSER_ICON_TYPE_${type.toUpperCase()}`);
	};
	const getTextByFile = (text, files) => {
		const {
			FileType,
			FileIconType
		} = getConst();
		const [file] = files;

		// todo: remove this hack after fix receiving messages with files on P&P
		if (!file || !file.type) {
			return text;
		}

		// A voice note is told apart by its own flag, not by the file type: it lands in an audio or a
		// video container depending on the recorder, and either one would give a wrong preview here.
		if (file.isVoiceNote) {
			return getTextByVoiceNote(text);
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

		// A video note keeps FileType.video and has no own FileIconType entry, so pass its phrase explicitly.
		if (file.isVideoNote && isVideoNoteCaptionFeatureEnabled()) {
			return getTextByIconPhrase(text, 'IM_PARSER_ICON_TYPE_VIDEO_NOTE');
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
	//
	// The optional trailing break is part of the block, and the asymmetry is deliberate.
	// AFTER: a list opens a line of its own, so a break typed right behind [/list]
	// would draw an empty line instead of merely ending one — the pattern swallows
	// exactly one, turning K source breaks into K-1 blank lines. BEFORE: nothing is
	// done, a break in front only ends the previous paragraph and belongs to it.
	// Both spellings are matched: a break re-serialized through outerHTML comes back
	// as '<br>', which is what the reply-quote container does (quote.js), and a
	// pattern knowing only '<br />' would not reach inside it.
	const INNERMOST_LIST_PATTERN = /\[(list(?:=1)?(?:\s+start=\d+)?)]((?:(?!\[list)[\s\S])*?)\[\/list](?:<br ?\/?>)?/gi;
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
	//
	// The optional trailing break is part of the block, same rule as for [list] and
	// with the same deliberate asymmetry: a table opens a line of its own, so it
	// swallows exactly one break behind itself (K source breaks -> K-1 blank lines),
	// while a break in front is left alone — it ends the previous paragraph. Both
	// spellings are matched, see the reasoning at INNERMOST_LIST_PATTERN (list.js).
	const TABLE_PATTERN = /\[table]([\s\S]*?)\[\/table](?:<br ?\/?>)?/gi;
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
	const CONTAINER_CLASS = 'bx-im-message-source-item__container --ui-hoverable';
	const ELLIPSIS_CLASS = '--ellipsis';
	const ParserInlineSourceLink = {
		/**
		 * Replace each [source=N]...[/source] token with an inline source badge
		 * carrying data-source-id. Input MUST be the output of Parser.decodeText /
		 * decodeInlineText (already Text.encode'd HTML), so the token body is inlined
		 * as-is: re-encoding here would double-escape it and break in-badge formatting.
		 * Links inside the token body are flattened to their content: the badge itself
		 * is the single click target (opens the source URL), so a nested <a> would
		 * trigger a second navigation on the same click.
		 *
		 * @param {string} text
		 * @returns {string}
		 */
		decode(text) {
			return text.replace(SOURCE_REGEX, (whole, sourceId, sourceText) => {
				const inner = main_core.Dom.create({
					tag: 'span',
					attrs: {
						className: ELLIPSIS_CLASS
					},
					html: sourceText
				});
				inner.querySelectorAll('a').forEach(anchor => anchor.replaceWith(...anchor.childNodes));
				return main_core.Dom.create({
					tag: 'span',
					attrs: {
						className: CONTAINER_CLASS,
						'data-source-id': sourceId,
						'data-testid': 'im-message-source-item'
					},
					html: inner.outerHTML
				}).outerHTML;
			});
		}
	};

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
		getContactPreviewText(message, includeCaption = false) {
			const componentParams = message.componentParams;
			if (!componentParams) {
				return null;
			}
			const firstName = main_core.Type.isStringFilled(componentParams.firstName) ? componentParams.firstName.trim() : '';
			const lastName = main_core.Type.isStringFilled(componentParams.lastName) ? componentParams.lastName.trim() : '';
			const phone = main_core.Type.isArrayFilled(componentParams.phones) && main_core.Type.isString(componentParams.phones[0]) ? componentParams.phones[0].trim() : '';
			const name = [lastName, firstName].filter(Boolean).join(' ');
			const previewText = [name, phone].filter(Boolean).join('\n');
			if (!includeCaption || previewText === '') {
				return previewText;
			}
			const cardLine = name === '' ? phone : `${name}, ${phone}`;
			const cardLineSuffix = `\n${cardLine}`;
			const caption = message.text?.endsWith(cardLineSuffix) ? message.text.slice(0, -cardLineSuffix.length) : '';
			return [caption, previewText].filter(Boolean).join('\n');
		},
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
		/**
		 * Decode [source=N]...[/source] tokens into inline source badges.
		 * Input MUST already be encoded HTML (output of decodeText / decodeInlineText),
		 * never raw user text: the result goes to v-html unescaped (XSS).
		 * See ParserInlineSourceLink.decode.
		 *
		 * @param {string} text
		 * @returns {string}
		 */
		decodeInlineSourceLinks(text) {
			return ParserInlineSourceLink.decode(text);
		}
	};

	exports.Parser = Parser;

})(this.BX.Messenger.v2.Lib = this.BX.Messenger.v2.Lib || {}, BX, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib);
//# sourceMappingURL=parser.bundle.js.map
