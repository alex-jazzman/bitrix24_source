import { Event, Dom } from 'main.core';

const DRAG_ENTITIES = Object.freeze({
	ruleConstruction: 'rule-construction',
	ruleCard: 'rule-card',
});

const INSERTION = Object.freeze({
	over: 'over',
	under: 'under',
});

const createGhost = (el: HTMLElement): HTMLElement => {
	const ghost = el.cloneNode(true);
	Dom.style(ghost, {
		position: 'fixed',
		left: '-100%',
		top: '-100%',
	});
	Dom.append(ghost, el.parentElement);

	return ghost;
};

const checkForDragTarget = (draggedItem: HTMLElement, event: DragEvent): HTMLElement | null => {
	const closestNode = event.target.closest(`[data-name=${draggedItem.dataset.name}]`);
	const isDragAllowed = closestNode
		&& closestNode !== draggedItem && closestNode.parentElement === draggedItem.parentElement;
	if (isDragAllowed)
	{
		return closestNode;
	}

	return null;
};

const dragStartHandler = (dragStartEvent: DragEvent, onDrop: () => void): void => {
	const { dataTransfer, currentTarget: container, target } = dragStartEvent;
	const draggedItem = target.closest(`[data-name=${DRAG_ENTITIES.ruleConstruction}], [data-name=${DRAG_ENTITIES.ruleCard}]`);
	const ghost = createGhost(draggedItem);
	let dragTarget = null;
	dataTransfer.setDragImage(ghost, 0, 0);
	dataTransfer.effectAllowed = 'move';
	const handlers = {
		dragover: (dragOverEvent: DragEvent) => {
			dragTarget = checkForDragTarget(draggedItem, dragOverEvent);
			if (dragTarget)
			{
				dragOverEvent.preventDefault();
			}
		},
		dragend: () => {
			Dom.remove(ghost);
			entries.forEach(([currentEvent, handler]) => {
				Event.unbind(container, currentEvent, handler);
			});
		},
		dragenter: (dragEnterEvent: DragEvent) => {
			if (dragTarget)
			{
				dragEnterEvent.preventDefault();
			}
		},
		drop: (dropEvent: DragEvent) => {
			if (!dragTarget)
			{
				return;
			}

			const { top } = dragTarget.getBoundingClientRect();
			const insertion = dropEvent.clientY < top + dragTarget.offsetHeight / 2
				? INSERTION.over : INSERTION.under;
			const payload = {
				draggedId: draggedItem.dataset.id,
				targetId: dragTarget.dataset.id,
				insertion,
			};
			if (draggedItem.dataset.ruleCardId)
			{
				payload.ruleCardId = draggedItem.dataset.ruleCardId;
			}

			onDrop(payload);
		},
	};
	const entries = Object.entries(handlers);
	entries.forEach(([currentEvent, handler]) => {
		Event.bind(container, currentEvent, handler);
	});
};

export const DragRuleEntity = {
	mounted(el: HTMLElement, { value: onDrop }: Object): void
	{
		Event.bind(el, 'dragstart', (event: DragEvent) => {
			dragStartHandler(event, onDrop);
		});
	},
	unmounted(el: HTMLElement): void
	{
		Event.unbindAll(el, 'dragstart');
	},
};
