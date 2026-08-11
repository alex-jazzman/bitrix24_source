import { Type, Dom, Event } from 'main.core';

const SupportedTags = new Set(['INPUT', 'TEXTAREA']);
const DragGhostClass = '--ghost';
const handlerState = new WeakMap();

function resolveDragText(binding): string
{
	return Type.isStringFilled(binding?.value) ? binding.value : '';
}

function getInputTarget(target: HTMLElement): ?HTMLElement
{
	if (SupportedTags.has(target.tagName))
	{
		return target;
	}

	return target.closest('input, textarea, [contenteditable="true"]');
}

function insertDraggedText(target: HTMLElement, text: string): void
{
	if (!SupportedTags.has(target.tagName))
	{
		return;
	}

	const input = target;
	const start = input.selectionStart ?? input.value.length;
	const end = input.selectionEnd ?? input.value.length;
	input.focus();
	input.setRangeText(text, start, end, 'end');
}

function createDragGhost(target: HTMLElement): HTMLElement
{
	const ghost = target.cloneNode(true);
	Dom.addClass(ghost, DragGhostClass);
	Dom.style(ghost, {
		position: 'fixed',
		top: '-1000px',
		left: '-1000px',
		opacity: '0.85',
		pointerEvents: 'none',
	});

	return ghost;
}

function cleanupDrag(el: HTMLElement): void
{
	const state = handlerState.get(el);
	if (!state)
	{
		return;
	}

	Event.unbind(document, 'dragover', state.onDocumentDragOver);
	Event.unbind(document, 'drop', state.onDocumentDrop);
	Event.unbind(document, 'dragend', state.onDocumentDragEnd);

	if (state.dragGhost)
	{
		Dom.remove(state.dragGhost);
	}

	handlerState.set(el, {
		...state,
		dragGhost: null,
	});
}

function attachHandlers(el: HTMLElement, binding): void
{
	const state = {
		dragGhost: null,
		getDragText: () => resolveDragText(binding),
		onDragStart: null,
		onDragEnd: null,
		onDocumentDragOver: null,
		onDocumentDrop: null,
		onDocumentDragEnd: null,
	};

	state.onDragStart = (event: DragEvent) => {
		const dataTransfer = event?.dataTransfer;
		if (!dataTransfer)
		{
			return;
		}

		dataTransfer.effectAllowed = 'copyMove';
		dataTransfer.setData('text/plain', state.getDragText());

		state.dragGhost = createDragGhost(el);
		if (state.dragGhost)
		{
			Dom.append(state.dragGhost, document.body);
			dataTransfer.setDragImage(state.dragGhost, 0, 0);
		}

		Event.bind(document, 'dragover', state.onDocumentDragOver);
		Event.bind(document, 'drop', state.onDocumentDrop);
		Event.bind(document, 'dragend', state.onDocumentDragEnd);
	};

	state.onDragEnd = () => cleanupDrag(el);

	state.onDocumentDragEnd = () => cleanupDrag(el);

	state.onDocumentDragOver = (event: DragEvent) => {
		event.preventDefault();

		const target = event?.target;
		const inputTarget = Type.isElementNode(target) ? getInputTarget(target) : null;
		event.dataTransfer.dropEffect = inputTarget ? 'copy' : 'move';
	};

	state.onDocumentDrop = (event: DragEvent) => {
		const target = event?.target;
		if (!Type.isElementNode(target))
		{
			return;
		}

		const inputTarget = getInputTarget(target);
		if (!inputTarget)
		{
			return;
		}

		event.preventDefault();
		insertDraggedText(inputTarget, state.getDragText());
		cleanupDrag(el);
	};

	Dom.attr(el, 'draggable', 'true');
	Event.bind(el, 'dragstart', state.onDragStart);
	Event.bind(el, 'dragend', state.onDragEnd);

	handlerState.set(el, state);
}

function detachHandlers(el: HTMLElement): void
{
	const state = handlerState.get(el);
	if (!state)
	{
		return;
	}

	cleanupDrag(el);
	Event.unbind(el, 'dragstart', state.onDragStart);
	Event.unbind(el, 'dragend', state.onDragEnd);
	handlerState.delete(el);
}

export const dragInspectorSchemeDataItem = {
	mounted(el: HTMLElement, binding): void
	{
		attachHandlers(el, binding);
	},
	updated(el: HTMLElement, binding): void
	{
		const state = handlerState.get(el);
		if (state)
		{
			state.getDragText = () => resolveDragText(binding);
		}
	},
	beforeUnmount(el: HTMLElement): void
	{
		detachHandlers(el);
	},
};
