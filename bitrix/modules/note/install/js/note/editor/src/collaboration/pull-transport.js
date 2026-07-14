import { Type } from 'main.core';
import { PullClient } from 'pull.client';
import { base64ToUint8Array } from '../utils/binary';

export const PullCommand = Object.freeze({
	DOCUMENT_PATCH_RECEIVED: 'documentPatchReceived',
	DOCUMENT_AWARENESS: 'documentAwareness',
	DOCUMENT_UPDATE: 'documentUpdate',
	DOCUMENT_MOVE: 'documentMove',
	DOCUMENT_ARCHIVE: 'documentArchive',
	DOCUMENT_RESTORE: 'documentRestore',
	DOCUMENT_DELETE: 'documentDelete',
	DOCUMENT_HARD_DELETE: 'documentHardDelete',
	DOCUMENT_CONTENT_OVERWRITTEN: 'documentContentOverwritten',
	DOCUMENT_CAPABILITIES: 'documentCapabilities',
	COLLECTION_CAPABILITIES: 'collectionCapabilities',
	COLLECTION_ARCHIVE: 'collectionArchive',
	COLLECTION_DELETE: 'collectionDelete',
});

// Lifecycle commands routed via #callbacks. Each lands in its own phase;
// unbound entries fall through as no-ops.
export const LIFECYCLE_COMMANDS = new Set([
	PullCommand.DOCUMENT_UPDATE,
	PullCommand.DOCUMENT_MOVE,
	PullCommand.DOCUMENT_ARCHIVE,
	PullCommand.DOCUMENT_RESTORE,
	PullCommand.DOCUMENT_DELETE,
	PullCommand.DOCUMENT_HARD_DELETE,
	PullCommand.DOCUMENT_CONTENT_OVERWRITTEN,
	PullCommand.DOCUMENT_CAPABILITIES,
	PullCommand.COLLECTION_CAPABILITIES,
	PullCommand.COLLECTION_ARCHIVE,
	PullCommand.COLLECTION_DELETE,
]);

export const LIFECYCLE_CALLBACK_BY_COMMAND = Object.freeze({
	[PullCommand.DOCUMENT_UPDATE]: 'onDocumentUpdate',
	// A move can change the document's collection, hence its effective ACL — re-check access.
	[PullCommand.DOCUMENT_MOVE]: 'onCapabilities',
	[PullCommand.DOCUMENT_ARCHIVE]: 'onArchive',
	[PullCommand.DOCUMENT_RESTORE]: 'onRestore',
	[PullCommand.DOCUMENT_DELETE]: 'onDelete',
	[PullCommand.DOCUMENT_HARD_DELETE]: 'onHardDelete',
	[PullCommand.DOCUMENT_CONTENT_OVERWRITTEN]: 'onContentOverwritten',
	[PullCommand.DOCUMENT_CAPABILITIES]: 'onCapabilities',
	// Document inherits ACL from its collection — collection-level changes also flip capabilities.
	[PullCommand.COLLECTION_CAPABILITIES]: 'onCapabilities',
	// Whole collection archived/deleted → every doc in it flips into archive/trash mode.
	[PullCommand.COLLECTION_ARCHIVE]: 'onArchive',
	[PullCommand.COLLECTION_DELETE]: 'onDelete',
});

export class PullTransport
{
	#documentId: number;
	#getCollectionId: () => number;
	#pullHandler: Function | null;
	#pullUnsubscribers: Function[];
	#wasPullOffline: boolean;
	#callbacks: Object | null;

	constructor({ documentId }: { documentId: number })
	{
		this.#documentId = documentId;
		this.#getCollectionId = () => 0;
		this.#pullHandler = null;
		this.#pullUnsubscribers = [];
		this.#wasPullOffline = false;
		this.#callbacks = null;
	}

	start({
		onPatch,
		onAwareness,
		onOffline,
		onBackOnline,
		onDocumentUpdate,
		onArchive,
		onRestore,
		onDelete,
		onHardDelete,
		onContentOverwritten,
		onCapabilities,
		getCollectionId,
	}: {
		onPatch: (update: Uint8Array, params: Object) => void,
		onAwareness: (params: Object) => void,
		onOffline: () => void,
		onBackOnline: () => void,
		onDocumentUpdate?: (params: Object) => void,
		onArchive?: (params: Object) => void,
		onRestore?: (params: Object) => void,
		onDelete?: (params: Object) => void,
		onHardDelete?: (params: Object) => void,
		onContentOverwritten?: (params: Object) => void,
		onCapabilities?: (params: Object) => void,
		getCollectionId?: () => number,
	}): void
	{
		this.#getCollectionId = typeof getCollectionId === 'function' ? getCollectionId : () => 0;
		if (!Type.isFunction(BX?.PULL?.subscribe))
		{
			return;
		}

		this.stop();
		this.#callbacks = {
			onPatch,
			onAwareness,
			onOffline,
			onBackOnline,
			onDocumentUpdate,
			onArchive,
			onRestore,
			onDelete,
			onHardDelete,
			onContentOverwritten,
			onCapabilities,
		};

		this.#pullHandler = (data) => {
			this.#handleCommand(data);
		};

		this.#pullUnsubscribers.push(
			BX.PULL.subscribe({
				type: PullClient.SubscriptionType.Server,
				moduleId: 'note',
				callback: this.#pullHandler,
			}),
			BX.PULL.subscribe({
				type: PullClient.SubscriptionType.Client,
				moduleId: 'note',
				callback: this.#pullHandler,
			}),
			BX.PULL.subscribe({
				type: PullClient.SubscriptionType.Status,
				callback: (data) => {
					this.#handleStatusChange(data);
				},
			}),
		);

		BX.PULL.extendWatch(`NOTE_DOC_${this.#documentId}`);
		BX.PULL.extendWatch(`NOTE_DOC_AWARE_${this.#documentId}`);
		// ACL channel — capability updates flow on this tag.
		BX.PULL.extendWatch(`NOTE_DOC_${this.#documentId}_ACL`);
		const collectionId = Number(this.#getCollectionId());
		if (Number.isInteger(collectionId) && collectionId > 0)
		{
			BX.PULL.extendWatch(`NOTE_COLLECTION_${collectionId}_ACL`);
			// Non-ACL collection channel — archive/delete cascade events of sibling/ancestor docs
			// arrive here so an open editor can detect that its subtree got swept.
			BX.PULL.extendWatch(`NOTE_COLLECTION_${collectionId}`);
		}
	}

	// Re-issue extendWatch for the (potentially new) collection of this document.
	// Called after a documentMove flips state.collectionId — without it the ACL/cascade
	// channel for the new collection would never get a server-side keepalive from this tab.
	refreshCollectionWatch(): void
	{
		if (!Type.isFunction(BX?.PULL?.extendWatch))
		{
			return;
		}

		const collectionId = Number(this.#getCollectionId());
		if (!Number.isInteger(collectionId) || collectionId <= 0)
		{
			return;
		}

		BX.PULL.extendWatch(`NOTE_COLLECTION_${collectionId}_ACL`);
		BX.PULL.extendWatch(`NOTE_COLLECTION_${collectionId}`);
	}

	stop(): void
	{
		if (this.#pullUnsubscribers.length > 0)
		{
			for (const unsub of this.#pullUnsubscribers)
			{
				if (Type.isFunction(unsub))
				{
					unsub();
				}
			}
			this.#pullUnsubscribers = [];
		}

		this.#pullHandler = null;
	}

	destroy(): void
	{
		this.stop();
		this.#callbacks = null;
	}

	#handleCommand(data: Object): void
	{
		if (!this.#callbacks)
		{
			return;
		}

		const { command, params } = data;

		if (command === PullCommand.DOCUMENT_PATCH_RECEIVED && Number(params?.documentId) === this.#documentId)
		{
			const patchBase64 = params?.patch;
			if (Type.isStringFilled(patchBase64))
			{
				const update = base64ToUint8Array(patchBase64);
				this.#callbacks.onPatch(update, params);
			}
		}

		if (command === PullCommand.DOCUMENT_AWARENESS && Number(params?.documentId) === this.#documentId)
		{
			this.#callbacks.onAwareness(params);
		}

		if (!LIFECYCLE_COMMANDS.has(command))
		{
			return;
		}

		// Subtree refetch payload has no documentIds — fall back to a capability/meta refetch so
		// the provider can decide whether the open document landed in archive/trash.
		const isDocCascade = command === PullCommand.DOCUMENT_ARCHIVE || command === PullCommand.DOCUMENT_DELETE;
		if (isDocCascade && params?.requestRefetch === true && !Array.isArray(params?.documentIds))
		{
			if (this.#getCollectionId() !== Number(params?.collectionId))
			{
				return;
			}
			const refetch = this.#callbacks.onCapabilities;
			if (typeof refetch === 'function')
			{
				refetch(params || {});
			}

			return;
		}

		if (!this.#isForCurrentDocument(command, params))
		{
			return;
		}

		const callbackName = LIFECYCLE_CALLBACK_BY_COMMAND[command];
		const callback = this.#callbacks[callbackName];
		if (typeof callback === 'function')
		{
			callback(this.#enrichLifecyclePayload(command, params) || {});
		}
	}

	// COLLECTION_DELETE carries an optional `recycleBinMap` keyed by documentId — lift this
	// tab's own entry into `recycleBinId/trashedAt` so handleRemoteDelete can fill state
	// without a follow-up REST round-trip.
	#enrichLifecyclePayload(command: string, params: ?Object): ?Object
	{
		if (command !== PullCommand.COLLECTION_DELETE || !params || !params.recycleBinMap)
		{
			return params;
		}

		const entry = params.recycleBinMap[this.#documentId] || params.recycleBinMap[String(this.#documentId)];
		if (!entry)
		{
			return params;
		}

		return {
			...params,
			recycleBinId: Number(entry.id) || 0,
			trashedAt: typeof entry.trashedAt === 'string' ? entry.trashedAt : '',
		};
	}

	#isForCurrentDocument(command: string, params: ?Object): boolean
	{
		if (!params)
		{
			return false;
		}

		// Batch lifecycle events carry a documentIds[] payload instead of documentId.
		if (command === PullCommand.DOCUMENT_ARCHIVE || command === PullCommand.DOCUMENT_DELETE)
		{
			const ids = Array.isArray(params.documentIds) ? params.documentIds : null;
			if (!ids)
			{
				return Number(params.documentId) === this.#documentId;
			}

			for (const id of ids)
			{
				if (Number(id) === this.#documentId)
				{
					return true;
				}
			}

			return false;
		}

		// Collection-level events apply to every doc in that collection.
		if (
			command === PullCommand.COLLECTION_CAPABILITIES
			|| command === PullCommand.COLLECTION_ARCHIVE
			|| command === PullCommand.COLLECTION_DELETE
		)
		{
			const collectionId = Number(this.#getCollectionId());

			return collectionId > 0 && Number(params.collectionId) === collectionId;
		}

		return Number(params.documentId) === this.#documentId;
	}

	#handleStatusChange(data: Object): void
	{
		if (!this.#callbacks)
		{
			return;
		}

		const { status } = data;

		if (status === 'offline')
		{
			this.#wasPullOffline = true;
			this.#callbacks.onOffline();
		}
		else if (status === 'online' && this.#wasPullOffline)
		{
			this.#wasPullOffline = false;
			this.#callbacks.onBackOnline();
		}
	}
}
