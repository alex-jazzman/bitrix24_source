import { Node } from '@tiptap/core';
import {
	parseNoteAssetSyntax,
	findNoteAssetStart,
	ASSET_TYPE_TO_NODE,
} from './note-asset-parser';

type AssetType = 'image' | 'file' | 'video';

type TokenAttrs = {
	assetType: AssetType,
	fileId: number,
};

type MarkdownToken = {
	type: 'noteAsset',
	raw: string,
	attrs: TokenAttrs,
};

type ParsedNode = {
	type: 'imageAttachment' | 'fileAttachment' | 'video',
	attrs: {
		fileId: number,
		documentId: null,
		name: null,
		size: null,
		mimeType: null,
	},
};

export const NoteAssetTokenizer: Object = Node.create({
	name: 'noteAsset',

	markdownTokenizer: {
		name: 'noteAsset',
		level: 'block',
		start(src: string): number
		{
			return findNoteAssetStart(src);
		},
		tokenize(src: string): MarkdownToken | null
		{
			const result = parseNoteAssetSyntax(src, 0);
			if (!result)
			{
				return null;
			}

			return {
				type: 'noteAsset',
				raw: result.raw,
				attrs: {
					assetType: result.assetType,
					fileId: result.fileId,
				},
			};
		},
		childTokens: [],
	},

	parseMarkdown(token: MarkdownToken): ParsedNode | null
	{
		const nodeType = ASSET_TYPE_TO_NODE[token.attrs.assetType];
		if (!nodeType)
		{
			return null;
		}

		return {
			type: nodeType,
			attrs: {
				fileId: token.attrs.fileId,
				documentId: null,
				name: null,
				size: null,
				mimeType: null,
			},
		};
	},
});
