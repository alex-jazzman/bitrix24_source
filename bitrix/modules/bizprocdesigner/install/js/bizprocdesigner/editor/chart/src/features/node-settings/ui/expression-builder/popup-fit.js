// Geometry of the builder popup relative to its trigger.
// Pure module: the component measures the DOM, this turns the measurements into a size and,
// where the size no longer fits below the trigger, into a shift back into the window.

// Visible breathing room between the popup and the window edges.
export const VIEWPORT_MARGIN = 16;

// Distance main.popup itself keeps between the trigger and a popup opened below it when the
// angle is on (`angleTopOffset`), see adjustPosition() in main/install/js/main/popup.
export const POPUP_GAP_BELOW = 10;

// Below this the popup is not worth showing: the header and the footer alone eat the space and
// nothing of the mode is left. A trigger low on the screen gets this height and the popup is
// lifted up instead, see calculatePopupShiftUp().
export const POPUP_MIN_HEIGHT = 265;

// The width the popup asks for; a window too narrow for it gets all it can spare.
export const POPUP_WIDTH = 380;

export type PopupHeightMeasurements = {
	triggerBottom: number,
	viewportHeight: number,
	gapBelow?: number,
	margin?: number,
	minHeight?: number,
};

export type PopupShiftMeasurements = {
	triggerBottom: number,
	viewportHeight: number,
	popupHeight: number,
	gapBelow?: number,
	margin?: number,
};

export type PopupWidthMeasurements = {
	viewportWidth: number,
	maxWidth?: number,
	margin?: number,
};

/**
 * The height the popup takes below its trigger: all the room left down to the window edge, less
 * the margin that keeps it off that edge, but never less than `POPUP_MIN_HEIGHT` and never taller
 * than the window itself between its margins (the cap the stylesheet holds it to as well).
 *
 * The popup always opens downwards, with no flip, so a trigger low on the screen gets a shorter
 * popup with its content scrolling inside, down to the minimum height.
 */
export function calculatePopupHeightBelow(measurements: PopupHeightMeasurements): number
{
	const {
		triggerBottom,
		viewportHeight,
		gapBelow = POPUP_GAP_BELOW,
		margin = VIEWPORT_MARGIN,
		minHeight = POPUP_MIN_HEIGHT,
	} = measurements;

	const heightBelow = Math.max(minHeight, Math.floor(viewportHeight - triggerBottom - gapBelow - margin));

	return Math.min(heightBelow, Math.max(0, Math.floor(viewportHeight - (2 * margin))));
}

/**
 * How far up the popup has to move for its bottom edge to stay inside the window: zero while the
 * popup fits below the trigger, the overflow once the minimum height reaches past the edge.
 * Without it the footer of a popup opened from a field at the bottom of the screen is out of
 * reach: the popup is fixed, so there is nothing to scroll to it.
 *
 * The popup keeps its bind to the trigger and slides up along it, it does not flip above it. The
 * shift is capped so the top of the popup stays in the window: a window shorter than the minimum
 * height cannot hold the popup whole either way.
 */
export function calculatePopupShiftUp(measurements: PopupShiftMeasurements): number
{
	const {
		triggerBottom,
		viewportHeight,
		popupHeight,
		gapBelow = POPUP_GAP_BELOW,
		margin = VIEWPORT_MARGIN,
	} = measurements;

	const overflow = Math.ceil(triggerBottom + gapBelow + popupHeight + margin - viewportHeight);
	const roomAbove = Math.floor(triggerBottom + gapBelow);

	return Math.max(0, Math.min(overflow, roomAbove));
}

/**
 * The width the popup takes: `POPUP_WIDTH` while the window has room for it, everything the
 * window can spare between the margins when it does not, so a narrow window gets a narrower popup
 * instead of one reaching past its side edge.
 */
export function calculatePopupWidth(measurements: PopupWidthMeasurements): number
{
	const {
		viewportWidth,
		maxWidth = POPUP_WIDTH,
		margin = VIEWPORT_MARGIN,
	} = measurements;

	return Math.max(0, Math.min(maxWidth, Math.floor(viewportWidth - (2 * margin))));
}
