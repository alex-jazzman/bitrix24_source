/**
 * Sizes of the panels the editor floats over the canvas, mirrored from the layout that positions
 * them (`entities/app/ui/app-layout/app-layout.css`). They live here because more than one place
 * counts with them: the width the debug bar is given (`app-layout.js`) and the edges the fit of the
 * overview is told to keep clear (`src/app.js`).
 *
 * The header is not among them - the working area starts below it and the canvas never reaches
 * under it.
 */
export const PANEL_EDGE_GAP = 8;
export const CATALOG_WIDTH_COLLAPSED = 54;
export const CATALOG_WIDTH_EXPANDED = 330;
export const SETTINGS_PANEL_WIDTH = 580;
export const DATA_INSPECTOR_PANEL_WIDTH = 596;

/**
 * Unlike the sizes above, this one mirrors no number of the layout: the layout states no height for
 * the toolbar rows at all - it only pins them to the edge of the canvas - and a row comes out as tall
 * as its own buttons (the 32px controls of `ui.block-diagram` inside the 2px inset of
 * `.editor-chart-app-layout__diagram-controls`).
 *
 * It is therefore the clearance kept for a row rather than a measurement of one, and it only has to
 * be no smaller than the row: a value too large widens the margin the fit leaves, a value too small
 * lets the scheme under the buttons. The round number is the larger of the two on purpose.
 */
export const TOOLBAR_ROW_HEIGHT = 40;

/**
 * How high the layout lifts the bottom toolbar row while the debug bar is open, counted from the
 * bottom edge of the canvas (`.editor-chart-app-layout__bottom-right-toolbar.--margined`): the bar
 * takes the strip below it.
 */
export const DEBUG_BAR_TOOLBAR_OFFSET = 320;
