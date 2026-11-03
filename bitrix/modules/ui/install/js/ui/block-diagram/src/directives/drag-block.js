import { Dom, Type, Event, Tag } from 'main.core';
import { toValue } from 'ui.vue3';

import { resolveDragImageScale } from '../utils';
import type { DragData } from '../types';

let copiedDragItem = null;

function onDragStart(event: MouseEvent, value: DragData | () => DragData): void
{
	const { dragData, dragImage } = Type.isFunction(value)
		? value()
		: value;

	copiedDragItem = toValue(dragImage).cloneNode(true).children[0];

	const wrapper = document.getElementById('blockDiagramDragWrapper');
	Dom.append(copiedDragItem, wrapper);

	Dom.style(copiedDragItem, {
		display: 'block',
		position: 'absolute',
		top: 0,
		left: 0,
	});

	const { width, height } = copiedDragItem.getBoundingClientRect();
	const dragImageScale = resolveDragImageScale(width, height);

	if (dragImageScale < 1)
	{
		Dom.style(copiedDragItem, { zoom: dragImageScale });
	}

	// anchor on the size the bitmap is actually rendered at, which also keeps the anchor correct
	// in browsers that ignore zoom (Firefox below 126)
	const rendered = copiedDragItem.getBoundingClientRect();

	event.dataTransfer.setDragImage(
		copiedDragItem,
		rendered.width / 2,
		rendered.height / 2,
	);

	event.dataTransfer.setData('text/plain', JSON.stringify({
		...toValue(dragData),
		dimensions: {
			width,
			height,
		},
	}));
}

function onDragEnd(event: MouseEvent): void
{
	Dom.remove(copiedDragItem);
	copiedDragItem = null;
}

function initDragItemWrapper(): void
{
	const hasWrapper = document.getElementById('blockDiagramDragWrapper');

	if (hasWrapper)
	{
		return;
	}

	const wrapper = Tag.render`
		<div>
			<div
				id="blockDiagramDragWrapper"
				style="position: relative; width: 100%; height: 100%;"
			>
			</div>
		</div>
	`;
	Dom.append(wrapper, document.body);
	Dom.style(wrapper, {
		position: 'absolute',
		transform: 'translate(-100%, -100%)',
		top: 0,
		right: 0,
	});
}

// The handlers the element was bound with: they close over the value of the directive, so
// unbinding cannot rebuild them and has to find the very functions that were bound.
const boundHandlers = new WeakMap();

export const DragBlock = {
	mounted(el, { value }): void
	{
		initDragItemWrapper();
		Dom.attr(el, 'draggable', 'true');

		const handlers = {
			dragStart: (event: MouseEvent) => onDragStart(event, value),
			dragEnd: (event: MouseEvent) => onDragEnd(event),
		};

		boundHandlers.set(el, handlers);
		Event.bind(el, 'dragstart', handlers.dragStart);
		Event.bind(el, 'dragend', handlers.dragEnd);
	},
	unmounted(el)
	{
		const handlers = boundHandlers.get(el) ?? null;

		if (handlers === null)
		{
			return;
		}

		boundHandlers.delete(el);
		Event.unbind(el, 'dragstart', handlers.dragStart);
		Event.unbind(el, 'dragend', handlers.dragEnd);
	},
};
