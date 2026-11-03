// Staleness grey. After the legacy single-transition gradient was removed, this is used only for the
// `icon-color` of a non-fresh direction arrow (check-in-map-service-maplibre.js). It is latent under the
// team-view default (arrows are not drawn there) and live in the single/open route view. The same grey is
// mirrored, across bundle boundaries, by location.check-in `--ci-grey` / checkin-tokens.CI_GREY (the stale
// marker colour). Route lines do NOT use grey: they fade to a translucent copy of the employee colour via
// alpha (stafftrackmobile route-line-freshness). Keep the copies in sync when the value changes.
export const LINE_GRADIENT_START_COLOR = '#97a2b2';

/**
 * Builds a MapLibre `line-gradient` interpolate expression from a ready-made list of `[progress, color]`
 * stops (ascending 0..1). The caller (route freshness) computes the fade by time and hands the finished
 * stops over verbatim. Stop colours may be `rgba(...)` (the stale end carries a reduced alpha); MapLibre's
 * `interpolate` blends the alpha channel too, so the colours are passed through as-is with no special
 * handling.
 * @param {Array<[number, string]>} stops
 * @returns {Array}
 */
export function buildLineGradientExpression(stops)
{
	const expression = ['interpolate', ['linear'], ['line-progress']];
	stops.forEach(([progress, color]) => {
		expression.push(progress, color);
	});

	return expression;
}
