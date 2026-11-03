import { DocumentService } from '../application/document-service';
import { DiskAttachmentStore } from '../services/disk-attachment-store';
import { collectUnresolvedObjectIds } from './collect-unresolved-disk-object-ids';

const EMPTY_RESULT = Object.freeze({ resolvedIds: [], unavailableIds: [], deletedIds: [] });

// How many objects travel in one request. Well under the server's own ceiling
// (`FileController::DISK_RESOLVE_MAX_ITEMS`), which stays a guard against a client asking for
// everything at once — see the loop below for why the client no longer wants to.
const RESOLVE_CHUNK_SIZE = 25;

/**
 * Fills in the Disk attachments of a document — name, size, links, viewer attributes and trash
 * state — in a single request for the whole document.
 *
 * The markdown holds nothing but the object id, deliberately: a file renamed or moved on Disk shows
 * its current state here, and one the reader cannot see shows as unavailable rather than leaking a
 * name. That also means this runs on every open, including the read-only version preview, which
 * carries the same tokens and resolves them against the file as it is now.
 *
 * What comes back is put in {@see DiskAttachmentStore}, never into the document: it is per-reader
 * data, and the document is shared with readers whose rights on the file differ.
 *
 * @returns resolvedIds — objects whose attributes were stored; unavailableIds — objects the server
 *          refused to describe, whose blocks now draw the unavailable state; deletedIds — objects it
 *          described as sitting in Disk's trash can. The last two are answers that can change on
 *          their own, and the caller is the one holding them back from being asked again at once.
 */
export async function resolveDiskAttachmentNodes(
	editor: Object,
	documentId: number,
	options: { skip?: Set<number> } = {},
): Promise<{ resolvedIds: number[], unavailableIds: number[], deletedIds: number[] }>
{
	if (!editor || !Number.isInteger(documentId) || documentId <= 0)
	{
		return EMPTY_RESULT;
	}

	const skip = options.skip instanceof Set ? options.skip : new Set();
	const objectIds = collectUnresolvedObjectIds(editor.state.doc, documentId, skip);
	if (objectIds.length === 0)
	{
		return EMPTY_RESULT;
	}

	const resolvedIds = [];
	const unavailableIds = [];
	const deletedIds = [];

	// One request per chunk, one chunk at a time. The answer costs the server about 8-9 ms per file —
	// building the viewer attributes on Disk's side, measured, and linear — so a document with a
	// hundred attachments would otherwise hold a worker for a second on every open. Chunked, the
	// blocks fill in as the answers land and no single request grows with the document. Sequential on
	// purpose: parallel chunks would put the very same load on the server at once.
	for (let from = 0; from < objectIds.length; from += RESOLVE_CHUNK_SIZE)
	{
		const chunk = objectIds.slice(from, from + RESOLVE_CHUNK_SIZE);

		let response = null;
		try
		{
			response = await DocumentService.resolveDiskAttachments({ documentId, objectIds: chunk });
		}
		catch
		{
			// Transient failure (network/5xx): stop asking and report what has already landed. What is
			// left stays unresolved in the store, so the next pass picks it up.
			break;
		}

		const items = Array.isArray(response?.data?.items) ? response.data.items : [];
		for (const item of items)
		{
			const objectId = Number(item?.objectId);
			if (!Number.isInteger(objectId) || objectId <= 0)
			{
				continue;
			}

			if (item.available !== true)
			{
				// Nothing but the flag: the server sends no name, size or preview for a file the reader
				// may not see, and the block must not invent them.
				DiskAttachmentStore.set(documentId, objectId, { unavailable: true });
				unavailableIds.push(objectId);

				continue;
			}

			DiskAttachmentStore.set(documentId, objectId, {
				name: String(item.name ?? ''),
				size: Number(item.size) || 0,
				mimeType: String(item.mimeType ?? ''),
				// The link the block points AT: Disk's own page for the file, with its own permission
				// check. Not a source for <img>/<video> — see inlineUrl.
				showUrl: item.showUrl ?? item.downloadUrl ?? null,
				downloadUrl: item.downloadUrl ?? null,
				// The only URL that serves the bytes inline; the download one is served as an attachment
				// and would make a picture a download prompt instead of a picture.
				inlineUrl: item.inlineUrl ?? null,
				viewerAttrs: item.viewerAttrs ?? null,
				deleted: item.deleted === true,
				canRestore: item.canRestore === true,
				restoreUrl: item.restoreUrl ?? null,
				// Access granted after the fact restores the block on the next resolve, without a reload.
				unavailable: false,
			});
			resolvedIds.push(objectId);

			// The file is described, but it sits in Disk's trash can, and the block offers this reader the
			// link to take it out of there. So the answer is reported as one to come back to: restore it in
			// the other tab and the card follows, without reopening the document.
			if (item.deleted === true)
			{
				deletedIds.push(objectId);
			}
		}
	}

	// The node type asserted by markdown is NOT re-derived from the resolved mime here, unlike own
	// files: the kind was chosen from Disk's own classification at pick time, and a document whose
	// author wrote `[[disk file ...]]` by hand should keep the block they asked for.

	return { resolvedIds, unavailableIds, deletedIds };
}
