import { Dom } from 'main.core';
import { Model } from 'tasks.v2.const';
import { DragEndEvent, Draggable, DragOverEvent, DragStartEvent } from 'ui.draganddrop.draggable';
import type { CheckListModel } from 'tasks.v2.model.check-list';
import { CheckListDragManager } from './check-list-drag-manager';
import type { CheckListManager } from './check-list-manager';

type Params = {
	store: any,
	checkListManager: CheckListManager,
};

export class CheckListListDragManager extends CheckListDragManager
{
	#store;
	#checkListManager;
	#draggable;
	#draggedItem = null;
	#container: HTMLElement;

	constructor(params: Params)
	{
		super(params);

		this.#store = params.store;
		this.#checkListManager = params.checkListManager;
	}

	init(container: HTMLElement, offsetX: number = 0): void
	{
		this.#container = container;

		this.#draggable = new Draggable({
			container: this.#container,
			draggable: '.check-list-draggable-list',
			dragElement: '.check-list-drag-list',
			delay: 0,
			type: Draggable.MOVE,
			offset: { x: offsetX },
		});

		this.#draggable.subscribe('beforeStart', this.#handleBeforeDragStart.bind(this));
		this.#draggable.subscribe('start', this.#handleDragStart.bind(this));
		this.#draggable.subscribe('over', this.#handleDragOver.bind(this));
		this.#draggable.subscribe('end', this.#handleDragEnd.bind(this));
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

		this.#draggedItem = draggedItem;

		this.#setYOffset(source);
	}

	#handleDragStart(event: DragStartEvent): void
	{
		this.#store.dispatch(`${Model.Interface}/setDisableCheckListAnimations`, true);
		this.#store.dispatch(`${Model.Interface}/setDraggedCheckListId`, this.#draggedItem.id);
	}

	#handleDragOver(event: DragOverEvent): void
	{
		const { over, clientY } = event.getData();

		const overedItemId = this.#checkListManager.prepareItemId(over.dataset.id);
		const overedItem = this.#checkListManager.getItem(overedItemId);
		if (overedItem)
		{
			const overMiddlePoint = this.#draggable.getElementMiddlePoint(over);
			const direction = (clientY > overMiddlePoint.y) ? 1 : -1;
			const directionFromBottom = (direction === 1);

			void this.#handleItemMoving(this.#draggedItem, overedItem, directionFromBottom);
		}
	}

	#handleDragEnd(event: DragEndEvent): void
	{
		const { source: { dataset } } = event.getData();

		const draggedItemId = this.#checkListManager.prepareItemId(dataset.id);
		const draggedItem = this.#checkListManager.getItem(draggedItemId);

		this.resortLevel(draggedItem.parentId);

		const draggedItemChanged = draggedItem.sortIndex !== this.#draggedItem.sortIndex;
		if (draggedItemChanged)
		{
			this.emit('update', draggedItem.id);
		}

		this.#store.dispatch(`${Model.Interface}/setDraggedCheckListId`, null);
		this.#store.dispatch(`${Model.Interface}/setDisableCheckListAnimations`, false);
		this.#draggedItem = null;

		this.emit('end', draggedItem.id);
	}

	#handleItemMoving(
		draggedItem: CheckListModel,
		overedItem: CheckListModel,
		directionFromBottom: boolean,
	): Promise<void>
	{
		const isFirstOnLevel = (overedItem.sortIndex === 0);
		const numberOfItemPerLevel = this.#checkListManager.getChildren(overedItem.parentId).length;
		const isLastOnLevel = (overedItem.sortIndex === (numberOfItemPerLevel - 1));

		const shouldSkip = (
			Math.abs(draggedItem.sortIndex - overedItem.sortIndex) === 1
			&& !isFirstOnLevel
			&& !isLastOnLevel
		);
		if (shouldSkip)
		{
			return;
		}

		this.moveDropPreview(draggedItem, overedItem, directionFromBottom, true);
		this.resortLevelDependingOnPosition(draggedItem, overedItem, directionFromBottom, true);
	}

	#setYOffset(draggedItemElement: HTMLElement): void
	{
		const relativePosition = Dom.getRelativePosition(draggedItemElement, this.#container);

		const relativeTop = relativePosition.top;
		const isTopItem = relativeTop <= 0;

		const offsetY = isTopItem ? relativeTop : 0;

		const options = this.#draggable.getOptions();
		options.offset.y = -offsetY;

		this.#draggable.setOptions(options);
	}
}
