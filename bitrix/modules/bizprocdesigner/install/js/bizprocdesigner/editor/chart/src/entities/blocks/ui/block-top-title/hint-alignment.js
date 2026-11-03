import { Type } from 'main.core';
import { type Popup } from 'main.popup';

type Bounds = {
	left: number,
	width: number,
};

type AngleAlignment = {
	popupShift: number,
	angleOffset: number,
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
 * Angle offset for a popup shifted by getPopupCenterShift(): the popup remains centered over the
 * title, but the angle points at the title left edge.
 */
export function getLeftEdgeAngleOffset(
	titleBounds: Bounds,
	popupBounds: Bounds,
	popupShift: number,
	angleHalfWidth: number,
	scale: number = 1,
): number
{
	const popupCenter = popupBounds.left + popupShift + (popupBounds.width / 2);
	const localAngleTip = (popupBounds.width / 2) + ((titleBounds.left - popupCenter) / scale);

	return localAngleTip - angleHalfWidth;
}

export function getLeftEdgeAngleAlignment(
	titleBounds: Bounds,
	popupBounds: Bounds,
	scale: number,
	angleHalfWidth: number,
): AngleAlignment
{
	const popupShift = getPopupCenterShift(titleBounds, popupBounds);
	const angleOffset = getLeftEdgeAngleOffset(titleBounds, popupBounds, popupShift, angleHalfWidth, scale);

	return { popupShift, angleOffset: getBoundedAngleOffset(angleOffset, popupBounds.width, angleHalfWidth * 2) };
}

function getBoundedAngleOffset(offset: number, popupWidth: number, angleWidth: number): number
{
	const maxOffset = Math.max(0, popupWidth - angleWidth);

	return Math.min(Math.max(0, offset), maxOffset);
}
