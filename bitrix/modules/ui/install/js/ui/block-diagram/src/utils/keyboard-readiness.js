import { Reflection, Type } from 'main.core';

const POPUP_MANAGER_CLASS_NAME = 'BX.Main.PopupManager';

/**
 * Whether a layer above the canvas holds the keyboard right now. Asked at the moment of the press
 * and never remembered: a popup opens and closes without telling the canvas about it, so a
 * subscription would have to be kept in step with a layer the canvas does not own.
 *
 * Public on purpose - the editor built over this extension answers the same question about the same
 * popups, and one rule implemented twice is two rules.
 *
 * A page carrying no popup manager carries no such layer either, so the keyboard is free.
 */
export function isKeyboardBusyByOverlay(): boolean
{
	const popupManager = Reflection.getClass(POPUP_MANAGER_CLASS_NAME);

	if (!Type.isFunction(popupManager?.isAnyPopupBlockingBackgroundEscShown))
	{
		return false;
	}

	return popupManager.isAnyPopupBlockingBackgroundEscShown() === true;
}
