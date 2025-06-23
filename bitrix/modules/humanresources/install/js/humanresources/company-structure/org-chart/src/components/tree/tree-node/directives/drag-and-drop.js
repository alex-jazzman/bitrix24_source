import { Event, Dom, Tag } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { events } from '../../../../consts';

const itemWidth = 278;
const gap = 24;
const mousedownHandler = ({ target, currentTarget: dragContainer }: MouseEvent) => {
	if (!Dom.hasClass(target, 'humanresources-tree__node_dnd-icon'))
	{
		return;
	}

	event.stopPropagation();
	const draggedItem = target.closest('.humanresources-tree__node');
	const draggedId = Number(draggedItem.dataset.id);
	const children = [...dragContainer.children];
	const draggedIndex = children.indexOf(draggedItem);
	const ghost = createGhost(draggedItem);
	Dom.append(ghost, dragContainer);
	let transformX = 0;
	let prevAffectedItems = [];
	let targetIndex = null;

	const mouseMoveHandler = (event: MouseEvent) => {
		Dom.style(document.body, 'userSelect', 'none');
		Dom.style(document.body, 'cursor', 'grabbing');
		Dom.addClass(dragContainer, '--drag-progress');
		Dom.addClass(draggedItem, '--dragging');
		transformX += event.movementX / dragContainer.dataset.zoom;
		setTransform(draggedItem, transformX);
		prevAffectedItems.forEach((affectedItem) => setTransform(affectedItem));
		targetIndex = Math.trunc((draggedItem.offsetLeft + transformX) / (itemWidth + gap));
		if (targetIndex === draggedIndex)
		{
			setTransform(ghost, draggedItem.offsetLeft);

			return;
		}

		const direction = draggedIndex < targetIndex ? 1 : -1;
		const affectedItems = direction > 0
			? children.slice(draggedIndex + 1, targetIndex + 1)
			: children.slice(targetIndex, draggedIndex);
		const fullWidth = itemWidth + gap;
		affectedItems.forEach((affectedItem) => setTransform(affectedItem, -direction * fullWidth));
		setTransform(ghost, draggedItem.offsetLeft + (direction * affectedItems.length * fullWidth));
		prevAffectedItems = affectedItems;
	};

	const mouseUpHandler = () => {
		Dom.style(document.body, 'userSelect', '');
		Dom.style(document.body, 'cursor', '');
		Event.unbind(document, 'mousemove', mouseMoveHandler);
		Event.unbind(document, 'mouseup', mouseUpHandler);
		[...prevAffectedItems, draggedItem].forEach((item) => setTransform(item));
		Dom.removeClass(dragContainer, '--drag-progress');
		Dom.removeClass(draggedItem, '--dragging');
		Dom.remove(ghost);
		EventEmitter.emit(events.HR_DEPARTMENT_TOGGLE_CONNECTORS, { draggedId, shouldShow: true });
		if (draggedIndex === targetIndex)
		{
			return;
		}

		const targetId = children[targetIndex] ? Number(children[targetIndex].dataset.id) : 0;
		if (targetId)
		{
			EventEmitter.emit(events.HR_DROP_DEPARTMENT, {
				draggedId,
				targetId,
				affectedItems: prevAffectedItems.map((item) => Number(item.dataset.id)),
				direction: draggedIndex < targetIndex ? 1 : -1,
			});
		}
	};
	Event.bind(document, 'mousemove', mouseMoveHandler);
	Event.bind(document, 'mouseup', mouseUpHandler);
	EventEmitter.emit(events.HR_DEPARTMENT_TOGGLE_CONNECTORS, { draggedId, shouldShow: false });
	EventEmitter.emit(events.HR_DRAG_DEPARTMENT, { draggedId });
};

const createGhost = (draggedItem: HTMLElement) => {
	const { offsetWidth, offsetHeight, offsetLeft } = draggedItem;

	return Tag.render`
		<div
			class="humanresources-tree__node_dnd-ghost"
			style="width: ${offsetWidth}px; height: ${offsetHeight}px; transform: translateX(${offsetLeft}px);"
		></div>
	`;
};

const setTransform = (element: HTMLElement, x: ?number) => {
	Dom.style(element, 'transform', x ? `translate3d(${x}px, 0, 0)` : '');
};

export const DragAndDrop = {
	mounted(el: HTMLElement): void
	{
		Event.bind(el, 'mousedown', mousedownHandler);
	},
	updated(el: HTMLElement, { value }): void
	{
		el.setAttribute('data-zoom', value);
	},
};
