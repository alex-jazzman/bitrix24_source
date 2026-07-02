import { DocumentService } from '../application/document-service';

const FILE_NODE_TYPES = new Set(['imageAttachment', 'fileAttachment', 'video']);

function collectUnresolvedFileIds(doc: Object): number[]
{
	const fileIds: Set<number> = new Set();

	doc.descendants((node) => {
		if (!FILE_NODE_TYPES.has(node.type.name))
		{
			return;
		}

		const { fileId, showUrl } = node.attrs;
		if (Number.isInteger(fileId) && fileId > 0 && !showUrl)
		{
			fileIds.add(fileId);
		}
	});

	return [...fileIds];
}

export async function resolveFileNodes(editor: Object, documentId: number): Promise<void>
{
	if (!editor || !Number.isInteger(documentId) || documentId <= 0)
	{
		return;
	}

	const fileIds = collectUnresolvedFileIds(editor.state.doc);
	if (fileIds.length === 0)
	{
		return;
	}

	let response = null;
	try
	{
		response = await DocumentService.resolveFileUrls({ documentId, fileIds });
	}
	catch
	{
		return;
	}

	const files = response?.data?.files;
	if (!Array.isArray(files) || files.length === 0)
	{
		return;
	}

	const urlMap = new Map();
	for (const file of files)
	{
		const id = Number(file.fileId);
		if (id > 0 && file.showUrl)
		{
			urlMap.set(id, {
				downloadUrl: file.downloadUrl,
				showUrl: file.showUrl,
				name: file.name || null,
				viewerAttrs: file.viewerAttrs || null,
			});
		}
	}

	if (urlMap.size === 0)
	{
		return;
	}

	const { tr, doc } = editor.state;
	let changed = false;

	doc.descendants((node, pos) => {
		if (!FILE_NODE_TYPES.has(node.type.name))
		{
			return;
		}

		const urls = urlMap.get(node.attrs.fileId);
		if (!urls)
		{
			return;
		}

		tr.setNodeMarkup(pos, undefined, {
			...node.attrs,
			downloadUrl: urls.downloadUrl,
			showUrl: urls.showUrl,
			...(urls.name ? { name: urls.name } : {}),
			...(urls.viewerAttrs ? { viewerAttrs: urls.viewerAttrs } : {}),
		});
		changed = true;
	});

	if (changed)
	{
		editor.view.dispatch(tr);
	}
}
