import { Type } from 'main.core';
import { NodeSelection } from '@tiptap/pm/state';
import { normalizeCollectionId, normalizeDocumentId } from '../utils/normalize';

export function createUploadToken(): string
{
	return `upload-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

// `select` puts a NodeSelection on the just-inserted (atom) node — used by the attachments hotkey
// so the tile lands focused: click it to browse-and-upload, or move the caret away to keep typing.
// The toolbar `+` buttons pass it falsy and keep the caret after the node, as before.
export function insertUploadAssetNode(
	editor: Object | null,
	assetKind: string,
	{ documentId, collectionId, select = false }: {
		documentId?: number | null,
		collectionId?: number | null,
		select?: boolean,
	} = {},
): void
{
	if (!editor)
	{
		return;
	}

	const normalizedDocumentId = normalizeDocumentId(documentId);
	const normalizedCollectionId = normalizeCollectionId(collectionId);
	const from = Number(editor.state.selection?.from);
	const to = Number(editor.state.selection?.to);
	const hasSelection = Number.isInteger(from) && Number.isInteger(to);
	const range = hasSelection ? { from, to } : editor.state.doc.content.size;
	const insertAnchor = hasSelection ? from : editor.state.doc.content.size;
	const uploadToken = createUploadToken();

	const chain = editor.chain().focus().insertContentAt(range, {
		type: 'uploadAsset',
		attrs: {
			assetKind,
			documentId: normalizedDocumentId,
			collectionId: normalizedCollectionId,
			status: 'pending',
			errorMessage: '',
			uploadToken,
		},
	});

	if (select)
	{
		// Put a NodeSelection on the tile just inserted (attachments hotkey: click to browse, arrow
		// away to skip). Locate it by its unique uploadToken rather than the pre-insert caret position —
		// insertContentAt splits/maps around the caret, so the node rarely lands exactly at `from`.
		chain.command(({ tr, dispatch }) => {
			if (!dispatch)
			{
				return true;
			}

			const isInsertedTile = (node) => {
				return node.type.name === 'uploadAsset' && node.attrs.uploadToken === uploadToken;
			};

			// Scan around the mapped insertion anchor rather than the whole document: the tile lands next
			// to where the caret was. The token check keeps the scan self-verifying, and a miss (filtered
			// or relocated insert) falls back to the full walk, so correctness never depends on the window.
			let nodePos = null;
			const anchor = tr.mapping.map(insertAnchor, -1);
			tr.doc.nodesBetween(Math.max(0, anchor - 1), Math.min(tr.doc.content.size, anchor + 2), (node, pos) => {
				if (nodePos === null && isInsertedTile(node))
				{
					nodePos = pos;
				}

				return nodePos === null;
			});

			if (nodePos === null)
			{
				tr.doc.descendants((node, pos) => {
					if (nodePos === null && isInsertedTile(node))
					{
						nodePos = pos;
					}

					return nodePos === null;
				});
			}

			if (nodePos !== null)
			{
				try
				{
					tr.setSelection(NodeSelection.create(tr.doc, nodePos));
				}
				catch
				{
					// Node isn't selectable (e.g. filtered on insert) — leave the caret as inserted.
				}
			}

			return true;
		});
	}

	chain.run();
}

export function createScopedUploadService(
	uploadAdapter: Object,
	collectionId: mixed,
	documentId: mixed,
): Object
{
	const scopedCollectionId = normalizeCollectionId(collectionId);
	const scopedDocumentId = normalizeDocumentId(documentId);
	if (scopedDocumentId === null)
	{
		return uploadAdapter;
	}

	const addUploadContext = (options = {}) => {
		const merged = {
			...(Type.isPlainObject(options) ? options : {}),
			documentId: scopedDocumentId,
		};
		if (scopedCollectionId !== null)
		{
			merged.collectionId = scopedCollectionId;
		}

		return merged;
	};

	return {
		documentId: scopedDocumentId,
		collectionId: scopedCollectionId,
		pickFile: (...args) => uploadAdapter.pickFile(...args),
		uploadImage: (file = null, options = {}) => uploadAdapter.uploadImage(file, addUploadContext(options)),
		uploadVideo: (file = null, options = {}) => uploadAdapter.uploadVideo(file, addUploadContext(options)),
		uploadVideoWithMeta: (file = null, options = {}) => uploadAdapter.uploadVideoWithMeta(
			file,
			addUploadContext(options),
		),
		uploadFile: (file = null, options = {}) => uploadAdapter.uploadFile(file, addUploadContext(options)),
		uploadFileWithMeta: (file = null, options = {}) => uploadAdapter.uploadFileWithMeta(
			file,
			addUploadContext(options),
		),
	};
}
