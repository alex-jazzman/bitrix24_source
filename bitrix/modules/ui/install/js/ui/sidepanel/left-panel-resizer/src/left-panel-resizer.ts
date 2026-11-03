import { Dom, Event, Type } from 'main.core';
import 'ui.design-tokens.air';

import { type LeftPanelResizerOptions, type LeftPanelResizerStorageOptions } from './types';

import './left-panel-resizer.css';

const SEPARATOR_CLASS = 'ui-sidepanel-left-panel-resizer';
const DRAGGING_CLASS = '--dragging';

type StoredWidth = {
	version: number,
	width: number,
};

type Gesture = {
	pointerId: number,
	startClientX: number,
	startPreferredWidth: number,
	startAppliedWidth: number,
	pendingPreferredWidth: number,
};

type AttributeSnapshot = Map<string, string | null>;

type InlineStyleSnapshot = {
	isSet: boolean,
	value: string,
	priority: string,
};

export class LeftPanelResizer
{
	static #instances: WeakMap<HTMLElement, LeftPanelResizer> = new WeakMap();

	#panel: HTMLElement;
	#separator: HTMLElement;
	#container: HTMLElement;
	#storageOptions: LeftPanelResizerStorageOptions | null;
	#initialWidth: number;
	#minWidth: number;
	#maxWidth: number;
	#minContentWidth: number;
	#keyboardStep: number;
	#preferredWidth: number;
	#appliedWidth: number;
	#gesture: Gesture | null = null;
	#resizeAnimationFrameId: number | null = null;
	#resizeObserver: ResizeObserver;
	#isDestroyed: boolean = false;
	#originalPanelWidth: InlineStyleSnapshot;
	#originalSeparatorAttributes: AttributeSnapshot;
	#hadSeparatorClass: boolean;
	#originalBodyCursor: InlineStyleSnapshot | null = null;
	#originalBodyUserSelect: InlineStyleSnapshot | null = null;
	#originalBodyWebkitUserSelect: InlineStyleSnapshot | null = null;

	constructor(options: LeftPanelResizerOptions)
	{
		LeftPanelResizer.#instances.get(options.separator)?.destroy();
		LeftPanelResizer.#instances.set(options.separator, this);

		this.#panel = options.panel;
		this.#separator = options.separator;
		this.#container = options.container;
		this.#storageOptions = options.STORAGE ?? null;
		this.#initialWidth = options.INITIAL_WIDTH;
		this.#minWidth = options.MIN_WIDTH;
		this.#maxWidth = options.MAX_WIDTH;
		this.#minContentWidth = options.MIN_CONTENT_WIDTH;
		this.#keyboardStep = options.KEYBOARD_STEP;
		this.#appliedWidth = this.#initialWidth;
		this.#originalPanelWidth = this.#getInlineStyleSnapshot(this.#panel, 'width');
		this.#originalSeparatorAttributes = this.#getSeparatorAttributeSnapshot();
		this.#hadSeparatorClass = Dom.hasClass(this.#separator, SEPARATOR_CLASS);
		this.#preferredWidth = this.#readPreferredWidth();

		this.#prepareSeparator(options.ACCESSIBLE_NAME);
		this.#bindEvents();
		this.#resizeObserver = new ResizeObserver(this.#handleContainerResize);
		this.#resizeObserver.observe(this.#container);
		this.#applyWidth(this.#preferredWidth);
	}

	destroy(): void
	{
		if (this.#isDestroyed)
		{
			return;
		}

		this.#isDestroyed = true;
		this.#cancelGesture();
		this.#unbindEvents();
		this.#resizeObserver.disconnect();
		this.#restoreInlineStyle(this.#panel, 'width', this.#originalPanelWidth);
		this.#restoreSeparator();

		if (LeftPanelResizer.#instances.get(this.#separator) === this)
		{
			LeftPanelResizer.#instances.delete(this.#separator);
		}
	}

	#prepareSeparator(accessibleName?: string): void
	{
		Dom.addClass(this.#separator, SEPARATOR_CLASS);
		Dom.attr(this.#separator, {
			role: 'separator',
			'aria-orientation': 'vertical',
			tabindex: '0',
		});

		if (Type.isStringFilled(accessibleName))
		{
			Dom.attr(this.#separator, 'aria-label', accessibleName);
		}

		if (Type.isStringFilled(this.#panel.id))
		{
			Dom.attr(this.#separator, 'aria-controls', this.#panel.id);
		}
	}

	#bindEvents(): void
	{
		Event.bind(this.#separator, 'pointerdown', this.#handlePointerDown);
		Event.bind(this.#separator, 'pointermove', this.#handlePointerMove);
		Event.bind(this.#separator, 'pointerup', this.#handlePointerUp);
		Event.bind(this.#separator, 'pointercancel', this.#handlePointerCancel);
		Event.bind(this.#separator, 'lostpointercapture', this.#handleLostPointerCapture);
		Event.bind(this.#separator, 'keydown', this.#handleKeyDown);
	}

	#unbindEvents(): void
	{
		Event.unbind(this.#separator, 'pointerdown', this.#handlePointerDown);
		Event.unbind(this.#separator, 'pointermove', this.#handlePointerMove);
		Event.unbind(this.#separator, 'pointerup', this.#handlePointerUp);
		Event.unbind(this.#separator, 'pointercancel', this.#handlePointerCancel);
		Event.unbind(this.#separator, 'lostpointercapture', this.#handleLostPointerCapture);
		Event.unbind(this.#separator, 'keydown', this.#handleKeyDown);
	}

	#handlePointerDown = (event: PointerEvent): void => {
		if (this.#gesture !== null || event.button !== 0 || !event.isPrimary)
		{
			return;
		}

		try
		{
			this.#separator.setPointerCapture(event.pointerId);
		}
		catch
		{
			return;
		}

		this.#gesture = {
			pointerId: event.pointerId,
			startClientX: event.clientX,
			startPreferredWidth: this.#preferredWidth,
			startAppliedWidth: this.#appliedWidth,
			pendingPreferredWidth: this.#preferredWidth,
		};
		Dom.addClass(this.#separator, DRAGGING_CLASS);
		this.#applyDraggingStyles();
		event.preventDefault();
	};

	#handlePointerMove = (event: PointerEvent): void => {
		if (event.pointerId !== this.#gesture?.pointerId)
		{
			return;
		}

		this.#gesture.pendingPreferredWidth = this.#getGestureWidth(event.clientX);
		this.#scheduleGestureWidthUpdate();
	};

	#handlePointerUp = (event: PointerEvent): void => {
		if (event.pointerId !== this.#gesture?.pointerId)
		{
			return;
		}

		const preferredWidth = this.#getGestureWidth(event.clientX);
		const pointerId = this.#gesture.pointerId;
		this.#cancelScheduledWidthUpdate();
		this.#gesture = null;
		this.#releasePointerCapture(pointerId);
		this.#restoreDraggingStyles();
		this.#commit(preferredWidth);
	};

	#handlePointerCancel = (event: PointerEvent): void => {
		if (event.pointerId === this.#gesture?.pointerId)
		{
			this.#cancelGesture();
		}
	};

	#handleLostPointerCapture = (event: PointerEvent): void => {
		if (event.pointerId === this.#gesture?.pointerId)
		{
			this.#cancelGesture();
		}
	};

	#handleKeyDown = (event: KeyboardEvent): void => {
		if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight')
		{
			return;
		}

		const direction = event.key === 'ArrowLeft' ? -1 : 1;
		this.#commit(this.#appliedWidth + (direction * this.#keyboardStep));
		event.preventDefault();
	};

	#handleContainerResize = (): void => {
		this.#applyWidth(this.#gesture?.pendingPreferredWidth ?? this.#preferredWidth);
	};

	#scheduleGestureWidthUpdate(): void
	{
		if (this.#resizeAnimationFrameId !== null)
		{
			return;
		}

		this.#resizeAnimationFrameId = window.requestAnimationFrame(() => {
			this.#resizeAnimationFrameId = null;

			if (this.#gesture !== null && !this.#isDestroyed)
			{
				this.#applyWidth(this.#gesture.pendingPreferredWidth);
			}
		});
	}

	#cancelScheduledWidthUpdate(): void
	{
		if (this.#resizeAnimationFrameId === null)
		{
			return;
		}

		window.cancelAnimationFrame(this.#resizeAnimationFrameId);
		this.#resizeAnimationFrameId = null;
	}

	#getGestureWidth(clientX: number): number
	{
		if (this.#gesture === null)
		{
			return this.#preferredWidth;
		}

		const delta = clientX - this.#gesture.startClientX;
		if (delta === 0)
		{
			return this.#gesture.startPreferredWidth;
		}

		return this.#normalizePreferredWidth(this.#gesture.startAppliedWidth + delta);
	}

	#commit(width: number): void
	{
		this.#preferredWidth = this.#normalizePreferredWidth(width);
		this.#applyWidth(this.#preferredWidth);
		this.#savePreferredWidth();
	}

	#cancelGesture(): void
	{
		this.#cancelScheduledWidthUpdate();

		if (this.#gesture === null)
		{
			Dom.removeClass(this.#separator, DRAGGING_CLASS);

			return;
		}

		const pointerId = this.#gesture.pointerId;
		this.#gesture = null;
		this.#releasePointerCapture(pointerId);
		this.#restoreDraggingStyles();
		this.#applyWidth(this.#preferredWidth);
	}

	#releasePointerCapture(pointerId: number): void
	{
		if (this.#separator.hasPointerCapture(pointerId))
		{
			this.#separator.releasePointerCapture(pointerId);
		}
	}

	#applyDraggingStyles(): void
	{
		this.#originalBodyCursor = this.#getInlineStyleSnapshot(document.body, 'cursor');
		this.#originalBodyUserSelect = this.#getInlineStyleSnapshot(document.body, 'user-select');
		this.#originalBodyWebkitUserSelect = this.#getInlineStyleSnapshot(document.body, '-webkit-user-select');
		Dom.style(document.body, {
			cursor: 'col-resize',
			'user-select': 'none',
			'-webkit-user-select': 'none',
		});
	}

	#restoreDraggingStyles(): void
	{
		Dom.removeClass(this.#separator, DRAGGING_CLASS);
		const bodyCursor = this.#originalBodyCursor;
		const bodyUserSelect = this.#originalBodyUserSelect;
		const bodyWebkitUserSelect = this.#originalBodyWebkitUserSelect;

		if (
			bodyCursor === null
			|| bodyUserSelect === null
			|| bodyWebkitUserSelect === null
		)
		{
			return;
		}

		this.#restoreInlineStyles(document.body, new Map([
			['cursor', bodyCursor],
			['user-select', bodyUserSelect],
			['-webkit-user-select', bodyWebkitUserSelect],
		]));
		this.#originalBodyCursor = null;
		this.#originalBodyUserSelect = null;
		this.#originalBodyWebkitUserSelect = null;
	}

	#applyWidth(preferredWidth: number): void
	{
		const effectiveMax = Math.max(
			this.#minWidth,
			Math.min(this.#maxWidth, this.#container.getBoundingClientRect().width - this.#minContentWidth),
		);

		this.#appliedWidth = this.#clamp(preferredWidth, this.#minWidth, effectiveMax);
		Dom.style(this.#panel, 'width', `${this.#appliedWidth}px`);
		Dom.attr(this.#separator, {
			'aria-valuemin': String(this.#minWidth),
			'aria-valuemax': String(Math.round(effectiveMax)),
			'aria-valuenow': String(Math.round(this.#appliedWidth)),
		});
	}

	#readPreferredWidth(): number
	{
		if (this.#storageOptions === null)
		{
			return this.#initialWidth;
		}

		try
		{
			const serializedValue = window.localStorage.getItem(this.#storageOptions.KEY);
			if (serializedValue === null)
			{
				return this.#initialWidth;
			}

			const payload: unknown = JSON.parse(serializedValue);
			if (!Type.isPlainObject(payload))
			{
				return this.#initialWidth;
			}

			const storedWidth = payload as StoredWidth;
			if (
				storedWidth.version !== this.#storageOptions.VERSION
				|| !Type.isInteger(storedWidth.width)
			)
			{
				return this.#initialWidth;
			}

			return this.#normalizePreferredWidth(storedWidth.width);
		}
		catch
		{
			return this.#initialWidth;
		}
	}

	#savePreferredWidth(): void
	{
		if (this.#storageOptions === null)
		{
			return;
		}

		try
		{
			window.localStorage.setItem(
				this.#storageOptions.KEY,
				JSON.stringify({
					version: this.#storageOptions.VERSION,
					width: this.#preferredWidth,
				}),
			);
		}
		catch
		{
			// Storage is optional; resizing remains available for the current session.
		}
	}

	#normalizePreferredWidth(width: number): number
	{
		return this.#clamp(Math.round(width), this.#minWidth, this.#maxWidth);
	}

	#clamp(value: number, min: number, max: number): number
	{
		return Math.max(min, Math.min(max, value));
	}

	#getInlineStyleSnapshot(element: HTMLElement, property: string): InlineStyleSnapshot
	{
		const { style } = element;
		let isSet = false;
		for (let index = 0; index < style.length; index++)
		{
			if (style.item(index) === property)
			{
				isSet = true;
				break;
			}
		}

		return {
			isSet,
			value: style.getPropertyValue(property),
			priority: style.getPropertyPriority(property),
		};
	}

	#restoreInlineStyle(element: HTMLElement, property: string, snapshot: InlineStyleSnapshot): void
	{
		this.#restoreInlineStyles(element, new Map([[property, snapshot]]));
	}

	#restoreInlineStyles(element: HTMLElement, snapshots: Map<string, InlineStyleSnapshot>): void
	{
		const draft = document.createElement('div');
		const currentStyle = Dom.attr(element, 'style');
		if (Type.isStringFilled(currentStyle))
		{
			Dom.attr(draft, 'style', currentStyle);
		}

		const { style } = draft;
		[...snapshots.keys()].forEach((property) => style.removeProperty(property));
		snapshots.forEach((snapshot, property) => {
			if (snapshot.isSet)
			{
				style.setProperty(property, snapshot.value, snapshot.priority);
			}
		});

		const restoredStyle = Dom.attr(draft, 'style');
		Dom.attr(element, 'style', Type.isStringFilled(restoredStyle) ? restoredStyle : null);
	}

	#getSeparatorAttributeSnapshot(): AttributeSnapshot
	{
		return new Map([
			['role', this.#separator.getAttribute('role')],
			['aria-orientation', this.#separator.getAttribute('aria-orientation')],
			['aria-label', this.#separator.getAttribute('aria-label')],
			['aria-controls', this.#separator.getAttribute('aria-controls')],
			['aria-valuemin', this.#separator.getAttribute('aria-valuemin')],
			['aria-valuemax', this.#separator.getAttribute('aria-valuemax')],
			['aria-valuenow', this.#separator.getAttribute('aria-valuenow')],
			['tabindex', this.#separator.getAttribute('tabindex')],
		]);
	}

	#restoreSeparator(): void
	{
		this.#originalSeparatorAttributes.forEach((value, name) => {
			if (value === null)
			{
				this.#separator.removeAttribute(name);
			}
			else
			{
				this.#separator.setAttribute(name, value);
			}
		});

		if (!this.#hadSeparatorClass)
		{
			Dom.removeClass(this.#separator, SEPARATOR_CLASS);
		}
	}
}
