import { Type } from 'main.core';
import { BaseEvent, EventEmitter } from 'main.core.events';
import { PullClient } from 'pull.client';
import { NoteEvent } from '../../../services/note-events';

const PullCommand = Object.freeze({
	DOCUMENT_CREATE: 'documentCreate',
	DOCUMENT_UPDATE: 'documentUpdate',
	DOCUMENT_MOVE: 'documentMove',
	DOCUMENT_ARCHIVE: 'documentArchive',
	DOCUMENT_RESTORE: 'documentRestore',
	DOCUMENT_DELETE: 'documentDelete',
	DOCUMENT_HARD_DELETE: 'documentHardDelete',
	COLLECTION_CREATE: 'collectionCreate',
	COLLECTION_UPDATE: 'collectionUpdate',
	COLLECTION_MOVE: 'collectionMove',
	COLLECTION_ARCHIVE: 'collectionArchive',
	COLLECTION_RESTORE: 'collectionRestore',
	COLLECTION_DELETE: 'collectionDelete',
	COLLECTION_CAPABILITIES: 'collectionCapabilities',
	COLLECTION_LIST_INVALIDATED: 'collectionListInvalidated',
	DOCUMENT_ACCESS_CASCADE: 'documentAccessCascade',
	// [EVENT-01] Personal channel: the composition of the favorites block.
	FAVORITE_ADD: 'favoriteAdd',
	FAVORITE_REMOVE: 'favoriteRemove',
	FAVORITE_MOVE: 'favoriteMove',
	// [EVENT-02] Personal channel: the notification state of an object of the block.
	SUBSCRIPTION_SET: 'subscriptionSet',
	SUBSCRIPTION_REMOVE: 'subscriptionRemove',
});

export { PullCommand };

export class SidebarPullActions
{
	#state;
	#handlers: { [string]: (params: Object) => void };
	#subscriptions: Array<Function>;
	#subscribed: boolean;

	constructor({ state, handlers }: { state: Object, handlers: { [string]: (params: Object) => void } })
	{
		this.#state = state;
		this.#handlers = handlers || {};
		this.#subscriptions = [];
		this.#subscribed = false;
	}

	subscribeToPullEvents(): void
	{
		if (this.#subscribed)
		{
			this.#refreshCollectionWatches();

			return;
		}

		if (!Type.isFunction(BX?.PULL?.subscribe))
		{
			return;
		}

		const knownCommands = new Set(Object.values(PullCommand));
		const handler = (data) => {
			// Drop foreign/out-of-spec pushes before any bus traffic or warn noise —
			// only commands declared in PullCommand are routed.
			if (!data || !knownCommands.has(data.command))
			{
				return;
			}

			// Cross-route bus: re-emit on EventEmitter so non-sidebar pages
			// (e.g. /shared/) can react without subscribing to BX.PULL directly.
			EventEmitter.emit(NoteEvent.PULL_EVENT, new BaseEvent({
				data: { command: data.command, params: data.params || {} },
			}));

			const dispatch = this.#handlers[data.command];
			if (typeof dispatch !== 'function')
			{
				console.warn('[NOTE PULL SIDEBAR] no handler for', data.command);

				return;
			}

			dispatch(data.params || {});
		};

		const unsubscribeServer = BX.PULL.subscribe({
			type: PullClient.SubscriptionType.Server,
			moduleId: 'note',
			callback: handler,
		});
		if (Type.isFunction(unsubscribeServer))
		{
			this.#subscriptions.push(unsubscribeServer);
		}

		BX.PULL.extendWatch('NOTE_GLOBAL');
		this.#refreshCollectionWatches();

		this.#subscribed = true;
	}

	unsubscribeFromPullEvents(): void
	{
		for (const unsub of this.#subscriptions)
		{
			if (Type.isFunction(unsub))
			{
				unsub();
			}
		}
		this.#subscriptions = [];
		this.#subscribed = false;
	}

	refreshCollectionWatches(): void
	{
		this.#refreshCollectionWatches();
	}

	#refreshCollectionWatches(): void
	{
		if (!Type.isFunction(BX?.PULL?.extendWatch))
		{
			return;
		}

		const collections = this.#state.collections.value || [];
		for (const collection of collections)
		{
			const id = Number(collection?.id);
			if (!Number.isInteger(id) || id <= 0)
			{
				continue;
			}

			BX.PULL.extendWatch(`NOTE_COLLECTION_${id}`);
			BX.PULL.extendWatch(`NOTE_COLLECTION_${id}_ACL`);
		}
	}
}
