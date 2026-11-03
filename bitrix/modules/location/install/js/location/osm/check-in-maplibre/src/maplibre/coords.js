/**
 * Pure coordinate/padding helpers for the MapLibre engine.
 *
 * Extracted from the engine so they can be unit-tested in isolation (task 1.10).
 * The engine imports `toLngLat` / `normalizePaddingPx` from here and must never
 * invert coordinates anywhere else - conversion happens ONLY at the engine
 * boundary (see CheckInMapServiceMapLibre).
 */

/**
 * Converts a host/Leaflet `[lat, lng]` pair into MapLibre's `[lng, lat]` order.
 *
 * The whole codebase (contract, Leaflet engine, dispatcher) speaks `[lat, lng]`.
 * MapLibre's API expects `[lng, lat]`. This is the single inversion point.
 *
 * @param {number[]} coords - `[lat, lng]`
 * @returns {number[]} `[lng, lat]`
 */
export function toLngLat(coords)
{
	return [coords[1], coords[0]];
}

/**
 * Normalizes `fitBoundsPadding` into a MapLibre padding object `{top, left, bottom, right}`.
 *
 * Mirrors the semantics of the Leaflet engine's `normalizePadding`
 * (check-in-map-service.js), but produces a MapLibre-shaped object instead of
 * Leaflet Points.
 *
 * Supported input formats:
 *   [vertical, horizontal] - symmetric, same value on top/bottom and left/right
 *   [top, right, bottom, left] - CSS-like, each side explicit
 *
 * A plain object that already looks like `{top,left,bottom,right}` is passed
 * through (with missing sides defaulted to 0) so ANIMATION_CONFIG padding can be
 * used directly.
 *
 * @param {number[]|object} padding
 * @returns {{top: number, left: number, bottom: number, right: number}}
 */
export function normalizePaddingPx(padding)
{
	if (padding && !Array.isArray(padding) && typeof padding === 'object')
	{
		return {
			top: padding.top || 0,
			left: padding.left || 0,
			bottom: padding.bottom || 0,
			right: padding.right || 0,
		};
	}

	if (!Array.isArray(padding))
	{
		return { top: 0, left: 0, bottom: 0, right: 0 };
	}

	if (padding.length >= 4)
	{
		// [top, right, bottom, left]
		return {
			top: padding[0],
			right: padding[1],
			bottom: padding[2],
			left: padding[3],
		};
	}

	// [vertical, horizontal] - symmetric
	const [v, h = v] = padding;

	return {
		top: v,
		bottom: v,
		left: h,
		right: h,
	};
}
