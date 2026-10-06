import { Type } from 'main.core';
import { PullClient } from 'pull.client';

// [NEW-C] Shared client half of the document-history push contract. The server registers the
// NOTE_DOC_HISTORY_{documentId} tag in CollaborationProvider::subscribeUserToDocumentTag and
// broadcasts freshly recorded b_note_event rows on it via HistoryPullGateway; FE extendWatch only
// renews an existing tag, it never subscribes a new one. Both the sidebar feed (version-timeline)
// and the activity-line chip consume this same stream — hence a single helper instead of two
// copies of the subscribe/extend/route plumbing.
const HISTORY_PUSH_COMMAND = 'documentHistoryEvent';
const HISTORY_PULL_TAG_PREFIX = 'NOTE_DOC_HISTORY_';

// [EVENT-02] Subscription lifecycle of the current user, pushed on their personal channel. Only
// these two commands are routed; anything else is dropped before a consumer sees it.
const SUBSCRIPTION_PUSH_COMMANDS = Object.freeze(['subscriptionSet', 'subscriptionRemove']);
const SUBSCRIPTION_SCOPE_DOCUMENT = 'document';
// The one depth that reaches nobody but the object it is written on. Everything else - a subscription
// on the knowledge base, a subtree subscription on an ancestor, and any removal (which carries no
// depth at all) - can change what reaches a document that is not named in the payload.
const SUBSCRIPTION_MODE_SELF = 'self';

// Subscribes to the pushed history-event stream for one document. `onEvent(event)` gets each pushed
// tile (a listFeed row shape, see HistoryPullGateway::emit/FeedProvider::enrichOne). Returns a
// disposer; calling it detaches the subscription. Safe to call before BX.PULL exists (no-op disposer).
export function subscribeDocumentHistory(documentId: number, onEvent: (event: Object) => void): () => void
{
	const id = Number(documentId);
	if (!Type.isFunction(BX?.PULL?.subscribe) || !(id > 0) || !Type.isFunction(onEvent))
	{
		return () => {};
	}

	const handler = (data) => {
		if (data?.command !== HISTORY_PUSH_COMMAND)
		{
			return;
		}

		const params = data?.params;
		if (Number(params?.documentId) !== id || !Type.isPlainObject(params?.event))
		{
			return;
		}

		onEvent(params.event);
	};

	const unsubscribe = BX.PULL.subscribe({
		type: PullClient.SubscriptionType.Server,
		moduleId: 'note',
		callback: handler,
	});
	extendDocumentHistoryWatch(id);

	return () => {
		if (typeof unsubscribe === 'function')
		{
			unsubscribe();
		}
	};
}

// [EVENT-02] Subscribes to the subscription commands that can concern one document - its own row and
// anything that may cover it from above (AC-052). `onChange({ command, mode })` carries the direct mode
// of the change; the effective state of the document also depends on coverage, so a consumer re-reads
// rather than adopting it blindly - which is why the filter errs towards passing a change through.
// Returns a disposer. Safe to call before BX.PULL exists (no-op disposer). No per-document tag here:
// these commands travel on the user's personal channel.
export function subscribeDocumentSubscription(
	documentId: number,
	onChange: (change: Object) => void,
): () => void
{
	const id = Number(documentId);
	if (!Type.isFunction(BX?.PULL?.subscribe) || !(id > 0) || !Type.isFunction(onChange))
	{
		return () => {};
	}

	const handler = (data) => {
		const command = String(data?.command || '');
		if (!SUBSCRIPTION_PUSH_COMMANDS.includes(command))
		{
			return;
		}

		const params = data?.params;
		const mode = params?.mode ?? null;
		// Another document's own-depth row is the only change that provably cannot reach this document.
		const isForeignSelfRow = params?.scope === SUBSCRIPTION_SCOPE_DOCUMENT
			&& Number(params?.entityId) !== id
			&& mode === SUBSCRIPTION_MODE_SELF;
		if (isForeignSelfRow)
		{
			return;
		}

		onChange({ command, mode });
	};

	const unsubscribe = BX.PULL.subscribe({
		type: PullClient.SubscriptionType.Server,
		moduleId: 'note',
		callback: handler,
	});

	return () => {
		if (typeof unsubscribe === 'function')
		{
			unsubscribe();
		}
	};
}

// Cheap keepalive for the per-document tag — extendWatch prolongs an already-registered tag, it
// does not create one (that happened server-side). Call it when a consumer becomes visible again.
export function extendDocumentHistoryWatch(documentId: number): void
{
	if (!Type.isFunction(BX?.PULL?.extendWatch))
	{
		return;
	}

	const id = Number(documentId);
	if (id > 0)
	{
		BX.PULL.extendWatch(`${HISTORY_PULL_TAG_PREFIX}${id}`);
	}
}
