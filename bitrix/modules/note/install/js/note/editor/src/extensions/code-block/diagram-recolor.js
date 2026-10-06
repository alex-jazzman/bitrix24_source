import { parseColor, toDarkColor } from './diagram-palette';

/**
 * Repaints a rendered diagram for a dark surface without asking the engine to draw it again.
 *
 * The engine bakes colors into the SVG, so a theme switch used to mean a full re-render - and layout
 * runs synchronously on the main thread, which is the freeze. Measured on a 120-node flowchart: the
 * re-render costs ~380ms, this pass ~5ms on the same 180KB of markup.
 *
 * Colors are rewritten through the parsed document, not by replacing text in the string: labels are
 * document content, and a node captioned "Error #FF0000" would otherwise have its caption edited.
 * Going through the document is also what tells label paint from plate paint, and the two move in
 * opposite directions (see toDarkColor).
 */

// Presentation attributes that hold a color. Paint servers (url(#gradient)) are values here too, and
// they are left alone - the gradient's own stops get repainted where they are declared.
const COLOR_ATTRIBUTES = Object.freeze([
	'fill',
	'stroke',
	'color',
	'stop-color',
	'flood-color',
	'lighting-color',
]);

// Longest names first so a shorthand does not swallow the specific property.
const COLOR_DECLARATION = new RegExp(
	'(background-color|border-top-color|border-right-color|border-bottom-color|border-left-color'
	+ '|border-color|outline-color|caret-color|stop-color|flood-color|lighting-color|text-shadow'
	+ '|box-shadow|background|border|outline|color|fill|stroke)(\\s*:\\s*)([^;{}]*)',
	'gi',
);

// A stylesheet, split into rules, so a declaration is read together with what it applies to.
const CSS_RULE = /([^{}]*)\{([^{}]*)\}/g;

// `color` always paints text. `fill`/`stroke` depend on what they are applied to - these are the parts
// of a mermaid diagram that carry a label.
const TEXT_ELEMENTS = 'text, tspan, foreignObject';
// sequenceNumber is deliberately absent: those digits sit on a disc that carries no fill of its own and
// inherits it from the root, where the engine writes the text colour - so the disc is dark in a light
// document and light in a dark one. The number has to be the colour of the surface and flip with it,
// which is exactly what a fill does here.
const TEXT_SELECTOR = /\b(text|tspan|span|p|div|label|title)\b|\.(node|edge|cluster|title|actor|section|task|slice|legend)[\w-]*label|labeltext|titletext/i;

// A label's plate is named after the label it sits under - gitGraph draws `.commit-label-bkg` - so the
// name alone reads as text. Checked first, and the plate wins: the two move in opposite directions, and
// a plate left light is a light box in a dark document, while a label left dark is still readable text.
const PLATE_SELECTOR = /bkg|background|\b(bg|rect|box|plate)\b/i;

// A color-valued position can still hold non-colors: keywords, lengths, `!important`, a paint server.
// Every token is offered to the color parser and only a real color is rewritten, so the list of things
// to skip stays short. `url(...)` comes first in the alternation because an id like `#abc123` inside it
// would otherwise read as a hex color.
const VALUE_TOKEN = /url\([^)]*\)|#[0-9a-fA-F]{3,8}\b|(?:rgba?|hsla?)\([^)]*\)|[a-zA-Z]{3,}/g;

// Keywords that mean "no paint" or "whatever the context says". `transparent` does parse as a color
// (black at zero alpha), and rewriting it would swap a plain keyword for an equally invisible triplet.
const KEYWORDS = Object.freeze(['transparent', 'currentcolor', 'inherit', 'initial', 'unset', 'revert']);

function recolorValue(value: string, surface: ?Object, foreground: boolean): string
{
	return value.replace(VALUE_TOKEN, (token: string) => {
		if (token.startsWith('url(') || KEYWORDS.includes(token.toLowerCase()))
		{
			return token;
		}

		const next = toDarkColor(token, surface, foreground);

		return typeof next === 'string' ? next : token;
	});
}

// Some properties say what they paint whatever they are applied to: `color` is always the text, a
// background is always the plate under it. The selector only gets to decide `fill` and `stroke`.
// mermaid draws an edge caption as `.edgeLabel { color; background-color }` - one rule, both roles -
// and reading the whole rule as text turned the caption into a light box with invisible letters.
const FOREGROUND_PROPERTY = /^color$/i;
const PLATE_PROPERTY = /^background/i;

function recolorDeclarations(css: string, surface: ?Object, foreground: boolean): string
{
	return css.replace(
		COLOR_DECLARATION,
		(match: string, property: string, separator: string, value: string) => {
			let paintsText = foreground;
			if (FOREGROUND_PROPERTY.test(property))
			{
				paintsText = true;
			}
			else if (PLATE_PROPERTY.test(property))
			{
				paintsText = false;
			}

			return property + separator + recolorValue(value, surface, paintsText);
		},
	);
}

// A scale is drawn over the surface rather than filled onto it, so its lines belong to the foreground
// with the labels they belong to: read as a plate, a gantt tick came out darker than the surface it
// crosses and the schedule lost its grid, while the light document draws the same line lighter than
// its background.
// Not word-bounded: the names are camelCase as often as not - radarAxisLine, xAxis, gridLine.
const OVERLAY_SELECTOR = /grid|tick|axis|domain/i;

function isForegroundSelector(selector: string): boolean
{
	if (PLATE_SELECTOR.test(selector))
	{
		return false;
	}

	return TEXT_SELECTOR.test(selector) || OVERLAY_SELECTOR.test(selector);
}

function recolorStylesheet(css: string, surface: ?Object): string
{
	return css.replace(
		CSS_RULE,
		(match: string, selector: string, body: string) => (
			selector + '{' + recolorDeclarations(body, surface, isForegroundSelector(selector)) + '}'
		),
	);
}

function recolorElement(element: Element, surface: ?Object): void
{
	// closest() and not a tag check: a label lives inside <foreignObject> as ordinary HTML, several
	// elements deep.
	const foreground = element.closest(TEXT_ELEMENTS) !== null;

	COLOR_ATTRIBUTES.forEach((name: string) => {
		const value = element.getAttribute(name);
		if (value === null || value.trim() === '')
		{
			return;
		}

		const next = recolorValue(value, surface, foreground || name === 'color');
		if (next !== value)
		{
			element.setAttribute(name, next);
		}
	});

	const style = element.getAttribute('style');
	if (style)
	{
		element.setAttribute('style', recolorDeclarations(style, surface, foreground));
	}
}

/**
 * Takes the SVG the engine produced for the light palette and returns it painted for `surface`.
 *
 * Returns the input unchanged when the surface is not a color or the markup holds no root <svg>, so a
 * missing token degrades to the light diagram rather than to a blank frame.
 */
export function recolorSvgForDark(svg: string, surface: ?string): string
{
	const surfaceRgb = parseColor(surface);
	if (!surfaceRgb)
	{
		return svg;
	}

	// Same inert parse as the measuring path, and text/html for the same reason: the engine puts HTML
	// labels in <foreignObject> with unclosed <br>, which is fatal for the XML parser.
	let root = null;
	try
	{
		root = new DOMParser().parseFromString(svg, 'text/html').querySelector('svg');
	}
	catch
	{
		return svg;
	}

	if (!root)
	{
		return svg;
	}

	// The stylesheet carries most of the palette: the engine writes per-class fills there, and the
	// scale colors it derives at render time (hsl(...), named colors) appear nowhere else.
	root.querySelectorAll('style').forEach((element: Element) => {
		element.textContent = recolorStylesheet(element.textContent, surfaceRgb);
	});

	recolorElement(root, surfaceRgb);
	root.querySelectorAll('*').forEach((element: Element) => recolorElement(element, surfaceRgb));

	return root.outerHTML;
}
