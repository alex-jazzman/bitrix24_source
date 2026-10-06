import { ajax } from 'main.core';

// [P6.T4 / API-07..09] Thin ajax wrapper around SubscriptionController — mirrors
// history-api.js's shape (one static method per action, plain data objects in/out).
export const SUBSCRIPTION_SCOPE_DOCUMENT = 'document';
export const SUBSCRIPTION_SCOPE_COLLECTION = 'collection';

export const SUBSCRIPTION_MODE_SELF = 'self';
export const SUBSCRIPTION_MODE_SUBTREE = 'subtree';
export const SUBSCRIPTION_MODE_ALL = 'all';
// Negative override for a document covered by an ancestor subtree / collection subscription —
// suppresses this document's notifications without touching the inherited subscription.
export const SUBSCRIPTION_MODE_MUTED = 'muted';

// [API-05] Refusal of a positive subscription on an object that is not in the favorites list.
export const SUBSCRIPTION_ERROR_FAVORITE_REQUIRED = 'FAVORITE_REQUIRED';

export function isFavoriteRequiredError(error: mixed): boolean
{
	return String(error?.errors?.[0]?.code || '') === SUBSCRIPTION_ERROR_FAVORITE_REQUIRED;
}

export class SubscriptionApi
{
	// [API-07] Subscribe / change scope — idempotent upsert. `mode` is `self`/`subtree`
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

	// [API-08] Unsubscribe — removes the caller's own subscription.
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

	// [API-09] State for the bell control. `collectionId` is optional — the server
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
