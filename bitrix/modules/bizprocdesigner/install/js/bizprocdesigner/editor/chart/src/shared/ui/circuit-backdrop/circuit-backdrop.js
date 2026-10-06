import './style.css';

/**
 * CircuitBackdrop — decorative circuit-pattern background: two mirrored,
 * radially masked copies of the pattern on the left and right sides.
 *
 * Extracted from AppSkeleton; also used by the empty state of the
 * rules tab (mockup 935:83190). The host container must be positioned
 * (position: relative) and clip overflow if needed — the backdrop centers
 * itself absolutely within the host.
 */
// @vue/component
export const CircuitBackdrop = {
	name: 'CircuitBackdrop',
	template: `
		<div class="editor-chart-circuit-backdrop" aria-hidden="true"></div>
	`,
};
