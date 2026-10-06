import { Type, Dom, Event } from 'main.core';
import { Draggable } from 'ui.draganddrop.draggable';

// setRangeText() applies to textarea and to these input types only; on the others it throws
// InvalidStateError, so such a field must not look like a drop target in the first place.
const SelectionInputTypes = new Set(['text', 'search', 'url', 'tel', 'password']);
const DragSourceClass = 'inspector-scheme-view__data-item-drag-source';
const DragGhostClass = 'inspector-scheme-view__data-item-drag-ghost';
const DragCursorOverlayClass = 'inspector-scheme-view__data-item-drag-cursor-overlay';
const DragValueAttribute = 'data-drag-value';
const TestIdAttribute = 'data-test-id';
// getComputedStyle() reports an unset line-height as `normal`, which has no pixel value.
const FallbackLineHeight = 16;
// Scroll metrics are fractional under page zoom, so an edge is never reached exactly.
const ScrollEdgeTolerance = 1;
const ScrollAxes = {
	x: { overflow: 'overflowX', position: 'scrollLeft', clientSize: 'clientWidth', scrollSize: 'scrollWidth' },
	y: { overflow: 'overflowY', position: 'scrollTop', clientSize: 'clientHeight', scrollSize: 'scrollHeight' },
};
const handlerState = new WeakMap();

function resolveDragText(source: ?HTMLElement): string
{
	const value = source ? Dom.attr(source, DragValueAttribute) : '';

	return Type.isStringFilled(value) ? value : '';
}

function acceptsDraggedText(element: ?HTMLElement): boolean
{
	if (!element || element.matches(':disabled, [readonly]'))
	{
		return false;
	}

	if (element.tagName === 'TEXTAREA')
	{
		return true;
	}

	return element.tagName === 'INPUT' && SelectionInputTypes.has(element.type);
}

function getInputTarget(target: HTMLElement): ?HTMLElement
{
	const candidate = acceptsDraggedText(target) ? target : target.closest('input, textarea');

	return acceptsDraggedText(candidate) ? candidate : null;
}

function createTextMirror(target: HTMLElement): HTMLElement
{
	const styles = getComputedStyle(target);
	const rect = target.getBoundingClientRect();
	const mirror = document.createElement('div');
	const horizontalBorder = parseFloat(styles.borderLeftWidth) + parseFloat(styles.borderRightWidth);
	const verticalBorder = parseFloat(styles.borderTopWidth) + parseFloat(styles.borderBottomWidth);

	Dom.attr(mirror, 'aria-hidden', 'true');
	Dom.style(mirror, {
		position: 'fixed',
		opacity: '0',
		pointerEvents: 'auto',
		zIndex: '2147483647',
		left: `${rect.left}px`,
		top: `${rect.top}px`,
		width: `${target.clientWidth + horizontalBorder}px`,
		height: `${target.clientHeight + verticalBorder}px`,
		overflow: 'hidden',
		boxSizing: 'border-box',
		padding: styles.padding,
		// The `border` shorthand serializes to an empty string once the sides differ, and a legacy
		// field usually looks exactly like that (`border: 0` plus a single `border-bottom`). The
		// mirror would then lose the border its own width and height are already measured with,
		// and every caret offset would shift. The three sub-shorthands take up to four values each.
		borderWidth: styles.borderWidth,
		borderStyle: styles.borderStyle,
		borderColor: styles.borderColor,
		fontFamily: styles.fontFamily,
		fontSize: styles.fontSize,
		fontStyle: styles.fontStyle,
		fontVariant: styles.fontVariant,
		fontWeight: styles.fontWeight,
		letterSpacing: styles.letterSpacing,
		lineHeight: styles.lineHeight,
		textAlign: styles.textAlign,
		textIndent: styles.textIndent,
		textTransform: styles.textTransform,
		direction: styles.direction,
		// A single-line input never wraps whatever the cascade says; a textarea does whatever its
		// own computed mode says, and the panel has fields with `normal` and `nowrap` alike.
		whiteSpace: target.tagName === 'TEXTAREA' ? styles.whiteSpace : 'pre',
		overflowWrap: styles.overflowWrap,
		wordBreak: styles.wordBreak,
		tabSize: styles.tabSize,
	});

	return mirror;
}

function resolveCaretPosition(textNode: Text, clientX: number, clientY: number): ?number
{
	if (Type.isFunction(document.caretRangeFromPoint))
	{
		const range = document.caretRangeFromPoint(clientX, clientY);
		if (range?.startContainer === textNode)
		{
			return range.startOffset;
		}
	}

	if (Type.isFunction(document.caretPositionFromPoint))
	{
		const position = document.caretPositionFromPoint(clientX, clientY);
		if (position?.offsetNode === textNode)
		{
			return position.offset;
		}
	}

	return null;
}

function getDropPosition(target: HTMLElement, clientX: number, clientY: number): number
{
	const mirror = createTextMirror(target);
	const value = target.value;
	const textNode = document.createTextNode(value);

	Dom.append(textNode, mirror);
	Dom.append(mirror, document.body);
	mirror.scrollLeft = target.scrollLeft;
	mirror.scrollTop = target.scrollTop;

	try
	{
		return resolveCaretPosition(textNode, clientX, clientY) ?? target.selectionStart ?? value.length;
	}
	finally
	{
		Dom.remove(mirror);
	}
}

function insertDraggedText(target: HTMLElement, text: string, clientX: number, clientY: number): void
{
	const position = getDropPosition(target, clientX, clientY);

	target.focus();
	target.setRangeText(text, position, position, 'end');
	target.dispatchEvent(new window.Event('input', { bubbles: true }));
	target.dispatchEvent(new window.Event('change', { bubbles: true }));
}

function createDragGhost(source: HTMLElement): HTMLElement
{
	const { width, height } = source.getBoundingClientRect();
	const ghost = source.cloneNode(true);

	Dom.addClass(ghost, DragGhostClass);
	// The ghost repeats the row it was cloned from, so it stays out of the accessibility tree
	// and gives up the test ids: two nodes under one id would break strict locators in e2e.
	Dom.attr(ghost, 'aria-hidden', 'true');
	[ghost, ...ghost.querySelectorAll(`[${TestIdAttribute}]`)].forEach((node) => {
		node.removeAttribute(TestIdAttribute);
	});
	Dom.style(ghost, {
		width: `${width}px`,
		height: `${height}px`,
	});

	return ghost;
}

function canScrollBy(position: number, clientSize: number, scrollSize: number, delta: number): boolean
{
	return delta > 0
		? position + clientSize < scrollSize - ScrollEdgeTolerance
		: position > ScrollEdgeTolerance;
}

// A container that has reached its edge hands the wheel over to the next one up, the way native
// scroll chaining does. Each axis is resolved on its own: the same gesture can move two different
// containers, and an edge on one axis must not hold back the other.
function findScrollableAncestor(element: ?HTMLElement, axis: 'x' | 'y', delta: number): ?HTMLElement
{
	if (delta === 0)
	{
		return null;
	}

	const { overflow, position, clientSize, scrollSize } = ScrollAxes[axis];
	let node = element;

	while (node)
	{
		const nodeOverflow = getComputedStyle(node)[overflow];
		const scrolls = (nodeOverflow === 'auto' || nodeOverflow === 'scroll')
			&& canScrollBy(node[position], node[clientSize], node[scrollSize], delta);

		if (scrolls)
		{
			return node;
		}

		node = node.parentElement;
	}

	return null;
}

// Firefox reports the wheel delta in lines, and a page-sized delta exists as well.
function toPixelDelta(delta: number, deltaMode: number, lineSize: number, pageSize: number): number
{
	if (deltaMode === WheelEvent.DOM_DELTA_LINE)
	{
		return delta * lineSize;
	}

	if (deltaMode === WheelEvent.DOM_DELTA_PAGE)
	{
		return delta * pageSize;
	}

	return delta;
}

function getLineSize(element: HTMLElement): number
{
	const lineHeight = parseFloat(getComputedStyle(element).lineHeight);

	return Number.isFinite(lineHeight) ? lineHeight : FallbackLineHeight;
}

function getElementUnderOverlay(overlay: HTMLElement, clientX: number, clientY: number): ?HTMLElement
{
	Dom.style(overlay, 'pointerEvents', 'none');
	const element = document.elementFromPoint(clientX, clientY);
	Dom.style(overlay, 'pointerEvents', null);

	return Type.isElementNode(element) ? element : null;
}

// The overlay owns the pointer for the whole gesture, so the wheel no longer reaches the settings
// panel and a field outside the viewport becomes unreachable without cancelling the drag. Pass the
// scroll on by hand; where there is nothing to scroll, leave the event to the browser.
function scrollUnderDragCursorOverlay(event: WheelEvent): void
{
	const target = getElementUnderOverlay(event.currentTarget, event.clientX, event.clientY);
	const horizontal = findScrollableAncestor(target, 'x', event.deltaX);
	const vertical = findScrollableAncestor(target, 'y', event.deltaY);

	if (!horizontal && !vertical)
	{
		return;
	}

	if (horizontal)
	{
		const lineSize = getLineSize(horizontal);

		horizontal.scrollLeft += toPixelDelta(event.deltaX, event.deltaMode, lineSize, horizontal.clientWidth);
	}

	if (vertical)
	{
		const lineSize = getLineSize(vertical);

		vertical.scrollTop += toPixelDelta(event.deltaY, event.deltaMode, lineSize, vertical.clientHeight);
	}

	event.preventDefault();
}

// The settings panel controls declare their own cursor with !important, so a rule scoped to the
// dragged-over element loses. The overlay takes the cursor out of that cascade entirely: it lies
// above everything and is the element the pointer actually hovers. It stays out of the
// accessibility tree and carries no test id for the same reasons as the preview.
function createDragCursorOverlay(): HTMLElement
{
	const overlay = document.createElement('div');

	Dom.addClass(overlay, DragCursorOverlayClass);
	Dom.attr(overlay, 'aria-hidden', 'true');
	// preventDefault() on wheel works only for a non-passive listener
	Event.bind(overlay, 'wheel', scrollUnderDragCursorOverlay, { passive: false });

	return overlay;
}

function moveDragGhost(ghost: HTMLElement, x: number, y: number): void
{
	Dom.style(ghost, {
		left: `${x}px`,
		top: `${y}px`,
	});
}

// The sensor arms the drag already on mousedown, so the preview waits for the first move:
// otherwise a plain click on the row would flash it.
function startDrag(state, event): void
{
	const { clientX, clientY, pointerOffsetX, pointerOffsetY, source } = event.getData();

	state.isActive = true;
	state.isCancelled = false;
	state.source = source;
	state.clientX = clientX;
	state.clientY = clientY;
	state.pointerOffsetX = pointerOffsetX;
	state.pointerOffsetY = pointerOffsetY;
}

function moveDrag(state, event): void
{
	const { clientX, clientY } = event.getData();

	state.clientX = clientX;
	state.clientY = clientY;

	if (!state.dragGhost)
	{
		state.dragGhost = createDragGhost(state.source);
		state.dragCursorOverlay = createDragCursorOverlay();
		Dom.append(state.dragGhost, document.body);
		Dom.append(state.dragCursorOverlay, document.body);
	}

	moveDragGhost(state.dragGhost, clientX - state.pointerOffsetX, clientY - state.pointerOffsetY);
}

function cleanupDrag(state): void
{
	if (state.dragGhost)
	{
		Dom.remove(state.dragGhost);
		state.dragGhost = null;
	}

	// Runs before the drop target is resolved, so elementFromPoint() sees the field, not the overlay.
	if (state.dragCursorOverlay)
	{
		Event.unbind(state.dragCursorOverlay, 'wheel', scrollUnderDragCursorOverlay, { passive: false });
		Dom.remove(state.dragCursorOverlay);
		state.dragCursorOverlay = null;
	}
}

function dropDraggedText(state, clientX: number, clientY: number): void
{
	const target = document.elementFromPoint(clientX, clientY);
	if (!Type.isElementNode(target))
	{
		return;
	}

	const inputTarget = getInputTarget(target);
	if (!inputTarget)
	{
		return;
	}

	insertDraggedText(inputTarget, resolveDragText(state.source), clientX, clientY);
}

function endDrag(state, event): void
{
	const { clientX, clientY } = event.getData();
	// The sensor arms on mousedown, so a plain click also ends here. Only a gesture that
	// actually moved (and therefore has a preview) may drop a value into a field.
	const wasDragging = Boolean(state.dragGhost);
	const wasCancelled = state.isCancelled;

	state.isActive = false;
	state.isCancelled = false;
	cleanupDrag(state);

	if (wasDragging && !wasCancelled)
	{
		dropDraggedText(state, clientX, clientY);
	}
}

function cancelDrag(state): void
{
	if (!state.isActive)
	{
		return;
	}

	state.isCancelled = true;
	document.dispatchEvent(new MouseEvent('mouseup', {
		bubbles: true,
		clientX: state.clientX,
		clientY: state.clientY,
		button: 0,
	}));
}

function stopTouchDrag(event: TouchEvent): void
{
	const target = event.target;
	if (Type.isElementNode(target) && target.closest(`.${DragSourceClass}`))
	{
		event.stopPropagation();
	}
}

function attachHandlers(el: HTMLElement): void
{
	const state = {
		el,
		isActive: false,
		isCancelled: false,
		source: null,
		dragGhost: null,
		dragCursorOverlay: null,
		clientX: 0,
		clientY: 0,
		pointerOffsetX: 0,
		pointerOffsetY: 0,
		draggable: null,
		onWindowBlur: null,
	};

	// HEADLESS keeps the row in place: the sortable visuals of the other types hide the
	// source and push a placeholder into the list, which is wrong for copying a value out.
	state.draggable = new Draggable({
		container: el,
		draggable: `.${DragSourceClass}`,
		dragElement: `.${DragSourceClass}`,
		type: Draggable.HEADLESS,
	});

	state.draggable.subscribe('start', (event) => startDrag(state, event));
	state.draggable.subscribe('move', (event) => moveDrag(state, event));
	state.draggable.subscribe('end', (event) => endDrag(state, event));
	state.onWindowBlur = () => cancelDrag(state);
	Event.bind(el, 'touchstart', stopTouchDrag);
	Event.bind(window, 'blur', state.onWindowBlur);

	handlerState.set(el, state);
}

function detachHandlers(el: HTMLElement): void
{
	const state = handlerState.get(el);
	if (!state)
	{
		return;
	}

	cancelDrag(state);
	cleanupDrag(state);
	Event.unbind(el, 'touchstart', stopTouchDrag);
	Event.unbind(window, 'blur', state.onWindowBlur);
	state.draggable.destroy();
	handlerState.delete(el);
}

export const dragInspectorSchemeDataItem = {
	mounted(el: HTMLElement): void
	{
		attachHandlers(el);
	},
	beforeUnmount(el: HTMLElement): void
	{
		detachHandlers(el);
	},
};
