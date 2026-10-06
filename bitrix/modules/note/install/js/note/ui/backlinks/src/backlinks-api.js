import { ajax, Type } from 'main.core';

// [API-01 / API-02] Client of the two backlink actions of DocumentController — one file per domain,
// same shape as history-api.js / favorite-api.js. The server answers a missing document, a forbidden
// one and a switched-off feature identically with 403, so the client has nothing to tell apart here.
const NEUTRAL_COUNT = Object.freeze({ count: 0, isCapped: false });

export class BacklinksApi
{
	// [API-01] Keyset page of the documents that link here. `afterCursor` is the `nextCursor` of a
	// previous answer (a raw SOURCE_ID) — an opaque value handed back verbatim, never parsed or built
	// locally. Guard on PRESENCE, not on a filled string: the cursor is a number, so a string check
	// would drop it and refetch the first page forever. Rejects on failure: the list owns its retry.
	static getBacklinks(
		{ documentId, limit = 20, afterCursor = null }: {
			documentId: number,
			limit?: number,
			afterCursor?: mixed,
		},
	): Promise<Object>
	{
		const data = {
			documentId: Number(documentId),
			limit: Number(limit),
		};

		if (afterCursor !== null && afterCursor !== undefined)
		{
			data.afterSourceId = afterCursor;
		}

		return ajax.runAction('note.infrastructure.DocumentController.getBacklinks', { data });
	}

	// [API-02] Personal counter of the chip. Never rejects: a refusal means "nothing to show" and
	// has to reach the chip as a zero, not as an error — naming the refusal would leak the very
	// existence of the sources the server just hid.
	static getBacklinksCount({ documentId }: { documentId: number }): Promise<{ count: number, isCapped: boolean }>
	{
		return ajax
			.runAction('note.infrastructure.DocumentController.getBacklinksCount', {
				data: { documentId: Number(documentId) },
			})
			.then((response) => {
				const payload = response?.data;
				if (!Type.isPlainObject(payload))
				{
					return { ...NEUTRAL_COUNT };
				}

				return {
					count: Number(payload.count) || 0,
					isCapped: payload.isCapped === true,
				};
			})
			.catch(() => ({ ...NEUTRAL_COUNT }));
	}
}
