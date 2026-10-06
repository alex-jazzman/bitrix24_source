import { Loc, Runtime, Type } from 'main.core';
import { isMobileApp } from '../../utils/open-link';
import { recolorSvgForDark } from './diagram-recolor';

// Diagram source is document content: in a shared document any co-author can put anything here, and
// it renders in the reader's session. So the rendered SVG is treated as hostile output and never
// reaches this document - it goes either into a frame with scripting and same-origin access both
// withheld (see buildDiagramFrame) or into an image, which by the SVG spec cannot script, cannot fire
// an event handler and cannot fetch anything either (see buildDiagramImage). strict mode below is
// output hygiene on top of that boundary, not the boundary itself.
const SANDBOX_ATTR = '';

// The frame is the carrier everywhere it works: its document renders <foreignObject>, so the engine
// keeps its own HTML labels and the diagram gets the geometry it was laid out for. The app's webview is
// the one exception - it never loads a document from srcdoc, the load event does not arrive there under
// any sandbox or CSP, so the diagram is delivered as an image instead. Both the engine configuration
// and the carrier read this single answer: an image drawn from HTML labels is a set of empty plates.
export function usesFrameDelivery(): boolean
{
	return !isMobileApp();
}

// mermaid lays out synchronously on the main thread, so a runaway diagram cannot be interrupted
// once the engine is entered - a promise timeout would resolve while the tab stays frozen. The
// only defence that actually works is refusing oversized input up front.
const MAX_SOURCE_LEN = 20000;

// Diagram colors come from the note design system, not from a built-in mermaid theme. 'base' plus
// these variables is what makes a diagram colourful: from primaryColor the theme derives its whole
// twelve-color scale by rotating hue, and that scale is what paints mindmap sections, chart series and
// gitGraph branches. The engine's own 'dark' instead paints every unstyled node near-black.
const THEME_TOKENS = Object.freeze({
	background: '--ui-color-accent-soft-grey-2',
	primaryColor: '--ui-color-accent-soft-blue-2',
	mainBkg: '--ui-color-accent-soft-blue-2',
	primaryBorderColor: '--ui-color-accent-main-primary',
	nodeBorder: '--ui-color-accent-main-primary',
	primaryTextColor: '--ui-color-base-1',
	textColor: '--ui-color-base-1',
	nodeTextColor: '--ui-color-base-1',
	lineColor: '--ui-color-base-4',
	secondaryColor: '--ui-color-bg-content-primary',
	tertiaryColor: '--ui-color-accent-soft-grey-2',
	clusterBkg: '--ui-color-bg-content-primary',
	clusterBorder: '--ui-color-divider-accent',
	edgeLabelBackground: '--ui-color-accent-soft-grey-2',
	// A sequence step number sits in a circle the engine never fills, so the circle is black - the SVG
	// default. The engine picks the number's colour by inverting lineColor, which with a light palette
	// means dark digits on that black disc. White is what the disc actually needs.
	sequenceNumberColor: '--ui-color-base-8',
});

// The surface a code block is painted on: what the colors get tinted with when a dark document repaints
// the diagram (see diagram-palette).
const SURFACE_TOKEN = '--ui-color-accent-soft-grey-2';

// Ordinary document text: the foreground colour the carrier is given (see foregroundColorRule), and
// what a label falls back to when the engine paints it a colour of its own choosing that our palette
// has made unreadable (see labelColorRule).
const LABEL_TOKEN = '--ui-color-base-1';

// Journey is the one type whose task plate is a fixed width from the config instead of being sized from
// its label, and it does not wrap the label in native text mode - a long one would run over its
// neighbours. Widening the plate to the longest label is the knob the engine offers for exactly this.
// The font is the engine's own default for these labels (taskFontSize/taskFontFamily).
const JOURNEY_TASK_FONT = '14px "Open Sans", sans-serif';
const JOURNEY_PLATE_MIN = 150;
// Past this a row of plates stops fitting any screen, so a label longer than the cap is left to run
// over rather than dragging the whole diagram out of the block.
const JOURNEY_PLATE_MAX = 360;
// boxTextMargin on both sides of the label.
const JOURNEY_PLATE_PADDING = 10;

// Every diagram is drawn once, in the light palette, whatever theme the document is in - a dark one
// repaints the finished SVG instead of asking for another layout. So the tokens are always read in a
// light context: in a dark one they are near-black (--ui-color-accent-soft-blue-2 is #E6F4FF in light
// and #062040 in dark), a twelve-color scale derived from blackness is black, and that is exactly how
// a colourful diagram used to arrive monochrome. The design system declares the tokens for
// ':root, .--ui-context-content-light', so an element carrying this class hands over the light values.
const LIGHT_CONTEXT_CLASS = '--ui-context-content-light';

let enginePromise: Promise<Object> | null = null;
// Per engine, not per module: the configuration is engine state, and a second engine (a stub under
// test) has none of it yet.
const appliedConfig: WeakMap<Object, string> = new WeakMap();
let textMeter = null;
// mermaid keeps global state across render() calls, so renders must not interleave.
let renderChain: Promise<void> = Promise.resolve();
let renderSeq = 0;

// Resolved against the element the diagram actually lives in, so the value is the one in force for the
// surrounding design-system context instead of a guess about the global theme.
function resolveSurface(contextEl: ?HTMLElement): string
{
	return getComputedStyle(contextEl ?? document.body).getPropertyValue(SURFACE_TOKEN).trim();
}

function resolveLabelColor(contextEl: ?HTMLElement): string
{
	return getComputedStyle(contextEl ?? document.body).getPropertyValue(LABEL_TOKEN).trim();
}

function resolveThemeVariables(contextEl: ?HTMLElement): Object
{
	const styles = getComputedStyle(contextEl ?? document.body);
	const variables = {};

	Object.entries(THEME_TOKENS).forEach(([name, token]: [string, string]) => {
		const value = styles.getPropertyValue(token).trim();
		if (value !== '')
		{
			variables[name] = value;
		}
	});

	return variables;
}

// The light values of the tokens, whatever theme the document is in. Custom properties only resolve for
// an element that is in the document, so the probe is attached for the read and taken away again.
function resolveLightThemeVariables(): Object
{
	const probe = document.createElement('div');
	probe.className = LIGHT_CONTEXT_CLASS;
	probe.style.display = 'none';
	document.body.append(probe);

	const variables = resolveThemeVariables(probe);
	probe.remove();

	return variables;
}

function loadEngine(): Promise<Object>
{
	return Runtime.loadExtension('ui.mermaid').then((exports: Object) => {
		const mermaid = exports?.mermaid;
		if (!mermaid || !Type.isFunction(mermaid.render) || !Type.isFunction(mermaid.initialize))
		{
			throw new Error('ui.mermaid: unexpected extension exports');
		}

		return mermaid;
	});
}

export function ensureMermaid(): Promise<Object>
{
	if (enginePromise === null)
	{
		// Drop a failed promise instead of caching it: a transient load failure must not
		// disable diagrams for the rest of the session.
		enginePromise = loadEngine().catch((error: Error) => {
			enginePromise = null;

			throw error;
		});
	}

	return enginePromise;
}

function measureTextWidth(text: string, font: string): number
{
	textMeter ??= document.createElement('canvas').getContext('2d');
	if (!textMeter)
	{
		return 0;
	}

	textMeter.font = font;

	return textMeter.measureText(text).width;
}

// Null for every other type: the plate width only exists in the journey config, and handing it over
// where it means nothing would just make the configuration read as if it did.
function resolveJourneyPlateWidth(source: string): ?number
{
	if (!/^\s*journey\b/.test(source))
	{
		return null;
	}

	let widest = 0;
	source.split('\n').forEach((line: string) => {
		// A task line is `label: score: actor`, so the label is what stands before the first colon.
		// Everything else in the source either has no colon or is a keyword line.
		const label = line.split(':')[0].trim();
		if (label !== '' && !/^(journey|title|section)\b/.test(label))
		{
			widest = Math.max(widest, measureTextWidth(label, JOURNEY_TASK_FONT));
		}
	});

	if (widest === 0)
	{
		return null;
	}

	return Math.min(JOURNEY_PLATE_MAX, Math.max(JOURNEY_PLATE_MIN, Math.ceil(widest) + JOURNEY_PLATE_PADDING));
}

// The label settings the image path needs, and only it. The frame keeps the engine's own defaults
// instead: it renders <foreignObject>, so labels stay HTML, the engine wraps and measures them itself,
// and the layout is the one every diagram type was tuned for - native text makes a mindmap's central
// label drift off its node and packs the geometry tighter than the type expects.
function nativeLabelConfig(): Object
{
	return {
		// Labels as native <text>, never inside <foreignObject>. An SVG shown as an image renders no
		// foreignObject at all (that is what the image delivery rests on, see buildDiagramImage), so a
		// diagram drawn with HTML labels would arrive as a set of empty plates. The engine wraps native
		// labels itself and sizes plates from the wrapped text, so the geometry stays workable.
		htmlLabels: false,
		flowchart: { htmlLabels: false },
		class: { htmlLabels: false },
		state: { htmlLabels: false },
		// journey ignores htmlLabels and picks its label renderer by this key: 'fo' is foreignObject,
		// anything else is native text.
		journey: { textPlacement: 'tspan' },
	};
}

// Whichever way the label is drawn, a journey plate is a fixed width from the config, so a long label
// either runs over its neighbour (native text, which does not wrap here) or wraps to a third line and
// spills out the bottom of the plate (HTML). Widening the plate to the longest label is the knob the
// engine offers for exactly this, and both deliveries need it.
function journeySection(source: string, native: Object): Object
{
	const width = resolveJourneyPlateWidth(source);
	const journey = { ...native.journey, ...(width === null ? {} : { width }) };

	return Object.keys(journey).length === 0 ? {} : { journey };
}

function applyEngineConfig(mermaid: Object, source: string): void
{
	const variables = resolveLightThemeVariables();
	const native = usesFrameDelivery() ? {} : nativeLabelConfig();
	const config = {
		startOnLoad: false,
		securityLevel: 'strict',
		theme: 'base',
		// 'base' plus these variables is what makes a diagram colourful: from primaryColor the theme
		// derives its whole twelve-color scale by rotating hue, and that scale paints mindmap sections,
		// chart series and gitGraph branches. Per-node `style` directives inside the diagram still win
		// over all of it. A dark document repaints the result (see themeDiagramSvg) instead of getting a
		// palette of its own.
		themeVariables: variables,
		// Without this the engine answers a broken diagram by DRAWING an error picture ("Syntax
		// error in text") into the page and then throwing - and it skips its own cleanup on that
		// path, so the error diagram stays in <body> for good. With the flag it cleans up and just
		// throws. Both this and securityLevel are `secure` keys in mermaid, so a diagram cannot
		// turn them off with an %%{init}%% directive.
		suppressErrorRendering: true,
		...native,
		...journeySection(source, native),
	};

	// initialize() rebuilds the whole configuration from defaults rather than merging into what is
	// already there, so the cache key has to cover all of it - a journey plate width from a previous
	// diagram must not be what decides whether the palette gets applied. It also keeps the two delivery
	// modes apart: the settings differ, so the key differs and neither reuses the other's engine state.
	const next = JSON.stringify(config);
	if (next === appliedConfig.get(mermaid))
	{
		return;
	}

	mermaid.initialize(config);
	appliedConfig.set(mermaid, next);
}

/**
 * Paints an already rendered diagram for the theme in force around it.
 *
 * Colors are baked into the SVG, so this used to be a re-render. Layout is synchronous on the main
 * thread - measured at ~380ms for a 120-node flowchart - which is what froze the page on every theme
 * switch. Repainting the finished markup costs ~5ms on the same diagram.
 */
export function themeDiagramSvg(svg: string, theme: ?string, contextEl: ?HTMLElement = null): string
{
	return theme === 'dark' ? recolorSvgForDark(svg, resolveSurface(contextEl)) : svg;
}

// The engine mounts scratch nodes in this document while rendering, derived from the id we give it
// (see mermaid render: 'd' + id for the container, 'i' + id for the sandbox iframe). It normally
// takes them away itself; anything still here afterwards is debris and must not be left in the page.
function removeEngineScratch(id: string): void
{
	[`d${id}`, `i${id}`, id].forEach((scratchId: string) => {
		document.getElementById(scratchId)?.remove();
	});
}

/**
 * Turns mermaid source into an SVG string, or null when the source is not a valid diagram.
 *
 * Takes the engine as an argument so the syntax gate and the cleanup can be tested without
 * loading the real one.
 */
export async function renderDiagramSvg(engine: Object, id: string, source: string): Promise<?string>
{
	try
	{
		applyEngineConfig(engine, source);

		// Syntax gate before render: parse() only parses (no DOM at all) and answers false instead
		// of throwing, so a broken diagram degrades to its source without the engine ever getting
		// near the page.
		const parsed = await engine.parse(source, { suppressErrors: true });
		if (!parsed)
		{
			return null;
		}

		const { svg } = await engine.render(id, source);

		return svg;
	}
	finally
	{
		removeEngineScratch(id);
	}
}

// Layout runs synchronously on the main thread, so a queue of diagrams is one long freeze: the mode
// switch that started it cannot paint until the last one is done. A full task boundary before each
// render lets the browser draw what it already has, so the reader sees the page move on and the
// diagrams fill in one after another.
function yieldToBrowser(): Promise<void>
{
	return new Promise((resolve: Function) => {
		setTimeout(resolve, 0);
	});
}

function enqueueRender(task: () => Promise<string>): Promise<string>
{
	const result = renderChain.then(() => yieldToBrowser()).then(() => task());
	renderChain = result.then(() => {}, () => {});

	return result;
}

let visibilityObserver = null;
const visibilityWaiters: WeakMap<Element, Function> = new WeakMap();

// One shared observer for every diagram block in the document.
function getVisibilityObserver(): ?Object
{
	if (visibilityObserver === null && typeof IntersectionObserver === 'function')
	{
		visibilityObserver = new IntersectionObserver((entries: Array<Object>) => {
			entries.forEach((entry: Object) => {
				if (!entry.isIntersecting)
				{
					return;
				}

				const waiter = visibilityWaiters.get(entry.target);
				visibilityWaiters.delete(entry.target);
				visibilityObserver.unobserve(entry.target);
				waiter?.();
			});
		}, { rootMargin: '300px' });
	}

	return visibilityObserver;
}

/**
 * Calls back once the element is on screen (or close to it), and returns a cancel function.
 *
 * A document can hold many diagrams, and drawing the ones nobody has scrolled to yet costs the same
 * blocking layout as the visible ones. The callback also lands after the current frame, which is
 * what keeps a mode switch from waiting on any rendering at all.
 */
export function whenVisible(element: HTMLElement, callback: Function): Function
{
	const observer = getVisibilityObserver();
	if (!observer)
	{
		// No observer support: keep the ordering guarantee (never render inside the caller's frame)
		// and just draw everything.
		const timer = setTimeout(callback, 0);

		return () => clearTimeout(timer);
	}

	visibilityWaiters.set(element, callback);
	observer.observe(element);

	return () => {
		visibilityWaiters.delete(element);
		observer.unobserve(element);
	};
}

// The SVG string is untrusted, so it must not touch the live DOM to be measured: DOMParser yields
// an inert document (no scripts, no subresource loads) that is safe to read attributes from.
//
// Parsed as text/html, NOT image/svg+xml: the engine puts HTML labels in <foreignObject> and emits
// unclosed <br> there, which is valid HTML but a fatal error for the XML parser. Measuring used to
// fail on every diagram with a <br/> in a label, and a failed measure leaves the frame at its
// default 150px height - the diagram was simply cut off.
function measureSvg(svg: string): ?Object
{
	let root = null;
	try
	{
		root = new DOMParser().parseFromString(svg, 'text/html').querySelector('svg');
	}
	catch
	{
		return null;
	}

	if (!root)
	{
		return null;
	}

	const viewBox = (root.getAttribute('viewBox') ?? '').trim().split(/[\s,]+/).map(Number);
	if (viewBox.length === 4 && viewBox[2] > 0 && viewBox[3] > 0)
	{
		return { width: viewBox[2], height: viewBox[3] };
	}

	// Only absolute values: mermaid often sizes the root as width="100%", and parseFloat would
	// happily read that as 100 units and pin a nonsense ratio.
	const width = parseAbsoluteLength(root.getAttribute('width'));
	const height = parseAbsoluteLength(root.getAttribute('height'));

	return width && height ? { width, height } : null;
}

function parseAbsoluteLength(value: ?string): ?number
{
	const match = /^\s*(\d+(?:\.\d+)?)(?:px)?\s*$/.exec(value ?? '');
	const parsed = match ? Number.parseFloat(match[1]) : 0;

	return parsed > 0 ? parsed : null;
}

const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';

// Worn by whichever carrier the diagram arrived in, so the viewport and its stylesheet never have to
// know which one that was.
export const DIAGRAM_MEDIA_CLASS = 'note-editor-diagram-media';

export const DIAGRAM_IMAGE_CLASS = 'note-editor-diagram-image';

// A gantt draws its scale as stroke="currentColor", and nothing in a carrier ever sets `color`: an
// image has no document to inherit it from, and the frame's document has no rule for it either. The
// property falls back to its initial value, every tick comes out black, and on a dark surface that is a
// grid of near-invisible strokes. So the root is told what the foreground colour is - the same one the
// labels use - and currentColor resolves against the theme instead of against nothing.
function foregroundColorRule(color: string): string
{
	return `svg{color:${color}}`;
}

// The diagram's own proportions are pinned from outside whichever carrier it went into: a frame with
// scripting withheld cannot measure itself or react to a resize, and an image has no say in the box it
// is given. With the ratio pinned, height follows width at any container size.
function applyMediaSize(media: HTMLElement, svg: string): void
{
	const box = measureSvg(svg);
	if (!box)
	{
		media.style.width = '100%';

		return;
	}

	// Never upscale past the diagram's natural size, but shrink freely on narrow screens.
	media.style.width = `min(100%, ${Math.round(box.width)}px)`;
	media.style.aspectRatio = `${box.width} / ${box.height}`;
	// Kept on the element so zooming can work from the diagram's own size without re-measuring.
	media.dataset.naturalWidth = String(box.width);
	media.dataset.naturalHeight = String(box.height);
}

function wrapSvg(svg: string, contextEl: ?HTMLElement): string
{
	// Nothing scripts inside the frame, so the document cannot report its own size or react to
	// resize. The SVG scales itself to the frame box instead, and the frame keeps the diagram's
	// aspect ratio (see applyMediaSize), so height follows width at any container size.
	//
	// max-width has to be forced off: with useMaxWidth (the engine's default) it writes
	// style="max-width: {layout width}px" onto the root <svg> itself, and an inline declaration beats
	// a plain rule from here. That cap equals the viewBox width, so zooming past it grew the frame
	// while the diagram inside stayed at its natural size and slid out of view.
	//
	// The empty sandbox stops the diagram from running code; the policy stops it from reaching the
	// network. The engine's strict mode strips event handlers out of a label but keeps the tag, so a
	// co-author could leave `<img src="http://...">` in a caption and have every reader's browser fetch
	// it - a beacon that reports who opened the document. A diagram needs no network at all: its markup
	// is inline, and fonts are named, not loaded. `data:` stays allowed so a self-contained image still
	// shows. Inline styles are the engine's own palette and the rules below.
	const labelColor = resolveLabelColor(contextEl);

	return '<!doctype html><meta charset="utf-8">'
		+ '<meta http-equiv="Content-Security-Policy" '
		+ `content="default-src 'none'; style-src 'unsafe-inline'; img-src data:; font-src data:">`
		+ '<style>html,body{margin:0;padding:0;background:transparent;overflow:hidden}'
		+ 'svg{display:block;width:100%!important;max-width:none!important;height:auto}'
		+ (labelColor === '' ? '' : foregroundColorRule(labelColor))
		+ '</style>'
		+ svg;
}

/**
 * Wraps an already rendered SVG into the sandboxed frame it is allowed to be shown in.
 *
 * The isolation the frame delivery rests on: the diagram gets a browsing context of its own, but one
 * with neither scripting nor this origin, so nothing in it can run and nothing in it can read the
 * document around it. Putting the same markup into this document is what would remove the boundary.
 *
 * Exported so the sandbox invariant can be asserted without starting the engine.
 */
export function buildDiagramFrame(svg: string, contextEl: ?HTMLElement = null): HTMLIFrameElement
{
	const iframe = document.createElement('iframe');
	iframe.className = DIAGRAM_MEDIA_CLASS;
	// Hard XSS boundary. Adding allow-scripts or allow-same-origin here removes the
	// isolation this whole approach is built on.
	iframe.setAttribute('sandbox', SANDBOX_ATTR);
	iframe.setAttribute('referrerpolicy', 'no-referrer');
	iframe.setAttribute('scrolling', 'no');
	// A frame without a name is announced as "frame" and nothing else, and the diagram is the whole
	// point of the block. The title is what a reader hears in its place.
	iframe.setAttribute('title', Loc.getMessage('NOTE_EDITOR_DIAGRAM_FRAME'));
	iframe.srcdoc = wrapSvg(svg, contextEl);

	applyMediaSize(iframe, svg);

	return iframe;
}

// An image is parsed as strict XML, unlike the same markup inside this document, and the engine does
// not always emit well-formed output: a C4 diagram references its icons with xlink:href while the root
// never declares that prefix, and an undeclared prefix is a fatal error - the diagram then simply does
// not decode. Instead of patching the symptoms one type at a time, the markup goes through the lenient
// HTML parser (which knows the foreign-content rules and puts xlink where it belongs) and comes back
// out through the XML serializer, so what leaves here is well-formed for every type.
//
// The sizing rule rides along in the same pass. With useMaxWidth (the engine's default) the engine
// writes style="max-width: {layout width}px" onto the root itself, and that cap equals the viewBox
// width - a zoomed diagram would stop growing at its natural size while the box around it kept going.
// An inline declaration is only outranked by an important one from a stylesheet, and the only
// stylesheet an image obeys is the one inside it.
//
// Parsing does not make the markup live: the parsed document is inert, so nothing is fetched and
// nothing runs, and what comes out is on its way into an image either way.
// A label often shares its class with the plate behind it - a journey section names both its plate and
// its title `section-type-0` - and a `fill` from the engine's own stylesheet outranks the `fill`
// attribute on the element. Native labels therefore came out painted the colour of their own plate and
// vanished: with HTML labels the clash could not happen, because those took a `color` instead. The
// element's own colour is promoted to an inline declaration, which outranks the stylesheet in turn.
function promoteTextColors(root: Element): void
{
	root.querySelectorAll('text[fill], tspan[fill]').forEach((label: Element) => {
		// An inline fill of its own is already the strongest thing there is - leave it alone.
		if (label.style.fill === '')
		{
			label.style.fill = label.getAttribute('fill');
		}
	});
}

// journey names its plate and its own title `section-type-N`, and the engine's stylesheet paints that
// class - so our palette lightens the plate and takes the label with it. The label colour the engine
// wrote is no help either: it is hard-coded white (the renderer captures sectionColours once at load,
// which is why no configuration reaches it), and white on a pale plate is nothing at all. So these
// labels are told to be ordinary document text, and this rule outranks the promotion below on purpose.
function labelColorRule(color: string): string
{
	return `text.journey-section,text.task{fill:${color}!important}`;
}

function prepareSvgForImage(svg: string, contextEl: ?HTMLElement): string
{
	const root = new DOMParser().parseFromString(svg, 'text/html').querySelector('svg');
	if (!root)
	{
		return svg;
	}

	const labelColor = resolveLabelColor(contextEl);
	const style = document.createElementNS(SVG_NAMESPACE, 'style');
	style.textContent = 'svg{max-width:none!important;width:100%;height:100%}'
		+ (labelColor === '' ? '' : foregroundColorRule(labelColor) + labelColorRule(labelColor));
	root.prepend(style);
	promoteTextColors(root);

	return new XMLSerializer().serializeToString(root);
}

// base64 rather than percent-encoding: labels here are mostly non-ASCII, and every such character
// costs six characters percent-encoded against four thirds of a byte in base64. Chunked because a
// 200 KB diagram is more arguments than fromCharCode takes in one call.
function svgToDataUri(svg: string): string
{
	const bytes = new TextEncoder().encode(svg);
	const CHUNK = 0x8000;
	let binary = '';

	for (let offset = 0; offset < bytes.length; offset += CHUNK)
	{
		binary += String.fromCharCode(...bytes.subarray(offset, offset + CHUNK));
	}

	return `data:image/svg+xml;base64,${btoa(binary)}`;
}

/**
 * Wraps an already rendered SVG into the inert image it is allowed to be shown in.
 *
 * The isolation the image delivery rests on. An SVG referenced by `<img>` is rendered in the secure
 * static mode of the SVG spec: it gets no browsing context at all, so scripts never run, event handlers
 * never fire, and no subresource is ever fetched - not because those were configured away, but because
 * an image has no way to do any of it. Putting the same markup into this document, or into a frame that
 * is allowed to script, is what would remove the boundary.
 *
 * Exported so that invariant can be asserted without starting the engine.
 */
export function buildDiagramImage(svg: string, contextEl: ?HTMLElement = null): HTMLImageElement
{
	const image = document.createElement('img');
	// The editor caps every picture in the text at the column width. This one is not part of the text -
	// its size belongs to the zoom - so the second class is what takes it out of that rule.
	image.className = `${DIAGRAM_MEDIA_CLASS} ${DIAGRAM_IMAGE_CLASS}`;
	image.src = svgToDataUri(prepareSvgForImage(svg, contextEl));
	// The picture is the whole point of the block, and a reader with a screen reader hears this in its
	// place. The diagram's own text is inside the image and unreachable from the outside either way.
	image.alt = Loc.getMessage('NOTE_EDITOR_DIAGRAM_FRAME');
	// Otherwise a stray drag drops a data-URI image somewhere else in the document.
	image.draggable = false;

	applyMediaSize(image, svg);

	return image;
}

/**
 * Renders mermaid source into an SVG string, loading the engine on first use.
 *
 * Theme-independent on purpose: the result is what the caller keeps and repaints per theme, so a theme
 * switch never costs another layout. Returns null when the diagram cannot be shown (oversized source,
 * invalid syntax, engine unavailable) - the caller then keeps the raw source visible. Never throws and
 * never leaves the editor in a broken state.
 */
export async function renderDiagramSource(source: ?string): Promise<?string>
{
	const text = Type.isString(source) ? source : '';
	if (text.trim() === '' || text.length > MAX_SOURCE_LEN)
	{
		return null;
	}

	try
	{
		const mermaid = await ensureMermaid();

		return await enqueueRender(() => renderDiagramSvg(mermaid, `note-mermaid-${++renderSeq}`, text));
	}
	catch
	{
		return null;
	}
}
