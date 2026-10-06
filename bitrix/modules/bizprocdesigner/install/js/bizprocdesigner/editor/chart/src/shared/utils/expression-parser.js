import { Type } from 'main.core';

// Mirrors bizproc `CBPActivity::ValueInlinePattern` (`bizproc/classes/general/activity.php`):
// `{=Object:Field}` with an optional `> mod1` and `, mod2`. Kept as a source string so every call
// scans with its own regex and no `lastIndex` leaks between calls.
const REFERENCE_SOURCE = '\\{=\\s*([a-z0-9_]+)\\s*:\\s*([a-z0-9_.]+)(\\s*>\\s*([a-z0-9_:]+)(\\s*,\\s*([a-z0-9_]+))?)?\\s*\\}';

const PRINTABLE_SUFFIX = '_printable';

export type ExpressionTextSegment = {
	kind: 'text',
	text: string,
};

export type ExpressionRefSegment = {
	kind: 'ref',
	raw: string,
	object: string,
	field: string,
	modifier: Array<string>,
	printable: boolean,
};

export type ExpressionSegment = ExpressionTextSegment | ExpressionRefSegment;

/**
 * Split a field value into plain text and bizproc reference segments.
 * Does not resolve references: an unmatched `{=` stays text by construction, and a reference
 * nested in a calc formula is found while the formula wrapper remains text.
 */
export function parseSegments(value: string): Array<ExpressionSegment>
{
	if (!Type.isStringFilled(value))
	{
		return [];
	}

	const segments = [];
	let textStart = 0;

	for (const match of value.matchAll(new RegExp(REFERENCE_SOURCE, 'gi')))
	{
		pushText(segments, value.slice(textStart, match.index));
		segments.push(createReferenceSegment(match));
		textStart = match.index + match[0].length;
	}

	pushText(segments, value.slice(textStart));

	return segments;
}

function pushText(segments: Array<ExpressionSegment>, text: string)
{
	if (text !== '')
	{
		segments.push({ kind: 'text', text });
	}
}

function createReferenceSegment(match: Array<string>): ExpressionRefSegment
{
	const [raw, object, field] = match;
	const modifier = [match[4], match[6]].filter((mod) => Type.isStringFilled(mod));
	const printable = field.endsWith(PRINTABLE_SUFFIX);

	return {
		kind: 'ref',
		raw,
		object,
		field: printable ? field.slice(0, -PRINTABLE_SUFFIX.length) : field,
		modifier,
		printable,
	};
}
