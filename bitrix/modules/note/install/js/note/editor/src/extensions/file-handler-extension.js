import { FileHandler } from '@tiptap/extension-file-handler';
import { Type } from 'main.core';
import {
	resolveTargetNodeTypeByPayload,
	buildAttachmentAttrs,
} from './attachments/upload-node-view';
import type { FileUploadService } from '../services/file-upload-service';

function buildPayload(uploadedFile: Object, sourceFile: File, documentId: number | null): Object
{
	return {
		name: uploadedFile.name || sourceFile.name || '',
		size: Number(uploadedFile.size) || Number(sourceFile.size) || 0,
		mimeType: uploadedFile.type || sourceFile.type || '',
		fileId: uploadedFile.fileId,
		documentId,
		showUrl: uploadedFile.showUrl,
		downloadUrl: uploadedFile.downloadUrl,
		viewerAttrs: uploadedFile.viewerAttrs,
	};
}

function insertAttachmentNode(editor: Object, payload: Object, position: number | null): number
{
	const targetNodeType = resolveTargetNodeTypeByPayload(payload);
	const schemaNodeType = editor?.state?.schema?.nodes?.[targetNodeType];
	if (!schemaNodeType)
	{
		return 0;
	}

	const attrs = buildAttachmentAttrs(payload, targetNodeType);
	if (!attrs)
	{
		return 0;
	}

	const newNode = schemaNodeType.create(attrs);
	// Inline result (image) must be wrapped in a paragraph to be legal at the document root.
	const paragraphType = editor?.state?.schema?.nodes?.paragraph;
	const nodeToInsert = (newNode.isInline && paragraphType)
		? paragraphType.create(null, newNode)
		: newNode;
	if (Type.isNumber(position))
	{
		editor.view.dispatch(editor.state.tr.insert(position, nodeToInsert));

		return nodeToInsert.nodeSize;
	}

	editor.chain().focus().insertContent(nodeToInsert.toJSON()).run();

	return nodeToInsert.nodeSize;
}

async function uploadOne(
	uploadService: FileUploadService,
	file: File,
): Promise<{ file: File, uploaded: Object | null, error: Error | null }>
{
	try
	{
		const uploaded = await uploadService.uploadFileWithMeta(file);

		return { file, uploaded, error: null };
	}
	catch (error)
	{
		return { file, uploaded: null, error };
	}
}

function createFileInsertHandler(
	uploadService: FileUploadService,
): (editor: Object, files: File[], position?: number) => Promise<void>
{
	return async (editor, files, position) => {
		if (!Array.isArray(files) || files.length === 0)
		{
			return;
		}

		const results = await Promise.all(files.map((file) => uploadOne(uploadService, file)));
		const documentId = Type.isNumber(uploadService.documentId) ? uploadService.documentId : null;
		let currentPos = Type.isNumber(position) ? position : null;

		for (const { file, uploaded, error } of results)
		{
			if (error || !uploaded)
			{
				continue;
			}

			const payload = buildPayload(uploaded, file, documentId);
			const insertedSize = insertAttachmentNode(editor, payload, currentPos);
			if (currentPos !== null && insertedSize > 0)
			{
				currentPos += insertedSize;
			}
		}
	};
}

export function createFileHandlerExtension(uploadService: FileUploadService): Object
{
	const insertFiles = createFileInsertHandler(uploadService);

	return FileHandler.configure({
		allowedMimeTypes: undefined,
		onDrop: (editor, files, pos) => {
			void insertFiles(editor, files, pos);
		},
		onPaste: (editor, files) => {
			void insertFiles(editor, files);
		},
	});
}
