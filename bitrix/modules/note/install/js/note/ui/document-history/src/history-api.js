import { ajax, Type } from 'main.core';

// Server rejects restoreVersion with 409 when the patch window is non-empty (SDD P1.T2):
// the client is expected to compact() and retry once — see VersionTimelineComponent.
export const RESTORE_DIRTY_WINDOW_ERROR_CODE = 'NOTE_RESTORE_DIRTY_WINDOW';

export function isRestoreDirtyWindowError(error: mixed): boolean
{
	const errors = Array.isArray(error?.errors) ? error.errors : [];

	return errors.some((item) => String(item?.code || '') === RESTORE_DIRTY_WINDOW_ERROR_CODE);
}

export class HistoryApi
{
	// [API-02] Lazy body fetch — only called on click (version-preview), never in a list.
	static async getVersion(
		{ documentId, versionId }: { documentId: number, versionId: number },
	): Promise<Object>
	{
		return ajax.runAction('note.infrastructure.DocumentController.getVersion', {
			data: {
				documentId: Number(documentId),
				versionId: Number(versionId),
			},
		});
	}

	// [API-03] Requires a prior compact() of the patch window — see the 409 retry flow in
	// VersionTimelineComponent.restoreCurrentVersion().
	//
	// `operationId` is the caller's name for this restore. The server does not store it - it echoes the
	// value in the documentContentOverwritten push, which is how the tab that asked for the restore tells
	// the answer to its own request from a rewrite somebody else made in the meantime. Optional, and a
	// caller that has no use for the distinction sends nothing, exactly as before.
	static async restoreVersion(
		{ documentId, versionId, operationId = null }: {
			documentId: number,
			versionId: number,
			operationId?: string | null,
		},
	): Promise<Object>
	{
		const data: Object = {
			documentId: Number(documentId),
			versionId: Number(versionId),
		};

		if (Type.isStringFilled(operationId))
		{
			data.operationId = operationId;
		}

		return ajax.runAction('note.infrastructure.DocumentController.restoreVersion', { data });
	}

	// [API-04, P2.T4] Keyset feed page — role visibility is applied server-side before the
	// `types` filter, the filter can only narrow it further (see FeedProvider). An empty
	// `types` list is the server's own "select all"; the caller must NOT send [] when the user
	// deselected everything (that reads as "all") — it short-circuits locally instead.
	// `afterCursor` is an opaque `{ createdAt, id }` handed back from a prior nextCursor — pass
	// it through verbatim, never reconstruct it.
	static async listFeed(
		{ documentId, types = [], limit = 30, afterCursor = null }: {
			documentId: number,
			types?: Array<string>,
			limit?: number,
			afterCursor?: ?Object,
		},
	): Promise<Object>
	{
		const data = {
			documentId: Number(documentId),
			types: Array.isArray(types) ? types : [],
			limit: Number(limit),
		};

		if (Type.isPlainObject(afterCursor))
		{
			data.afterCursor = afterCursor;
		}

		return ajax.runAction('note.infrastructure.DocumentController.listFeed', { data });
	}

	// [API-06, P3.T3/T4] Server snapshot of "who viewed the document" — the views widget uses
	// this as its base and overlays live awareness join/heartbeat events on top (see
	// views-widget.js). No separate track call exists here on purpose: a view is recorded
	// server-side as a side effect of the awareness `join` message (P3.T2), not by this read.
	static async getViews(
		{ documentId, limit = 50, afterCursor = null }: {
			documentId: number,
			limit?: number,
			afterCursor?: ?{ viewedAt: string, userId: number },
		},
	): Promise<Object>
	{
		const data = {
			documentId: Number(documentId),
			limit: Number(limit),
		};

		if (afterCursor !== null && Type.isPlainObject(afterCursor))
		{
			data.afterCursor = {
				viewedAt: String(afterCursor.viewedAt || ''),
				userId: Number(afterCursor.userId) || 0,
			};
		}

		return ajax.runAction('note.infrastructure.DocumentController.getViews', { data });
	}
}
