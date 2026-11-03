import { Type } from 'main.core';
// The tokenizer and the recognition live in the extension next to the formula model they parse with;
// taking them from the facade also keeps the scan free of the stores an editor barrel would pull in.
import { MAX_PARSE_LENGTH, recognizeFieldValue, tokenizeExpression } from 'bizprocdesigner.expression-builder';

import { AUTOMATION_SOURCE } from './automation-notation';

// Mirrors bizproc `Activity::CalcInlinePattern`: a formula inside a text. The condition of the
// server's trailing `([^\}]|$)` is kept - a `}}` with one more brace after it does not end a formula -
// but it is checked by a lookahead instead of consuming that character, so formulas standing right
// next to each other are all found. A deliberate divergence: the server consumes it and so skips the
// middle formula (`{{=true()}}{{=false()}}{{=true()}}` calculates to `[true()]{{=false()}}[true()]`).
const INLINE_FORMULA_SOURCE = '\\{\\{=[\\S\\s]*?\\}\\}(?=[^}]|$)';

const BRACED_FORMULA_OPEN = '{{=';

// A `}}` closing a `{{Caption}}` closes no formula: the server calculates no such value at all, it
// unconverts the caption into `{=Object:Field}` first, and the reference it becomes carries no `}}`.
// The scan therefore runs over a copy where every caption is hidden behind a filler of its own length -
// same length, so a range found on the copy holds on the value itself.
// A caption of no known field is hidden too: the catalog of the fields does not reach this layer, and a
// formula over a caption that names nothing is broken whichever way its braces are read.
const CAPTION_MASK_CHAR = '_';

// A match carrying a formula opener is no caption of a field: the server looks up no field of such a
// name either and leaves the match a literal, so the braces inside it are the formula's own.
function maskCaptions(value: string): string
{
	return value.replace(
		new RegExp(AUTOMATION_SOURCE, 'g'),
		(caption: string) => (
			caption.includes(BRACED_FORMULA_OPEN)
				? caption
				: CAPTION_MASK_CHAR.repeat(caption.length)
		),
	);
}

const BARE_FORMULA_OPEN = '=';

/**
 * A `{{= expression }}` taken by the whole value: the server reads such a value with `Calc\Parser`,
 * whose scanner knows string literals, so a `}}` inside a string does not end the formula there. The
 * tokenizer mirrors that scanner and takes the braces only at the ends of the value, so a stream it
 * reads is the whole-value formula the server calculates. A value that is a single reference and no
 * formula at all is a stream it reads too - hence the opening braces are asked for separately.
 */
function isWholeBracedFormula(value: string): boolean
{
	return value.trimStart().startsWith(BRACED_FORMULA_OPEN) && tokenizeExpression(value).ok;
}

/**
 * A value written as `= expression` is the same formula as `{{= expression }}`, so the bare body is
 * asked about in the one shape the recognition reads. The bare form belongs to the whole value only:
 * inline, an equals sign is an ordinary character.
 */
function isWholeBareFormula(value: string): boolean
{
	const trimmed = value.trim();
	if (!trimmed.startsWith(BARE_FORMULA_OPEN))
	{
		return false;
	}

	const kind = recognizeFieldValue(`{{=${trimmed.slice(1)}}}`).kind;

	return kind !== 'raw' && kind !== 'empty';
}

/**
 * Ranges of the value taken by calc formulas, in the order the server tries them: the whole value
 * first - the bare `= expression` form, which has no inline shape at all, and the `{{=...}}` form the
 * tokenizer reads to the end of the value - and the inline pattern only for what is left. The order
 * is the server's own: it hands the whole value to `Calc\Parser` and falls back to the inline pattern
 * when the calculation fails, so a `}}` inside a string literal ends the formula for the inline
 * pattern of both sides alike, and for neither of them when the value is a formula whole.
 * The length cap runs before any pattern, so an over-long value carries no formula at all.
 *
 * The bare form is read narrower than the server reads it, and this is the limit of the contract: the
 * server hands to `Calc\Parser` everything `CBPActivity::CalcPattern` matches, while a whole formula
 * is taken here only when the value builder itself reads the body. Telling a formula from a text
 * starting with `=` takes the very calculation there is none of here, so a value of a shape of its
 * own keeps the tokens of its parts instead of becoming one token of a formula.
 */
export function findFormulaRanges(value: mixed): Array<{ start: number, end: number }>
{
	if (!Type.isStringFilled(value) || value.length > MAX_PARSE_LENGTH)
	{
		return [];
	}

	const masked = maskCaptions(value);

	if (isWholeBareFormula(masked))
	{
		return [{ start: 0, end: value.length }];
	}

	// The masked copy first, so a `}}` of a caption inside the formula closes nothing; then the value
	// itself, for a formula whose own `{{`/`}}` the caption pattern matched - it knows no string literals
	// and no unclosed brace, the tokenizer does.
	// Trimmed: the spaces around a formula are a text of their own, the way the value builder shows them.
	if (isWholeBracedFormula(masked) || isWholeBracedFormula(value))
	{
		return [{ start: value.search(/\S/), end: value.trimEnd().length }];
	}

	const ranges = [];
	for (const match of masked.matchAll(new RegExp(INLINE_FORMULA_SOURCE, 'g')))
	{
		ranges.push({ start: match.index, end: match.index + match[0].length });
	}

	return ranges;
}
