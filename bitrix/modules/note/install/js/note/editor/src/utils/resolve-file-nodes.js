import { DocumentService } from '../application/document-service';
import { resolveTargetNodeTypeByPayload, buildAttachmentAttrs } from '../extensions/attachments/upload-node-view';

const FILE_NODE_TYPES = new Set(['imageAttachment', 'fileAttachment', 'video']);

const EMPTY_RESULT = Object.freeze({ resolvedIds: [], failedIds: [], failedById: new Map() });

function collectUnresolvedFileIds(doc: Object, skip: Set<number>): number[]
{
	const fileIds: Set<number> = new Set();

	doc.descendants((node) => {
		if (!FILE_NODE_TYPES.has(node.type.name))
		{
			return;
		}

		const { fileId, showUrl } = node.attrs;
		if (Number.isInteger(fileId) && fileId > 0 && !showUrl && !skip.has(fileId))
		{
			fileIds.add(fileId);
		}
	});

	return [...fileIds];
}

/**
 * Resolve missing file URLs by fileId for attachment nodes in the document.
 *
 * Sets showUrl/downloadUrl/name/viewerAttrs (and clears `unavailable`) for every node whose
 * fileId the backend resolved. Nodes the backend reports as failed are NOT mutated here — the
 * caller decides how to surface them (placeholder vs removal), since that depends on origin.
 *
 * @param {Object} editor — Tiptap editor instance.
 * @param {number} documentId — owning document id (URLs are document-scoped).
 * @param {{ skip?: Set<number> }} [options] — fileIds to ignore (e.g. already known-failed).
 * @returns {Promise<{ resolvedIds: number[], failedIds: number[], failedById: Map<number, string> }>}
 */
export async function resolveFileNodes(
	editor: Object,
	documentId: number,
	options: { skip?: Set<number> } = {},
): Promise<{ resolvedIds: number[], failedIds: number[], failedById: Map<number, string> }>
{
	if (!editor || !Number.isInteger(documentId) || documentId <= 0)
	{
		return EMPTY_RESULT;
	}

	const skip = options.skip instanceof Set ? options.skip : new Set();
	const fileIds = collectUnresolvedFileIds(editor.state.doc, skip);
	if (fileIds.length === 0)
	{
		return EMPTY_RESULT;
	}

	let response = null;
	try
	{
		response = await DocumentService.resolveFileUrls({ documentId, fileIds });
	}
	catch
	{
		// Transient failure (network/5xx): report nothing as failed so the caller retries later.
		return EMPTY_RESULT;
	}

	const files = Array.isArray(response?.data?.files) ? response.data.files : [];
	const failed = Array.isArray(response?.data?.failed) ? response.data.failed : [];

	// Key by the node's current id (originalFileId): the backend may adopt a borrowed file,
	// returning a freshly-cloned fileId the node must be remapped to.
	const urlMap = new Map();
	for (const file of files)
	{
		const resolvedId = Number(file.fileId);
		const originalId = Number(file.originalFileId ?? file.fileId);
		if (resolvedId > 0 && originalId > 0 && file.showUrl)
		{
			urlMap.set(originalId, {
				fileId: resolvedId,
				documentId,
				name: file.name || '',
				size: Number(file.size) || 0,
				mimeType: file.type || '',
				downloadUrl: file.downloadUrl || file.showUrl,
				showUrl: file.showUrl,
				viewerAttrs: file.viewerAttrs || {},
			});
		}
	}

	const failedById = new Map();
	for (const item of failed)
	{
		const id = Number(item.fileId);
		if (id > 0)
		{
			failedById.set(id, String(item.message || ''));
		}
	}

	if (urlMap.size > 0)
	{
		const { tr, doc, schema } = editor.state;
		let changed = false;

		doc.descendants((node, pos) => {
			if (!FILE_NODE_TYPES.has(node.type.name))
			{
				return;
			}

			const payload = urlMap.get(node.attrs.fileId);
			if (!payload)
			{
				return;
			}

			// The node type was asserted by the markdown construction ([[image ...]]) and may not
			// match the real file. Re-derive it from the resolved mime/name (same mapping as upload),
			// so e.g. an [[image]] pointing at a PDF becomes a proper file node.
			const desiredType = resolveTargetNodeTypeByPayload(payload);
			const targetType = schema.nodes[desiredType] ? desiredType : node.type.name;
			const attrs = buildAttachmentAttrs(payload, targetType);
			if (!attrs)
			{
				return;
			}
			attrs.unavailable = false;

			if (targetType === node.type.name)
			{
				tr.setNodeMarkup(pos, undefined, attrs);
			}
			else
			{
				tr.setNodeMarkup(pos, schema.nodes[targetType], attrs);
			}
			changed = true;
		});

		if (changed)
		{
			editor.view.dispatch(tr);
		}
	}

	return {
		resolvedIds: [...urlMap.keys()],
		failedIds: [...failedById.keys()],
		failedById,
	};
}
