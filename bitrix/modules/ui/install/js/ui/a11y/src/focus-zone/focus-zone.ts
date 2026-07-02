import { Browser, Event, Type, Text } from 'main.core';

import { FocusNavigator, type FocusNavigatorOptions } from '../focus-navigator/focus-navigator';
import { FocusMonitor } from '../focus-monitor/focus-monitor';
import { AccessibilityLogger } from '../accessibility-logger/accessibility-logger';

import { FocusKeys } from './keys';
import { type FocusZoneOptions, type FocusZoneDirection } from './types';

export const ActiveDescendant = {
	/** Attribute set on the currently active descendant element. */
	ELEMENT_ATTR: 'data-active-descendant',
	/** Attribute set on the container when it has an active descendant. */
	CONTAINER_ATTR: 'data-has-active-descendant',
	/** Activated by explicit keyboard navigation (`:focus-visible` equivalent). */
	EXPLICIT: 'activated-by-keyboard',
	/** Activated implicitly: initialization, DOM mutation, mouseover. */
	IMPLICIT: 'activated-by-other',
} as const;

const KEY_TO_BIT: Readonly<Record<string, number | undefined>> = {
	ArrowLeft: FocusKeys.ArrowHorizontal,
	ArrowDown: FocusKeys.ArrowVertical,
	ArrowUp: FocusKeys.ArrowVertical,
	ArrowRight: FocusKeys.ArrowHorizontal,
	h: FocusKeys.HL,
	j: FocusKeys.JK,
	k: FocusKeys.JK,
	l: FocusKeys.HL,
	a: FocusKeys.AD,
	s: FocusKeys.WS,
	w: FocusKeys.WS,
	d: FocusKeys.AD,
	Tab: FocusKeys.Tab,
	Home: FocusKeys.HomeAndEnd,
	End: FocusKeys.HomeAndEnd,
	PageUp: FocusKeys.PageUpDown,
	PageDown: FocusKeys.PageUpDown,
	Backspace: FocusKeys.Backspace,
};

const KEY_TO_DIRECTION: Readonly<Record<string, FocusZoneDirection>> = {
	ArrowLeft: 'previous',
	ArrowDown: 'next',
	ArrowUp: 'previous',
	ArrowRight: 'next',
	h: 'previous',
	j: 'next',
	k: 'previous',
	l: 'next',
	a: 'previous',
	s: 'next',
	w: 'previous',
	d: 'next',
	Tab: 'next',
	Home: 'start',
	End: 'end',
	PageUp: 'start',
	PageDown: 'end',
	Backspace: 'previous',
};

const NON_EDITABLE_INPUT_TYPES: Set<string> = new Set([
	'button',
	'checkbox',
	'file',
	'hidden',
	'image',
	'radio',
	'range',
	'reset',
	'submit',
]);

/**
 * Manages arrow-key (and other configurable key) focus navigation among
 * focusable elements within a container.
 *
 * Supports two focus models:
 * - **Roving tabindex** (default): moves real DOM focus between elements and
 *   maintains a single `tabindex="0"` entry point.
 * - **Active descendant**: keeps DOM focus on a control element and manages
 *   `aria-activedescendant` on that control.
 *
 * @memberof BX.UI.Accessibility
 */
export class FocusZone
{
	readonly #container: HTMLElement;
	#options: FocusZoneOptions;
	#active: boolean = false;

	readonly #bindKeys: number;
	readonly #focusOutBehavior: string;
	readonly #focusInStrategy: FocusZoneOptions['focusInStrategy'];
	readonly #preventScroll: boolean;
	readonly #ignoreHoverEvents: boolean;
	readonly #tabbableOnly: boolean;

	#elementSet: Set<HTMLElement> = new Set();
	#savedTabIndex: WeakMap<HTMLElement, string | null> = new WeakMap();
	#currentFocusedElement: HTMLElement | null = null;

	readonly #activeDescendantControl: HTMLElement | null = null;
	#observer: MutationObserver | null = null;
	#syncFrameId: number | null = null;
	#bindings: Array<[EventTarget, string, EventListenerOrEventListenerObject, boolean]> = [];
	#generatedContainerId: boolean = false;
	readonly #generatedElementIds: WeakSet<HTMLElement> = new WeakSet();

	readonly #keyDownHandler = this.#handleKeyDown.bind(this);
	readonly #focusInHandler = this.#handleFocusIn.bind(this);
	readonly #mouseMoveHandler = this.#handleMouseMove.bind(this);
	readonly #controlFocusInHandler = this.#handleControlFocusIn.bind(this);
	readonly #controlFocusOutHandler = this.#handleControlFocusOut.bind(this);

	constructor(container: HTMLElement, options: FocusZoneOptions = {})
	{
		this.#container = container;
		this.#options = Type.isPlainObject(options) ? options : {};

		this.#activeDescendantControl = this.#options.activeDescendantControl ?? null;
		this.#focusOutBehavior = this.#options.focusOutBehavior ?? 'stop';
		this.#focusInStrategy = this.#options.focusInStrategy ?? 'previous';
		this.#preventScroll = this.#options.preventScroll ?? false;
		this.#ignoreHoverEvents = this.#options.ignoreHoverEvents ?? false;
		this.#tabbableOnly = this.#options.tabbableOnly ?? false;

		this.#bindKeys = this.#options.bindKeys
			?? (
				(this.#options.getNextFocusable ? FocusKeys.ArrowAll : FocusKeys.ArrowVertical)
				| FocusKeys.HomeAndEnd
			)
		;
	}

	static enableDebug(): void
	{
		AccessibilityLogger.enable('focus-zone');
	}

	static disableDebug(): void
	{
		AccessibilityLogger.disable('focus-zone');
	}

	activate(): void
	{
		if (this.#active)
		{
			return;
		}

		this.#active = true;

		// Collect and manage focusable elements
		this.#elementSet = this.#collectFocusableSet();

		for (const element of this.#elementSet)
		{
			this.#saveAndSetTabIndex(element);
		}

		// Set up aria-controls when using active descendant model
		if (this.#activeDescendantControl)
		{
			if (!this.#container.id)
			{
				this.#container.setAttribute('id', `fz-${Text.getRandom()}`);
				this.#generatedContainerId = true;
			}

			this.#activeDescendantControl.setAttribute('aria-controls', this.#container.id);
		}

		// Set initial focused element
		const preventInitialFocus = this.#focusInStrategy === 'initial' && this.#activeDescendantControl;
		if (!preventInitialFocus)
		{
			this.#updateFocusedElement(this.#resolveInitialFocusedElement());
		}

		this.#attachEventListeners();
		this.#attachObserver();

		AccessibilityLogger.log('focus-zone', `activated with ${this.#elementSet.size} elements`);
	}

	deactivate(): void
	{
		if (!this.#active)
		{
			return;
		}

		this.#active = false;

		if (this.#observer)
		{
			this.#observer.disconnect();
			this.#observer = null;
		}

		if (this.#syncFrameId !== null)
		{
			cancelAnimationFrame(this.#syncFrameId);
			this.#syncFrameId = null;
		}

		this.#detachEventListeners();

		for (const element of this.#elementSet)
		{
			this.#restoreTabIndex(element);

			if (this.#generatedElementIds.has(element))
			{
				element.removeAttribute('id');
				this.#generatedElementIds.delete(element);
			}
		}

		if (this.#activeDescendantControl)
		{
			this.#clearActiveDescendant();
			this.#activeDescendantControl.removeAttribute('aria-controls');
		}

		if (this.#generatedContainerId)
		{
			this.#container.removeAttribute('id');
			this.#generatedContainerId = false;
		}

		this.#elementSet.clear();
		this.#currentFocusedElement = null;

		AccessibilityLogger.log('focus-zone', 'deactivated');
	}

	isActive(): boolean
	{
		return this.#active;
	}

	getCurrentFocusedElement(): HTMLElement | null
	{
		return this.#currentFocusedElement;
	}

	refreshElements(): void
	{
		if (this.#active)
		{
			this.#syncFocusableElements();
		}
	}

	#collectFocusableSet(): Set<HTMLElement>
	{
		const elements: Set<HTMLElement> = new Set();
		const walker = FocusNavigator.createWalker(this.#container, {
			tabbableOnly: this.#tabbableOnly,
			accept: this.#options.focusableElementFilter,
		});

		for (let node = walker.nextNode(); node !== null; node = walker.nextNode())
		{
			elements.add(node as HTMLElement);
		}

		return elements;
	}

	#getNavigatorOptions(from: HTMLElement | null = null, wrap: boolean = false): FocusNavigatorOptions
	{
		return {
			from: from ?? undefined,
			tabbableOnly: false,
			accept: (el: HTMLElement): boolean => this.#elementSet.has(el),
			wrap,
		};
	}

	#findManagedAncestor(node: Node): HTMLElement | null
	{
		let el = Type.isElementNode(node) ? node as HTMLElement : node.parentElement;
		while (el && el !== this.#container)
		{
			if (this.#elementSet.has(el))
			{
				return el;
			}

			el = el.parentElement;
		}

		return null;
	}

	#saveAndSetTabIndex(element: HTMLElement): void
	{
		if (!this.#savedTabIndex.has(element))
		{
			this.#savedTabIndex.set(element, element.getAttribute('tabindex'));
		}

		element.setAttribute('tabindex', '-1');
	}

	#restoreTabIndex(element: HTMLElement): void
	{
		const savedIndex = this.#savedTabIndex.get(element);
		if (savedIndex !== undefined)
		{
			if (savedIndex === null)
			{
				element.removeAttribute('tabindex');
			}
			else
			{
				element.setAttribute('tabindex', savedIndex);
			}

			this.#savedTabIndex.delete(element);
		}
	}

	#updateFocusedElement(to: HTMLElement | null = null, directlyActivated: boolean = false): void
	{
		const from = this.#currentFocusedElement;
		this.#currentFocusedElement = to;

		if (this.#activeDescendantControl)
		{
			if (to && FocusNavigator.getActiveElement() === this.#activeDescendantControl)
			{
				this.#setActiveDescendant(from, to, directlyActivated);
			}
			else
			{
				this.#clearActiveDescendant();
			}

			return;
		}

		// Roving tabindex: previous element → tabindex=-1, new element → tabindex=0
		if (from && from !== to && this.#savedTabIndex.has(from))
		{
			from.setAttribute('tabindex', '-1');
		}

		if (to)
		{
			to.setAttribute('tabindex', '0');
		}
	}

	#setActiveDescendant(from: HTMLElement | null, to: HTMLElement, directlyActivated: boolean = false): void
	{
		if (!to.id)
		{
			to.setAttribute('id', `fz-${Text.getRandom()}`);
			this.#generatedElementIds.add(to);
		}

		if (from && from !== to)
		{
			from.removeAttribute(ActiveDescendant.ELEMENT_ATTR);
		}

		// Avoid redundant updates when the same element is activated indirectly
		if (!this.#activeDescendantControl)
		{
			return;
		}

		const previousId = this.#activeDescendantControl.getAttribute('aria-activedescendant');
		const nextActivationMode = directlyActivated
			? ActiveDescendant.EXPLICIT
			: ActiveDescendant.IMPLICIT;
		const currentActivationMode = to.getAttribute(ActiveDescendant.ELEMENT_ATTR);

		if (previousId === to.id && currentActivationMode === nextActivationMode)
		{
			return;
		}

		this.#activeDescendantControl.setAttribute('aria-activedescendant', to.id);
		this.#container.setAttribute(ActiveDescendant.CONTAINER_ATTR, to.id);

		to.setAttribute(
			ActiveDescendant.ELEMENT_ATTR,
			nextActivationMode,
		);

		AccessibilityLogger.logNode('focus-zone', 'active descendant ->', to);

		this.#options.onActiveDescendantChanged?.(to, from, directlyActivated);
	}

	#clearActiveDescendant(previousElement: HTMLElement | null = this.#currentFocusedElement): void
	{
		if (this.#focusInStrategy === 'first')
		{
			this.#currentFocusedElement = null;
		}

		this.#activeDescendantControl?.removeAttribute('aria-activedescendant');
		this.#container.removeAttribute(ActiveDescendant.CONTAINER_ATTR);

		if (previousElement)
		{
			previousElement.removeAttribute(ActiveDescendant.ELEMENT_ATTR);
		}

		// Clear stale markers from any other elements
		const stale = this.#container.querySelectorAll(`[${ActiveDescendant.ELEMENT_ATTR}]`);
		for (const element of stale)
		{
			element.removeAttribute(ActiveDescendant.ELEMENT_ATTR);
		}

		this.#options.onActiveDescendantChanged?.(null, previousElement, false);
	}

	#handleKeyDown(event: KeyboardEvent): void
	{
		const keyBit = KEY_TO_BIT[event.key];
		if (keyBit === undefined || this.#elementSet.size === 0)
		{
			return;
		}

		if (
			event.defaultPrevented
			|| (keyBit & this.#bindKeys) === 0
			|| FocusZone.#isNativeInputKey(event, FocusNavigator.getActiveElement())
		)
		{
			return;
		}

		const direction = FocusZone.#getDirection(event);
		let nextElement: HTMLElement | null = null;

		// Try custom callback first
		if (this.#options.getNextFocusable)
		{
			nextElement = this.#options.getNextFocusable(
				direction,
				FocusNavigator.getActiveElement() ?? null,
				event,
			);
		}

		if (!nextElement)
		{
			const wrap = this.#focusOutBehavior === 'wrap' && event.key !== 'Tab';
			const navOptions = this.#getNavigatorOptions(this.#currentFocusedElement, wrap);

			switch (direction)
			{
				case 'previous':
				{
					nextElement = FocusNavigator.getPrevious(this.#container, navOptions);

					break;
				}

				case 'next':
				{
					nextElement = FocusNavigator.getNext(this.#container, navOptions);

					break;
				}

				case 'start':
				{
					nextElement = FocusNavigator.getFirst(this.#container, navOptions);

					break;
				}

				default:
				{
					nextElement = FocusNavigator.getLast(this.#container, navOptions);
				}
			}
		}

		if (this.#activeDescendantControl)
		{
			this.#updateFocusedElement(nextElement || this.#currentFocusedElement, true);
		}
		else if (nextElement)
		{
			// updateFocusedElement will be called from the focusin handler
			nextElement.focus({ preventScroll: this.#preventScroll });
		}

		// Tab should always allow escaping from this container, so only
		// preventDefault if tab key press already resulted in a focus movement
		if (event.key !== 'Tab' || nextElement)
		{
			event.preventDefault();
		}
	}

	#handleFocusIn(event: FocusEvent): void
	{
		if (!Type.isElementNode(event.target))
		{
			return;
		}

		if (this.#activeDescendantControl)
		{
			this.#handleFocusInActiveDescendant(event);
		}
		else
		{
			this.#handleFocusInRovingTabindex(event);
		}
	}

	#handleFocusInActiveDescendant(event: FocusEvent): void
	{
		const target = event.target as HTMLElement;
		if (this.#elementSet.has(target))
		{
			this.#activeDescendantControl?.focus({ preventScroll: this.#preventScroll });
			this.#updateFocusedElement(target);
		}
	}

	#handleFocusInRovingTabindex(event: FocusEvent): void
	{
		const target = event.target as HTMLElement;
		const tracker = FocusMonitor.Instance.getModalityTracker();
		const isPointerFocus = tracker.getLastModality() === 'pointer';

		if (isPointerFocus)
		{
			if (this.#elementSet.has(target))
			{
				this.#updateFocusedElement(target);
			}

			return;
		}

		if (!this.#elementSet.has(target))
		{
			return;
		}

		if (this.#focusInStrategy === 'previous')
		{
			this.#updateFocusedElement(target);
		}
		else if (this.#focusInStrategy === 'closest' || this.#focusInStrategy === 'first')
		{
			if (this.#isFocusEnteringFromOutside(event.relatedTarget))
			{
				const targetElement = this.#getEntryFocusedElement();
				if (targetElement)
				{
					targetElement.focus({ preventScroll: this.#preventScroll });
				}

				return;
			}

			this.#updateFocusedElement(target);
		}
		else if (Type.isFunction(this.#focusInStrategy))
		{
			if (this.#isFocusEnteringFromOutside(event.relatedTarget))
			{
				const elementToFocus = (this.#focusInStrategy as Function)(event.relatedTarget as HTMLElement);
				if (elementToFocus && this.#elementSet.has(elementToFocus))
				{
					elementToFocus.focus({ preventScroll: this.#preventScroll });

					return;
				}

				AccessibilityLogger.warn(
					'focus-zone',
					'focusInStrategy returned an element outside the managed focus set.',
				);
			}

			this.#updateFocusedElement(target);
		}
	}

	#resolveInitialFocusedElement(): HTMLElement | null
	{
		if (Type.isFunction(this.#focusInStrategy))
		{
			const element = (this.#focusInStrategy as Function)(this.#currentFocusedElement);

			return element && this.#elementSet.has(element) ? element : null;
		}

		return FocusNavigator.getFirst(this.#container, this.#getNavigatorOptions());
	}

	#getEntryFocusedElement(): HTMLElement | null
	{
		const navOptions = this.#getNavigatorOptions();

		return FocusMonitor.Instance.getModalityTracker().isLastNavigationReversed()
			? FocusNavigator.getLast(this.#container, navOptions)
			: FocusNavigator.getFirst(this.#container, navOptions);
	}

	#isFocusEnteringFromOutside(relatedTarget: EventTarget | null): relatedTarget is HTMLElement
	{
		return Type.isElementNode(relatedTarget) && !this.#container.contains(relatedTarget as HTMLElement);
	}

	#handleMouseMove(event: MouseEvent): void
	{
		const { target } = event;
		if (!Type.isElementNode(target))
		{
			return;
		}

		const managedElement = this.#findManagedAncestor(target as Node);
		if (managedElement)
		{
			this.#updateFocusedElement(managedElement);
		}
	}

	#handleControlFocusIn(): void
	{
		const preventInitialFocus = this.#focusInStrategy === 'initial' && this.#activeDescendantControl;
		if (this.#currentFocusedElement)
		{
			this.#setActiveDescendant(null, this.#currentFocusedElement);
		}
		else if (!preventInitialFocus)
		{
			this.#updateFocusedElement(
				FocusNavigator.getFirst(this.#container, this.#getNavigatorOptions()),
			);
		}
	}

	#handleControlFocusOut(): void
	{
		this.#clearActiveDescendant();
	}

	#listen<K extends keyof HTMLElementEventMap>(
		target: EventTarget,
		eventName: K,
		handler: (event: HTMLElementEventMap[K]) => void,
		capture?: boolean,
	): void

	#listen(
		target: EventTarget,
		event: string,
		handler: EventListener,
		capture?: boolean,
	): void

	#listen(
		target: EventTarget,
		event: string,
		handler: EventListener,
		capture: boolean = false,
	): void
	{
		Event.bind(target, event, handler, capture);
		this.#bindings.push([target, event, handler, capture]);
	}

	#attachEventListeners(): void
	{
		const keyboardTarget = this.#activeDescendantControl ?? this.#container;
		this.#listen(keyboardTarget, 'keydown', this.#keyDownHandler);
		this.#listen(this.#container, 'focusin', this.#focusInHandler);

		if (this.#activeDescendantControl)
		{
			if (!this.#ignoreHoverEvents)
			{
				this.#listen(this.#container, 'mousemove', this.#mouseMoveHandler, true);
			}

			this.#listen(this.#activeDescendantControl, 'focusin', this.#controlFocusInHandler);
			this.#listen(this.#activeDescendantControl, 'focusout', this.#controlFocusOutHandler);
		}
	}

	#detachEventListeners(): void
	{
		for (const [target, event, handler, capture] of this.#bindings)
		{
			Event.unbind(target, event, handler, capture);
		}

		this.#bindings = [];
	}

	#attachObserver(): void
	{
		this.#observer = new MutationObserver(() => {
			this.#scheduleSyncFocusableElements();
		});

		this.#observer.observe(this.#container, {
			attributes: true,
			subtree: true,
			childList: true,
			attributeFilter: ['hidden', 'disabled', 'tabindex', 'inert', 'contenteditable', 'aria-disabled'],
		});
	}

	#scheduleSyncFocusableElements(): void
	{
		if (!this.#active || this.#syncFrameId !== null)
		{
			return;
		}

		this.#syncFrameId = requestAnimationFrame(() => {
			this.#syncFrameId = null;
			this.#syncFocusableElements();
		});
	}

	#syncFocusableElements(): void
	{
		if (!this.#active)
		{
			return;
		}

		const newSet = this.#collectFocusableSet();
		const oldSet = this.#elementSet;

		// Restore tabindex for elements that are no longer managed
		for (const element of oldSet)
		{
			if (!newSet.has(element))
			{
				this.#restoreTabIndex(element);
			}
		}

		// Save and set tabindex for newly discovered elements
		for (const element of newSet)
		{
			if (!oldSet.has(element))
			{
				this.#saveAndSetTabIndex(element);
			}
		}

		this.#elementSet = newSet;

		// Handle current focused element being removed
		if (this.#currentFocusedElement && !newSet.has(this.#currentFocusedElement))
		{
			this.#updateFocusedElement(
				FocusNavigator.getFirst(this.#container, this.#getNavigatorOptions()),
			);
		}
		else if (!this.#currentFocusedElement && newSet.size > 0)
		{
			const preventInitialFocus = this.#focusInStrategy === 'initial' && this.#activeDescendantControl;
			if (!preventInitialFocus)
			{
				this.#updateFocusedElement(
					FocusNavigator.getFirst(this.#container, this.#getNavigatorOptions()),
				);
			}
		}
	}

	static #getDirection(event: KeyboardEvent): FocusZoneDirection
	{
		const direction = KEY_TO_DIRECTION[event.key];

		if (event.key === 'Tab' && event.shiftKey)
		{
			return 'previous';
		}

		const isMac = Browser.isMac();
		if ((isMac && event.metaKey) || (!isMac && event.ctrlKey))
		{
			if (event.key === 'ArrowLeft' || event.key === 'ArrowUp')
			{
				return 'start';
			}

			if (event.key === 'ArrowRight' || event.key === 'ArrowDown')
			{
				return 'end';
			}
		}

		return direction;
	}

	static #isEditableElement(element: HTMLElement | null): boolean
	{
		if (!Type.isElementNode(element))
		{
			return false;
		}

		const el = element as HTMLElement;

		if (el.tagName === 'INPUT')
		{
			return !NON_EDITABLE_INPUT_TYPES.has((element as HTMLInputElement).type);
		}

		if (el.tagName === 'TEXTAREA' || el.tagName === 'SELECT')
		{
			return true;
		}

		return el.isContentEditable;
	}

	/**
	 * Determines whether the key event is intended for native input behavior
	 * (text editing, cursor movement, dropdown opening) and should not be
	 * intercepted for focus navigation.
	 */
	static #isNativeInputKey(event: KeyboardEvent, activeElement: HTMLElement | null): boolean
	{
		const { key, metaKey, altKey } = event;

		// Check if key is a single printable character (handles surrogate pairs)

		const codePoint = key.codePointAt(0) ?? 0;
		const isSingleChar = (
			key.length === 1
			|| (key.length === 2 && codePoint >= 0xD800 && codePoint <= 0xDBFF)
		);

		const isEditable = FocusZone.#isEditableElement(activeElement);
		const isSelect = activeElement?.tagName === 'SELECT';

		// Printable characters and Home/End should not affect focus in editable elements
		if (isEditable && (isSingleChar || key === 'Home' || key === 'End'))
		{
			return true;
		}

		if (isSelect)
		{
			const isMac = Browser.isMac();

			// macOS: bare ArrowDown opens the select
			if (key === 'ArrowDown' && isMac && !metaKey)
			{
				return true;
			}

			// Other platforms: Alt+ArrowDown opens the select
			return key === 'ArrowDown' && !isMac && altKey;
		}

		// Text input / textarea / contenteditable handling
		if (isEditable)
		{
			const isInputElement = activeElement?.tagName === 'TEXTAREA' || activeElement?.tagName === 'INPUT';
			const inputEl = activeElement as HTMLInputElement | HTMLTextAreaElement;

			const cursorAtStart = (
				isInputElement
				&& inputEl.selectionStart === 0
				&& inputEl.selectionEnd === 0
			);

			const cursorAtEnd = (
				isInputElement
				&& inputEl.selectionStart === inputEl.value.length
				&& inputEl.selectionEnd === inputEl.value.length
			);

			// Only move focus left/right when cursor is at boundary
			if (key === 'ArrowLeft' && !cursorAtStart)
			{
				return true;
			}

			if (key === 'ArrowRight' && !cursorAtEnd)
			{
				return true;
			}

			const isContentEditable = (
				Type.isElementNode(activeElement) && (activeElement as ElementContentEditable).isContentEditable
			);

			// Multiline inputs (textarea, contenteditable)
			if (activeElement?.tagName === 'TEXTAREA' || isContentEditable)
			{
				// Always ignore page navigation inside multiline elements
				if (key === 'PageUp' || key === 'PageDown')
				{
					return true;
				}

				// Only move focus up/down when cursor is at boundary
				if (key === 'ArrowUp' && !cursorAtStart)
				{
					return true;
				}

				if (key === 'ArrowDown' && !cursorAtEnd)
				{
					return true;
				}
			}
		}

		return false;
	}
}
