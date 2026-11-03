import { InteractivityChecker } from 'ui.a11y';
import { Shutter } from 'sale.checkout.lib';

const focusableSelector = 'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])';
const shutterSelector = '.checkout-basket-item-backdrop-container';

export const restoreButton = ['.checkout-resotre-btn'];
export const removeButtons = ['.checkout-basket-item-remove-btn', '.checkout-basket-item-remove-dots-btn'];
export const changeVariationButton = ['.checkout-basket-item-change-btn'];

/**
 * Only real tab stops count: a mouse-only link has a negative tabindex yet still takes focus.
 */
export function getFocusableNodes(root)
{
	return [...root.querySelectorAll(focusableSelector)].filter((node) => InteractivityChecker.isTabbable(node));
}

export function moveFocus(candidates, container)
{
	for (const node of candidates)
	{
		node?.focus();

		if (node === document.activeElement)
		{
			return;
		}
	}

	if (!container || container.contains(document.activeElement))
	{
		return;
	}

	container.setAttribute('tabindex', '-1');
	container.focus();
}

/**
 * Takes a node inside the shutter or the wrapper around it; without a shutter the callback runs at once.
 */
export function whenShutterVisible(node, callback)
{
	return Shutter.whenVisible(node.closest(shutterSelector) ?? node.querySelector(shutterSelector), callback);
}
