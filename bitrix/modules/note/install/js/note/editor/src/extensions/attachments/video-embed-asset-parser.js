// @flow

// Pure parser/serializer for the `[[video-embed url=<URL> width=<N> align=<left|right>]]` block form.
// This is the round-trip representation of a video embed that carries sizing/positioning - the plain
// bare-URL form (video-embed-parser.js) has no room for attributes, so a resized/aligned embed
// serializes to this richer token instead. Kept free of `ui.video-service`; URL->embed-src resolution
// stays in video-embed.js.
//
// Grammar mirrors the note-asset `[[...]]` family (video-embed.js is a distinct keyword, so the
// strict `(image|file|video) fileId=` parser in note-asset-parser.js never claims it). The URL value
// is `\S`-minus-`]` (video hosts don't use spaces or `]` in their URLs).

type VideoEmbedAsset = {
	url: string,
	width: number | null,
	align: string | null,
	raw: string,
};

// Block token owning its line (<=3 leading spaces tolerated, trailing spaces/newline consumed).
const VIDEO_EMBED_ASSET_RE: RegExp = /^ {0,3}\[\[video-embed url=([^\s\]]+)((?:[ \t]+[a-z]+=[^\s\]]+)*)\]\][ \t]*(?:\n|$)/;

const KNOWN_ATTRS: Set<string> = new Set(['width', 'align']);
const ALIGN_VALUES: Set<string> = new Set(['left', 'right', 'center']);

function interpretAttrs(attrsRaw: string): { width: number | null, align: string | null } | null
{
	let width = null;
	let align = null;
	if (!attrsRaw)
	{
		return { width, align };
	}

	const attrRe = /([a-z]+)=([^\s\]]+)/g;
	let attrMatch = attrRe.exec(attrsRaw);
	while (attrMatch)
	{
		const key = attrMatch[1];
		if (!KNOWN_ATTRS.has(key))
		{
			return null; // unknown attribute - not our canonical form
		}
		if (key === 'width')
		{
			// Percentage of the container (>0..100, fractional allowed); clamp over-100 to 100 and
			// normalize to two decimals so it stays clean across round-trips (matches note-asset-parser).
			const value = Number(attrMatch[2]);
			if (!Number.isFinite(value) || value <= 0)
			{
				return null;
			}
			width = Math.min(Math.round(value * 100) / 100, 100);
		}
		else if (key === 'align')
		{
			if (!ALIGN_VALUES.has(attrMatch[2]))
			{
				return null;
			}
			// center is the default (no float) and is stored as null - never serialized.
			align = attrMatch[2] === 'center' ? null : attrMatch[2];
		}
		attrMatch = attrRe.exec(attrsRaw);
	}

	return { width, align };
}

/**
 * Serializes a video embed to the `[[video-embed ...]]` block token. Only emits width/align when set;
 * with neither, the caller should prefer the bare-URL form instead (this still produces a valid token).
 */
export function buildVideoEmbedAsset(source: string, width: mixed, align: mixed): string
{
	let out = `[[video-embed url=${String(source)}`;

	const w = Number(width);
	if (Number.isFinite(w) && w > 0 && w <= 100)
	{
		out += ` width=${w}`;
	}

	if (align === 'left' || align === 'right')
	{
		out += ` align=${align}`;
	}

	return `${out}]]`;
}

/**
 * Matches a `[[video-embed ...]]` token occupying the whole first line of `src` (anchored at 0).
 *
 * @return {VideoEmbedAsset | null} null when the line is not a canonical video-embed token.
 */
export function matchVideoEmbedAsset(src: string): VideoEmbedAsset | null
{
	const match = VIDEO_EMBED_ASSET_RE.exec(src);
	if (!match)
	{
		return null;
	}

	const attrs = interpretAttrs(match[2] || '');
	if (attrs === null)
	{
		return null;
	}

	return {
		url: match[1],
		width: attrs.width,
		align: attrs.align,
		raw: match[0],
	};
}

/**
 * Index of the first line that starts a `[[video-embed` token (<=3 leading spaces), or -1. Used as the
 * marked block tokenizer's `start()` hint.
 */
export function findVideoEmbedAssetStart(src: string): number
{
	let from = 0;
	while (from < src.length)
	{
		const idx = src.indexOf('[[video-embed', from);
		if (idx === -1)
		{
			return -1;
		}

		const lineStart = idx === 0 ? 0 : src.lastIndexOf('\n', idx - 1) + 1;
		if (/^ {0,3}$/.test(src.slice(lineStart, idx)))
		{
			return lineStart;
		}

		from = idx + 1;
	}

	return -1;
}
