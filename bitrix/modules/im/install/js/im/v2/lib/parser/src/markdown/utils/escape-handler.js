import { MARKDOWN_ESCAPE_PREFIX, MARKDOWN_PLACEHOLDER_SUFFIX } from '../const.js';

const ESCAPE_PATTERN = /\\([!#()*+.>[\\\]_`{|}~\-])/g;

// Built from the same constants used to protect, so the protect/restore pair can
// never drift (parallels CodeProtector / restoreInlineCode).
const ESCAPE_PLACEHOLDER_PATTERN = new RegExp(
	`${MARKDOWN_ESCAPE_PREFIX}(\\d+)${MARKDOWN_PLACEHOLDER_SUFFIX}`,
	'g',
);

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
function codePointEndingAt(source: string, index: number): string
{
	const low = source.charCodeAt(index);
	if (low >= 0xDC00 && low <= 0xDFFF && index - 1 >= 0)
	{
		const high = source.charCodeAt(index - 1);
		if (high >= 0xD800 && high <= 0xDBFF)
		{
			return source.slice(index - 1, index + 1);
		}
	}

	return source[index] ?? '';
}

function codePointStartingAt(source: string, index: number): string
{
	const high = source.charCodeAt(index);
	if (high >= 0xD800 && high <= 0xDBFF)
	{
		const low = source.charCodeAt(index + 1);
		if (low >= 0xDC00 && low <= 0xDFFF)
		{
			return source.slice(index, index + 2);
		}
	}

	return source[index] ?? '';
}

// "Art" = a visible glyph that is neither a word character (\p{L}/\p{N}) nor whitespace: ASCII
// punctuation/symbols, the shrug's ¯, and every Unicode symbol/punctuation glyph. ASCII is decided
// by cheap charCode ranges; a non-ASCII neighbour is art iff it is not whitespace and not a word
// char. This matches the parser's documented "not letter, not digit, not space" rule exactly.
function isArtChar(char: string): boolean
{
	if (!char)
	{
		return false;
	}

	const code = char.charCodeAt(0);

	if (code < 0x80)
	{
		// ASCII: whitespace/controls and letters/digits are not art; every other glyph is.
		return !(code <= 32 || (code >= 48 && code <= 57) || (code >= 65 && code <= 90) || (code >= 97 && code <= 122));
	}

	// Non-ASCII: Unicode whitespace is content; otherwise art iff it is not a \p{L}/\p{N} word char.
	return !(/\s/.test(char) || NON_ASCII_WORD_CHAR.test(char));
}

export class EscapeHandler
{
	#escapes = [];

	protect(text: string): string
	{
		this.#escapes = [];

		return text.replaceAll(ESCAPE_PATTERN, (match, char, offset, source) => {
			// Keep the backslash literal for an emphasis delimiter drawn inside symbol art. The
			// neighbours are read as whole code points so astral letters/symbols classify correctly.
			const keepBackslash = EMPHASIS_ESCAPES.has(char)
				&& isArtChar(codePointEndingAt(source, offset - 1))
				&& isArtChar(codePointStartingAt(source, offset + 2));

			const index = this.#escapes.length;
			this.#escapes.push(keepBackslash ? `\\${char}` : char);

			return `${MARKDOWN_ESCAPE_PREFIX}${index}${MARKDOWN_PLACEHOLDER_SUFFIX}`;
		});
	}

	restore(text: string): string
	{
		if (this.#escapes.length === 0)
		{
			return text;
		}

		const escapes = this.#escapes;
		const result = text.replaceAll(
			ESCAPE_PLACEHOLDER_PATTERN,
			// A user-typed literal "####MD_ESC_N####" (or an out-of-range index) has no
			// stored char — leave the marker untouched instead of emitting "undefined".
			(match, index) => escapes[Number(index)] ?? match,
		);

		this.#escapes = [];

		return result;
	}
}
