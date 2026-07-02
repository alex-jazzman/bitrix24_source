import { Node, mergeAttributes } from '@tiptap/core';
import { VueUploadAssetNodeView } from './upload-node-view';
import { UploadAssetNodeViewComponent } from '../../components/nodes/upload-asset';

export const UploadAsset = Node.create({
	name: 'uploadAsset',
	group: 'block',
	atom: true,
	selectable: true,
	draggable: true,
	addAttributes()
	{
		return {
			assetKind: {
				default: 'file',
			},
			documentId: {
				default: null,
			},
			collectionId: {
				default: null,
			},
			status: {
				default: 'pending',
			},
			errorMessage: {
				default: '',
			},
			uploadToken: {
				default: null,
			},
		};
	},
	parseHTML()
	{
		return [{ tag: 'div[data-type="uploadAsset"]' }];
	},
	renderHTML({ HTMLAttributes, node })
	{
		return [
			'div',
			mergeAttributes(HTMLAttributes, {
				'data-type': 'uploadAsset',
				class: 'note-editor-upload-asset',
				contenteditable: 'false',
				'data-asset-kind': node.attrs.assetKind || 'file',
				'data-document-id': node.attrs.documentId || '',
				'data-collection-id': node.attrs.collectionId || '',
				'data-status': node.attrs.status || 'pending',
			}),
			node.attrs.errorMessage || '',
		];
	},
	addOptions()
	{
		return {
			nodeViewComponent: UploadAssetNodeViewComponent,
		};
	},
	addNodeView()
	{
		return ({ node, editor, getPos }) => new VueUploadAssetNodeView({
			node,
			editor,
			getPos,
			extension: this,
			dataType: 'uploadAsset',
			className: 'note-editor-upload-asset',
		});
	},
});
