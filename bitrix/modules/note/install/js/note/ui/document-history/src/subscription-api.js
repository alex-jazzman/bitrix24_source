import { ajax } from 'main.core';

// Thin ajax wrapper around SubscriptionController - mirrors
// history-api.js's shape (one static method per action, plain data objects in/out).
export const SUBSCRIPTION_SCOPE_DOCUMENT = 'document';
export const SUBSCRIPTION_SCOPE_COLLECTION = 'collection';

export const SUBSCRIPTION_MODE_SELF = 'self';
export const SUBSCRIPTION_MODE_SUBTREE = 'subtree';
export const SUBSCRIPTION_MODE_ALL = 'all';
// Negative override for a document covered by an ancestor subtree / collection subscription —
// suppresses this document's notifications without touching the inherited subscription.
export const SUBSCRIPTION_MODE_MUTED = 'muted';

// MODES-01: the modes the product actually ships, per scope - a document is subscribed with `self`
// alone, a knowledge base has no shipped mode at all. Mirror of the server's list; the refusal lives
// on the transport (SubscriptionController::setAction), this map only keeps the interface from
// offering what the server would not accept. It is the single place on the client that says what is
// shipped: no component decides that for itself, so widening the shipping is an edit of this map.
export const SHIPPED_SUBSCRIPTION_MODES = Object.freeze({
	[SUBSCRIPTION_SCOPE_DOCUMENT]: Object.freeze([SUBSCRIPTION_MODE_SELF]),
	[SUBSCRIPTION_SCOPE_COLLECTION]: Object.freeze([]),
});

export function isShippedSubscriptionMode(scope: string, mode: mixed): boolean
{
	return (SHIPPED_SUBSCRIPTION_MODES[scope] ?? []).includes(String(mode ?? ''));
}

// Whether the scope has a shipped mode at all - the build-time half of the question, asked on its
// own only where no portal option applies (a mirror guard, a test).
export function hasShippedSubscriptionMode(scope: string): boolean
{
	return (SHIPPED_SUBSCRIPTION_MODES[scope] ?? []).length > 0;
}

// Whether a subscription surface exists here at all - what a component asks before it draws a bell
// or a filter. Both halves meet in this one function: the shipping map above, and the
// `notifications_enabled` option the server feeds to the mount. No component carries a rule of its
// own, so widening the shipping or switching the option reaches every surface through here.
export function hasSubscriptionSurface(scope: string, notificationsEnabled: mixed): boolean
{
	return notificationsEnabled === true && hasShippedSubscriptionMode(scope);
}

// Refusal of a positive subscription on an object that is not in the favorites list.
export const SUBSCRIPTION_ERROR_FAVORITE_REQUIRED = 'FAVORITE_REQUIRED';

export function isFavoriteRequiredError(error: mixed): boolean
{
	return String(error?.errors?.[0]?.code || '') === SUBSCRIPTION_ERROR_FAVORITE_REQUIRED;
}

export class SubscriptionApi
{
	// Subscribe / change scope - idempotent upsert. `mode` is `self`/`subtree`
	// for a document target, `all` for a collection target.
	static async set(
		{ scope, entityId, mode }: { scope: string, entityId: number, mode: string },
	): Promise<Object>
	{
		return ajax.runAction('note.infrastructure.SubscriptionController.set', {
			data: {
				scope,
				entityId: Number(entityId),
				mode,
			},
		});
	}

	// Unsubscribe - removes the caller's own subscription.
	static async remove(
		{ scope, entityId }: { scope: string, entityId: number },
	): Promise<Object>
	{
		return ajax.runAction('note.infrastructure.SubscriptionController.remove', {
			data: {
				scope,
				entityId: Number(entityId),
			},
		});
	}

	// State for the bell control. `collectionId` is optional - the server
	// falls back to the document's own collection when it's omitted.
	static async getState(
		{ documentId, collectionId = null }: { documentId: number, collectionId?: ?number },
	): Promise<Object>
	{
		const data = { documentId: Number(documentId) };

		if (Number.isInteger(collectionId) && collectionId > 0)
		{
			data.collectionId = collectionId;
		}

		return ajax.runAction('note.infrastructure.SubscriptionController.getState', { data });
	}
}
