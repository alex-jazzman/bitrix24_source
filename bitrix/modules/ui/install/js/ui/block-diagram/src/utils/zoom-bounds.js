import { ZOOM_FLOOR } from '../constants';

// The lower bound is the one carrying the safety invariant, so the property validator and the
// diagnostics of the pair have to judge it by one and the same rule.
export function isValidMinZoom(value: number): boolean
{
	return Number.isFinite(value) && value >= ZOOM_FLOOR;
}

// The floor of the scale, applied wherever a scale is written. An unreadable bound falls back to
// its freest safe value and in an inverted pair the lower one wins: bounds come from the consumer,
// and refusing to serve a gesture over a typo in a setting breaks more than it fixes. A request
// that is not a number leaves the scale where it was.
export function clampZoom(zoom: number, minZoom: number, maxZoom: number, fallback: number): number
{
	if (!Number.isFinite(zoom))
	{
		return fallback;
	}

	const lowerBound = Number.isFinite(minZoom) ? Math.max(minZoom, ZOOM_FLOOR) : ZOOM_FLOOR;
	const upperBound = Number.isFinite(maxZoom) ? Math.max(maxZoom, lowerBound) : Number.POSITIVE_INFINITY;

	return Math.min(upperBound, Math.max(lowerBound, zoom));
}
