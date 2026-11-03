import { Text, Type } from 'main.core';

import { AUTOMATION_SOURCE } from './automation-notation';
import { findFormulaRanges } from './formula-ranges';

// Mirrors bizproc `CBPActivity::ValueInlinePattern` (`bizproc/classes/general/activity.php`):
// `{=Object:Field}` with an optional `> mod1` and `, mod2`. Kept as a source string so every call
// scans with its own regex and no `lastIndex` leaks between calls.
const REFERENCE_SOURCE = '\\{=\\s*([a-z0-9_]+)\\s*:\\s*([a-z0-9_.]+)(\\s*>\\s*([a-z0-9_:]+)(\\s*,\\s*([a-z0-9_]+))?)?\\s*\\}';

// Ours as well: the scan is linear in the value, but a `{{` that closes nowhere costs the content bound
// of the notation at every position it stands, and the panel scans a value on mount and on every blur. A value of
// hundreds of kilobytes - a document pasted into a field - is shown as it is written rather than held
// for a scan nothing readable can come out of.
const MAX_SCAN_LENGTH = 50000;

const SEGMENT_SOURCE = `${REFERENCE_SOURCE}|${AUTOMATION_SOURCE}`;
const AUTOMATION_GROUP = 7;

const PRINTABLE_SUFFIX = '_printable';
const LABEL_SEPARATOR = '#';
const TEMPLATE_PREFIX = '*:';
const CONSTANT_PREFIX = '&:';

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

export type ExpressionFormulaSegment = {
	kind: 'formula',
	text: string,
};

/**
 * `{{Name}}` of the automation designer: a field of the document named by its caption. The caption is
 * resolved against the catalog of the fields, which the parser knows nothing of, so the segment carries
 * the name as it is written.
 */
export type ExpressionNameSegment = {
	kind: 'name',
	raw: string,
	name: string,
	printable: boolean,
};

export type ExpressionSegment =
	| ExpressionTextSegment
	| ExpressionRefSegment
	| ExpressionFormulaSegment
	| ExpressionNameSegment;

/**
 * Split a field value into plain text, calc formulas and bizproc reference segments.
 * Does not resolve references: an unmatched `{=` stays text by construction, and a reference
 * inside a formula stays part of the formula - a calculation is a single value, not a text around
 * its operands.
 */
export function parseSegments(value: string): Array<ExpressionSegment>
{
	if (!Type.isStringFilled(value))
	{
		return [];
	}

	if (value.length > MAX_SCAN_LENGTH)
	{
		return [{ kind: 'text', text: value }];
	}

	const segments = [];
	let cursor = 0;

	for (const { start, end } of findFormulaRanges(value))
	{
		pushReferences(segments, value.slice(cursor, start));
		segments.push({ kind: 'formula', text: value.slice(start, end) });
		cursor = end;
	}

	pushReferences(segments, value.slice(cursor));

	return segments;
}

function pushReferences(segments: Array<ExpressionSegment>, text: string)
{
	let textStart = 0;

	for (const match of text.matchAll(new RegExp(SEGMENT_SOURCE, 'gi')))
	{
		const segment = Type.isString(match[AUTOMATION_GROUP])
			? createAutomationSegment(match[0], match[AUTOMATION_GROUP])
			: createReferenceSegment(match)
		;

		if (!segment)
		{
			continue;
		}

		pushText(segments, text.slice(textStart, match.index));
		segments.push(segment);
		textStart = match.index + match[0].length;
	}

	pushText(segments, text.slice(textStart));
}

function pushText(segments: Array<ExpressionSegment>, text: string)
{
	if (text !== '')
	{
		segments.push({ kind: 'text', text });
	}
}

/**
 * A `{{...}}` of the automation designer, read the way the server reads it back
 * ({@see \Bitrix\Bizproc\Automation\Helper::unConvertExpressions}): a text starting with `~` names its
 * object itself and becomes an ordinary reference, everything else names a field of the document by its
 * caption. A `~` form written in no known shape is left to the text it came from.
 *
 * The content is read decoded, as the server reads it (`htmlspecialcharsback`): a caption holding `&`
 * or a quote comes from a saved template written out as an entity, and the caption of the field it names
 * holds the character itself. `raw` keeps the notation as it is written - it is what goes back into the
 * value of the field.
 */
function createAutomationSegment(raw: string, mixed: string): ExpressionSegment | null
{
	const decoded = Text.decode(mixed);

	return decoded.startsWith('~') ? createTildeSegment(raw, decoded) : createNameSegment(raw, decoded);
}

/**
 * The `{{...}}` notation read at one position of a value. The presenter of a formula scans its source
 * position by position, so it cannot use the scan of the whole value `parseSegments()` does.
 */
export function readAutomationSegment(source: string, start: number): { segment: ExpressionSegment, end: number } | null
{
	const scanner = new RegExp(AUTOMATION_SOURCE, 'iy');
	scanner.lastIndex = start;

	const match = scanner.exec(source);
	if (!match)
	{
		return null;
	}

	const segment = createAutomationSegment(match[0], match[1]);

	return segment ? { segment, end: start + match[0].length } : null;
}

function createTildeSegment(raw: string, mixed: string): ExpressionRefSegment | null
{
	const labelAt = mixed.indexOf(LABEL_SEPARATOR);
	const body = (labelAt === -1 ? mixed : mixed.slice(0, labelAt)).slice(1).trim();
	let expression = body;

	if (body.startsWith(TEMPLATE_PREFIX))
	{
		expression = `Template${body.slice(1)}`;
	}
	else if (body.startsWith(CONSTANT_PREFIX))
	{
		expression = `Constant${body.slice(1)}`;
	}

	const match = new RegExp(`^${REFERENCE_SOURCE}$`, 'i').exec(`{=${expression}}`);

	return match ? { ...createReferenceSegment(match), raw } : null;
}

function createNameSegment(raw: string, mixed: string): ExpressionNameSegment
{
	const name = mixed.trim();
	const printable = name.endsWith(PRINTABLE_SUFFIX);

	return {
		kind: 'name',
		raw,
		name,
		printable,
	};
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
