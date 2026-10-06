/**
 * @module im/messenger/lib/parser/markdown/utils/escape-handler
 */
jn.define('im/messenger/lib/parser/markdown/utils/escape-handler', (require, exports, module) => {
	const { MARKDOWN_ESCAPE_PREFIX, MARKDOWN_PLACEHOLDER_SUFFIX } = require('im/messenger/lib/parser/const');
	const ESCAPE_PATTERN = /\\([!#()*+.>[\\\]_`{|}~\-])/g;
	// Derived from the same constants used to protect, so the protect/restore pair can never drift.
	const ESCAPE_PLACEHOLDER_PATTERN = new RegExp(`${MARKDOWN_ESCAPE_PREFIX}(\\d+)${MARKDOWN_PLACEHOLDER_SUFFIX}`, 'g');

	// Emphasis delimiters are the only escapes that also show up inside symbol art like the
	// shrug ¯\_(ツ)_/¯. When such a delimiter sits between two "art" characters (non-word AND
	// non-space) the backslash is part of the drawing, not an escape, so keep it literal; the
	// placeholder still neutralises the delimiter so no emphasis forms. A word- or space-adjacent
	// \_ / \* / \~ stays an ordinary text escape.
	const EMPHASIS_ESCAPES = new Set(['_', '*', '~']);

	// Word chars (\p{L} ∪ \p{N}) as [lo, hi] code-point ranges over the whole Unicode range, so astral
	// letters/digits classify correctly too. The Android runtime has no \p{L}/\p{N} property escapes
	// (see inline-rules.js), so the ranges are baked. They are delta-encoded ("gap.span" base-36 tokens,
	// each range relative to the previous) to keep the source compact, and decoded lazily on first use —
	// isArtChar only runs on an escaped emphasis delimiter, so most messages never build the table.
	// Regenerate: for cp in 0x80..0x10FFFF collect where /\p{L}|\p{N}/u holds, then emit
	// gap=lo-prevHi-1, span=hi-lo as base-36 "gap.span" joined by ",". Verified: decoding matches
	// !(\p{L}\p{N}\s) for every code point (0 divergences).
	const WORD_RANGES_PACKED = '16.0,7.1,1.0,3.1,1.2,1.m,1.u,1.cp,4.b,e.4,7.0,1.0,3l.4,1.1,2.3,1.0,6.0,1.2,1.0,1.j,1.2a,1.3u,8.4l,1.11,2.0,6.14,1z.q,4.3,19.16,l.9,4.1,1.2q,1.0,f.1,7.e,2.0,g.0,1.t,t.2g,b.0,e.16,9.1,4.0,5.l,4.0,9.0,3.0,n.o,7.a,5.n,1.6,g.15,1m.1h,3.0,i.0,7.9,4.9,1.f,4.7,2.1,2.l,1.6,1.0,3.3,3.0,g.0,d.1,1.2,4.b,2.5,2.0,8.5,4.1,2.l,1.6,1.1,1.1,1.1,v.3,1.0,7.9,2.2,g.8,1.2,1.l,1.6,1.1,1.4,3.0,i.0,f.1,4.9,9.0,b.7,2.1,2.l,1.6,1.1,1.4,3.0,u.1,1.2,4.9,1.6,b.0,1.5,3.2,1.3,3.1,1.0,1.1,3.1,3.2,3.b,m.0,l.c,i.7,1.2,1.m,1.f,3.0,q.2,1.1,2.1,4.9,8.6,1.0,4.7,1.2,1.m,1.9,1.4,3.0,u.2,1.1,4.9,1.1,h.8,1.2,1.14,2.0,g.0,5.2,1.9,4.i,1.5,5.h,3.n,1.8,1.0,2.6,v.9,h.1b,1.1,c.6,9.9,13.1,1.0,1.4,1.n,1.0,1.9,1.1,9.0,2.4,1.0,9.9,2.3,w.0,v.j,c.7,1.z,r.4,37.16,k.a,6.5,4.3,3.0,3.1,7.2,4.c,c.0,1.9,6.11,1.0,5.0,2.16,1.98,1.3,2.6,1.0,1.3,2.14,1.3,2.w,1.3,2.6,1.0,1.3,2.e,1.1k,1.3,2.1u,e.j,3.f,g.2d,2.5,3.h7,2.g,1.p,5.22,3.a,7.h,d.i,e.h,e.c,1.2,f.1f,z.0,4.0,3.9,6.9,m.9,6.2g,7.4,2.x,1.0,5.1x,a.u,13.13,2.4,b.17,4.p,6.a,11.m,9.1g,17.9,6.9,d.0,2l.1a,h.7,3.9,15.t,d.1j,q.z,s.9,3.1c,2.a,5.16,2.2,15.3,1.5,1.1,3.0,5.5b,1s.7p,2.5,2.11,2.5,2.7,1.0,1.0,1.0,1.u,2.1g,1.6,1.0,3.2,1.6,3.3,2.5,4.c,5.2,1.6,37.1,2.5,5.a,6.c,2t.0,4.0,2.9,1.0,3.4,6.0,1.0,1.0,1.3,1.a,2.3,5.4,4.0,1.1l,k6.1n,26.l,hi.t,vg.6c,6.3,3.1,9.0,2.11,1.0,5.0,2.1j,7.0,g.m,9.6,1.6,1.6,1.6,1.6,1.6,1.6,1.6,28.0,d1.2,p.8,7.4,2.4,4.2d,6.2,1.2h,1.3,5.16,1.2l,3.3,a.v,1c.f,w.9,u.7,1.e,w.9,13.e,8w.533,1s.h3g,1v.19,2.7g,3.r,k.1a,g.u,2.27,13.8,2.2u,2.29,k.g,1.2,1.3,1.m,d.5,a.1f,e.1d,s.9,o.5,3.0,1.1,1.11,a.m,p.s,7.1a,s.a,6.4,1.o,1.14,n.2,1.7,4.9,6.m,3.0,3.1d,1.0,3.1,2.4,2.0,1.0,o.2,2.a,7.2,c.5,2.5,2.5,9.6,1.6,1.16,1.d,6.36,d.9,6.8mb,c.m,4.1c,6is.a5,2.2x,12.6,c.4,5.0,1.9,1.c,1.4,1.0,1.1,1.1,1.2z,x.a2,i.1r,2.1h,14.b,38.4,1.3q,j.9,7.p,6.p,b.2g,3.5,2.5,2.5,2.2,z.b,1.p,1.i,1.1,1.e,2.d,y.3e,c.18,c.1k,h.1,6s.s,3.1c,g.q,4.z,9.t,5.11,a.t,2.z,4.7,1.4,16.4d,2.9,6.z,4.z,4.13,8.1f,c.a,1.e,1.6,1.1,1.a,1.e,1.6,1.1,3.1f,c.8m,9.l,a.7,o.5,1.15,1.8,1x.5,2.0,1.17,1.1,3.0,2.m,2.u,2.11,8.8,1c.i,1.1,5.w,4.p,6.p,12.1j,4.j,2.1a,f.3,1.2,1.s,a.8,n.u,1.v,w.7,1.r,6.4,g.1h,a.l,2.q,5.p,n.6,28.20,1j.1e,d.1e,7.15,c.9,6.11,9.m,62.u,1.15,6.1,g.5,1k.13,8.l,b.3,r.h,1a.r,k.m,c.1g,q.t,1.1,2.0,d.18,w.o,7.9,9.z,f.9,4.0,2.0,8.y,3.0,c.1b,e.3,b.a,1.0,4.j,b.h,1.o,j.1,1r.6,1.0,1.3,1.e,1.9,7.1a,h.9,b.7,2.1,2.l,1.6,1.1,1.4,3.0,i.0,c.4,u.9,1.0,2.0,1.11,1.0,p.0,1.0,18.1g,i.3,5.9,5.2,u.1b,k.1,1.0,8.9,4m.1a,15.3,10.1b,k.0,b.9,12.16,d.0,7.9,6.j,s.q,l.b,4.6,55.17,38.2a,c.7,2.0,2.7,1.1,1.n,f.0,1.0,e.9,1y.7,2.12,g.0,1.0,s.0,a.13,7.0,l.0,b.19,j.0,i.20,5j.w,f.9,6.8,1.10,h.0,f.s,5.t,34.6,1.1,1.11,l.0,9.9,6.5,1.1,1.v,e.0,7.9,6.17,4.9,6u.i,f.0,1.c,1.x,s.9,2e.0,f.k,17.pl,2u.32,h.5f,218.2o,f.tr,h.5,p.32y,5.g6,5a1.t,i.9,1c6.fs,7.u,1.9,6.26,1.9,6.t,i.1b,g.3,c.9,1.6,1.k,5.i,c0.18,3.9,5i.2e,9.o,2.o,18.22,5.0,1u.c,1s.1,1.0,e.4,9.5p1,15.v,2p.36,6pp.3,1.6,1.1,1.82,f.0,t.2,2.0,e.3,8.az,1s4.2y,5.c,3.8,7.9,386.9,152.j,c.j,30.o,3r.2c,1.1y,1.1,2.0,2.1,2.3,1.b,1.0,1.6,1.1s,1.3,2.7,1.6,1.r,1.3,1.4,1.0,3.6,1.9f,2.o,1.o,1.u,1.o,1.u,1.o,1.u,1.o,1.u,1.o,1.7,2.1d,1ds.u,6.5,79.1p,42.18,a.6,2.9,4.0,8x.t,i.17,4.9,d2.r,4.9,5y.t,2.a,5h.u,1.2,1.1,1.6,2.4,9.1,68.6,1.3,1.1,1.e,1.5g,2.8,1c.1v,7.0,4.9,lz.1m,1.2,1.3,24.18,1.e,5e.3,1.q,1.1,1.0,2.0,1.9,1.3,1.0,1.0,6.0,4.0,1.0,1.0,1.2,1.1,1.0,2.0,1.0,1.0,1.0,1.0,1.1,1.0,2.3,1.6,1.3,1.3,1.0,1.9,1.g,5.2,1.4,1.g,g4.c,25f.9,sm.wyn,w.3dp,2.4gd,2.5rk,f.h9,1wi.f1,15u.3t6,5.6jt';

	let wordRanges = null;

	function getWordRanges()
	{
		if (wordRanges)
		{
			return wordRanges;
		}

		wordRanges = [];
		let prev = 0x7F;
		for (const token of WORD_RANGES_PACKED.split(','))
		{
			const dot = token.indexOf('.');
			const lo = prev + 1 + parseInt(token.slice(0, dot), 36);
			const hi = lo + parseInt(token.slice(dot + 1), 36);
			wordRanges.push(lo, hi);
			prev = hi;
		}

		return wordRanges;
	}

	// True when `code` is a Unicode letter or digit (word char) — binary search over the ranges.
	function isWordCode(code)
	{
		const ranges = getWordRanges();
		let lo = 0;
		let hi = (ranges.length >> 1) - 1;

		while (lo <= hi)
		{
			const mid = (lo + hi) >> 1;
			const start = ranges[mid * 2];
			const end = ranges[mid * 2 + 1];

			if (code < start)
			{
				hi = mid - 1;
			}
			else if (code > end)
			{
				lo = mid + 1;
			}
			else
			{
				return true;
			}
		}

		return false;
	}

	// A neighbour glyph may be an astral character (a UTF-16 surrogate pair), so classify the whole
	// code point rather than a lone surrogate half — otherwise a math-bold letter like 𝐀 (a letter)
	// would be read as a lone surrogate and mistaken for a symbol. These return the full code point.
	function codePointEndingAt(source, index)
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

	function codePointStartingAt(source, index)
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
	// punctuation/symbols, the shrug's ¯, and every Unicode symbol/punctuation glyph. ASCII via cheap
	// charCode ranges; a non-ASCII neighbour is art iff it is not whitespace and not a baked word char.
	// This matches the parser's documented "not letter, not digit, not space" rule exactly.
	function isArtChar(char)
	{
		if (!char)
		{
			return false;
		}

		const code = char.charCodeAt(0);

		if (code < 0x80)
		{
			return !(code <= 32 || (code >= 48 && code <= 57) || (code >= 65 && code <= 90) || (code >= 97 && code <= 122));
		}

		// Non-ASCII: Unicode whitespace is content; otherwise art iff not a \p{L}/\p{N} word char.
		return !(/\s/.test(char) || isWordCode(char.codePointAt(0)));
	}

	class EscapeHandler
	{
		#escapes = [];

		protect(text)
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

		restore(text)
		{
			if (this.#escapes.length === 0)
			{
				return text;
			}

			const escapes = this.#escapes;
			const result = text.replaceAll(
				ESCAPE_PLACEHOLDER_PATTERN,
				// A user-typed literal "####MD_ESC_N####" (or out-of-range index) has no stored
				// char — leave the marker untouched instead of emitting the string "undefined".
				(match, index) => escapes[Number(index)] ?? match,
			);

			this.#escapes = [];

			return result;
		}
	}

	module.exports = {
		EscapeHandler,
	};
});
