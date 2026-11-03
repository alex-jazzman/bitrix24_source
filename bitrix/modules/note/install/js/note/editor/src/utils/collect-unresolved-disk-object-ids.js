import { DiskAttachmentStore } from '../services/disk-attachment-store';

const FILE_NODE_TYPES = new Set(['imageAttachment', 'fileAttachment', 'video']);

/**
 * Object ids of the document's Disk blocks that still need an answer from the server, deduplicated
 * and in reading order.
 *
 * Split out of resolve-disk-attachment-nodes.js so it can be unit-tested on a plain document stub:
 * that module reaches the server through DocumentService, and the unit harness cannot resolve Bitrix
 * bundle namespaces.
 *
 * @param skip Ids the caller holds back for now — see the retry hold in FileNodeResolverExtension.
 */
export function collectUnresolvedObjectIds(doc: Object, documentId: number, skip: Set<number>): number[]
{
	const objectIds: Set<number> = new Set();

	doc.descendants((node) => {
		if (!FILE_NODE_TYPES.has(node.type.name))
		{
			return;
		}

		const { diskObjectId } = node.attrs;
		if (!Number.isInteger(diskObjectId) || diskObjectId <= 0 || skip.has(diskObjectId))
		{
			return;
		}

		// A verdict that can still change is kept in the store so the block can draw it, and asked about
		// again all the same: access can be granted while the document stays open, and a file in the trash
		// can be restored — by this very reader, through the link the block itself offers. Only a file the
		// server described and did not call deleted is a final answer. How long to wait before asking
		// again is the caller's business (see the skip set).
		const entry = DiskAttachmentStore.get(documentId, diskObjectId);
		if (entry === null || entry.unavailable === true || entry.deleted === true)
		{
			objectIds.add(diskObjectId);
		}
	});

	return [...objectIds];
}
