import { Type } from 'main.core';
import type { Popup } from 'main.popup';

type Bounds = {
	left: number,
	width: number,
};

/**
 * Horizontal shift that moves the popup center over the title center.
 */
export function getPopupCenterShift(titleBounds: Bounds, popupBounds: Bounds): number
{
	const titleCenter = titleBounds.left + (titleBounds.width / 2);
	const popupCenter = popupBounds.left + (popupBounds.width / 2);

	return titleCenter - popupCenter;
}

/**
 * Half width of the angle, taken from the angle itself: main.popup keeps that size in its own css
 * and exports no constant for it, so a copy of the number would drift away unnoticed.
 *
 * Null means the angle is missing or not laid out yet - then it has to be left where it stands,
 * because a guessed size points it at a wrong place.
 */
export function getAngleHalfWidth(popup: ?Popup): ?number
{
	const angleWidth = popup?.angle?.element?.offsetWidth;

	if (!Type.isNumber(angleWidth) || angleWidth <= 0)
	{
		return null;
	}

	return angleWidth / 2;
}

/**
 * Angle offset for a popup shifted by getPopupCenterShift(): its center coincides with the title
 * center, so an angle standing in the middle of the popup points at the title at any title width.
 *
 * The hint directive of ui.vue3.directives.hint centers the angle on the title itself and knows
 * nothing about the shift applied to the popup afterwards, hence the recalculation.
 */
export function getCenteredAngleOffset(popupWidth: number, angleHalfWidth: number): number
{
	return (popupWidth / 2) - angleHalfWidth;
}
