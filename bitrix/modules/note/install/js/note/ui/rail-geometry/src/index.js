/*
 * [ALG-02] Width limit and placement mode of the chat panel.
 *
 * The two numbers below are copies, and they have to be: `--note-history-width` is declared locally
 * on `.note-version-timeline` and is not readable from outside, and the comfortable document width
 * is a literal repeated across the module. Keep them here, in one block, with their sources — if the
 * timeline's width ever changes, DOC_FLOOR must be recomputed by hand, there is no link in code.
 * (editor.css:2258 already duplicates 340px as a fallback, so the precedent exists.)
 */

// editor.css:298 — width: min(100%, 1000px)
export const DOC_COMFORT_WIDTH = 1000;

// document-history/src/style.css:416 (--note-history-width) and ui/hotkeys/src/style.css:7
// (--note-hotkeys-panel-width) — the two rail residents are the same width.
export const RAIL_PANEL_WIDTH = 340;

export const PANEL_MIN_WIDTH = 320;

// Q-1: the width every open starts from. The panel is resizable, but the width is deliberately not
// persisted anywhere — a drag lives until the page is reloaded, and then this number is back. Its
// origin is the portal's own right panel (intranet airtemplate.php:237), from the time the setting
// was shared; the setting itself is no longer read or written.
export const PANEL_WIDTH = 360;

/**
 * What the document keeps when a rail resident is open on a window where the document is exactly
 * comfortable. The panel's limit is derived from what is left after this guarantee — not as a share
 * of the window — which is why on a wide window the chat can go considerably wider than the timeline.
 */
export const DOC_FLOOR = DOC_COMFORT_WIDTH - RAIL_PANEL_WIDTH;

function clamp(min: number, value: number, max: number): number
{
	return Math.max(min, Math.min(max, value));
}

// Geometry is read from live layout, so a missing or broken value is normal input. Without this
// every arithmetic result would silently become NaN, and NaN written into a CSS variable collapses
// the panel to zero without a single error in the console.
function toNumber(value: mixed): number
{
	const number = Number(value);

	return Number.isFinite(number) ? number : 0;
}

/**
 * @param viewportWidth documentElement.clientWidth — NOT window.innerWidth, which includes the
 *   scrollbar and would shift the overlay threshold by its width.
 * @param sidebarWidth effective navigation width, i.e. the logo width when it is collapsed.
 * @param desiredWidth width asked for by the current drag; 0 or absent means "no drag yet, open at
 *   PANEL_WIDTH". Nothing outside the live gesture ever passes a value here — the width is not
 *   stored, so there is no saved number to feed in.
 */
export function resolveRailGeometry(
	{ viewportWidth, sidebarWidth, desiredWidth }: Object,
): { mode: string, width: number, maxWidth: number }
{
	const desired = toNumber(desiredWidth) > 0 ? toNumber(desiredWidth) : PANEL_WIDTH;
	const available = Math.max(0, toNumber(viewportWidth) - toNumber(sidebarWidth));
	const maxPanelWidth = available - DOC_FLOOR;

	if (maxPanelWidth >= PANEL_MIN_WIDTH)
	{
		return {
			mode: 'inline',
			width: clamp(PANEL_MIN_WIDTH, desired, maxPanelWidth),
			maxWidth: maxPanelWidth,
		};
	}

	return {
		mode: 'overlay',
		// The outer min() is required: on a very narrow window the panel minimum exceeds the space
		// available, and without it the panel ends up wider than the row and gets clipped by its
		// overflow instead of simply taking whatever is left.
		width: Math.min(available, Math.max(PANEL_MIN_WIDTH, desired)),
		maxWidth: available,
	};
}
