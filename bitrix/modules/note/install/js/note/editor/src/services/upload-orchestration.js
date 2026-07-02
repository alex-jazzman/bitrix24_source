import { Type } from 'main.core';
import { normalizeCollectionId, normalizeDocumentId } from '../utils/normalize';

export function createUploadToken(): string
{
	return `upload-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function insertUploadAssetNode(
	editor: Object | null,
	assetKind: string,
	{ documentId, collectionId }: { documentId?: number | null, collectionId?: number | null } = {},
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

	editor.chain().focus().insertContentAt(range, {
		type: 'uploadAsset',
		attrs: {
			assetKind,
			documentId: normalizedDocumentId,
			collectionId: normalizedCollectionId,
			status: 'pending',
			errorMessage: '',
			uploadToken: createUploadToken(),
		},
	}).run();
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
