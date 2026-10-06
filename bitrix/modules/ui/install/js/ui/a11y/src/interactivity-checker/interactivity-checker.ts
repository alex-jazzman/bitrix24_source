import { Type } from 'main.core';
import { FOCUSABLE_SELECTOR } from '../focus-navigator/focusable-selector';

const supportsCheckVisibility = !Type.isUndefined(window.Element) && 'checkVisibility' in window.Element.prototype;

const NON_TEXT_INPUT_TYPES: Set<string> = new Set([
	'button',
	'checkbox',
	'color',
	'file',
	'hidden',
	'image',
	'radio',
	'range',
	'reset',
	'submit',
]);

// A colour or a date input has no caret, but its own keys (arrows, Home / End)
// belong to it all the same.
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
 * @memberof BX.UI.Accessibility
 */
export class InteractivityChecker
{
	static isDisabled(element: HTMLElement): boolean
	{
		return (
			Type.isElementNode(element)
			&& (element.hasAttribute('disabled') || element.getAttribute('aria-disabled') === 'true')
		);
	}

	/**
	 * An element the user types text into: moving focus away from it drops the
	 * caret and the current selection, so a widget must not take focus from it.
	 */
	static isTextInput(element: HTMLElement | null | undefined): boolean
	{
		if (!Type.isElementNode(element))
		{
			return false;
		}

		if (element.tagName === 'INPUT')
		{
			return !NON_TEXT_INPUT_TYPES.has((element as HTMLInputElement).type);
		}

		return element.tagName === 'TEXTAREA' || element.isContentEditable;
	}

	/**
	 * An element that consumes navigation keys itself — text editing, caret moves,
	 * opening a dropdown — so a widget must not intercept those keys from it. Wider
	 * than `isTextInput`: a `<select>` has no caret, yet the arrows are its own.
	 */
	static isEditable(element: HTMLElement | null): boolean
	{
		if (!Type.isElementNode(element))
		{
			return false;
		}

		if (element.tagName === 'INPUT')
		{
			return !NON_EDITABLE_INPUT_TYPES.has((element as HTMLInputElement).type);
		}

		return element.tagName === 'TEXTAREA' || element.tagName === 'SELECT' || element.isContentEditable;
	}

	static isVisible(element: HTMLElement): boolean
	{
		if (!Type.isElementNode(element) || !element.isConnected)
		{
			return false;
		}

		if (supportsCheckVisibility)
		{
			return element.checkVisibility({ visibilityProperty: true, opacityProperty: true });
		}

		const hasGeometry = element.offsetWidth > 0 || element.offsetHeight > 0 || element.getClientRects().length > 0;

		return hasGeometry && getComputedStyle(element).visibility === 'visible';
	}

	static isTabbable(element: HTMLElement): boolean
	{
		if (!this.isFocusable(element))
		{
			return false;
		}

		return !this.hasNegativeTabIndex(element);
	}

	static hasNegativeTabIndex(element: HTMLElement): boolean
	{
		const tabindex = element?.getAttribute('tabindex');
		if (tabindex === null)
		{
			return false;
		}

		return Number.parseInt(tabindex, 10) < 0;
	}

	static isFocusable(element: HTMLElement): boolean
	{
		if (!Type.isElementNode(element) || element.closest('[inert]') || !element.isConnected)
		{
			return false;
		}

		return element.matches(FOCUSABLE_SELECTOR) && this.isVisible(element);
	}
}
