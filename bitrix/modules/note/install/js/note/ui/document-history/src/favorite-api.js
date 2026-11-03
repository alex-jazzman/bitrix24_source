import { ajax } from 'main.core';

// Thin ajax wrapper around FavoriteController for the star of the activity line -
// same shape as subscription-api.js (one static method per action, plain data objects in/out). Only
// the document scope is here: the star of a knowledge base lives in the sidebar row, not in a document.
const ENTITY_TYPE_DOCUMENT = 'document';

export class FavoriteApi
{
	// Adds the document to the personal list; without a position it goes in first.
	static add({ documentId }: { documentId: number }): Promise<Object>
	{
		return ajax.runAction('note.infrastructure.FavoriteController.add', {
			data: {
				entityType: ENTITY_TYPE_DOCUMENT,
				entityId: Number(documentId),
				position: null,
			},
		});
	}

	// Removes the row. Idempotent: a missing row is not an error.
	static remove({ documentId }: { documentId: number }): Promise<Object>
	{
		return ajax.runAction('note.infrastructure.FavoriteController.remove', {
			data: {
				entityType: ENTITY_TYPE_DOCUMENT,
				entityId: Number(documentId),
			},
		});
	}
}
