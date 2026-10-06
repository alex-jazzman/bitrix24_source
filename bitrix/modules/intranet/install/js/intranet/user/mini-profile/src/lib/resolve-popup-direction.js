export type PopupVerticalPosition = 'top' | 'bottom';

/**
 * Picks the vertical side the mini-profile popup should open to.
 *
 * @param anchorCenterY vertical center of the anchor element, viewport-relative, px
 * @param viewportHeight viewport height, px (window.innerHeight)
 * @returns 'bottom' — open downward (anchor at or above viewport middle),
 *          'top' — open upward (anchor below viewport middle)
 */
export function resolveViewportDirection(anchorCenterY: number, viewportHeight: number): PopupVerticalPosition
{
	return anchorCenterY <= viewportHeight / 2 ? 'bottom' : 'top';
}
