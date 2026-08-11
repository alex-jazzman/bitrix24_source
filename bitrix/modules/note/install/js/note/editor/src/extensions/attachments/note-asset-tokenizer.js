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
	width: number | null,
	align: string | null,
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
		width?: number | null,
		align?: string | null,
	},
};

// Block-level tokenizer for all asset types (image/file/video). Each [[<type> fileId=N ...]] token
// owns its line and becomes a top-level block node — images are block nodes again, so they are no
// longer wrapped in a paragraph nor handled by a separate inline tokenizer.
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
					assetType: ((result.assetType: any): AssetType),
					fileId: result.fileId,
					width: result.width,
					align: result.align,
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

		const attrs: Object = {
			fileId: token.attrs.fileId,
			documentId: null,
			name: null,
			size: null,
			mimeType: null,
		};

		// Resizable media (image, video) carries presentation attributes (resize width, alignment); file does not.
		if (nodeType === 'imageAttachment' || nodeType === 'video')
		{
			attrs.width = token.attrs.width ?? null;
			attrs.align = token.attrs.align ?? null;
		}

		return {
			type: nodeType,
			attrs,
		};
	},
});
