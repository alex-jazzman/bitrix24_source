import { Dom, Event, Type, Text, type RegistryEventListener } from 'main.core';

import { FocusMonitor } from '../focus-monitor/focus-monitor';
import { FocusNavigator, type FocusNavigatorOptions } from '../focus-navigator/focus-navigator';
import { InteractivityChecker } from '../interactivity-checker/interactivity-checker';
import { AccessibilityLogger } from '../accessibility-logger/accessibility-logger';

import { type InitialFocus, type FocusTrapOptions, type FocusBoundaryTarget, RestoreFocus } from './types';
import { AccessibilitySettings } from '../accessibility-settings/accessibility-settings';

const PRECEDING = Node.DOCUMENT_POSITION_PRECEDING | Node.DOCUMENT_POSITION_CONTAINS;
const FOLLOWING = Node.DOCUMENT_POSITION_FOLLOWING | Node.DOCUMENT_POSITION_CONTAINED_BY;

/**
 * @memberof BX.UI.Accessibility
 */
export class FocusTrap
{
	#id: string = `focus-trap-${Text.getRandom()}`;
	#container: HTMLElement;
	#options: FocusTrapOptions;
	#active: boolean = false;
	#looped: boolean = true;
	#initialized: boolean = false;
	#restoreFocus: RestoreFocus | null = null;
	#preventScroll: boolean = true;

	#startFocusBoundary: HTMLElement | null = null;
	#endFocusBoundary: HTMLElement | null = null;

	#lastFocusedElement: HTMLElement | null = null;
	#alreadyInert: WeakSet<HTMLElement> = new WeakSet();

	#startFocusHandler = this.#handleStartBoundaryFocus.bind(this);
	#endFocusHandler = this.#handleEndBoundaryFocus.bind(this);

	constructor(container: HTMLElement, options: FocusTrapOptions = {})
	{
		this.#container = container;
		this.#options = Type.isPlainObject(options) ? options : {};

		this.setRestoreFocus(this.#options.restoreFocus ?? null);

		if (this.#options.looped !== undefined)
		{
			this.setLooped(this.#options.looped);
		}

		if (this.#options.preventScroll !== undefined)
		{
			this.setPreventScroll(this.#options.preventScroll);
		}
	}

	static enableDebug(): void
	{
		AccessibilityLogger.enable('focus-trap');
	}

	static disableDebug(): void
	{
		AccessibilityLogger.disable('focus-trap');
	}

	activate(options: { initialFocus?: boolean } = {}): void
	{
		if (this.#active)
		{
			return;
		}

		if (!this.#initialized)
		{
			this.#init();
		}

		if (this.#lastFocusedElement === null)
		{
			this.captureActiveElement();
		}

		this.#active = true;

		if (this.#looped)
		{
			this.#setBoundariesFocusable(true);
		}

		const { initialFocus } = { initialFocus: true, ...options };
		if (initialFocus)
		{
			this.applyInitialFocus();
		}

		this.#setOutsideIsolation(true);
	}

	deactivate(): void
	{
		if (!this.#active)
		{
			return;
		}

		this.#active = false;
		this.#setBoundariesFocusable(false);
		this.#setOutsideIsolation(false);

		this.restoreFocus();
	}

	destroy(): void
	{
		this.deactivate();

		if (!this.#initialized)
		{
			return;
		}

		Event.unbind(this.#startFocusBoundary!, 'focus', this.#startFocusHandler);
		Event.unbind(this.#endFocusBoundary!, 'focus', this.#endFocusHandler);

		Dom.remove(this.#startFocusBoundary);
		Dom.remove(this.#endFocusBoundary);

		this.#initialized = false;
	}

	setLooped(flag: boolean): void
	{
		if (!Type.isBoolean(flag))
		{
			return;
		}

		this.#looped = flag;

		if (this.#active)
		{
			this.#setBoundariesFocusable(flag);
		}
	}

	setPreventScroll(flag: boolean): void
	{
		this.#preventScroll = Type.isBoolean(flag) ? flag : true;
	}

	isLooped(): boolean
	{
		return this.#looped;
	}

	isActive(): boolean
	{
		return this.#active;
	}

	setLastFocusedElement(el: HTMLElement): void
	{
		if (Type.isElementNode(el) && el.tagName !== 'BODY' && !this.contains(el))
		{
			this.#lastFocusedElement = el;
			AccessibilityLogger.logNode('focus-trap', 'set last focus', el);
		}
	}

	captureActiveElement(): HTMLElement | null
	{
		const activeElement = FocusNavigator.getActiveElement();
		if (activeElement !== null)
		{
			this.setLastFocusedElement(activeElement);
		}

		return activeElement;
	}

	contains(el: HTMLElement): boolean
	{
		return this.#container.contains(el);
	}

	focusFirst(options?: FocusNavigatorOptions): HTMLElement | null
	{
		return FocusNavigator.focusFirst(this.#container, this.#prepareFocusOptions(options));
	}

	focusLast(options?: FocusNavigatorOptions): HTMLElement | null
	{
		return FocusNavigator.focusLast(this.#container, this.#prepareFocusOptions(options));
	}

	focusNext(options?: FocusNavigatorOptions): HTMLElement | null
	{
		return FocusNavigator.focusNext(this.#container, this.#prepareFocusOptions(options));
	}

	focusPrevious(options?: FocusNavigatorOptions): HTMLElement | null
	{
		return FocusNavigator.focusPrevious(this.#container, this.#prepareFocusOptions(options));
	}

	focusContainer(options?: FocusNavigatorOptions): HTMLElement
	{
		return FocusNavigator.focusContainer(this.#container, this.#prepareFocusOptions(options));
	}

	focusBySelector(selector: string, options?: FocusNavigatorOptions): HTMLElement | null
	{
		return FocusNavigator.focusBySelector(this.#container, selector, this.#prepareFocusOptions(options));
	}

	#prepareFocusOptions(options?: FocusNavigatorOptions): FocusNavigatorOptions
	{
		const preparedOptions: FocusNavigatorOptions = Type.isPlainObject(options) ? { ...options } : {};
		if (Type.isNil(preparedOptions.preventScroll))
		{
			preparedOptions.preventScroll = this.#preventScroll;
		}

		return preparedOptions;
	}

	getId(): string
	{
		return this.#id;
	}

	#init(): void
	{
		this.#startFocusBoundary = this.#createFocusBoundary();
		this.#endFocusBoundary = this.#createFocusBoundary();

		Event.bind(this.#startFocusBoundary, 'focus', this.#startFocusHandler);
		Event.bind(this.#endFocusBoundary, 'focus', this.#endFocusHandler);

		this.#container.insertAdjacentElement('beforebegin', this.#startFocusBoundary);
		this.#container.insertAdjacentElement('afterend', this.#endFocusBoundary);

		this.#initialized = true;
	}

	#createFocusBoundary(): HTMLElement
	{
		const el = document.createElement('div');
		el.setAttribute('aria-hidden', 'true');
		el.setAttribute('data-focus-trap', this.getId());

		Dom.style(el, {
			position: 'fixed',
			width: 0,
			height: 0,
			opacity: '0',
			pointerEvents: 'none',
			outline: 'none',
		});

		return el;
	}

	#handleStartBoundaryFocus(event: FocusEvent): void
	{
		if (!this.#active || !this.#startFocusBoundary)
		{
			return;
		}

		const position = (
			event.relatedTarget
				? this.#startFocusBoundary.compareDocumentPosition(event.relatedTarget as Node)
				: 0
		);

		const isBackward = position & FOLLOWING;
		if (!isBackward)
		{
			if (!this.focusFirst())
			{
				this.focusContainer();
			}

			return;
		}

		const target = this.#options.startBoundary ? this.#resolveBoundary(this.#options.startBoundary) : null;
		if (target)
		{
			FocusNavigator.focusTarget(target, { preventScroll: this.#preventScroll });

			return;
		}

		if (!this.focusLast())
		{
			this.focusContainer();
		}
	}

	#handleEndBoundaryFocus(event: FocusEvent): void
	{
		if (!this.#active || !this.#endFocusBoundary)
		{
			return;
		}

		const position = (
			event.relatedTarget
				? this.#endFocusBoundary.compareDocumentPosition(event.relatedTarget as Node)
				: 0
		);

		const isBackward = position & PRECEDING;
		if (!isBackward)
		{
			if (!this.focusLast())
			{
				this.focusContainer();
			}

			return;
		}
		const target = this.#options.endBoundary ? this.#resolveBoundary(this.#options.endBoundary) : null;
		if (target)
		{
			FocusNavigator.focusTarget(target, { preventScroll: this.#preventScroll });

			return;
		}

		if (!this.focusFirst())
		{
			this.focusContainer();
		}
	}

	#resolveBoundary(boundary: FocusBoundaryTarget): HTMLElement | null
	{
		if (Type.isStringFilled(boundary))
		{
			const el = document.querySelector<HTMLElement>(boundary as string);

			return el !== null && Type.isElementNode(el) && InteractivityChecker.isFocusable(el) ? el : null;
		}

		if (Type.isElementNode(boundary) && InteractivityChecker.isFocusable(boundary as HTMLElement))
		{
			return boundary as HTMLElement;
		}

		if (Type.isFunction(boundary))
		{
			const el = (boundary as Function)();

			return Type.isElementNode(el) && InteractivityChecker.isFocusable(el) ? el : null;
		}

		return null;
	}

	#setBoundariesFocusable(enabled: boolean): void
	{
		const tabindex = enabled ? '0' : '-1';
		this.#startFocusBoundary?.setAttribute('tabindex', tabindex);
		this.#endFocusBoundary?.setAttribute('tabindex', tabindex);
	}

	applyInitialFocus(): void
	{
		const initialFocus: InitialFocus | InitialFocus[] = this.#options.initialFocus ?? true;
		if (initialFocus === false)
		{
			return;
		}

		if (!this.#options.forceInitialFocus)
		{
			const activeElement = FocusNavigator.getActiveElement(this.#container);
			if (activeElement && this.#container.contains(activeElement) && activeElement !== this.#container)
			{
				return;
			}
		}

		const candidates = Array.isArray(initialFocus) ? initialFocus : [initialFocus];
		for (const candidate of candidates)
		{
			if (this.#tryInitialFocus(candidate))
			{
				return;
			}
		}

		this.focusContainer();
	}

	#tryInitialFocus(initialFocus: InitialFocus): boolean
	{
		if (initialFocus === false)
		{
			return false;
		}

		if (initialFocus === 'container')
		{
			this.focusContainer();

			return true;
		}

		if (Type.isStringFilled(initialFocus))
		{
			return this.focusBySelector(initialFocus as string) !== null;
		}

		if (Type.isFunction(initialFocus))
		{
			const el = (initialFocus as Function)();
			if (InteractivityChecker.isFocusable(el))
			{
				FocusNavigator.focusTarget(el, { preventScroll: this.#preventScroll });

				return true;
			}

			return false;
		}

		if (initialFocus === true || initialFocus === 'first-tabbable' || Type.isNil(initialFocus))
		{
			return Boolean(this.focusFirst());
		}

		return false;
	}

	setRestoreFocus(restore: RestoreFocus | null): void
	{
		if (
			Type.isBoolean(restore)
			|| Type.isNull(restore)
			|| Type.isStringFilled(restore)
			|| Type.isFunction(restore)
			|| Type.isElementNode(restore)
		)
		{
			this.#restoreFocus = restore;
		}
	}

	restoreFocus(): void
	{
		try
		{
			const restoreFocus = this.#restoreFocus ?? true;
			if (restoreFocus === false)
			{
				return;
			}

			if (Type.isStringFilled(restoreFocus))
			{
				const doc = this.#container.ownerDocument ?? document;
				let el: HTMLElement | null = null;
				try
				{
					el = doc.querySelector<HTMLElement>(restoreFocus as string);
				}
				catch
				{
					console.error('FocusTrap: invalid restoreFocus selector provided');
				}

				if (el !== null && InteractivityChecker.isFocusable(el))
				{
					FocusNavigator.restoreFocus(el, { preventScroll: true });

					return;
				}
			}

			if (Type.isElementNode(restoreFocus) && InteractivityChecker.isFocusable(restoreFocus as HTMLElement))
			{
				FocusNavigator.restoreFocus(restoreFocus as HTMLElement, { preventScroll: true });

				return;
			}

			if (Type.isFunction(restoreFocus))
			{
				const el = (restoreFocus as Function)();
				if (InteractivityChecker.isFocusable(el))
				{
					FocusNavigator.restoreFocus(el, { preventScroll: true });

					return;
				}
			}

			if (this.#lastFocusedElement !== null && InteractivityChecker.isFocusable(this.#lastFocusedElement))
			{
				let eventListeners: RegistryEventListener[] = [];

				const suppressFocusOnRestore = (
					Type.isBoolean(this.#options.suppressFocusOnRestore)
						? this.#options.suppressFocusOnRestore
						: AccessibilitySettings.suppressFocusOnRestore()
				);

				try
				{
					if (suppressFocusOnRestore)
					{
						// Event.getEventListeners only knows about handlers registered via
						// Event.bind. Handlers attached through native addEventListener are
						// invisible here and will still fire on refocus.
						eventListeners = Event.getEventListeners(this.#lastFocusedElement, 'focus');
						if (eventListeners.length > 0)
						{
							Event.unbindAll(this.#lastFocusedElement, 'focus');
						}
					}

					AccessibilityLogger.logNode('focus-trap', 'back to last focus', this.#lastFocusedElement);

					FocusNavigator.restoreFocus(this.#lastFocusedElement, { preventScroll: true });
				}
				finally
				{
					if (suppressFocusOnRestore)
					{
						for (const eventListener of eventListeners)
						{
							Event.bind(this.#lastFocusedElement, 'focus', eventListener.listener);
						}
					}
				}

				return;
			}

			FocusMonitor.Instance.restoreFocus();
		}
		finally
		{
			this.#lastFocusedElement = null;
		}
	}

	#setOutsideIsolation(enable: boolean): void
	{
		if (this.#options.isolateOutside !== true)
		{
			return;
		}

		const containers = [this.#container, ...this.#getOutsideExceptionElements()];
		const topLevelContainers = containers.filter(
			(el) => {
				return !containers.some((other) => other !== el && other.contains(el));
			},
		);

		const adjacentElements = this.#getAdjacentElements(topLevelContainers);

		if (enable)
		{
			this.#alreadyInert = new WeakSet();
			for (const el of adjacentElements)
			{
				if (el === this.#container || this.#container.contains(el) || el.getAttribute('data-focus-trap') === this.getId())
				{
					continue;
				}

				// Old scripts may create hidden containers in the <body> for later display.
				// In this case, we should not set inert attribute.
				if (el.parentNode?.nodeName === 'BODY' && el.offsetWidth === 0 && el.offsetHeight === 0)
				{
					continue;
				}

				if (el.inert || el.hasAttribute('inert'))
				{
					this.#alreadyInert.add(el);
				}

				el.setAttribute('inert', 'true');
			}
		}
		else
		{
			for (const el of adjacentElements)
			{
				if (this.#alreadyInert.has(el))
				{
					continue;
				}

				el.removeAttribute('inert');
			}

			this.#alreadyInert = new WeakSet();
		}
	}

	#getAdjacentElements(containers: HTMLElement[]): Set<HTMLElement>
	{
		const adjacentElements = new Set<HTMLElement>();
		const containerAncestors = new Set<HTMLElement>();

		for (const container of containers)
		{
			let currentElement: HTMLElement | null = container;
			while (currentElement && currentElement.tagName !== 'BODY')
			{
				containerAncestors.add(currentElement);
				const parent: HTMLElement | null = currentElement.parentElement;
				const siblings = parent ? parent.children : [];
				for (const sibling of siblings)
				{
					if (
						sibling.tagName !== 'SCRIPT'
						&& sibling.tagName !== 'STYLE'
						&& !sibling.getAttribute('data-a11y-ignore-inert')
						&& Type.isElementNode(sibling)
					)
					{
						adjacentElements.add(sibling as HTMLElement);
					}
				}

				currentElement = parent;
			}
		}

		containerAncestors.forEach((el) => {
			adjacentElements.delete(el);
		});

		return adjacentElements;
	}

	#getOutsideExceptionElements(): HTMLElement[]
	{
		if (!Type.isArrayFilled(this.#options.outsideExceptionSelectors))
		{
			return [];
		}

		try
		{
			const selectors = this.#options.outsideExceptionSelectors!.join(',');

			return [...document.querySelectorAll<HTMLElement>(selectors)];
		}
		catch
		{
			console.error('FocusTrap: invalid outsideExceptionSelectors provided');

			return [];
		}
	}
}
