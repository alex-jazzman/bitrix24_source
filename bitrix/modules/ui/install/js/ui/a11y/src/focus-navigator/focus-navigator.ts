import { Type } from 'main.core';
import { InteractivityChecker } from '../interactivity-checker/interactivity-checker';

import { FOCUSABLE_SELECTOR } from './focusable-selector';
import { AccessibilityLogger } from '../accessibility-logger/accessibility-logger';

export const RESTORE_FOCUS_EVENT = 'a11y:restore-focus';

type Direction = 'next' | 'previous' | 'first' | 'last';

type WalkerOptions = {
	tabbableOnly: boolean;
	accept?: (el: HTMLElement) => boolean;
};

export type FocusNavigatorOptions = {
	from?: HTMLElement;
	tabbableOnly?: boolean;
	wrap?: boolean;
	accept?: (el: HTMLElement) => boolean;
	preventScroll?: boolean;
	focusVisible?: boolean;
};

/**
 * @memberof BX.UI.Accessibility
 */
export class FocusNavigator
{
	static get FOCUSABLE_SELECTOR(): string
	{
		return FOCUSABLE_SELECTOR;
	}

	static getFirst(container: HTMLElement, options?: FocusNavigatorOptions): HTMLElement | null
	{
		return this.#traverse(container, 'first', options);
	}

	static getLast(container: HTMLElement, options?: FocusNavigatorOptions): HTMLElement | null
	{
		return this.#traverse(container, 'last', options);
	}

	static getNext(container: HTMLElement, options?: FocusNavigatorOptions): HTMLElement | null
	{
		return this.#traverse(container, 'next', options);
	}

	static getPrevious(container: HTMLElement, options?: FocusNavigatorOptions): HTMLElement | null
	{
		return this.#traverse(container, 'previous', options);
	}

	static focusFirst(container: HTMLElement, options?: FocusNavigatorOptions): HTMLElement | null
	{
		return this.focusTarget(this.#traverse(container, 'first', options), options);
	}

	static focusLast(container: HTMLElement, options?: FocusNavigatorOptions): HTMLElement | null
	{
		return this.focusTarget(this.#traverse(container, 'last', options), options);
	}

	static focusNext(container: HTMLElement, options?: FocusNavigatorOptions): HTMLElement | null
	{
		return this.focusTarget(this.#traverse(container, 'next', options), options);
	}

	static focusPrevious(container: HTMLElement, options?: FocusNavigatorOptions): HTMLElement | null
	{
		return this.focusTarget(this.#traverse(container, 'previous', options), options);
	}

	static focusContainer(container: HTMLElement, options?: FocusNavigatorOptions): HTMLElement
	{
		if (!container.hasAttribute('tabindex'))
		{
			container.setAttribute('tabindex', '-1');
		}

		this.focusTarget(container, options);

		return container;
	}

	static getActiveElement(node?: Node | null): HTMLElement | null
	{
		const { activeElement } = this.#getDocument(node);

		if (activeElement?.tagName === 'IFRAME' && (activeElement as HTMLIFrameElement).contentDocument?.body)
		{
			const iframe = activeElement as HTMLIFrameElement;

			return this.getActiveElement(iframe.contentDocument?.body);
		}

		if (Type.isElementNode(activeElement))
		{
			return activeElement as HTMLElement;
		}

		return null;
	}

	static createWalker(
		container: HTMLElement,
		options?: Pick<FocusNavigatorOptions, 'tabbableOnly' | 'accept'>,
	): TreeWalker
	{
		const { tabbableOnly = false, accept } = options ?? {};
		const ownerDocument = container.ownerDocument ?? document;

		return ownerDocument.createTreeWalker(
			container,
			NodeFilter.SHOW_ELEMENT,
			{
				acceptNode(node: Element): number
				{
					const el = node as HTMLElement;
					if (!InteractivityChecker.isFocusable(el))
					{
						return NodeFilter.FILTER_SKIP;
					}

					if (tabbableOnly && el.tabIndex < 0)
					{
						return NodeFilter.FILTER_SKIP;
					}

					// Iframes always pass the filter so `#walk` can descend into their
					// contentDocument; the iframe element itself is never yielded when
					// same-origin content is reachable.
					if (accept && !accept(el) && el.tagName !== 'IFRAME')
					{
						return NodeFilter.FILTER_SKIP;
					}

					return NodeFilter.FILTER_ACCEPT;
				},
			},
		);
	}

	/**
	 * Recursively traverses the container in DOM order, descending into same-origin iframes.
	 *
	 * TreeWalker does not cross Document boundaries, so when an iframe is encountered
	 * a nested walker is created for iframe.contentDocument.body.
	 * Cross-origin iframes are silently skipped.
	 */
	static* #walk(container: HTMLElement, options: WalkerOptions): Generator<HTMLElement>
	{
		const walker = this.createWalker(container, options);
		for (let node = walker.nextNode(); node !== null; node = walker.nextNode())
		{
			const el = node as HTMLElement;
			if (el.tagName === 'IFRAME')
			{
				try
				{
					const iframe = el as HTMLIFrameElement;
					const body = iframe.contentDocument?.body;
					if (body)
					{
						// Descend into iframe — the tag itself is not yielded, only its contents
						yield* this.#walk(body, options);
						continue;
					}
				}
				catch
				{
					// cross-origin iframe — skip silently
				}
			}

			yield el;
		}
	}

	/**
	 * first    → O(1)  first yield of the generator
	 * last     → O(n)  drain the generator to the end
	 * next     → O(k)  iterate until from, return the following element
	 * previous → O(k)  iterate until from, return the preceding element
	 */
	static #traverse(container: HTMLElement, direction: Direction, options?: FocusNavigatorOptions): HTMLElement | null
	{
		const walkerOptions: WalkerOptions = {
			tabbableOnly: options?.tabbableOnly ?? true,
			accept: options?.accept,
		};

		switch (direction)
		{
			case 'first':
			{
				return this.#walk(container, walkerOptions).next().value ?? null;
			}

			case 'last':
			{
				let last: HTMLElement | null = null;
				for (const el of this.#walk(container, walkerOptions))
				{
					last = el;
				}

				return last;
			}

			case 'next':
			{
				const from = this.#resolveFrom(container, options);
				let found = from === null;

				for (const el of this.#walk(container, walkerOptions))
				{
					if (found)
					{
						return el;
					}

					if (el === from)
					{
						found = true;
					}
				}

				if (options?.wrap)
				{
					return this.#walk(container, walkerOptions).next().value ?? null;
				}

				return null;
			}

			case 'previous':
			{
				const from = this.#resolveFrom(container, options);
				let prev: HTMLElement | null = null;

				for (const el of this.#walk(container, walkerOptions))
				{
					if (el === from)
					{
						break;
					}

					prev = el;
				}

				if (prev)
				{
					return prev;
				}

				if (options?.wrap)
				{
					return this.#traverse(container, 'last', options);
				}

				return null;
			}

			default:
			{
				break;
			}
		}

		return null;
	}

	static focusBySelector(container: HTMLElement, selector: string, options?: FocusNavigatorOptions): HTMLElement | null
	{
		const { accept: outerAccept, ...rest } = options ?? {};
		const accept = (el: HTMLElement): boolean => {
			return el.matches(selector) && (outerAccept ? outerAccept(el) : true);
		};

		const from = this.#resolveFrom(container, options);
		let found = from === null;

		for (const el of this.#walk(container, { ...(rest as WalkerOptions), accept }))
		{
			if (found)
			{
				return this.focusTarget(el, options);
			}

			if (el === from)
			{
				found = true;
			}
		}

		if (options?.wrap)
		{
			const el = this.#walk(container, { ...(rest as WalkerOptions), accept }).next().value;
			if (el)
			{
				return this.focusTarget(el, options);
			}
		}

		return null;
	}

	static #resolveFrom(container: HTMLElement, options?: FocusNavigatorOptions): HTMLElement | null
	{
		const from = options?.from ?? this.getActiveElement(container);

		if (!from || container === from)
		{
			return null;
		}

		if (container.contains(from))
		{
			return from;
		}

		// from may be inside a nested iframe —
		// walk up the frameElement chain until we reach the container
		let doc = from.ownerDocument;

		while (doc !== null)
		{
			const frame = doc.defaultView?.frameElement;

			if (!frame)
			{
				return null;
			}

			if (container.contains(frame))
			{
				return from;
			}

			doc = frame.ownerDocument;
		}

		return null;
	}

	static focusTarget(target: HTMLElement | null, options?: FocusNavigatorOptions): HTMLElement | null
	{
		if (!target)
		{
			return null;
		}

		const { preventScroll, focusVisible } = options ?? {};

		target.focus({ preventScroll, focusVisible } as FocusOptions);

		return target;
	}

	static restoreFocus(target: HTMLElement | null, options?: FocusNavigatorOptions): HTMLElement | null
	{
		if (!Type.isElementNode(target))
		{
			return null;
		}

		try
		{
			const customEvent = new CustomEvent(RESTORE_FOCUS_EVENT, {
				bubbles: true,
				cancelable: true,
			});

			const dispatchResult = (target as HTMLElement).dispatchEvent(customEvent);
			if (dispatchResult)
			{
				this.focusTarget(target, options);
				AccessibilityLogger.log('focus-monitor', 'restored focus to', target);

				return target;
			}
		}
		catch
		{
			AccessibilityLogger.warn('focus-monitor', 'failed to restore focus to', target);
		}

		return null;
	}

	static #getDocument(node?: Window | Document | Node | null): Document
	{
		if (!node)
		{
			return document;
		}

		if ((node as Window).window === node)
		{
			return node.document;
		}

		return (node as Node).ownerDocument ?? document;
	}
}
