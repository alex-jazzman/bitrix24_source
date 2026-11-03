// Geometry of the builder popup relative to its trigger.
// Pure module: the component measures the DOM, this turns the measurements into the limits the
// stylesheet holds the window to. Where the window is placed is main.popup's business, not ours.

// Visible breathing room between the popup and the window edges.
export const VIEWPORT_MARGIN = 16;

// Distance main.popup itself keeps between the trigger and the popup for the angle
// (`angleTopOffset`), on either side of the trigger: see calculatePopupTopFromBelow() in
// main/install/js/main/popup.
export const POPUP_ANGLE_GAP = 10;

// The width the popup asks for; a window too narrow for it gets all it can spare.
// The layout card is 460 wide counting a 1px border on each side, and this window draws no border
// of its own, while `.popup-window` sizes itself by its outer edge (`box-sizing: border-box`): 458
// is what leaves the content the working area of the layout. A border here brings this back to 460.
export const POPUP_WIDTH = 458;

export type PopupMaxHeightMeasurements = {
	triggerTop: number,
	triggerBottom: number,
	viewportHeight: number,
	// The side the window is bound by, named as in `bindOptions.position` of main.popup.
	side?: 'top' | 'bottom',
	gap?: number,
	margin?: number,
};

export type PopupWidthMeasurements = {
	viewportWidth: number,
	maxWidth?: number,
	margin?: number,
};

/**
 * A ceiling, not a height: the window is as tall as its content asks for and this only says how
 * tall it may grow. The ceiling follows the side the window is bound by:
 *
 * - `top` - the window is latched above the trigger and will stay there, so it may only grow up
 *   to the top edge of the screen: the ceiling is the room above and nothing else. This ceiling is
 *   also what keeps the window on that side, and that is an invariant to keep, not a side effect:
 *   main.popup returns a window whose top edge comes out past the top of the document back below
 *   the trigger (`top < 0` in calculatePopupTopFromAbove(), main/install/js/main/popup), and
 *   `forceTop` does not disable that branch. A floor raising the ceiling over the room above the
 *   trigger therefore brings the window back under it on a trigger standing high on the screen.
 * - `bottom` - the side is still main.popup's to choose: it opens the popup below the trigger and
 *   moves it above when it does not fit below. The ceiling is the room on the roomier of the two
 *   sides, and for a reason: cut down to the room below, it would never let the window outgrow
 *   that room, main.popup would never see the window not fitting, and one opened low on the
 *   screen would be squeezed instead of moved above. Cut down to the room above, the window
 *   would hang past the bottom edge while it still stands below the trigger.
 *
 * The stylesheet caps the window by its own ceiling as well and takes the lower of the two, so on
 * a screen with room to spare the window keeps the size of its content.
 */
export function calculatePopupMaxHeight(measurements: PopupMaxHeightMeasurements): number
{
	const {
		triggerTop,
		triggerBottom,
		viewportHeight,
		side = 'bottom',
		gap = POPUP_ANGLE_GAP,
		margin = VIEWPORT_MARGIN,
	} = measurements;

	const roomAbove = triggerTop - gap - margin;
	if (side === 'top')
	{
		return Math.max(0, Math.floor(roomAbove));
	}

	const roomBelow = viewportHeight - triggerBottom - gap - margin;

	return Math.max(0, Math.floor(Math.max(roomBelow, roomAbove)));
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
