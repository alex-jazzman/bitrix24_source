import { EventEmitter, BaseEvent } from 'main.core.events';
import { NoteEvent } from '../../services/note-events';
import { captureRowTravel, markSectionMotion } from '../../utils/drop-motion';
import type { SidebarDocument, Collection } from '../../type';
import type { SidebarApi } from '../../services/sidebar-api';

type DocDragTarget = {
	collectionId: number,
	parentId: number | null,
	targetId: number | null,
	placement: string,
};

type BranchDragPayload = {
	branchElement: HTMLElement,
	collectionId: number | string,
	parentId: number | string | null,
	nativeEvent: DragEvent,
};

type CachedRect = {
	docId: number,
	top: number,
	bottom: number,
	height: number,
};

export class DocumentDndService
{
	#dragState: Object;
	#store: Object;
	#api: SidebarApi;
	#onFail: (error: mixed) => void;
	#uiState: Object;
	#autoExpandDelayMs: number;
	#prefetchCooldownMs: number = 300;
	#autoExpandTimer: number | null = null;
	#autoExpandKey: string | null = null;
	#dragPrefetchedKeys: Set<string> = new Set();
	#dragPrefetchInFlight: Map<string, Promise<void>> = new Map();
	#dragPrefetchAt: Map<string, number> = new Map();
	#cachedBranchElement: HTMLElement | null = null;
	#cachedRects: CachedRect[] | null = null;

	constructor({
		dragState,
		store,
		api,
		onFail,
		uiState,
		autoExpandDelayMs = 500,
	}: {
		dragState: Object,
		store: Object,
		api: SidebarApi,
		onFail: (error: mixed) => void,
		uiState: Object,
		autoExpandDelayMs?: number,
	})
	{
		this.#dragState = dragState;
		this.#store = store;
		this.#api = api;
		this.#onFail = onFail;
		this.#uiState = uiState;
		this.#autoExpandDelayMs = autoExpandDelayMs;
	}

	startDrag(doc: SidebarDocument, event: DragEvent): void
	{
		this.#clearAutoExpand();
		this.#clearDragPrefetchState();
		this.#invalidateRectCache();
		this.#dragState.docItem = {
			id: Number(doc.id),
			collectionId: Number(doc.collectionId),
			parentId: this.#toNullableInt(doc.parentId),
			title: String(doc.title || ''),
			hasChildren: Boolean(doc.hasChildren),
			position: Number(doc.position || 0),
		};
		this.#dragState.docTarget = null;

		const transfer = event.dataTransfer;
		if (transfer)
		{
			transfer.effectAllowed = 'move';
			transfer.setData('text/plain', String(doc.id));
		}
	}

	onBranchDragEnter(payload: BranchDragPayload): void
	{
		if (!this.#dragState.docItem)
		{
			return;
		}

		payload.nativeEvent.preventDefault();
		this.#cacheBranchRects(payload.branchElement);
	}

	onBranchDragOver(payload: BranchDragPayload): void
	{
		if (!this.#dragState.docItem)
		{
			return;
		}

		payload.nativeEvent.preventDefault();

		if (this.#cachedBranchElement !== payload.branchElement)
		{
			this.#cacheBranchRects(payload.branchElement);
		}

		const collectionId = Number(payload.collectionId);
		const parentId = this.#toNullableInt(payload.parentId);
		const target = this.#resolveGapTarget(collectionId, parentId, payload.nativeEvent);
		if (!target)
		{
			return;
		}

		const current = this.#dragState.docTarget;
		if (
			current
			&& Number(current.targetId) === Number(target.targetId)
			&& current.placement === target.placement
			&& Number(current.collectionId) === Number(target.collectionId)
			&& current.parentId === target.parentId
		)
		{
			return;
		}

		this.#dragState.docTarget = target;

		if (target.placement === 'inside' && target.targetId !== null)
		{
			const doc = this.#store.queries.findLoadedDocument(collectionId, target.targetId);
			if (doc)
			{
				this.#scheduleDocAutoExpand(doc);
			}
			else
			{
				this.#clearAutoExpand();
			}
		}
		else if (target.placement === 'inside' && target.targetId === null)
		{
			this.#scheduleCollectionAutoExpand(collectionId);
		}
		else
		{
			this.#clearAutoExpand();
		}
	}

	async onBranchDrop(payload: BranchDragPayload): Promise<void>
	{
		if (!this.#dragState.docItem)
		{
			return;
		}

		payload.nativeEvent.preventDefault();
		payload.nativeEvent.stopPropagation();
		this.#clearAutoExpand();

		const target = this.#dragState.docTarget;
		if (!target)
		{
			this.clearDrag();

			return;
		}

		await this.#moveDocumentWithTarget(target);
	}

	onViewportDragOver(event: DragEvent): void
	{
		if (!this.#dragState.docItem)
		{
			return;
		}

		if (event.target instanceof HTMLElement && event.target.closest('.tree-branch'))
		{
			return;
		}

		if (event.target instanceof HTMLElement && event.target.closest('.collection-row'))
		{
			return;
		}

		event.preventDefault();

		const currentTarget = this.#dragState.docTarget;
		if (!currentTarget)
		{
			return;
		}

		const collectionId = Number(currentTarget.collectionId);
		const rootDocs = this.#store.queries.getChildren(collectionId, null);
		if (rootDocs.length === 0)
		{
			return;
		}

		const lastDoc = rootDocs[rootDocs.length - 1];
		const lastDocId = Number(lastDoc.id);
		const newTarget = {
			collectionId,
			parentId: null,
			targetId: lastDocId,
			placement: 'after',
		};

		if (
			Number(currentTarget.targetId) === lastDocId
			&& currentTarget.placement === 'after'
			&& currentTarget.parentId === null
		)
		{
			return;
		}

		this.#dragState.docTarget = newTarget;
		this.#clearAutoExpand();
	}

	async onViewportDrop(event: DragEvent): Promise<void>
	{
		if (!this.#dragState.docItem)
		{
			return;
		}

		if (event.target instanceof HTMLElement && event.target.closest('.tree-branch'))
		{
			return;
		}

		event.preventDefault();
		event.stopPropagation();
		this.#clearAutoExpand();

		const target = this.#dragState.docTarget;
		if (!target)
		{
			this.clearDrag();

			return;
		}

		await this.#moveDocumentWithTarget(target);
	}

	onCollectionDragOver(collection: Collection | null, event: DragEvent): void
	{
		if (!this.#dragState.docItem || !collection)
		{
			return;
		}

		event.preventDefault();

		const current = this.#dragState.docTarget;
		if (
			current
			&& current.placement === 'inside'
			&& current.targetId === null
			&& Number(current.collectionId) === Number(collection.id)
		)
		{
			return;
		}

		this.#dragState.docTarget = {
			collectionId: Number(collection.id),
			parentId: null,
			targetId: null,
			placement: 'inside',
		};

		this.#scheduleCollectionAutoExpand(Number(collection.id));
	}

	async onCollectionDrop(collection: Collection | null, event: DragEvent): Promise<void>
	{
		if (!this.#dragState.docItem || !collection)
		{
			return;
		}

		event.preventDefault();
		event.stopPropagation();
		this.#clearAutoExpand();
		const target = {
			collectionId: Number(collection.id),
			parentId: null,
			targetId: null,
			placement: 'inside',
		};

		await this.#moveDocumentWithTarget(target);
	}

	clearDrag(): void
	{
		this.#clearAutoExpand();
		this.#clearDragPrefetchState();
		this.#invalidateRectCache();
		this.#dragState.docItem = null;
		this.#dragState.docTarget = null;
	}

	async #moveDocumentWithTarget(target: DocDragTarget): Promise<void>
	{
		const dragItem = this.#dragState.docItem;
		if (!dragItem)
		{
			return;
		}

		if (target.targetId === dragItem.id)
		{
			this.clearDrag();

			return;
		}

		if (this.#isInvalidDocMoveTarget(dragItem, target))
		{
			this.clearDrag();

			return;
		}

		// Read while the row still stands where it was picked up, before anything is awaited: the move is a
		// request away and the branch it lands in may have to be loaded first, and both take frames the row
		// spends where it was.
		const travel = captureRowTravel(dragItem.id);

		try
		{
			const position = this.#resolveDocumentPosition(dragItem, target);
			const nextParentId = target.placement === 'inside' ? target.targetId : target.parentId;

			if (this.#shouldGuardPrefetchTarget(target, nextParentId))
			{
				await this.#guardPrefetchTarget(target.collectionId, nextParentId);
			}

			const response = await this.#api.moveDocument(dragItem.id, target.collectionId, nextParentId, position);

			this.#store.actions.moveDocumentLocal({
				docId: dragItem.id,
				fromCollectionId: dragItem.collectionId,
				fromParentId: dragItem.parentId,
				toCollectionId: target.collectionId,
				toParentId: nextParentId,
				placement: target.placement,
				targetId: target.targetId,
				fallbackDoc: {
					id: dragItem.id,
					collectionId: target.collectionId,
					parentId: nextParentId,
					title: dragItem.title,
					hasChildren: dragItem.hasChildren,
					position: dragItem.position,
				},
			});
			this.#store.actions.applyDocumentPositions(response.affectedPositions);

			// After the patch, before the reloads the events below set off: what the row has to travel is the
			// distance to where the move itself put it, and what the sections have to move by is what the two
			// branches now hold.
			travel?.play();
			markSectionMotion(document.querySelector('.sidebar'));

			const changedParents = new Set();

			if (dragItem.parentId !== null)
			{
				changedParents.add(`${dragItem.collectionId}:${dragItem.parentId}`);
			}

			if (nextParentId !== null)
			{
				changedParents.add(`${target.collectionId}:${nextParentId}`);
			}

			for (const key of changedParents)
			{
				const [colId, parId] = key.split(':').map(Number);
				EventEmitter.emit(NoteEvent.DOCUMENT_CHILDREN_CHANGED, new BaseEvent({
					data: { parentId: parId, collectionId: colId },
				}));
			}
		}
		catch (error)
		{
			this.#onFail(error);
		}
		finally
		{
			this.clearDrag();
		}
	}

	#resolveDocumentPosition(dragItem: Object, target: DocDragTarget): number | null
	{
		if (target.placement === 'root' || target.placement === 'inside')
		{
			return null;
		}

		const siblings = this.#store.queries.getChildren(target.collectionId, target.parentId);
		const siblingIds = siblings.map((item) => Number(item.id)).filter((id) => id !== dragItem.id);
		const targetIndex = siblingIds.indexOf(target.targetId);
		if (targetIndex < 0)
		{
			return null;
		}

		const insertIndex = target.placement === 'before' ? targetIndex : targetIndex + 1;

		return insertIndex + 1;
	}

	#cacheBranchRects(branchElement: HTMLElement): void
	{
		if (this.#cachedBranchElement === branchElement)
		{
			return;
		}

		const rows = [...branchElement.querySelectorAll(':scope > li > .tree-row')];
		this.#cachedRects = rows.map((row) => {
			const rect = row.getBoundingClientRect();

			return {
				docId: Number(row.dataset.docId),
				top: rect.top,
				bottom: rect.bottom,
				height: rect.height,
			};
		});
		this.#cachedBranchElement = branchElement;
	}

	#invalidateRectCache(): void
	{
		this.#cachedBranchElement = null;
		this.#cachedRects = null;
	}

	invalidateDragRectCache(): void
	{
		this.#invalidateRectCache();
	}

	#resolveGapTarget(
		collectionId: number,
		parentId: number | null,
		event: DragEvent,
	): DocDragTarget | null
	{
		const rects = this.#cachedRects;
		if (!rects || rects.length === 0)
		{
			return {
				collectionId,
				parentId,
				targetId: null,
				placement: 'inside',
			};
		}

		const result = this.#findGapPlacement(rects, event.clientY);

		return {
			collectionId,
			parentId,
			targetId: result.docId,
			placement: result.placement,
		};
	}

	#findGapPlacement(
		rects: CachedRect[],
		pointerY: number,
	): { docId: number, placement: string }
	{
		for (let i = 0; i < rects.length; i++)
		{
			const { docId, top, height } = rects[i];

			if (pointerY < top + height * 0.25)
			{
				if (i === 0)
				{
					return { docId, placement: 'before' };
				}

				return { docId: rects[i - 1].docId, placement: 'after' };
			}

			if (pointerY < top + height * 0.75)
			{
				return { docId, placement: 'inside' };
			}

			if (this.#store.state.expandedDocs[docId] && pointerY < top + height)
			{
				return { docId, placement: 'inside' };
			}

			const nextTop = (i < rects.length - 1) ? rects[i + 1].top : null;
			if (nextTop === null || pointerY < nextTop)
			{
				return { docId, placement: 'after' };
			}
		}

		return { docId: rects[rects.length - 1].docId, placement: 'after' };
	}

	#shouldGuardPrefetchTarget(target: DocDragTarget, nextParentId: number | null): boolean
	{
		if (target.placement !== 'inside')
		{
			return false;
		}

		const collectionId = Number(target.collectionId);
		const parentId = this.#toNullableInt(nextParentId);
		if (!Number.isFinite(collectionId) || collectionId <= 0)
		{
			return false;
		}

		if (parentId === null)
		{
			return (
				Boolean(this.#uiState.expandedCollections[collectionId])
				&& !this.#store.queries.isBranchLoaded(collectionId, null)
			);
		}

		if (!this.#store.state.expandedDocs[parentId])
		{
			return false;
		}

		return !this.#store.queries.isBranchLoaded(collectionId, parentId);
	}

	async #guardPrefetchTarget(collectionId: number, parentId: number | null): Promise<void>
	{
		const key = `${Number(collectionId)}:${parentId === null ? 'root' : Number(parentId)}`;
		if (this.#dragPrefetchedKeys.has(key))
		{
			return;
		}

		const inFlight = this.#dragPrefetchInFlight.get(key);
		if (inFlight)
		{
			await inFlight;

			return;
		}

		const lastAttemptAt = this.#dragPrefetchAt.get(key);
		if (Number.isFinite(lastAttemptAt) && (Date.now() - lastAttemptAt) < this.#prefetchCooldownMs)
		{
			return;
		}

		this.#dragPrefetchAt.set(key, Date.now());
		const request = this.#store.actions.ensureChildrenLoaded(collectionId, parentId);
		this.#dragPrefetchInFlight.set(key, request);
		try
		{
			await request;
			this.#dragPrefetchedKeys.add(key);
		}
		finally
		{
			if (this.#dragPrefetchInFlight.get(key) === request)
			{
				this.#dragPrefetchInFlight.delete(key);
			}
		}
	}

	#scheduleDocAutoExpand(doc: SidebarDocument | null): void
	{
		if (!doc)
		{
			return;
		}

		const collectionId = Number(doc.collectionId);
		const docId = Number(doc.id);
		if (
			!Number.isFinite(collectionId)
			|| collectionId <= 0
			|| !Number.isFinite(docId)
			|| docId <= 0
		)
		{
			return;
		}

		if (!doc.hasChildren)
		{
			this.#clearAutoExpand();

			return;
		}

		if (this.#store.state.expandedDocs[docId])
		{
			this.#clearAutoExpand();

			return;
		}

		this.#scheduleAutoExpand(`doc:${collectionId}:${docId}`, async () => {
			const target = this.#dragState.docTarget;
			if (
				!target
				|| target.placement !== 'inside'
				|| Number(target.collectionId) !== collectionId
				|| Number(target.targetId) !== docId
			)
			{
				return;
			}

			if (this.#store.state.expandedDocs[docId])
			{
				return;
			}

			this.#store.state.expandedDocs[docId] = true;
			this.#invalidateRectCache();
			await this.#store.actions.ensureChildrenLoaded(collectionId, docId);
		});
	}

	#scheduleCollectionAutoExpand(collectionId: number): void
	{
		if (!Number.isFinite(collectionId) || collectionId <= 0)
		{
			return;
		}

		if (this.#uiState.expandedCollections[collectionId])
		{
			this.#clearAutoExpand();

			return;
		}

		this.#scheduleAutoExpand(`collection:${collectionId}`, async () => {
			const target = this.#dragState.docTarget;
			if (
				!target
				|| target.placement !== 'inside'
				|| Number(target.collectionId) !== collectionId
				|| !(target.targetId === null || target.targetId === undefined)
			)
			{
				return;
			}

			const shouldExpandImmediately = this.#store.queries.isLoadingChildren(collectionId, null)
				|| this.#store.queries.getChildren(collectionId, null).length > 0
				|| this.#store.queries.hasNextChildren(collectionId, null)
				;
			if (shouldExpandImmediately)
			{
				this.#uiState.expandedCollections[collectionId] = true;
			}

			await this.#store.actions.ensureChildrenLoaded(collectionId, null);
			const hasChildren = this.#store.queries.getChildren(collectionId, null).length > 0
				|| this.#store.queries.hasNextChildren(collectionId, null)
				;
			if (!hasChildren)
			{
				return;
			}

			this.#uiState.expandedCollections[collectionId] = true;
			this.#invalidateRectCache();
		});
	}

	#scheduleAutoExpand(key: string, callback: () => Promise<void>): void
	{
		if (this.#autoExpandKey === key)
		{
			return;
		}

		this.#clearAutoExpand();
		this.#autoExpandKey = key;
		this.#autoExpandTimer = setTimeout(() => {
			if (this.#autoExpandKey !== key)
			{
				return;
			}

			this.#autoExpandTimer = null;
			this.#autoExpandKey = null;
			void callback();
		}, this.#autoExpandDelayMs);
	}

	#clearAutoExpand(): void
	{
		if (this.#autoExpandTimer !== null)
		{
			clearTimeout(this.#autoExpandTimer);
			this.#autoExpandTimer = null;
		}

		this.#autoExpandKey = null;
	}

	#clearDragPrefetchState(): void
	{
		this.#dragPrefetchedKeys.clear();
		this.#dragPrefetchInFlight.clear();
		this.#dragPrefetchAt.clear();
	}

	#isInvalidDocMoveTarget(dragItem: Object, target: DocDragTarget): boolean
	{
		if (!target || target.targetId === null || target.targetId === undefined)
		{
			return false;
		}

		if (Number(dragItem.id) === Number(target.targetId))
		{
			return true;
		}

		if (Number(dragItem.collectionId) !== Number(target.collectionId))
		{
			return false;
		}

		let currentId = Number(target.targetId);
		let guard = 0;
		while (currentId > 0 && guard < 200)
		{
			guard += 1;
			if (currentId === Number(dragItem.id))
			{
				return true;
			}

			const loadedDoc = this.#store.queries.findLoadedDocument(target.collectionId, currentId);
			if (!loadedDoc)
			{
				return false;
			}

			const nextParent = this.#toNullableInt(loadedDoc.parentId);
			if (nextParent === null)
			{
				return false;
			}

			currentId = Number(nextParent);
		}

		return false;
	}

	#toNullableInt(value: mixed): number | null
	{
		if (value === null || value === undefined || value === '')
		{
			return null;
		}

		return Number(value);
	}
}
