import { Browser } from 'main.core';

import { FIT_TO_VIEW_SHORTCUT } from '../../constants';
import { normalizeCombo } from '../input-state/input-state';

/**
 * The actions the canvas owns itself. A consumer names them by these ids - in a catalog of its own
 * and in the set of bindings it hands the registry - so the ids are part of the public surface.
 */
export const CANVAS_ACTION_ID = Object.freeze({
	UNDO: 'canvas.undo',
	REDO: 'canvas.redo',
	COPY: 'canvas.copy',
	PASTE: 'canvas.paste',
	TOGGLE_SEARCH: 'canvas.toggleSearch',
	TOGGLE_MAP: 'canvas.toggleMap',
	ZOOM_IN: 'canvas.zoomIn',
	ZOOM_OUT: 'canvas.zoomOut',
	FIT_TO_VIEW: 'canvas.fitToView',
	NEXT_SEARCH_RESULT: 'canvas.nextSearchResult',
	PREV_SEARCH_RESULT: 'canvas.prevSearchResult',
});

/**
 * The combos those actions ship with. Redo is the one that differs by platform, and the difference
 * lives here rather than at the place of registration: a registration names the action it runs and
 * never the keys that run it.
 *
 * A fresh map on every call, because a consumer merging its own actions into the set works on what
 * it is given - the defaults of the layer are not its to write into.
 *
 * @param {boolean} [isMac]
 * @returns {Map<string, string | null>} canonical combo per action id, null for an action that ships
 *   without one on this platform
 */
export function getCanvasActionDefaults(isMac = Browser.isMac())
{
	return new Map([
		[CANVAS_ACTION_ID.UNDO, normalizeCombo(['Mod', 'z'], isMac)],
		[CANVAS_ACTION_ID.REDO, normalizeCombo(isMac ? ['Mod', 'Shift', 'z'] : ['Mod', 'y'], isMac)],
		[CANVAS_ACTION_ID.COPY, normalizeCombo(['Mod', 'c'], isMac)],
		[CANVAS_ACTION_ID.PASTE, normalizeCombo(['Mod', 'v'], isMac)],
		[CANVAS_ACTION_ID.TOGGLE_SEARCH, normalizeCombo(['Mod', 'f'], isMac)],
		// Shift keeps the combo away from Cmd+M, which minimizes the window on macOS before the page
		// ever sees the press (reserved-combos.ts lists 'meta+keym'): one and the same combo on both
		// platforms instead of an action that ships without a default on one of them.
		[CANVAS_ACTION_ID.TOGGLE_MAP, normalizeCombo(['Mod', 'Shift', 'm'], isMac)],
		[CANVAS_ACTION_ID.ZOOM_IN, normalizeCombo(['Mod', 'Equal'], isMac)],
		[CANVAS_ACTION_ID.ZOOM_OUT, normalizeCombo(['Mod', 'Minus'], isMac)],
		// The only action of the layer whose default types a character, and the one combo among them
		// that reads the same on every platform: no modifier of the platform takes part in it. The keys
		// come from the constant that declares this default, while what the panel and the canvas announce
		// through `aria-keyshortcuts` is read from the registry, so it follows a reassignment. A press
		// into a field being edited is left alone by the input state, as for every action here, and the
		// narrower rule - the command answers only while the focus stands on a surface of the diagram -
		// belongs to the place of registration (`components/zoom-bar/zoom-bar.js`).
		[CANVAS_ACTION_ID.FIT_TO_VIEW, normalizeCombo(FIT_TO_VIEW_SHORTCUT, isMac)],
		[CANVAS_ACTION_ID.NEXT_SEARCH_RESULT, normalizeCombo(['Mod', 'Shift', 'ArrowRight'], isMac)],
		[CANVAS_ACTION_ID.PREV_SEARCH_RESULT, normalizeCombo(['Mod', 'Shift', 'ArrowLeft'], isMac)],
	]);
}
