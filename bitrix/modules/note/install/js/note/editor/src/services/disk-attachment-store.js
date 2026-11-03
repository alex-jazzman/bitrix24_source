/**
 * What the server currently says about the Disk files a document references.
 *
 * Deliberately NOT part of the document. Markdown carries only the object id, so name, size, links
 * and trash state are re-fetched on every open anyway — writing them into the collaborative model
 * would buy nothing and cost something real: the model is shared, and rights on a Disk file are not.
 * A co-editor who may not read the file would receive its name from whoever may, and the server's
 * refusal to name it for them would be undone by the very mechanism that keeps the text in sync.
 *
 * Keyed by document as well as object: the same file can be attached to one document and unreachable
 * from another, and the two answers must not be mistaken for one another.
 */

type DiskAttachmentEntry = {
	name?: string,
	size?: number,
	mimeType?: string,
	showUrl?: string | null,
	downloadUrl?: string | null,
	inlineUrl?: string | null,
	viewerAttrs?: Object | null,
	deleted?: boolean,
	canRestore?: boolean,
	restoreUrl?: string | null,
	unavailable?: boolean,
};

const entries: Map<string, DiskAttachmentEntry> = new Map();

// Subscribers of one attachment, not of the store: a document full of Disk files resolves one object
// at a time, and a single list of subscribers would run every block's callback on every answer.
const listeners: Map<string, Set<() => void>> = new Map();

function keyOf(documentId: number, objectId: number): string
{
	return `${documentId}:${objectId}`;
}

export const DiskAttachmentStore = {
	get(documentId: number, objectId: number): DiskAttachmentEntry | null
	{
		if (!Number.isInteger(documentId) || !Number.isInteger(objectId))
		{
			return null;
		}

		return entries.get(keyOf(documentId, objectId)) ?? null;
	},

	has(documentId: number, objectId: number): boolean
	{
		return this.get(documentId, objectId) !== null;
	},

	set(documentId: number, objectId: number, entry: DiskAttachmentEntry): void
	{
		if (!Number.isInteger(documentId) || !Number.isInteger(objectId))
		{
			return;
		}

		const key = keyOf(documentId, objectId);
		entries.set(key, entry);
		listeners.get(key)?.forEach((listener) => listener());
	},

	/**
	 * Watches one attachment of one document.
	 *
	 * @returns An unsubscribe function. Node views hold one each and re-subscribe when the node they
	 *          draw changes into another attachment, so it has to be cheap to drop.
	 */
	subscribe(documentId: number, objectId: number, listener: () => void): () => void
	{
		const key = keyOf(documentId, objectId);
		let forKey = listeners.get(key);
		if (!forKey)
		{
			forKey = new Set();
			listeners.set(key, forKey);
		}
		forKey.add(listener);

		return () => {
			const current = listeners.get(key);
			if (!current)
			{
				return;
			}

			current.delete(listener);
			if (current.size === 0)
			{
				listeners.delete(key);
			}
		};
	},

	/**
	 * Drops what was learned about one document. Called when its editor goes away: the app switches
	 * documents without a page load, so entries of every document ever opened would otherwise live
	 * until the tab is closed. Nothing is lost — the next open asks the server again, which it does
	 * anyway.
	 */
	forgetDocument(documentId: number): void
	{
		if (!Number.isInteger(documentId) || documentId <= 0)
		{
			return;
		}

		const prefix = `${documentId}:`;
		for (const key of entries.keys())
		{
			if (key.startsWith(prefix))
			{
				entries.delete(key);
			}
		}
	},

	/** Test seam. Production forgets per document, see forgetDocument(). */
	clear(): void
	{
		entries.clear();
	},
};
