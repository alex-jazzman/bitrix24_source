// @flow

type AssetType = 'image' | 'file' | 'video';

type ParseResult = {
	assetType: AssetType,
	fileId: number,
	raw: string,
};

// Strict, block-only syntax for REST-uploaded attachments: [[<type> fileId=<digits>]]
// No spaces around tokens, no extra attributes, lowercase type, integer fileId.
const NOTE_ASSET_RE: RegExp = /^\[\[(image|file|video) fileId=(\d+)\]\][ \t]*(?:\n|$)/;

export const ASSET_TYPE_TO_NODE: { [AssetType]: string } = {
	image: 'imageAttachment',
	file: 'fileAttachment',
	video: 'video',
};

export function parseNoteAssetSyntax(src: string, pos: number): ParseResult | null
{
	if (pos < 0 || pos >= src.length)
	{
		return null;
	}

	const slice = pos === 0 ? src : src.slice(pos);
	const match = NOTE_ASSET_RE.exec(slice);
	if (!match)
	{
		return null;
	}

	const fileId = Number(match[2]);
	if (!Number.isInteger(fileId) || fileId <= 0)
	{
		return null;
	}

	return {
		assetType: ((match[1]: any): AssetType),
		fileId,
		raw: match[0],
	};
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

		// Block-only: must start at line beginning (no leading spaces — REST emits
		// canonical form, and any indentation means it isn't a top-level asset block).
		if (idx === 0 || src.charCodeAt(idx - 1) === 0x0A)
		{
			return idx;
		}

		from = idx + 1;
	}

	return -1;
}
