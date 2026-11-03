import Type from '../type';
import {
	type ExtractedAssets,
	type AssetScript,
	type AssetStyle,
	type ExtractAssetsOptions,
} from './types';

/**
 * Script types that carry markup or settings rather than code. A `<script>` of one of these is
 * left where it stands: the consumer reads it out of the markup later.
 *
 * `importmap` is one of them for a different reason: it is read by the browser itself, and its
 * body is JSON. Taken out and evaluated as code it threw a syntax error and the module
 * specifiers it declared were lost.
 */
const DEFAULT_TEMPLATE_TYPES: ReadonlyArray<string> = [
	'text/html',
	'text/template',
	'extension/settings',
	'importmap',
];

const RUN_FIRST_ATTRIBUTE = 'bxrunfirst';

// Frozen because the same object is handed to every caller with nothing to parse, and the
// consumers are legacy JavaScript for which `readonly` is not a constraint.
const EMPTY_RESULT: ExtractedAssets = Object.freeze({
	html: '',
	scripts: Object.freeze([]),
	styles: Object.freeze([]),
});

/**
 * Scans the markup for scripts and stylesheet links and takes them out of it.
 *
 * ## What this does not handle
 *
 * The scan is textual, so it cannot tell a `<script>` element from the same characters inside an
 * attribute value: `<div data-tpl="<script>x()</script>">` is read as a real script, the element
 * is cut apart, and `x()` is handed back to be run. HTML nests and attribute values may contain
 * anything, which a pattern over a flat string cannot express - no arrangement of the
 * expressions below fixes it. Feeding this function markup whose attribute values may carry
 * angle brackets is therefore unsafe, and the caller must know that before choosing it.
 *
 * A parser built on the browser's own tree - `<template>` or `DOMParser` - does not have this
 * hole, and an earlier version of this function was written that way. It cost 15-30x more per
 * call (measured: 0.060 ms against 0.004 ms on a typical 3 KB response, 2.3 ms against 0.2 ms at
 * 100 KB) because it builds every node of the document and serialises the tree back to a string,
 * whether or not anything is extracted. The speed is why this implementation replaced it; the
 * hole above is what that speed costs, and the trade belongs to the caller, not to this file.
 *
 * ## What it does handle
 *
 * The markup is only read, never executed: no element is created and nothing is fetched. Running
 * the collected scripts is left to the caller, exactly as it is with `BX.processHTML`. The
 * result is not sanitised either, and it is not meant to be.
 *
 * Two defects of `BX.processHTML` are not carried over. The expressions are built per call
 * rather than shared at module level, so the search position one call leaves behind cannot reach
 * the next. And the markup is assembled from slices in one pass instead of being rebuilt for
 * every link removed, which is what makes the legacy loop quadratic in the number of
 * stylesheets: at 500 of them it takes 18 ms where this takes 0.6 ms.
 *
 * @example
 * const { html, scripts, styles } = extractAssets('<p>text</p><script>run()</script>');
 * // html === '<p>text</p>', scripts === [{ isInternal: true, text: 'run()', ... }]
 */
export default function extractAssets(data: unknown, options: ExtractAssetsOptions = {}): ExtractedAssets
{
	if (!Type.isStringFilled(data))
	{
		return EMPTY_RESULT;
	}

	// Built here, not shared at module level: expressions carrying the global flag keep a search
	// position between calls, and a shared table is what makes the legacy parser answer
	// differently on a second call for the same input.
	const scriptTag = /<script\b([^>]*)>/gi;
	// `[\s/>]` after the name, then anything up to the bracket: the closing tag may carry a
	// slash or attributes (`</script/>`, `</script foo="bar">`) and the browser honours all of
	// them. Matching only `</script>` leaves the element unclosed here but closed in the browser,
	// and the script then stays in `html` instead of being collected.
	const scriptEnd = /<\/script(?=[\s/>])[^>]*>/gi;

	const scripts: Array<AssetScript> = [];
	// Slices of markup to keep; joined once at the end rather than concatenated in the loop.
	const kept: Array<string> = [];
	let copiedTo = 0;

	const runFirstForAll = options.runFirst === true;
	const templateTypes = options.templateTypes ?? DEFAULT_TEMPLATE_TYPES;

	let match = scriptTag.exec(data);
	for (; match !== null; match = scriptTag.exec(data))
	{
		const attributes = match[1] ?? '';
		scriptEnd.lastIndex = scriptTag.lastIndex;
		const end = scriptEnd.exec(data);
		if (end === null)
		{
			// No closing tag: the rest is markup, as it is for the legacy parser.
			break;
		}

		const parsed = readAttributes(attributes);
		const type = parsed.get('type') ?? null;
		if (type !== null && templateTypes.includes(type))
		{
			// Kept in the markup, so the walk resumes past it without cutting anything out.
			scriptTag.lastIndex = scriptEnd.lastIndex;
			continue;
		}

		kept.push(data.slice(copiedTo, match.index));

		const src = parsed.get('src') ?? null;
		const runFirst = runFirstForAll || parsed.has(RUN_FIRST_ATTRIBUTE);

		if (Type.isStringFilled(src))
		{
			scripts.push({ isInternal: false, src, runFirst, type });
		}
		else
		{
			const body = data.slice(scriptTag.lastIndex, end.index);
			scripts.push({ isInternal: true, text: body, runFirst, type });
		}

		copiedTo = scriptEnd.lastIndex;
		scriptTag.lastIndex = scriptEnd.lastIndex;
	}

	kept.push(data.slice(copiedTo));

	const { html, styles } = collectStyles(kept.join(''));

	return { html, scripts, styles };
}

/**
 * Takes the stylesheet links out of the markup. The markup is assembled from slices in one pass:
 * rebuilding the whole string for every link removed is what makes the legacy loop quadratic in
 * the number of stylesheets.
 */
function collectStyles(data: string): { html: string, styles: Array<AssetStyle> }
{
	const linkTag = /<link\b([^>]*)>/gi;
	const styles: Array<AssetStyle> = [];
	const kept: Array<string> = [];
	let copiedTo = 0;

	for (let link = linkTag.exec(data); link !== null; link = linkTag.exec(data))
	{
		const parsed = readAttributes(link[1] ?? '');
		const href = parsed.get('href') ?? null;

		// A link is removed only once it has been collected: one that is not a stylesheet, or
		// carries no address, stays in the markup rather than vanishing from it.
		if (!isStylesheetLink(parsed) || !Type.isStringFilled(href))
		{
			continue;
		}

		styles.push({ href, media: parsed.get('media') ?? null });
		kept.push(data.slice(copiedTo, link.index));
		copiedTo = linkTag.lastIndex;
	}

	kept.push(data.slice(copiedTo));

	return { html: kept.join(''), styles };
}

/**
 * Walks the text between a tag name and its closing bracket, yielding each attribute once.
 *
 * Reading one attribute by searching the whole string for its name is what makes a scan fragile:
 * `src` is then found inside `data-src`, and inside the value of a neighbour - `onload="this.src=x"`
 * hands back `x` as the address of an external script and the real body is lost. Walking the pairs
 * in order cannot look inside a value, because the value is consumed as part of the pair.
 */
function readAttributes(attributes: string): Map<string, string>
{
	const pair = /([^\s/=>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g;
	const result = new Map<string, string>();

	for (let match = pair.exec(attributes); match !== null; match = pair.exec(attributes))
	{
		const name = match[1].toLowerCase();
		if (!result.has(name))
		{
			result.set(name, match[2] ?? match[3] ?? match[4] ?? '');
		}
	}

	return result;
}

function isStylesheetLink(attributes: Map<string, string>): boolean
{
	if (attributes.get('type') === 'text/css')
	{
		return true;
	}

	const rel = attributes.get('rel');

	return Type.isStringFilled(rel) && rel.toLowerCase().split(/\s+/).includes('stylesheet');
}
