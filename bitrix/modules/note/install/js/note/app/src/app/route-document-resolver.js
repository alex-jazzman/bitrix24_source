import { ajax, Type } from 'main.core';
import type { DocumentData } from 'note.editor';
import type { ResolveResult } from '../type';

export class RouteDocumentResolver
{
	#inFlightById: Map<number, Promise<DocumentData | null>> = new Map();

	async resolve(
		docId: mixed,
		{ fullContext = false }: { fullContext?: boolean } = {},
	): Promise<ResolveResult>
	{
		const normalizedDocId = this.#toPositiveInt(docId);
		if (normalizedDocId === null)
		{
			return this.#emptyResult('not_found');
		}

		try
		{
			if (fullContext)
			{
				return await this.#resolveWithOpenContext(normalizedDocId);
			}

			const document = await this.#getDocument(normalizedDocId);
			if (!document)
			{
				return this.#emptyResult('not_found');
			}

			return {
				status: 'ready',
				document,
				ancestors: document.ancestors,
				openContext: null,
				errorMessage: '',
			};
		}
		catch (error)
		{
			const message = Type.isStringFilled(error?.message)
				? error.message
				: ''
			;

			return {
				...this.#emptyResult('error'),
				errorMessage: message,
			};
		}
	}

	async #resolveWithOpenContext(docId: number): Promise<ResolveResult>
	{
		const response = await ajax.runAction('note.infrastructure.DocumentController.getOpenContext', {
			data: { id: docId },
		});
		const context = response?.data ?? null;
		if (!Type.isPlainObject(context))
		{
			return this.#emptyResult('not_found');
		}

		const document = this.#normalizeDocument(context.document);
		if (!document)
		{
			return this.#emptyResult('not_found');
		}

		return {
			status: 'ready',
			document,
			ancestors: document.ancestors,
			openContext: context,
			errorMessage: '',
		};
	}

	#emptyResult(status: 'not_found' | 'error'): ResolveResult
	{
		return {
			status,
			document: null,
			ancestors: [],
			openContext: null,
			errorMessage: '',
		};
	}

	async #getDocument(docId: number): Promise<DocumentData | null>
	{
		if (this.#inFlightById.has(docId))
		{
			return this.#inFlightById.get(docId);
		}

		let request = null;
		request = (async () => {
			try
			{
				const response = await ajax.runAction('note.infrastructure.DocumentController.get', {
					data: { id: docId },
				});

				return this.#normalizeDocument(response?.data ?? null);
			}
			finally
			{
				if (this.#inFlightById.get(docId) === request)
				{
					this.#inFlightById.delete(docId);
				}
			}
		})();

		this.#inFlightById.set(docId, request);

		return request;
	}

	#normalizeDocument(row: mixed): DocumentData | null
	{
		if (!Type.isPlainObject(row))
		{
			return null;
		}

		const id = this.#toPositiveInt(row.id);
		if (id === null)
		{
			return null;
		}

		const sharedAccess = Boolean(row.sharedAccess);
		const isTrashed = Boolean(row.isTrashed);
		const collectionId = this.#toPositiveInt(row.collectionId);
		if (collectionId === null && !sharedAccess && !isTrashed)
		{
			return null;
		}

		const markdown = Type.isArray(row.markdown)
			|| Type.isPlainObject(row.markdown)
			|| Type.isString(row.markdown)
			? row.markdown
			: null;

		return {
			...row,
			id,
			collectionId: collectionId ?? 0,
			// Container id of a shared document: keys its branch in the accessible-tree namespace.
			// Reported apart from collectionId, which stays absent so the breadcrumb container is
			// rendered as plain text.
			sharedCollectionId: this.#toPositiveInt(row.sharedCollectionId) ?? 0,
			collectionTitle: String(row.collectionTitle ?? ''),
			ancestors: this.#normalizeAncestors(row.ancestors),
			canEdit: Boolean(row.canEdit),
			canEditCollection: Boolean(row.canEditCollection),
			sharedAccess,
			parentId: this.#toNullableInt(row.parentId),
			title: String(row.title ?? ''),
			markdown,
			position: this.#toInt(row.position) ?? 0,
			isArchived: Boolean(row.isArchived),
			archivedAt: typeof row.archivedAt === 'string' && row.archivedAt !== '' ? row.archivedAt : null,
			isTrashed,
			trashedAt: typeof row.trashedAt === 'string' && row.trashedAt !== '' ? row.trashedAt : null,
			isOrphan: Boolean(row.isOrphan),
			canRestore: Boolean(row.canRestore),
			views: this.#normalizeViews(row.views),
			lastChange: this.#normalizeLastChange(row.lastChange),
			subscription: this.#normalizeSubscription(row.subscription),
		};
	}

	// Bell state bundled with the bootstrap payload (see DocumentSubscriptionStateResolver) — the
	// subscription bell adopts this instead of its own getState request on mount.
	#normalizeSubscription(value: mixed): Object | null
	{
		if (!Type.isPlainObject(value))
		{
			return null;
		}

		return {
			subscribed: Boolean(value.subscribed),
			mode: typeof value.mode === 'string' ? value.mode : null,
			muted: Boolean(value.muted),
			inherited: Boolean(value.inherited),
			inheritedSource: typeof value.inheritedSource === 'string' ? value.inheritedSource : null,
			inheritedTitle: typeof value.inheritedTitle === 'string' ? value.inheritedTitle : '',
		};
	}

	// [#2] `{ authors: [{id,name,avatar}], time: <ISO 8601 string> } | null` — feeds
	// note.ui.document-history's ActivityLineComponent chip (see note.editor's `lastChange`
	// state/prop). Missing authors or an unparsable time both collapse to null: the chip's own
	// `hasChipInfo` check treats a partial snapshot the same as "nothing to show yet".
	#normalizeLastChange(value: mixed): { authors: Array<Object>, time: string } | null
	{
		if (!Type.isPlainObject(value))
		{
			return null;
		}

		const rawAuthors = Array.isArray(value.authors) ? value.authors : [];
		const authors = [];
		for (const author of rawAuthors)
		{
			if (!Type.isPlainObject(author))
			{
				continue;
			}

			const id = this.#toPositiveInt(author.id);
			if (id === null)
			{
				continue;
			}

			authors.push({
				id,
				name: String(author.name ?? ''),
				avatar: author.avatar || null,
				// Server identity color (matches the caret / timeline) — keep it so the bootstrap chip
				// avatar isn't the palette fallback.
				color: author.color || null,
			});
		}

		const time = typeof value.time === 'string' ? value.time : '';
		if (authors.length === 0 || time === '')
		{
			return null;
		}

		return { authors, time };
	}

	#normalizeViews(value: mixed): { uniqueCount: number, viewers: Array<Object> } | null
	{
		if (!Type.isPlainObject(value))
		{
			return null;
		}

		const viewers = Array.isArray(value.viewers) ? value.viewers : [];
		const normalizedViewers = [];
		for (const viewer of viewers)
		{
			if (!Type.isPlainObject(viewer))
			{
				continue;
			}

			const userId = this.#toPositiveInt(viewer.userId);
			if (userId === null)
			{
				continue;
			}

			normalizedViewers.push({
				userId,
				name: String(viewer.name ?? ''),
				avatar: viewer.avatar || null,
				// Server identity color (matches the caret / avatar stack) — keep it so bootstrap
				// viewers aren't palette-colored while live/paginated rows use the real color.
				color: viewer.color || null,
				viewedAt: typeof viewer.viewedAt === 'string' ? viewer.viewedAt : '',
			});
		}

		return {
			uniqueCount: Number.isInteger(value.uniqueCount) ? value.uniqueCount : normalizedViewers.length,
			viewers: normalizedViewers,
		};
	}

	#normalizeAncestors(value: mixed): Array<{id: number, title: string}>
	{
		if (!Array.isArray(value))
		{
			return [];
		}

		const result = [];
		for (const item of value)
		{
			if (!Type.isPlainObject(item))
			{
				continue;
			}

			const id = this.#toPositiveInt(item.id);
			if (id === null)
			{
				continue;
			}

			result.push({
				id,
				title: String(item.title ?? ''),
			});
		}

		return result;
	}

	#toInt(value: mixed): number | null
	{
		const parsed = Number(value);
		if (!Number.isFinite(parsed))
		{
			return null;
		}

		return Math.trunc(parsed);
	}

	#toPositiveInt(value: mixed): number | null
	{
		const normalized = this.#toInt(value);

		return normalized !== null && normalized > 0 ? normalized : null;
	}

	#toNullableInt(value: mixed): number | null
	{
		if (value === null || value === undefined || value === '')
		{
			return null;
		}

		return this.#toInt(value);
	}
}
