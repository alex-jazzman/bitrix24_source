import { Popup } from 'main.popup';

// mirrors the private POPUP_ANGLE_HALF_WIDTH of ui/install/js/ui/vue3/directives/hint/src/tooltip.js
const DIRECTIVE_ANGLE_HALF_WIDTH = 17;

// caps the part of the width that comes from the carrier alone, so a wide inspector panel does not
// stretch the hint across the screen; the width the angle needs stays uncapped, see below
const MAX_CARRIER_WIDTH_RATIO = 0.5;

/**
 * Least popup width at which the hint angle stays attached to the popup.
 *
 * The hint directive centers the angle on the value carrier and writes the resulting offset
 * straight into the angle style, bypassing the `width - angleMax` clamp that main.popup applies
 * in setAngle(). On a popup narrower than that offset the angle ends up outside the popup, so the
 * same arithmetic is reproduced here to ask for a popup the offset still fits into.
 */
export function getHintPopupMinWidth(carrierWidth: number): number
{
	const angleOffset = Popup.getOption('angleLeftOffset') - DIRECTIVE_ANGLE_HALF_WIDTH + (carrierWidth / 2);
	const angleEdgeReserve = Math.max(Popup.getOption('angleMaxTop'), Popup.getOption('angleMaxBottom'));
	const angleReserve = angleOffset + angleEdgeReserve;

	const cappedCarrierWidth = Math.min(
		carrierWidth,
		document.documentElement.clientWidth * MAX_CARRIER_WIDTH_RATIO,
	);

	// the cap may shrink the carrier-driven part, but never the width the angle needs
	return Math.ceil(Math.max(angleReserve, cappedCarrierWidth));
}
