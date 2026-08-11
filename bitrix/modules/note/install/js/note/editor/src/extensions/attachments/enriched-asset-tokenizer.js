import { Node } from '@tiptap/core';
import {
	parseEnrichedAssetSyntax,
	findEnrichedAssetStart,
	parseAttrs,
	ASSET_TYPE_TO_NODE,
	parseEnrichedAssetCell,
} from './enriched-asset-parser';
import { INLINE_ASSET_NODE_TYPES } from './note-asset-parser';

type AssetType = 'image' | 'file' | 'video';

type TokenAttrs = {
	type?: AssetType,
	fileId?: string,
	documentId?: string,
	name?: string,
	size?: string,
	mimeType?: string,
	label?: string,
	url?: string,
	isImage?: boolean,
};

type MarkdownToken = {
	type: 'enrichedAsset',
	raw: string,
	attrs: TokenAttrs,
};

type ParsedNode = {
	type: 'imageAttachment' | 'fileAttachment' | 'video',
	attrs: {
		fileId: number,
		documentId: number,
		name: string | null,
		size: number | null,
		mimeType: string | null,
	},
};

export { parseEnrichedAssetCell };

export const EnrichedAssetTokenizer: Object = Node.create({
	name: 'enrichedAsset',

	markdownTokenizer: {
		name: 'enrichedAsset',
		level: 'block',
		start(src: string): number
		{
			return findEnrichedAssetStart(src);
		},
		tokenize(src: string): MarkdownToken | null
		{
			const result = parseEnrichedAssetSyntax(src, 0, 'block');
			if (!result)
			{
				return null;
			}

			return {
				type: 'enrichedAsset',
				raw: result.raw,
				attrs: {
					...parseAttrs(result.attrsRaw),
					label: result.label,
					url: result.url,
					isImage: result.isImage,
				},
			};
		},
		childTokens: [],
	},

	parseMarkdown(token: MarkdownToken): ParsedNode | null
	{
		const { type, fileId, documentId, name, size, mimeType, label } = token.attrs;
		const nodeType = ASSET_TYPE_TO_NODE[type];
		if (!nodeType)
		{
			return null;
		}

		const node = {
			type: nodeType,
			attrs: {
				fileId: Number(fileId),
				documentId: Number(documentId),
				name: name ?? label,
				size: size ? Number(size) : null,
				mimeType: mimeType ?? null,
			},
		};

		// Inline asset node from a block-level token: wrap in a paragraph to keep `doc` content legal.
		if (INLINE_ASSET_NODE_TYPES.has(nodeType))
		{
			return { type: 'paragraph', content: [node] };
		}

		return node;
	},
});
