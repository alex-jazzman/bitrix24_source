import { Event as MainEvent, Type } from 'main.core';

type MultipleSelectBehaviorOptions = {
	roots?: Array<HTMLElement | null | void>,
	eventTarget?: EventTarget,
	requireTrusted?: boolean,
};

type MultipleSelectSnapshot = {
	select: HTMLSelectElement,
	selected: boolean[],
};

type MultipleSelectOptionMatch = {
	select: HTMLSelectElement,
	option: HTMLOptionElement,
};

type MouseEventWithPointerType = MouseEvent & {
	pointerType?: string,
};

type NonMousePointerDownState = {
	clientX: number,
	clientY: number,
	startedAt: number,
};

type ScrollbarSelectionMode = 'track' | 'thumb';

type ScrollbarSelectionSession = {
	select: HTMLSelectElement,
	snapshot: MultipleSelectSnapshot,
	restoreHandler: Function,
	startClientY: number,
	startScrollTop: number,
	scrollTimer: number | null,
	mode: ScrollbarSelectionMode,
};

type ScrollbarTrackGeometry = {
	trackTop: number,
	trackBottom: number,
	trackHeight: number,
	thumbHeight: number,
	thumbTravelHeight: number,
};

const COMPATIBLE_MOUSE_EVENT_MAX_DELAY = 800;
const COMPATIBLE_MOUSE_EVENT_MAX_DISTANCE = 25;
const FALLBACK_SCROLLBAR_WIDTH = 16;
const MIN_MEASURED_SCROLLBAR_WIDTH = 4;
const MULTI_SELECT_SCROLLBAR_WIDTH_PROPERTY = '--bizprocdesigner-multi-select-scrollbar-width';
const SCROLL_REPEAT_INTERVAL = 120;
const SCROLL_REPEAT_START_DELAY = 300;
const RESTORE_DELAYS = [0, 50, 150, 300, 600];

function getSelectFromOption(option: HTMLOptionElement): HTMLSelectElement | null
{
	const select = option.closest('select');

	return select instanceof HTMLSelectElement ? select : null;
}

function getAvailableRoots(roots: Array<HTMLElement | null | void>): HTMLElement[]
{
	return roots.filter((root): boolean => root instanceof HTMLElement);
}

function isInsideRoots(element: HTMLElement, roots: Array<HTMLElement | null | void>): boolean
{
	const availableRoots = getAvailableRoots(roots);

	return availableRoots.length === 0 || availableRoots.some((root: HTMLElement) => root.contains(element));
}

function getMultipleSelectFromTarget(target: EventTarget | null): HTMLSelectElement | null
{
	if (target instanceof HTMLSelectElement)
	{
		return target.multiple ? target : null;
	}

	if (target instanceof HTMLOptionElement)
	{
		const select = getSelectFromOption(target);

		return select?.multiple ? select : null;
	}

	return null;
}

function getMultipleSelectFromPoint(clientX: number, clientY: number): HTMLSelectElement | null
{
	if (!Type.isFunction(document.elementsFromPoint))
	{
		return null;
	}

	const [element] = document.elementsFromPoint(clientX, clientY);

	return element ? getMultipleSelectFromTarget(element) : null;
}

function getMultipleSelectFromMouseEvent(
	event: MouseEvent,
	roots: Array<HTMLElement | null | void>,
): HTMLSelectElement | null
{
	if (!(event.target instanceof HTMLElement) || !isInsideRoots(event.target, roots))
	{
		return null;
	}

	const select = getMultipleSelectFromTarget(event.target)
		?? getMultipleSelectFromPoint(event.clientX, event.clientY)
	;

	return select && isInsideRoots(select, roots) ? select : null;
}

function getSelectScrollLineHeight(select: HTMLSelectElement): number
{
	const firstOption = select.options[0];
	const optionHeight = firstOption ? parseFloat(getComputedStyle(firstOption).height) : Number.NaN;
	if (Number.isFinite(optionHeight) && optionHeight > 0)
	{
		return optionHeight;
	}

	const lineHeight = parseFloat(getComputedStyle(select).lineHeight);
	if (Number.isFinite(lineHeight) && lineHeight > 0)
	{
		return Math.max(lineHeight, 1);
	}

	return Math.max(select.clientHeight / Math.max(select.size || 1, 1), 1);
}

function isPointInsideOption(option: HTMLOptionElement, clientX: number, clientY: number): boolean
{
	const optionRect = option.getBoundingClientRect();

	return optionRect.width > 0
		&& optionRect.height > 0
		&& clientX >= optionRect.left
		&& clientX <= optionRect.right
		&& clientY >= optionRect.top
		&& clientY <= optionRect.bottom
	;
}

function getOptionByCoordinates(select: HTMLSelectElement, clientX: number, clientY: number): HTMLOptionElement | null
{
	return [...select.options].find((option) => isPointInsideOption(option, clientX, clientY)) ?? null;
}

function getMultipleSelectOptionFromMouseEvent(event: MouseEvent): MultipleSelectOptionMatch | null
{
	if (event.target instanceof HTMLOptionElement)
	{
		const select = getSelectFromOption(event.target);

		return select?.multiple ? { select, option: event.target } : null;
	}

	const select = getMultipleSelectFromTarget(event.target) ?? getMultipleSelectFromPoint(event.clientX, event.clientY);
	if (!select?.multiple)
	{
		return null;
	}

	const option = getOptionByCoordinates(select, event.clientX, event.clientY);

	return option ? { select, option } : null;
}

function getPointerType(event: MouseEvent): string
{
	const { pointerType } = (event: MouseEventWithPointerType);

	return Type.isStringFilled(pointerType) ? pointerType : '';
}

function isPrimaryMouseDown(event: MouseEvent, requireTrusted: boolean): boolean
{
	const pointerType = getPointerType(event);

	return event.type === 'mousedown'
		&& (!requireTrusted || event.isTrusted)
		&& event.button === 0
		&& (!Type.isStringFilled(pointerType) || pointerType === 'mouse')
	;
}

function isNonMousePointerDown(event: MouseEvent): boolean
{
	const pointerType = getPointerType(event);

	return event.type === 'pointerdown' && Type.isStringFilled(pointerType) && pointerType !== 'mouse';
}

function createNonMousePointerDownState(event: MouseEvent): NonMousePointerDownState
{
	return {
		clientX: event.clientX,
		clientY: event.clientY,
		startedAt: Date.now(),
	};
}

function isCloseToNonMousePointerDown(event: MouseEvent, pointerState: NonMousePointerDownState): boolean
{
	return Math.abs(event.clientX - pointerState.clientX) <= COMPATIBLE_MOUSE_EVENT_MAX_DISTANCE
		&& Math.abs(event.clientY - pointerState.clientY) <= COMPATIBLE_MOUSE_EVENT_MAX_DISTANCE
	;
}

function isCompatibleMouseDownAfterNonMousePointer(
	event: MouseEvent,
	pointerState: NonMousePointerDownState | null,
): boolean
{
	if (event.type !== 'mousedown' || !pointerState)
	{
		return false;
	}

	return Date.now() - pointerState.startedAt <= COMPATIBLE_MOUSE_EVENT_MAX_DELAY
		&& isCloseToNonMousePointerDown(event, pointerState)
	;
}

function createCompatibleMouseDownFilter(): Function
{
	let nonMousePointerDownState: NonMousePointerDownState | null = null;

	return (event: MouseEvent): boolean => {
		if (isNonMousePointerDown(event))
		{
			nonMousePointerDownState = createNonMousePointerDownState(event);

			return true;
		}

		if (isCompatibleMouseDownAfterNonMousePointer(event, nonMousePointerDownState))
		{
			nonMousePointerDownState = null;

			return true;
		}

		if (event.type === 'mousedown')
		{
			nonMousePointerDownState = null;
		}

		return false;
	};
}

function createSelectionSnapshot(select: HTMLSelectElement): MultipleSelectSnapshot
{
	return {
		select,
		selected: [...select.options].map((option) => option.selected),
	};
}

function restoreSelectionSnapshot(snapshot: MultipleSelectSnapshot): void
{
	const options = [...snapshot.select.options];
	for (const [index, option] of options.entries())
	{
		option.selected = snapshot.selected[index] === true;
	}
}

function scheduleSelectionRestore(snapshot: MultipleSelectSnapshot): number[]
{
	return RESTORE_DELAYS.map((delay) => setTimeout(() => restoreSelectionSnapshot(snapshot), delay));
}

function stopNativeScrollbarEvent(event: MouseEvent): void
{
	event.preventDefault();
	event.stopPropagation();

	if (Type.isFunction(event.stopImmediatePropagation))
	{
		event.stopImmediatePropagation();
	}
}

function getStyleNumber(style: CSSStyleDeclaration, property: string): number
{
	return Math.max(parseFloat(style.getPropertyValue(property)) || 0, 0);
}

function getScrollbarWidth(select: HTMLSelectElement): number
{
	const style = getComputedStyle(select);
	const borderWidth = getStyleNumber(style, 'border-left-width') + getStyleNumber(style, 'border-right-width');
	const measuredScrollbarWidth = Math.max(select.offsetWidth - select.clientWidth - borderWidth, 0);
	const styledScrollbarWidth = getStyleNumber(style, MULTI_SELECT_SCROLLBAR_WIDTH_PROPERTY);

	return Math.max(measuredScrollbarWidth, styledScrollbarWidth);
}

function getEffectiveScrollbarWidth(select: HTMLSelectElement): number
{
	const scrollbarWidth = getScrollbarWidth(select);

	return scrollbarWidth >= MIN_MEASURED_SCROLLBAR_WIDTH ? scrollbarWidth : FALLBACK_SCROLLBAR_WIDTH;
}

function isOptionDisabled(option: HTMLOptionElement): boolean
{
	const select = getSelectFromOption(option);
	const group = option.parentElement;

	return option.disabled
		|| select?.disabled === true
		|| (group instanceof HTMLOptGroupElement && group.disabled)
	;
}

function getScrollbarTrackGeometry(select: HTMLSelectElement): ScrollbarTrackGeometry
{
	const rect = select.getBoundingClientRect();
	const trackTop = rect.top;
	const trackBottom = rect.bottom;
	const trackHeight = Math.max(trackBottom - trackTop, 1);
	const thumbHeight = Math.min(
		Math.max((select.clientHeight / select.scrollHeight) * trackHeight, getSelectScrollLineHeight(select)),
		trackHeight,
	);

	return {
		trackTop,
		trackBottom,
		trackHeight,
		thumbHeight,
		thumbTravelHeight: Math.max(trackHeight - thumbHeight, 1),
	};
}

function getScrollbarDragRatio(select: HTMLSelectElement): number
{
	const scrollableHeight = select.scrollHeight - select.clientHeight;
	if (scrollableHeight <= 0)
	{
		return 0;
	}

	return scrollableHeight / getScrollbarTrackGeometry(select).thumbTravelHeight;
}

function getScrollbarTrackScrollDelta(select: HTMLSelectElement, clientY: number): number
{
	const geometry = getScrollbarTrackGeometry(select);
	if (clientY <= geometry.trackTop || clientY >= geometry.trackBottom)
	{
		return 0;
	}

	const scrollRatio = select.scrollTop / Math.max(select.scrollHeight - select.clientHeight, 1);
	const thumbTop = geometry.trackTop + scrollRatio * geometry.thumbTravelHeight;
	const thumbBottom = thumbTop + geometry.thumbHeight;
	if (clientY < thumbTop)
	{
		return -select.clientHeight;
	}

	if (clientY > thumbBottom)
	{
		return select.clientHeight;
	}

	return 0;
}

function scrollSelect(select: HTMLSelectElement, scrollTop: number): void
{
	select.scrollTop = Math.max(0, Math.min(scrollTop, select.scrollHeight - select.clientHeight));
}

function scrollSelectBy(select: HTMLSelectElement, delta: number): void
{
	scrollSelect(select, select.scrollTop + delta);
}

function bindBehaviorEvents(eventTarget: EventTarget, mouseDownHandler: Function): void
{
	MainEvent.bind(eventTarget, 'pointerdown', mouseDownHandler, true);
	MainEvent.bind(eventTarget, 'mousedown', mouseDownHandler, true);
}

function unbindBehaviorEvents(eventTarget: EventTarget, mouseDownHandler: Function): void
{
	MainEvent.unbind(eventTarget, 'pointerdown', mouseDownHandler, true);
	MainEvent.unbind(eventTarget, 'mousedown', mouseDownHandler, true);
}

export function isMultipleSelectScrollbarZone(select: HTMLSelectElement, clientX: number): boolean
{
	if (select.scrollHeight <= select.clientHeight)
	{
		return false;
	}

	const rect = select.getBoundingClientRect();
	const computedStyle = getComputedStyle(select);
	const scrollbarWidth = getEffectiveScrollbarWidth(select);
	if (computedStyle.direction === 'rtl')
	{
		const scrollbarRight = rect.left + getStyleNumber(computedStyle, 'border-left-width') + scrollbarWidth;

		return clientX >= rect.left && clientX <= scrollbarRight;
	}

	const scrollbarLeft = rect.right - getStyleNumber(computedStyle, 'border-right-width') - scrollbarWidth;

	return clientX >= scrollbarLeft && clientX <= rect.right;
}

export function handleMultipleSelectMouseDown(event: MouseEvent, options: MultipleSelectBehaviorOptions = {}): boolean
{
	const requireTrusted = options.requireTrusted !== false;
	if (!isPrimaryMouseDown(event, requireTrusted))
	{
		return false;
	}

	if (event.target instanceof HTMLElement && !isInsideRoots(event.target, options.roots ?? []))
	{
		return false;
	}

	const match = getMultipleSelectOptionFromMouseEvent(event);
	if (!match || isOptionDisabled(match.option))
	{
		return false;
	}

	if (!isInsideRoots(match.select, options.roots ?? []))
	{
		return false;
	}

	if (isMultipleSelectScrollbarZone(match.select, event.clientX))
	{
		return false;
	}

	const scrollTop = match.select.scrollTop;
	event.preventDefault();
	match.select.focus({ preventScroll: true });
	match.option.selected = !match.option.selected;
	match.select.dispatchEvent(new window.Event('change', { bubbles: true }));

	setTimeout(() => {
		match.select.scrollTop = scrollTop;
	}, 0);

	return true;
}

export function bindMultipleSelectBehavior(options: MultipleSelectBehaviorOptions = {}): Function
{
	const eventTarget = options.eventTarget ?? document;
	const roots = options.roots ?? [];
	const requireTrusted = options.requireTrusted !== false;
	const skipCompatibleMouseDown = createCompatibleMouseDownFilter();
	let scrollbarSession: ScrollbarSelectionSession | null = null;
	let pendingRestoreTimers: number[] = [];

	const cancelPendingSelectionRestore = () => {
		pendingRestoreTimers.forEach((timer) => clearTimeout(timer));
		pendingRestoreTimers = [];
	};

	const schedulePendingSelectionRestore = (snapshot: MultipleSelectSnapshot) => {
		cancelPendingSelectionRestore();
		pendingRestoreTimers = scheduleSelectionRestore(snapshot);
	};

	const cancelPendingSelectionRestoreOnSelectChange = (event: Event) => {
		if (scrollbarSession)
		{
			return;
		}

		const select = getMultipleSelectFromTarget(event.target);
		if (select && isInsideRoots(select, roots))
		{
			cancelPendingSelectionRestore();
		}
	};

	const stopScrollbarSession = () => {
		if (!scrollbarSession)
		{
			return;
		}

		const { select, snapshot, restoreHandler, scrollTimer } = scrollbarSession;
		scrollbarSession = null;
		if (scrollTimer !== null)
		{
			clearTimeout(scrollTimer);
		}
		MainEvent.unbind(select, 'input', restoreHandler, true);
		MainEvent.unbind(select, 'change', restoreHandler, true);
		schedulePendingSelectionRestore(snapshot);
	};

	const startScrollbarSession = (
		select: HTMLSelectElement,
		event: MouseEvent,
		mode: ScrollbarSelectionMode,
	) => {
		stopScrollbarSession();
		cancelPendingSelectionRestore();

		const snapshot = createSelectionSnapshot(select);
		const restoreHandler = (changeEvent: Event) => {
			schedulePendingSelectionRestore(snapshot);
			changeEvent.stopPropagation();
			if (Type.isFunction(changeEvent.stopImmediatePropagation))
			{
				changeEvent.stopImmediatePropagation();
			}
		};
		scrollbarSession = {
			select,
			snapshot,
			restoreHandler,
			startClientY: event.clientY,
			startScrollTop: select.scrollTop,
			scrollTimer: null,
			mode,
		};
		MainEvent.bind(select, 'input', restoreHandler, true);
		MainEvent.bind(select, 'change', restoreHandler, true);
	};

	const repeatTrackScroll = (select: HTMLSelectElement, clientY: number) => {
		const scrollTrack = (): boolean => {
			const delta = getScrollbarTrackScrollDelta(select, clientY);
			if (delta === 0)
			{
				if (scrollbarSession && scrollbarSession.scrollTimer !== null)
				{
					clearTimeout(scrollbarSession.scrollTimer);
					scrollbarSession.scrollTimer = null;
				}

				return false;
			}

			scrollSelectBy(select, delta);

			return true;
		};

		scrollTrack();
		if (scrollbarSession)
		{
			scrollbarSession.scrollTimer = setTimeout(() => {
				if (scrollTrack() && scrollbarSession)
				{
					scrollbarSession.scrollTimer = setInterval(scrollTrack, SCROLL_REPEAT_INTERVAL);
				}
			}, SCROLL_REPEAT_START_DELAY);
		}
	};

	const handleScrollbarMouseDown = (event: MouseEvent, select: HTMLSelectElement): boolean => {
		if (select.disabled || !isMultipleSelectScrollbarZone(select, event.clientX))
		{
			return false;
		}

		stopNativeScrollbarEvent(event);
		select.focus({ preventScroll: true });

		const trackDelta = getScrollbarTrackScrollDelta(select, event.clientY);
		if (trackDelta !== 0)
		{
			startScrollbarSession(select, event, 'track');
			repeatTrackScroll(select, event.clientY);

			return true;
		}

		startScrollbarSession(select, event, 'thumb');

		return true;
	};

	const mouseDownHandler = (event: Event) => {
		if (!(event instanceof MouseEvent))
		{
			return;
		}

		if (event.type === 'pointerdown')
		{
			skipCompatibleMouseDown(event);

			return;
		}

		if (skipCompatibleMouseDown(event) || !isPrimaryMouseDown(event, requireTrusted))
		{
			return;
		}

		const select = getMultipleSelectFromMouseEvent(event, roots);
		if (
			select
			&& handleScrollbarMouseDown(event, select)
		)
		{
			return;
		}

		cancelPendingSelectionRestore();
		handleMultipleSelectMouseDown(event, options);
	};

	const mouseMoveHandler = (event: Event) => {
		if (!(event instanceof MouseEvent) || !scrollbarSession)
		{
			return;
		}

		if (event.buttons === 0)
		{
			stopScrollbarSession();

			return;
		}

		if (scrollbarSession.mode !== 'thumb')
		{
			return;
		}

		stopNativeScrollbarEvent(event);
		const { select, startClientY, startScrollTop } = scrollbarSession;
		const deltaY = event.clientY - startClientY;
		scrollSelect(select, startScrollTop + deltaY * getScrollbarDragRatio(select));
	};

	bindBehaviorEvents(eventTarget, mouseDownHandler);
	MainEvent.bind(eventTarget, 'input', cancelPendingSelectionRestoreOnSelectChange, true);
	MainEvent.bind(eventTarget, 'change', cancelPendingSelectionRestoreOnSelectChange, true);
	MainEvent.bind(eventTarget, 'mousemove', mouseMoveHandler, true);
	MainEvent.bind(eventTarget, 'mouseup', stopScrollbarSession, true);
	MainEvent.bind(eventTarget, 'pointerup', stopScrollbarSession, true);
	MainEvent.bind(eventTarget, 'pointercancel', stopScrollbarSession, true);
	MainEvent.bind(window, 'blur', stopScrollbarSession);

	return () => {
		stopScrollbarSession();
		cancelPendingSelectionRestore();
		unbindBehaviorEvents(eventTarget, mouseDownHandler);
		MainEvent.unbind(eventTarget, 'input', cancelPendingSelectionRestoreOnSelectChange, true);
		MainEvent.unbind(eventTarget, 'change', cancelPendingSelectionRestoreOnSelectChange, true);
		MainEvent.unbind(eventTarget, 'mousemove', mouseMoveHandler, true);
		MainEvent.unbind(eventTarget, 'mouseup', stopScrollbarSession, true);
		MainEvent.unbind(eventTarget, 'pointerup', stopScrollbarSession, true);
		MainEvent.unbind(eventTarget, 'pointercancel', stopScrollbarSession, true);
		MainEvent.unbind(window, 'blur', stopScrollbarSession);
	};
}
