import { Dom, Event } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { Draggable, type DragStartEvent } from 'ui.draganddrop.draggable';

import { Model } from 'tasks.v2.const';
import type { CheckListModel } from 'tasks.v2.model.check-list';

import type { CheckListManager } from './check-list-manager';
import { getFixedContainingBlockOffset } from './fixed-containing-block';

export type Params = {
	store: any,
	checkListManager: CheckListManager,
	canAddItem?: boolean,
	stubItemId?: string,
	currentUserId?: string,
};

export class CheckListDragManager extends EventEmitter
{
	#store;
	#checkListManager;

	#stubItemId: string;

	#draggable: Draggable = null;
	#container: HTMLElement = null;
	#ghost: HTMLElement = null;
	#offsetFrameId: number = null;
	#offsetCompensationY: number = 0;

	#handleScroll = (): void => {
		if (this.#offsetFrameId !== null)
		{
			return;
		}

		this.#offsetFrameId = requestAnimationFrame(() => {
			this.#offsetFrameId = null;
			this.updateGhostOffset();
		});
	};

	#handleDragStart = (event: DragStartEvent): void => {
		const { type } = this.#draggable.getOptions();
		this.#ghost = (type === Draggable.HEADLESS ? null : event.getData().draggable);

		Event.bind(document, 'scroll', this.#handleScroll, { capture: true });
	};

	#handleDragEnd = (): void => {
		this.stopGhostOffsetTracking();

		this.#offsetCompensationY = 0;
	};

	constructor(params: Params)
	{
		super();

		this.setEventNamespace('Tasks.V2.CheckList.CheckListDragManager');

		this.#store = params.store;
		this.#checkListManager = params.checkListManager;

		this.#stubItemId = params.stubItemId;
	}

	initGhostOffsetTracking(draggable: Draggable, container: HTMLElement): void
	{
		this.#draggable = draggable;
		this.#container = container;

		draggable.subscribe('start', this.#handleDragStart);
		draggable.subscribe('end', this.#handleDragEnd);
	}

	stopGhostOffsetTracking(): void
	{
		Event.unbind(document, 'scroll', this.#handleScroll, { capture: true });

		if (this.#offsetFrameId !== null)
		{
			cancelAnimationFrame(this.#offsetFrameId);
			this.#offsetFrameId = null;
		}

		this.#ghost = null;
	}

	setGhostOffsetCompensationY(compensationY: number): void
	{
		this.#offsetCompensationY = compensationY;
	}

	updateGhostOffset(): void
	{
		const { x, y } = getFixedContainingBlockOffset(this.#container);
		const offsetY = y + this.#offsetCompensationY;

		const { offset } = this.#draggable.getOptions();

		this.#shiftGhost(x - offset.x, offsetY - offset.y);

		offset.x = x;
		offset.y = offsetY;
	}

	#shiftGhost(x: number, y: number): void
	{
		if (!this.#ghost || (x === 0 && y === 0))
		{
			return;
		}

		const { top, left } = this.#ghost.style;
		const shiftedTop = Number.parseFloat(top) + y;
		const shiftedLeft = Number.parseFloat(left) + x;
		if (Number.isNaN(shiftedTop) || Number.isNaN(shiftedLeft))
		{
			return;
		}

		Dom.style(this.#ghost, {
			top: `${shiftedTop}px`,
			left: `${shiftedLeft}px`,
		});
	}

	moveDropPreview(
		draggedItem: CheckListModel,
		overedItem: CheckListModel,
		directionFromBottom: boolean,
		isSameLevelMove: boolean,
	): void
	{
		let tmpDraggedIndex = (
			directionFromBottom
				? this.#calculateAfterSortIndex(overedItem) - 0.5
				: this.#calculateBeforeSortIndex(overedItem) + 0.5
		);

		if (!isSameLevelMove)
		{
			const isDraggedItemHigher = this.#checkListManager.isFirstItemHigherLevelThan(draggedItem, overedItem);
			const isOverStubItem = overedItem.id === this.#stubItemId;
			if (!isDraggedItemHigher && !isOverStubItem)
			{
				tmpDraggedIndex = this.#calculateBeforeSortIndex(overedItem) + 0.5;

				void this.#store.dispatch(`${Model.CheckList}/update`, {
					id: overedItem.id,
					fields: { sortIndex: tmpDraggedIndex + 1 },
				});
			}
		}

		void this.#store.dispatch(`${Model.CheckList}/update`, {
			id: draggedItem.id,
			fields: {
				sortIndex: tmpDraggedIndex,
				parentId: overedItem.parentId,
			},
		});
	}

	resortLevelDependingOnPosition(
		draggedItem: CheckListModel,
		overedItem: CheckListModel,
		directionFromBottom: boolean,
		isSameLevelMove: boolean,
	): void
	{
		let newDraggedSortIndex = (
			directionFromBottom
				? this.#calculateAfterSortIndex(overedItem)
				: this.#calculateBeforeSortIndex(overedItem)
		);

		let levelResort = false;
		if (!isSameLevelMove)
		{
			const isDraggedItemHigher = this.#checkListManager.isFirstItemHigherLevelThan(draggedItem, overedItem);
			if (!isDraggedItemHigher)
			{
				newDraggedSortIndex = this.#calculateBeforeSortIndex(overedItem);

				levelResort = true;
			}
		}

		if (levelResort)
		{
			this.resortLevel(overedItem.parentId);

			return;
		}

		const updates: CheckListModel[] = [
			{
				...draggedItem,
				sortIndex: newDraggedSortIndex,
				parentId: overedItem.parentId,
			},
		];

		if (directionFromBottom)
		{
			this.#checkListManager.resortItemsAfterIndex(
				overedItem.parentId,
				newDraggedSortIndex,
				(resortUpdates: CheckListModel[]) => {
					this.#store.dispatch(`${Model.CheckList}/upsertMany`, [...updates, ...resortUpdates]);
				},
			);
		}
		else
		{
			this.#checkListManager.resortItemsBeforeIndex(
				overedItem.parentId,
				newDraggedSortIndex,
				(resortUpdates: CheckListModel[]) => {
					this.#store.dispatch(`${Model.CheckList}/upsertMany`, [...updates, ...resortUpdates]);
				},
			);
		}
	}

	resortLevel(parentId: number): void
	{
		this.#checkListManager.resortItemsOnLevel(
			parentId,
			(updates: CheckListModel[]) => {
				this.#store.dispatch(`${Model.CheckList}/upsertMany`, updates);
			},
		);
	}

	#calculateAfterSortIndex(item: CheckListModel): number
	{
		return item.sortIndex + 1;
	}

	#calculateBeforeSortIndex(item: CheckListModel): number
	{
		return item.sortIndex - 1;
	}
}
