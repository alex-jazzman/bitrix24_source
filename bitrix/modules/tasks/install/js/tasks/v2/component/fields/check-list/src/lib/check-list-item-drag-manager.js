import { Dom } from 'main.core';
import { DragEndEvent, Draggable, DragOverEvent } from 'ui.draganddrop.draggable';

import { Model } from 'tasks.v2.const';
import type { CheckListModel } from 'tasks.v2.model.check-list';

import { CheckListDragManager, type Params } from './check-list-drag-manager';

export class CheckListItemDragManager extends CheckListDragManager
{
	#store;
	#checkListManager;
	#draggable;
	#draggedItem = {
		item: null,
		childrenIds: [],
		enterDropzone: false,
	};

	#canAddItem: boolean;
	#stubItemId: string;
	#currentUserId: string;
	#isSameLevelMove: boolean = false;

	constructor(params: Params)
	{
		super(params);

		this.#store = params.store;
		this.#checkListManager = params.checkListManager;

		this.#canAddItem = params.canAddItem;
		this.#stubItemId = params.stubItemId;
		this.#currentUserId = params.currentUserId;
	}

	init(container: HTMLElement, offsetX: number = 0, listDropzone: Array<HTMLElement> = []): void
	{
		this.#draggable = new Draggable({
			container,
			draggable: '.check-list-draggable-item',
			dragElement: '.check-list-drag-item',
			delay: 0,
			type: Draggable.MOVE,
			offset: { x: offsetX },
			dropzone: listDropzone,
		});

		this.#draggable.subscribe('beforeStart', this.#handleBeforeDragStart.bind(this));
		this.#draggable.subscribe('start', this.#handleDragStart.bind(this));
		this.#draggable.subscribe('over', this.#handleDragOver.bind(this));
		this.#draggable.subscribe('end', this.#handleDragEnd.bind(this));

		this.#draggable.subscribe('drop', this.#handleDropEnd.bind(this));
		this.#draggable.subscribe('dropzone:enter', this.#handleDropZoneEnter.bind(this));
		this.#draggable.subscribe('dropzone:out', this.#handleDropZoneOut.bind(this));
	}

	destroy(): void
	{
		this.#draggable?.destroy();
	}

	#handleBeforeDragStart(event): void
	{
		const data = event.getData();
		const source = data?.source;
		const dataset = source?.dataset;
		if (!dataset)
		{
			event.preventDefault();

			return;
		}

		const draggedItemId = this.#checkListManager.prepareItemId(dataset.id);
		const draggedItem = this.#checkListManager.getItem(draggedItemId);
		if (!draggedItem)
		{
			event.preventDefault();

			return;
		}

		this.#store.dispatch(`${Model.Interface}/setDisableCheckListAnimations`, true);
		this.#store.dispatch(`${Model.Interface}/setDraggedCheckListId`, draggedItem.id);

		this.#draggedItem = {
			item: draggedItem,
			childrenIds: [],
			enterDropzone: false,
		};

		if (this.#checkListManager.hasItemChildren(draggedItem))
		{
			Dom.addClass(source, '--multiple-drag');
		}
	}

	#handleDragStart(): void
	{
		const draggedItem: CheckListModel = this.#draggedItem.item;

		if (this.#checkListManager.hasItemChildren(draggedItem))
		{
			const children: CheckListModel[] = this.#checkListManager.getAllChildren(draggedItem.id);
			this.#draggedItem.childrenIds = children.map((child: CheckListModel) => child.id);

			this.#checkListManager.hideItems(
				this.#draggedItem.childrenIds,
				(updates: CheckListModel[]) => {
					this.#store.dispatch(`${Model.CheckList}/upsertMany`, updates);
				},
			);
		}
	}

	#handleDragOver(event: DragOverEvent): void
	{
		const { source: { dataset }, over, clientY } = event.getData();

		const overedItem = this.#getItemByNode(over);
		if (overedItem)
		{
			const isOverStubItem = overedItem.id === this.#stubItemId;
			const draggedItemId = this.#checkListManager.prepareItemId(dataset.id);
			const draggedItem = this.#checkListManager.getItem(draggedItemId);
			this.#draggedItem.item = draggedItem;

			const overedRootParent = this.#checkListManager.getRootParentByChildId(overedItem.id);
			const draggedRootParent = this.#checkListManager.getRootParentByChildId(draggedItem.id);

			const overedRootParentId = (isOverStubItem ? overedItem.parentId : overedRootParent.id);

			if (!this.#canAddItem && overedRootParentId !== draggedRootParent.id)
			{
				event.preventDefault();

				return;
			}

			const overMiddlePoint = this.#draggable.getElementMiddlePoint(over);
			const direction = (clientY > overMiddlePoint.y) ? 1 : -1;
			let directionFromBottom = (direction === 1);

			if (isOverStubItem)
			{
				directionFromBottom = false;
			}

			this.#isSameLevelMove = draggedItem.parentId === overedItem.parentId;
			if (this.#isSameLevelMove)
			{
				void this.#handleItemMovingOnSameLevel(draggedItem, overedItem, directionFromBottom);
			}
			else
			{
				this.#handleItemMovingOnBetweenLevel(draggedItem, overedItem, directionFromBottom);
			}
		}
	}

	#handleDragEnd(event: DragEndEvent): void
	{
		const { source, source: { dataset } } = event.getData();

		const draggedItemId = this.#checkListManager.prepareItemId(dataset.id);
		const draggedItem = this.#checkListManager.getItem(draggedItemId);

		Dom.removeClass(source, '--multiple-drag');

		if (this.#draggedItem.enterDropzone)
		{
			return;
		}

		this.resortLevel(draggedItem.parentId);

		this.#handleDrop(draggedItem);
	}

	#handleDropEnd(event): void
	{
		const { dropzone, source: { dataset } } = event.getData();

		const draggedItemId = this.#checkListManager.prepareItemId(dataset.id);
		const draggedItem = this.#checkListManager.getItem(draggedItemId);

		const newParentId = this.#checkListManager.prepareItemId(dropzone.dataset.id);

		if (draggedItem.parentId !== newParentId)
		{
			this.resortLevel(draggedItem.parentId);
		}

		void this.#store.dispatch(`${Model.CheckList}/update`, {
			id: draggedItem.id,
			fields: {
				sortIndex: this.#checkListManager.getChildren(newParentId).length + 1,
				parentId: newParentId,
				hidden: false,
			},
		});

		this.resortLevel(newParentId);

		this.#handleDrop(draggedItem);

		Dom.removeClass(dropzone, '--dropzone');
	}

	#handleDropZoneEnter(event): void
	{
		const { dropzone, source: { dataset } } = event.getData();
		const draggedItemId = this.#checkListManager.prepareItemId(dataset.id);
		const draggedItem = this.#checkListManager.getItem(draggedItemId);
		if (!draggedItem)
		{
			event.preventDefault();

			return;
		}

		this.#draggedItem.enterDropzone = true;

		this.#checkListManager.hideItems(
			[draggedItemId],
			(updates: CheckListModel[]) => {
				this.#store.dispatch(`${Model.CheckList}/upsertMany`, updates);
			},
		);

		Dom.addClass(dropzone, '--dropzone');
	}

	#handleDropZoneOut(event): void
	{
		const { dropzone, source: { dataset } } = event.getData();
		const draggedItemId = this.#checkListManager.prepareItemId(dataset.id);
		const draggedItem = this.#checkListManager.getItem(draggedItemId);
		if (!draggedItem)
		{
			event.preventDefault();

			return;
		}

		this.#draggedItem.enterDropzone = false;

		this.#checkListManager.showItems(
			[draggedItemId],
			(updates: CheckListModel[]) => {
				this.#store.dispatch(`${Model.CheckList}/upsertMany`, updates);
			},
		);

		Dom.removeClass(dropzone, '--dropzone');
	}

	#handleDrop(draggedItem: CheckListModel): void
	{
		const draggedItemChanged = (
			draggedItem.parentId !== this.#draggedItem.item.parentId
			|| draggedItem.sortIndex !== this.#draggedItem.item.sortIndex
		);
		if (draggedItemChanged)
		{
			this.emit('update', draggedItem.id);
		}

		if (this.#draggedItem.childrenIds.length > 0)
		{
			this.#checkListManager.showItems(
				this.#draggedItem.childrenIds,
				(updates: CheckListModel[]) => {
					this.#store.dispatch(`${Model.CheckList}/upsertMany`, updates);
				},
			);
		}

		this.#draggedItem = {
			item: null,
			childrenIds: [],
			enterDropzone: false,
		};

		this.#store.dispatch(`${Model.Interface}/setDraggedCheckListId`, null);
		this.#store.dispatch(`${Model.Interface}/setDisableCheckListAnimations`, false);

		if (!this.#isSameLevelMove)
		{
			this.#checkListManager.handleTargetParentFilter(
				draggedItem,
				this.#currentUserId,
				(updates: CheckListModel[]) => {
					setTimeout(() => {
						this.#store.dispatch(`${Model.CheckList}/upsertMany`, updates);
					}, 1000);
				},
			);
		}

		this.emit('end', draggedItem.id);
	}

	async #handleItemMovingOnSameLevel(
		draggedItem: CheckListModel,
		overedItem: CheckListModel,
		directionFromBottom: boolean,
	): Promise<void>
	{
		const isFirstOnLevel = (overedItem.sortIndex === 0);
		const numberOfItemPerLevel = this.#checkListManager.getChildren(overedItem.parentId).length;
		const isSimpleAndLastOnLevel = (
			overedItem.sortIndex === (numberOfItemPerLevel - 1)
			&& !this.#checkListManager.hasItemChildren(overedItem)
		);

		const shouldSkip = (
			Math.abs(draggedItem.sortIndex - overedItem.sortIndex) === 1
			&& !isFirstOnLevel
			&& !isSimpleAndLastOnLevel
		);
		if (shouldSkip)
		{
			return;
		}

		this.moveDropPreview(draggedItem, overedItem, directionFromBottom, true);
		this.resortLevelDependingOnPosition(draggedItem, overedItem, directionFromBottom, true);
	}

	async #handleItemMovingOnBetweenLevel(
		draggedItem: CheckListModel,
		overedItem: CheckListModel,
		directionFromBottom: boolean,
	): void
	{
		const previousParentId = draggedItem.parentId;

		this.moveDropPreview(draggedItem, overedItem, directionFromBottom, false);
		this.resortLevelDependingOnPosition(draggedItem, overedItem, directionFromBottom, false);

		this.resortLevel(previousParentId);
	}

	#getItemByNode(node: HTMLElement): CheckListModel
	{
		const itemId = this.#checkListManager.prepareItemId(node.dataset.id);

		const isStubItem = itemId === this.#stubItemId;
		if (isStubItem)
		{
			const parentId = this.#checkListManager.prepareItemId(node.dataset.parentId);
			const sortIndex = (this.#checkListManager.getChildren(parentId).length);

			return {
				id: this.#stubItemId,
				parentId,
				sortIndex,
			};
		}

		return this.#checkListManager.getItem(itemId);
	}
}
