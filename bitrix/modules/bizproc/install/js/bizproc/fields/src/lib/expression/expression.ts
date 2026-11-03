import { Type } from 'main.core';

/**
 * Marks a bizproc expression: {=Source:Field}, {{...}}, {{=...}} or a leading `=`. Only the
 * marker, not the grammar - reading an expression apart belongs to bizproc itself, while a
 * field type asks no more than "is this a value of mine or an expression standing in for one".
 */
const EXPRESSION_MARKER: RegExp = /^\s*[={]/;

export function isExpressionValue(value: unknown): value is string
{
	return Type.isStringFilled(value) && EXPRESSION_MARKER.test(value);
}

/**
 * Cuts a value string on the commas between its values and on no other. A value may be an
 * expression rather than a plain one, and an expression carries commas of its own: the arguments
 * of `{{=if(strlen({=A:x}) > 0, a, b)}}` are one value, not three. So a comma within braces - at
 * whatever depth, the `{=...}` references nested in a `{{=...}}` included - separates nothing, and
 * only a comma outside them all ends a value.
 *
 * A closing brace that closes nothing takes the depth no lower than zero: an unbalanced string is
 * still cut the way its top-level commas ask for, rather than turned into one value swallowing the
 * rest. The opposite half is deliberately not symmetrical - a brace opened and never closed holds
 * the depth to the end of the string, so everything behind it stays one value. That string is an
 * expression somebody is still typing, and half an expression is of no use to a reader or a form.
 */
export function splitTopLevelValues(text: string): string[]
{
	const values: string[] = [];
	let depth: number = 0;
	let start: number = 0;

	for (let index = 0; index < text.length; index += 1)
	{
		const char = text[index];

		if (char === '{')
		{
			depth += 1;
		}
		else if (char === '}')
		{
			depth = Math.max(depth - 1, 0);
		}
		else if (char === ',' && depth === 0)
		{
			values.push(text.slice(start, index));
			start = index + 1;
		}
	}

	values.push(text.slice(start));

	return values;
}

/**
 * Name of the companion input an expression travels in, the single place that suffix is spelled.
 * The backend reads it back under the same name: Base::extractValueSingle takes request[Field +
 * '_text'] when the field's own value came back empty.
 *
 * Built from the field name rather than the control name on purpose - the control name of a
 * multiple already carries the `[]`, and the companion is one input for the whole field.
 */
export function getExpressionFieldName(fieldName: string): string
{
	return `${fieldName}_text`;
}
