// Runtime entry of the vendored @floating-ui/dom (global namespace BX.UI.FloatingUi).
// chef bundles it straight from node_modules (resolveNodeModules + standalone);
// the official upstream types live next door (src/floating-ui.d.ts + src/vendor-types/).
// See README.md for the full scheme.
export {
	computePosition,
	autoUpdate,
	offset,
	flip,
	shift,
	limitShift,
	size,
	arrow,
	hide,
	inline,
	autoPlacement,
	detectOverflow,
	getOverflowAncestors,
	platform,
} from '@floating-ui/dom';
