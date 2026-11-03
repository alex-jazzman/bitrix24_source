// Declares runtime dependencies that have no direct import in the render tree.
// `main.date` backs the format-date util, the design tokens provide the colours, radii and spacing used by
// the CSS, and the outline icon set carries the glyph CSS for the BIcon controls
// (view toggle and error states). Components with real imports (typography,
// disk icon set, buttons, the BIcon component) are not declared here.
import 'main.date';
import 'ui.design-tokens';
import 'ui.design-tokens.air';
import 'ui.icon-set.outline';
// The solid set carries the clock glyph shown inside the Recent avatar.
import 'ui.icon-set.solid';
