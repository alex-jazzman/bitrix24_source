// @flow

type AssetType = 'image' | 'file' | 'video';

type ParseResult = {
	assetType: AssetType,
	fileId: number,
	width: number | null,
	align: string | null,
	raw: string,
};

type AssetMatch = {
	match: ParseResult,
	start: number,
	end: number,
};

// Strict syntax for REST-uploaded attachments: [[<type> fileId=<digits> <opt-attrs>]]
// Lowercase type, integer fileId, then zero or more ` key=value` pairs (only whitelisted keys).
// Block form: the token owns its line (trailing newline / EOF). All asset nodes are block.
// Up to 3 leading spaces are tolerated (CommonMark block indentation); 4+ would be an indented
// code block. Imports may emit a token under stray/structural whitespace.
const NOTE_ASSET_GRAMMAR: string = String.raw`\[\[(image|file|video) fileId=(\d+)((?:[ \t]+[a-z]+=[^\s\]]+)*)\]\]`;
const NOTE_ASSET_RE: RegExp = new RegExp(`^ {0,3}${NOTE_ASSET_GRAMMAR}[ \\t]*(?:\\n|$)`);

// Optional attributes allowed after fileId. Unknown keys make the whole token non-canonical (rejected).
const KNOWN_ASSET_ATTRS: Set<string> = new Set(['width', 'align']);

// Float-based image alignment. `center` is the default (no float) and is stored as null,
// so it never round-trips into markdown — only left/right are serialized.
const ALIGN_VALUES: Set<string> = new Set(['left', 'right', 'center']);

export function isEscapedAt(src: string, index: number): boolean
{
	let backslashCount = 0;
	for (let cursor = index - 1; cursor >= 0 && src[cursor] === '\\'; cursor--)
	{
		backslashCount++;
	}

	return backslashCount % 2 === 1;
}

export const ASSET_TYPE_TO_NODE: { [AssetType]: string } = {
	image: 'imageAttachment',
	file: 'fileAttachment',
	video: 'video',
};

function interpretAssetMatch(match: Object): ParseResult | null
{
	const fileId = Number(match[2]);
	if (!Number.isInteger(fileId) || fileId <= 0)
	{
		return null;
	}

	let width = null;
	let align = null;
	const attrsRaw = match[3] || '';
	if (attrsRaw)
	{
		const attrRe = /([a-z]+)=([^\s\]]+)/g;
		let attrMatch = attrRe.exec(attrsRaw);
		while (attrMatch)
		{
			const key = attrMatch[1];
			if (!KNOWN_ASSET_ATTRS.has(key))
			{
				return null; // unknown attribute — not canonical
			}
			if (key === 'width')
			{
				// width is a percentage of the container (>0..100), fractional allowed. Clamp over-100
				// (e.g. legacy px values like 280) to 100 instead of rejecting the token, and
				// normalize to two decimals so the stored attr stays clean across round-trips.
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
				align = attrMatch[2] === 'center' ? null : attrMatch[2];
			}
			attrMatch = attrRe.exec(attrsRaw);
		}
	}

	return {
		assetType: ((match[1]: any): AssetType),
		fileId,
		width,
		align,
		raw: match[0],
	};
}

export function parseNoteAssetSyntax(src: string, pos: number): ParseResult | null
{
	if (pos < 0 || pos >= src.length)
	{
		return null;
	}

	const slice = pos === 0 ? src : src.slice(pos);
	const match = NOTE_ASSET_RE.exec(slice);

	return match ? interpretAssetMatch(match) : null;
}

export function findNoteAssetMatches(src: string, includeEscaped = false): AssetMatch[]
{
	const matches: AssetMatch[] = [];
	const searchRe = new RegExp(NOTE_ASSET_GRAMMAR, 'g');
	let match = searchRe.exec(src);

	while (match)
	{
		if (includeEscaped || !isEscapedAt(src, match.index))
		{
			const interpreted = interpretAssetMatch(match);
			if (interpreted)
			{
				matches.push({
					match: interpreted,
					start: match.index,
					end: match.index + match[0].length,
				});
			}
		}

		match = searchRe.exec(src);
	}

	return matches;
}

export function findNoteAssetStart(src: string): number
{
	let from = 0;
	while (from < src.length)
	{
		const idx = src.indexOf('[[', from);
		if (idx === -1)
		{
			return -1;
		}

		// Block-level, but tolerate up to 3 leading spaces from line start (CommonMark block
		// indentation); 4+ spaces stay an indented code block. Return the line start so the
		// token's raw consumes the indent, leaving no stray whitespace text node.
		const lineStart = idx === 0 ? 0 : src.lastIndexOf('\n', idx - 1) + 1;
		if (/^ {0,3}$/.test(src.slice(lineStart, idx)))
		{
			return lineStart;
		}

		from = idx + 1;
	}

	return -1;
}
