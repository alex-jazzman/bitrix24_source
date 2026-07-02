import type { Collection } from '../../type';
import type { SidebarApi } from '../../services/sidebar-api';

type DragTarget = {
	id: number,
	placement: 'before' | 'after',
};

type CachedCollectionRect = {
	id: number,
	top: number,
	bottom: number,
	height: number,
};

export class CollectionDndService
{
	#dragState: Object;
	#store: Object;
	#api: SidebarApi;
	#onFail: (error: mixed) => void;
	#cachedListElement: HTMLElement | null = null;
	#cachedRects: CachedCollectionRect[] | null = null;
	#lastScrollTop: number = 0;
	#committed: boolean = false;

	constructor({ dragState, store, api, onFail }: {
		dragState: Object,
		store: Object,
		api: SidebarApi,
		onFail: (error: mixed) => void,
	})
	{
		this.#dragState = dragState;
		this.#store = store;
		this.#api = api;
		this.#onFail = onFail;
	}

	startDrag(collection: Collection, event: DragEvent): void
	{
		this.#dragState.collectionItem = { id: Number(collection.id) };
		this.#dragState.collectionTarget = null;
		this.#committed = false;
		this.#invalidateRectCache();

		const transfer = event.dataTransfer;
		if (transfer)
		{
			transfer.effectAllowed = 'move';
			transfer.setData('text/plain', String(collection.id));
		}
	}

	onDragOver(collection: Collection, event: DragEvent): void
	{
		if (!this.#dragState.collectionItem)
		{
			return;
		}

		event.preventDefault();
	}

	onListDragOver(event: DragEvent): void
	{
		if (!this.#dragState.collectionItem || this.#dragState.docItem)
		{
			return;
		}

		event.preventDefault();
		const listNode = event.currentTarget;
		if (this.#cachedListElement !== listNode)
		{
			this.#cacheListRects(listNode);
		}

		const scrollParent = listNode.closest('.sidebar-content');
		if (scrollParent && scrollParent.scrollTop !== this.#lastScrollTop)
		{
			this.#lastScrollTop = scrollParent.scrollTop;
			this.#invalidateRectCache();
			this.#cacheListRects(listNode);
		}

		const target = this.#resolveCollectionGapTarget(event);
		if (!target)
		{
			return;
		}

		const current = this.#dragState.collectionTarget;
		if (
			current
			&& Number(current.id) === Number(target.id)
			&& current.placement === target.placement
		)
		{
			return;
		}

		this.#dragState.collectionTarget = target;
	}

	onViewportDragOver(event: DragEvent): void
	{
		if (!this.#dragState.collectionItem || this.#dragState.docItem)
		{
			return;
		}

		const targetNode = event.target;
		if (targetNode instanceof HTMLElement && targetNode.closest('.collection-list'))
		{
			return;
		}

		const target = this.#resolveCollectionViewportTarget(event);
		if (!target)
		{
			return;
		}

		event.preventDefault();
		this.#dragState.collectionTarget = target;
	}

	async onDrop(collection: Collection, event: DragEvent): Promise<void>
	{
		if (!this.#dragState.collectionItem)
		{
			return;
		}

		event.preventDefault();
		event.stopPropagation();
		this.#tryCommitAndClear();
	}

	async onListDrop(event: DragEvent): Promise<void>
	{
		if (!this.#dragState.collectionItem || this.#dragState.docItem)
		{
			return;
		}

		event.preventDefault();
		this.#tryCommitAndClear();
	}

	async onViewportDrop(event: DragEvent): Promise<void>
	{
		if (!this.#dragState.collectionItem || this.#dragState.docItem)
		{
			return;
		}

		const targetNode = event.target;
		if (targetNode instanceof HTMLElement && targetNode.closest('.collection-list'))
		{
			return;
		}

		if (!this.#dragState.collectionTarget)
		{
			this.#dragState.collectionTarget = this.#resolveCollectionViewportTarget(event);
		}

		event.preventDefault();
		this.#tryCommitAndClear();
	}

	endDrag(): void
	{
		this.#tryCommitAndClear();
	}

	clearDrag(): void
	{
		this.#dragState.collectionItem = null;
		this.#dragState.collectionTarget = null;
		this.#invalidateRectCache();
	}

	#tryCommitAndClear(): void
	{
		if (this.#committed)
		{
			this.clearDrag();

			return;
		}

		const dragItem = this.#dragState.collectionItem;
		const target = this.#dragState.collectionTarget;
		this.clearDrag();

		if (!dragItem || !target || dragItem.id === Number(target.id))
		{
			return;
		}

		this.#committed = true;
		const position = this.#resolvePosition(dragItem.id, Number(target.id), target.placement);
		this.#store.actions.moveCollectionLocal(dragItem.id, Number(target.id), target.placement);
		void this.#sendMove(dragItem.id, position);
	}

	async #sendMove(dragId: number, position: number | null): Promise<void>
	{
		try
		{
			const response = await this.#api.moveCollection(dragId, position);
			const affected = Array.isArray(response?.affectedPositions) ? response.affectedPositions : [];
			if (affected.length > 0 && this.#store.actions.applyCollectionPositions)
			{
				this.#store.actions.applyCollectionPositions(affected);
			}
		}
		catch (error)
		{
			this.#onFail(error);
		}
	}

	#resolvePosition(dragId: number, targetId: number, placement: string): number | null
	{
		const siblings = this.#store.state.collections.value
			.map((item) => Number(item.id))
			.filter((id) => id !== dragId)
		;
		const targetIndex = siblings.indexOf(targetId);
		if (targetIndex < 0)
		{
			return null;
		}

		const insertIndex = placement === 'before' ? targetIndex : targetIndex + 1;

		return insertIndex + 1;
	}

	#cacheListRects(listNode: HTMLElement): void
	{
		if (this.#cachedListElement === listNode)
		{
			return;
		}

		const rowNodes = [...listNode.querySelectorAll('.collection-row')];
		this.#cachedRects = rowNodes.map((row) => {
			const rect = row.getBoundingClientRect();

			return {
				id: Number(row.dataset.collectionId),
				top: rect.top,
				bottom: rect.bottom,
				height: rect.height,
			};
		});
		this.#cachedListElement = listNode;
	}

	#invalidateRectCache(): void
	{
		this.#cachedListElement = null;
		this.#cachedRects = null;
	}

	invalidateDragRectCache(): void
	{
		this.#invalidateRectCache();
	}

	#resolveCollectionGapTarget(event: DragEvent): DragTarget | null
	{
		const rects = this.#cachedRects;
		if (!rects || rects.length === 0)
		{
			return null;
		}

		const pointerY = event.clientY;

		if (pointerY <= rects[0].top)
		{
			return { id: rects[0].id, placement: 'before' };
		}

		if (pointerY >= rects[rects.length - 1].bottom)
		{
			return { id: rects[rects.length - 1].id, placement: 'after' };
		}

		for (let i = 0; i < rects.length; i++)
		{
			const { id, top, height } = rects[i];
			const midY = top + height / 2;

			if (pointerY < midY)
			{
				if (i === 0)
				{
					return { id, placement: 'before' };
				}

				return { id: rects[i - 1].id, placement: 'after' };
			}

			const nextTop = (i < rects.length - 1) ? rects[i + 1].top : null;
			if (nextTop === null || pointerY < nextTop)
			{
				return { id, placement: 'after' };
			}
		}

		return { id: rects[rects.length - 1].id, placement: 'after' };
	}

	#resolveCollectionViewportTarget(event: DragEvent): DragTarget | null
	{
		const viewportNode = event.currentTarget;
		const listNode = viewportNode.querySelector('.collection-list');
		if (!(listNode instanceof HTMLElement))
		{
			return null;
		}

		const rowNodes = [...listNode.querySelectorAll('.collection-row')];
		if (rowNodes.length === 0)
		{
			return null;
		}

		const pointerY = event.clientY;
		const firstId = Number(rowNodes[0].dataset.collectionId);
		const lastId = Number(rowNodes[rowNodes.length - 1].dataset.collectionId);
		if (!Number.isFinite(firstId) || !Number.isFinite(lastId))
		{
			return null;
		}

		const listRect = listNode.getBoundingClientRect();
		if (pointerY < listRect.top)
		{
			return { id: firstId, placement: 'before' };
		}

		if (pointerY > listRect.bottom)
		{
			return { id: lastId, placement: 'after' };
		}

		return null;
	}
}
