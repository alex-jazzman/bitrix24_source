/**
 * Constants and lookup tables of the legacy layer (MOD-01).
 *
 * The six public constants go into the global namespace; the two tables are internal to the
 * subtree and are imported directly by the modules that read them - no ring passes through them,
 * so late binding buys nothing here.
 */

/**
 * Mouse buttons as a bit mask: `getEventButton` combines them with a bitwise or.
 */
export const MSLEFT = 1;
export const MSMIDDLE = 2;
export const MSRIGHT = 4;

/**
 * Am/pm mode. The types are deliberately uneven - `AM_PM_NONE` is `false`, not `0`, and callers
 * compare `BX.isAmPmMode()` against it strictly.
 */
export const AM_PM_UPPER = 1;
export const AM_PM_LOWER = 2;
export const AM_PM_NONE = false;

/**
 * Lookup tables internal to the subtree. They are imported directly by the two modules that read
 * them - `events.ts` for `eventTypes`, `dom-traverse.ts` for `CHECK_FORM_ELEMENTS` - because no
 * ring passes through them and late binding would buy nothing (ADR 3.4). They are not published
 * into the global namespace and never were.
 */

/**
 * Decides which constructor `fireEvent` uses: these nine names become a MouseEvent, anything else
 * a plain Event.
 */
export const eventTypes: Record<string, string> = {
	click: 'MouseEvent',
	dblclick: 'MouseEvent',
	mousedown: 'MouseEvent',
	mousemove: 'MouseEvent',
	mouseout: 'MouseEvent',
	mouseover: 'MouseEvent',
	mouseup: 'MouseEvent',
	focus: 'MouseEvent',
	blur: 'MouseEvent',
};

export const CHECK_FORM_ELEMENTS = { tagName: /^INPUT|SELECT|TEXTAREA|BUTTON$/i };
