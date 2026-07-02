import { Type } from 'main.core';
import { FOCUSABLE_SELECTOR } from '../focus-navigator/focusable-selector';

const supportsCheckVisibility = !Type.isUndefined(window.Element) && 'checkVisibility' in window.Element.prototype;

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
