/**
 * Zoom and pan arithmetic for a rendered diagram.
 *
 * Kept free of the DOM: the diagram itself lives in a sandboxed frame that cannot script, so all of
 * the interaction is driven from the parent and every decision here is plain geometry.
 */

// Only a sanity floor against a nonsensical number. The real lower bound is the fit scale, enforced
// where zooming happens: a long diagram can legitimately fit at 8%, and flooring that at some
// "reasonable" minimum drew it two and a half times larger than the space it had.
export const MIN_SCALE = 0.01;
export const MAX_SCALE = 4;

// Feels like a zoom step without needing many clicks to get anywhere.
const STEP = 1.25;

export function clampScale(scale: number): number
{
	if (!Number.isFinite(scale))
	{
		return 1;
	}

	return Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale));
}

export function stepScale(scale: number, direction: number): number
{
	return clampScale(direction > 0 ? scale * STEP : scale / STEP);
}

/**
 * Scale at which the diagram fits the space available to it.
 *
 * Height is optional: a code block grows to whatever height the diagram needs, so only its width
 * binds - a fullscreen viewport cannot grow and has to contain both directions.
 *
 * Never above 1: a small diagram is shown at its natural size instead of being blown up to fill the
 * block, which is how it reads on any other markdown surface.
 */
export function fitScale(
	naturalWidth: number,
	viewportWidth: number,
	naturalHeight: number = 0,
	viewportHeight: number = 0,
): number
{
	if (!(naturalWidth > 0) || !(viewportWidth > 0))
	{
		return 1;
	}

	let ratio = viewportWidth / naturalWidth;
	if (naturalHeight > 0 && viewportHeight > 0)
	{
		ratio = Math.min(ratio, viewportHeight / naturalHeight);
	}

	return clampScale(Math.min(1, ratio));
}

/**
 * Keeps the diagram inside the viewport: no dragging it out of sight, and an axis that has room to
 * spare is centred instead of pinned to one edge.
 */
export function clampPan(
	{ contentWidth, contentHeight, viewportWidth, viewportHeight, x, y }: Object,
): Object
{
	return {
		x: clampAxis(contentWidth, viewportWidth, x),
		y: clampAxis(contentHeight, viewportHeight, y),
	};
}

function clampAxis(content: number, viewport: number, offset: number): number
{
	const slack = viewport - content;
	if (!Number.isFinite(slack))
	{
		return 0;
	}

	if (slack >= 0)
	{
		return slack / 2;
	}

	return Math.min(0, Math.max(slack, Number.isFinite(offset) ? offset : 0));
}

/**
 * Pan offset that keeps the point under the cursor still while the scale changes.
 *
 * Without this a wheel zoom drifts away from whatever the reader was looking at.
 */
export function anchorPan(
	{ x, y, pointerX, pointerY, previousScale, nextScale }: Object,
): Object
{
	const ratio = previousScale > 0 ? nextScale / previousScale : 1;

	return {
		x: pointerX - ((pointerX - x) * ratio),
		y: pointerY - ((pointerY - y) * ratio),
	};
}

export function formatScale(scale: number): string
{
	return `${Math.round(clampScale(scale) * 100)}%`;
}
