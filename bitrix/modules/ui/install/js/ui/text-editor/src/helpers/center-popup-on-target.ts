import { Popup } from 'main.popup';

/**
 * Puts a popup and its angle under the middle of the element it was opened from.
 *
 * Popup anchors its own left edge to the target, so a picker wider than its button hangs off to
 * one side; both the offset and the angle have to be shifted by hand. The width of the popup is
 * passed in rather than measured here: a picker with a declared width knows it before the layout
 * does, while one sized by its content only learns it once the container is on the page.
 */
export function centerPopupOnTarget(popup: Popup, targetWidth: number, popupWidth: number): void
{
	const angleLeftOffset = Popup.getOption('angleLeftOffset') as number;
	const angleShift = angleLeftOffset - (Popup.getOption('angleMinTop') as number);
	const offsetLeft = targetWidth / 2 - popupWidth / 2;

	popup.setAngle({ offset: popupWidth / 2 - angleShift });
	popup.setOffset({ offsetLeft: offsetLeft + angleLeftOffset });
}
