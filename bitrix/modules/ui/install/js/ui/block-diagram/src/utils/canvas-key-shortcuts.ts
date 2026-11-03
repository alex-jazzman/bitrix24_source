// The half of the announcement that never moves: the arrows pan the camera and belong to the surface
// itself rather than to the registry, so no one reassigns them.
export const PAN_KEY_SHORTCUTS = 'ArrowUp ArrowDown ArrowLeft ArrowRight';

/**
 * The `aria-keyshortcuts` of a surface of the canvas: the panning of the camera, which is its own, and
 * the fit of the whole scheme, which runs here as well but is registered by the zoom bar the consumer
 * mounts next to the diagram (`components/zoom-bar/zoom-bar.js`). The fit is an action of the registry:
 * what announces it follows a reassignment, and an action left without a combo adds nothing to the list.
 *
 * @param {string | null} fitToViewCombo combo of the fit as `aria-keyshortcuts` spells it
 * @returns {string}
 */
export function buildCanvasKeyShortcuts(fitToViewCombo)
{
	return fitToViewCombo === null
		? PAN_KEY_SHORTCUTS
		: `${PAN_KEY_SHORTCUTS} ${fitToViewCombo}`;
}
