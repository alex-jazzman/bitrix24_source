import { EventEmitter } from 'main.core.events';
import { Model } from 'tasks.v2.const';
import type { CheckListModel } from 'tasks.v2.model.check-list';

import type { CheckListManager } from './check-list-manager';

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

	constructor(params: Params)
	{
		super();

		this.setEventNamespace('Tasks.V2.CheckList.CheckListDragManager');

		this.#store = params.store;
		this.#checkListManager = params.checkListManager;

		this.#stubItemId = params.stubItemId;
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
