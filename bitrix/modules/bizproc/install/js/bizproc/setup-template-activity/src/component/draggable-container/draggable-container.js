import { Dom, Event } from 'main.core';
import { BaseEvent, EventEmitter } from 'main.core.events';

import './draggable-container.css';

type DragState = {
	sourceBlockIndex: number | null,
	draggedItemIndex: number | null,
	draggedElement: HTMLElement | null,
	ghostElement: HTMLElement | null,
	offsetX: number,
	offsetY: number,
	lastTargetBlockIndex: number | null,
	lastTargetItemIndex: number | null,
};

// @vue/component
export const DraggableContainer = {
	name: 'DraggableContainer',
	props: {
		items: {
			type: Array,
			required: true,
		},
		blockIndex: {
			type: Number,
			required: true,
		},
	},
	emits: ['update:items'],
	data(): {
		isDragging: boolean,
		dropTargetIndex: number | null,
		dragState: DragState,
		}
	{
		return {
			isDragging: false,
			dropTargetIndex: null,
			dragState: {
				sourceBlockIndex: null,
				draggedItemIndex: null,
				draggedElement: null,
				ghostElement: null,
				offsetX: 0,
				offsetY: 0,
				lastTargetBlockIndex: null,
				lastTargetItemIndex: null,
			},
		};
	},
	computed:
	{
		draggedItemIndex(): number | null
		{
			return this.isDragging ? this.dragState.draggedItemIndex : null;
		},
	},
	created(): void
	{
		this.boundHandleDragMove = this.handleDragMove.bind(this);
		this.boundHandleDragEnd = this.handleDragEnd.bind(this);

		EventEmitter.subscribe('Bizproc.SetupTemplate:Draggable:start', this.onGlobalDragStart);
		EventEmitter.subscribe('Bizproc.SetupTemplate:Draggable:dragover', this.onGlobalDragOver);
		EventEmitter.subscribe('Bizproc.SetupTemplate:Draggable:end', this.onGlobalDragEnd);
	},
	beforeUnmount(): void
	{
		EventEmitter.unsubscribe('Bizproc.SetupTemplate:Draggable:start', this.onGlobalDragStart);
		EventEmitter.unsubscribe('Bizproc.SetupTemplate:Draggable:dragover', this.onGlobalDragOver);
		EventEmitter.unsubscribe('Bizproc.SetupTemplate:Draggable:end', this.onGlobalDragEnd);
	},
	methods:
		{
			onGlobalDragStart(e: BaseEvent): void
			{
				const payload = e.getData();
				const { sourceItemIndex, sourceBlockIndex, event, element } = payload;

				if (sourceBlockIndex !== this.blockIndex)
				{
					return;
				}

				event.preventDefault();

				this.isDragging = true;
				this.dragState.sourceBlockIndex = this.blockIndex;
				this.dragState.draggedItemIndex = sourceItemIndex;
				this.dragState.draggedElement = element;

				this.createGhost(event);
				Dom.addClass(this.dragState.draggedElement, '--dragging');
				Dom.addClass(document.body, '--user-dragging');
				Event.bind(document, 'mousemove', this.boundHandleDragMove);
				Event.bind(document, 'mouseup', this.boundHandleDragEnd);
			},
			onGlobalDragOver(e: BaseEvent): void
			{
				const payload = e.getData();
				if (payload.targetBlockIndex === this.blockIndex)
				{
					this.dropTargetIndex = payload.targetItemIndex;
				}
				else
				{
					this.dropTargetIndex = null;
				}

				if (this.isDragging)
				{
					this.dragState.lastTargetBlockIndex = payload.targetBlockIndex;
					this.dragState.lastTargetItemIndex = payload.targetItemIndex;
				}
			},
			handleDragMove(event: MouseEvent): void
			{
				if (!this.isDragging)
				{
					return;
				}

				this.updateGhostPosition(event);

				const result = { targetBlockIndex: null, targetItemIndex: null };
				const elementUnderCursor = document.elementFromPoint(event.clientX, event.clientY);

				if (elementUnderCursor)
				{
					const container = elementUnderCursor.closest('[data-draggable-container]');
					if (container)
					{
						result.targetBlockIndex = parseInt(container.dataset.blockIndex, 10);
						const allItems = [...container.querySelectorAll('[data-draggable-item]')];
						const closestItem = elementUnderCursor.closest('[data-draggable-item]');

						if (closestItem)
						{
							const rect = closestItem.getBoundingClientRect();
							const isAfter = (event.clientY - rect.top) > rect.height / 2;
							const index = allItems.indexOf(closestItem);
							result.targetItemIndex = isAfter ? index + 1 : index;
						}
						else if (allItems.length === 0)
						{
							result.targetItemIndex = 0;
						}
					}
				}
				EventEmitter.emit('Bizproc.SetupTemplate:Draggable:dragover', result);
			},
			handleDragEnd(): void
			{
				if (!this.isDragging)
				{
					return;
				}

				EventEmitter.emit('Bizproc.SetupTemplate:Draggable:drop', {
					sourceBlockIndex: this.dragState.sourceBlockIndex,
					sourceItemIndex: this.dragState.draggedItemIndex,
					targetBlockIndex: this.dragState.lastTargetBlockIndex,
					targetItemIndex: this.dragState.lastTargetItemIndex,
				});

				EventEmitter.emit('Bizproc.SetupTemplate:Draggable:end');
			},
			onGlobalDragEnd(): void
			{
				if (this.isDragging)
				{
					this.resetDragState();
				}
				this.isDragging = false;
				this.dropTargetIndex = null;
			},
			resetDragState(): void
			{
				Dom.removeClass(document.body, '--user-dragging');
				if (this.dragState.draggedElement)
				{
					Dom.removeClass(this.dragState.draggedElement, '--dragging');
				}

				if (this.dragState.ghostElement)
				{
					Dom.remove(this.dragState.ghostElement);
				}

				Event.unbind(document, 'mousemove', this.boundHandleDragMove);
				Event.unbind(document, 'mouseup', this.boundHandleDragEnd);

				this.dragState = {
					sourceBlockIndex: null,
					draggedItemIndex: null,
					draggedElement: null,
					ghostElement: null,
					offsetX: 0,
					offsetY: 0,
					lastTargetBlockIndex: null,
					lastTargetItemIndex: null,
				};
			},
			updateGhostPosition(event: MouseEvent): void
			{
				if (!this.dragState.ghostElement)
				{
					return;
				}
				Dom.style(this.dragState.ghostElement, 'left', `${event.clientX - this.dragState.offsetX}px`);
				Dom.style(this.dragState.ghostElement, 'top', `${event.clientY - this.dragState.offsetY}px`);
			},
			createGhost(event: MouseEvent): void
			{
				const rect = this.dragState.draggedElement.getBoundingClientRect();
				this.dragState.offsetX = event.clientX - rect.left;
				this.dragState.offsetY = event.clientY - rect.top;

				const ghost = this.dragState.draggedElement.cloneNode(true);
				Dom.addClass(ghost, '--ghost');
				Dom.style(ghost, 'width', `${rect.width}px`);
				Dom.append(ghost, document.body);
				this.dragState.ghostElement = ghost;

				this.updateGhostPosition(event);
			},
		},
	template: `
		<div>
			<slot
				:dropTargetIndex="dropTargetIndex"
				:draggedItemIndex="draggedItemIndex"
			></slot>
		</div>
	`,
};
