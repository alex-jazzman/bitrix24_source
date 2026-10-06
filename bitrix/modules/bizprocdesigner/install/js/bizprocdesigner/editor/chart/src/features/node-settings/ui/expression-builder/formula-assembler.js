import { Type } from 'main.core';

// Calculator-mode formula assembly and literal-only preview for the expression builder.
// No eval / new Function: preview computes over parsed numeric literals with plain math.

export type PreviewResult =
	| { kind: 'value', value: number }
	| { kind: 'depends-on-data' }
	| { kind: 'warning', code: 'not-a-number' | 'div-by-zero' };

export const CALC_OP = Object.freeze({
	add: 'add',
	subtract: 'subtract',
	multiply: 'multiply',
	divide: 'divide',
	round: 'round',
});

// Operation id -> assembly metadata. `symbol` is the infix operator (null for round).
export const CALC_OPERATIONS = Object.freeze([
	{ id: CALC_OP.add, symbol: '+', labelKey: 'BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_CALC_OP_ADD' },
	{ id: CALC_OP.subtract, symbol: '-', labelKey: 'BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_CALC_OP_SUB' },
	{ id: CALC_OP.multiply, symbol: '*', labelKey: 'BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_CALC_OP_MUL' },
	{ id: CALC_OP.divide, symbol: '/', labelKey: 'BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_CALC_OP_DIV' },
	{ id: CALC_OP.round, symbol: null, labelKey: 'BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_CALC_OP_ROUND' },
]);

export const PREVIEW_KIND = Object.freeze({
	value: 'value',
	dependsOnData: 'depends-on-data',
	warning: 'warning',
});

export const PREVIEW_WARNING = Object.freeze({
	notANumber: 'not-a-number',
	divByZero: 'div-by-zero',
});

/**
 * A source-reference operand is any operand carrying a BP expression reference
 * (`{=...}` or `{{=...}}`): its runtime value is unknown at configuration time.
 */
export function isSourceReference(operand: mixed): boolean
{
	return Type.isString(operand) && (operand.includes('{=') || operand.includes('{{='));
}

function parseLiteralNumber(operand: mixed): { ok: boolean, value?: number }
{
	if (!Type.isString(operand) && !Type.isNumber(operand))
	{
		return { ok: false };
	}

	const str = String(operand).trim();
	if (str === '')
	{
		return { ok: false };
	}

	const num = Number(str);

	return Number.isFinite(num) ? { ok: true, value: num } : { ok: false };
}

function findOperation(operationId: string): ?Object
{
	return CALC_OPERATIONS.find((operation) => operation.id === operationId) ?? null;
}

/**
 * Assemble the wire string from operands (verbatim substitution).
 * operands[0] = A, operands[1] = B (B = digits N for round).
 */
export function assembleFormula(operationId: string, operands: Array<string>): string
{
	const operation = findOperation(operationId);
	if (!operation)
	{
		return '';
	}

	const operandA = operands[0] ?? '';
	const operandB = operands[1] ?? '';

	if (operation.id === CALC_OP.round)
	{
		return `{{=round(${operandA}, ${operandB})}}`;
	}

	return `{{=${operandA} ${operation.symbol} ${operandB}}}`;
}

/**
 * Moves the decimal point through the exponent notation instead of multiplying by a power of ten:
 * `1.005 * 100` is 100.49999999999999 and would round down, while the server rounds 1.005 to 1.01.
 * A value already written with an exponent cannot take a second one — such a number falls back to
 * the multiplication, where the precision it has left no longer matters.
 */
function shiftExponent(value: number, exponent: number): number
{
	if (exponent === 0 || !Number.isFinite(value))
	{
		return value;
	}

	const shifted = Number(`${value}e${exponent}`);

	return Number.isFinite(shifted) ? shifted : value * (10 ** exponent);
}

/**
 * The semantics of the server-side `round((float) $value, (int) $precision)` the workflow will run
 * (bizproc `MathLib::callRound()`): the precision is truncated to an integer and halves are rounded
 * away from zero, unlike `Math.round`, which takes them towards positive infinity.
 */
function roundTo(value: number, digits: number): number
{
	const precision = Math.trunc(digits);
	const scaled = shiftExponent(value, precision);

	return shiftExponent(Math.sign(scaled) * Math.round(Math.abs(scaled)), -precision);
}

/**
 * Preview only for literal operands; any source-reference operand short-circuits to
 * "depends-on-data". Warnings are literal-only (non-numeric literal, or literal division by zero).
 */
export function buildPreview(operands: Array<mixed>, operationId: string): PreviewResult
{
	if (operands.some((operand) => isSourceReference(operand)))
	{
		return { kind: PREVIEW_KIND.dependsOnData };
	}

	const parsed = operands.map((operand) => parseLiteralNumber(operand));
	if (parsed.some((result) => !result.ok))
	{
		return { kind: PREVIEW_KIND.warning, code: PREVIEW_WARNING.notANumber };
	}

	const [a, b] = parsed.map((result) => result.value);

	let result = 0;
	switch (operationId)
	{
		case CALC_OP.add:
			result = a + b;
			break;
		case CALC_OP.subtract:
			result = a - b;
			break;
		case CALC_OP.multiply:
			result = a * b;
			break;
		case CALC_OP.divide:
			if (b === 0)
			{
				return { kind: PREVIEW_KIND.warning, code: PREVIEW_WARNING.divByZero };
			}
			result = a / b;
			break;
		case CALC_OP.round:
			result = roundTo(a, b);
			break;
		default:
			return { kind: PREVIEW_KIND.warning, code: PREVIEW_WARNING.notANumber };
	}

	return { kind: PREVIEW_KIND.value, value: result };
}

// Recognition of an existing field value.

// Cap input length before running any regex (ReDoS safety); longer values stay "raw".
const MAX_PARSE_LENGTH = 2000;

// Mirrors bizproc `Activity::ValueSinglePattern` (anchored, case-insensitive):
// `{=Object:Field}` with an optional `> mod1` and `, mod2`.
const REFERENCE_RE = /^\s*{=\s*(\w+)\s*:\s*([\w.]+)(?:\s*>\s*([\w:]+)(?:\s*,\s*(\w+))?)?\s*}\s*$/i;

// `{{=round(A, N)}}` — the calculator's own round assembly (TBL-OP). Checked before FUNCTION_RE,
// which would otherwise swallow it as a plain function call and lose the operands. Argument classes
// are disjoint from `\s`, `,` and the braces, so every split is unambiguous (see ARITHMETIC_RE).
const ROUND_RE = /^\s*{{=\s*round\s*\(\s*({=[^{}]*}|[^\s(),{}]+)\s*,\s*({=[^{}]*}|[^\s(),{}]+)\s*\)\s*}}\s*$/i;

// `{{=name(...)}}`: recognized by function name only (arguments are not parsed).
const FUNCTION_RE = /^\s*{{=\s*([_a-z]\w*)\s*\([\S\s]*\)\s*}}\s*$/i;

// One binary arithmetic `{{=A op B}}`. Operand token: a `{=...}` reference or a run of
// non-operator, non-brace, non-whitespace characters, with the unary sign the calculator itself
// assembles into the formula (a literal `-1` typed into an operand). Keeping the operand classes
// disjoint from the surrounding `\s*` is what makes the match unambiguous: overlapping classes let
// the engine try every split of a whitespace run and turn a failing match into a polynomial walk.
const ARITHMETIC_RE = /^\s*{{=\s*({=[^{}]*}|[+-]?[^\s*+/{}-]+)\s*([*+/-])\s*({=[^{}]*}|[+-]?[^\s*+/{}-]+)\s*}}\s*$/;

const OPERATOR_TO_OPERATION = Object.freeze({
	'+': CALC_OP.add,
	'-': CALC_OP.subtract,
	'*': CALC_OP.multiply,
	'/': CALC_OP.divide,
});

export const FORMULA_PART = Object.freeze({
	brace: 'brace',
	function: 'function',
	source: 'source',
	operator: 'operator',
	value: 'value',
	modifier: 'modifier',
	plain: 'plain',
});

/**
 * Parse a current field value. Recognizes ONLY: a reference with a single optional modifier
 * (`{=Src:Field > mod}`), one binary arithmetic (`{{=A op B}}`), the round assembly
 * (`{{=round(A, N)}}`) and a function by name (`{{=name(...)}}`). Everything else is `raw`:
 * a ready formula, left unchanged.
 */
export function parseExpression(value: mixed): Object
{
	if (!Type.isStringFilled(value))
	{
		return { kind: 'empty' };
	}

	if (value.length > MAX_PARSE_LENGTH)
	{
		return { kind: 'raw', raw: value };
	}

	const referenceMatch = REFERENCE_RE.exec(value);
	if (referenceMatch)
	{
		// A second modifier has no place in the modification UI (one transform at a time), and
		// prefilling from the first one alone would let Apply rewrite the value without the second.
		// Such a value stays raw, like any value the builder does not understand.
		if (Type.isStringFilled(referenceMatch[4]))
		{
			return { kind: 'raw', raw: value, secondModifier: referenceMatch[4] };
		}

		return {
			kind: 'reference',
			object: referenceMatch[1],
			field: referenceMatch[2],
			modifier: referenceMatch[3] ?? null,
			raw: value,
		};
	}

	const roundMatch = ROUND_RE.exec(value);
	if (roundMatch)
	{
		return {
			kind: 'arithmetic',
			operandA: roundMatch[1],
			operator: null,
			operandB: roundMatch[2],
			operationId: CALC_OP.round,
			raw: value,
		};
	}

	const functionMatch = FUNCTION_RE.exec(value);
	if (functionMatch)
	{
		return { kind: 'function', name: functionMatch[1], raw: value };
	}

	const arithmeticMatch = ARITHMETIC_RE.exec(value);
	if (arithmeticMatch)
	{
		return {
			kind: 'arithmetic',
			operandA: arithmeticMatch[1].trim(),
			operator: arithmeticMatch[2],
			operandB: arithmeticMatch[3].trim(),
			operationId: OPERATOR_TO_OPERATION[arithmeticMatch[2]] ?? null,
			raw: value,
		};
	}

	return { kind: 'raw', raw: value };
}

type FormulaPart = { type: string, text: string };

function operandType(operand: string): string
{
	return isSourceReference(operand) ? FORMULA_PART.source : FORMULA_PART.value;
}

/**
 * Cuts typed parts out of the value itself: every part text is a slice of the source, so spacing
 * and letter case stay the ones that were typed and only the typing around them is ours. Anchors
 * are taken left to right; whatever lies between them stays plain.
 *
 * Once an anchor is not found the slicer is broken: `seek` keeps returning -1 and `push` stops
 * writing, so the methods below need no guards of their own and `finish()` returns null.
 */
function createSlicer(source: string)
{
	const parts: Array<FormulaPart> = [];
	let cursor = 0;
	let broken = false;

	const seek = (token: string, from: number): number => {
		const at = broken ? -1 : source.indexOf(token, from);
		if (at === -1)
		{
			broken = true;
		}

		return at;
	};

	const push = (type: string, from: number, to: number): void => {
		if (broken)
		{
			return;
		}

		if (from > cursor)
		{
			parts.push({ type: FORMULA_PART.plain, text: source.slice(cursor, from) });
		}

		parts.push({ type, text: source.slice(from, to) });
		cursor = to;
	};

	const isSpaceAt = (at: number): boolean => (/\s/).test(source.charAt(at));

	return {
		cut(type: string, token: string): void
		{
			const at = seek(token, cursor);
			push(type, at, at + token.length);
		},

		// A separator with the spacing typed around it: `+` and ` + ` both stay one operator part.
		cutPadded(type: string, token: string): void
		{
			const at = seek(token, cursor);
			if (broken)
			{
				return;
			}

			let from = at;
			while (from > cursor && isSpaceAt(from - 1))
			{
				from--;
			}

			let to = at + token.length;
			while (to < source.length && isSpaceAt(to))
			{
				to++;
			}

			push(type, from, to);
		},

		// The callee name: everything up to `stopToken`, without the spacing around it.
		cutBefore(type: string, stopToken: string): void
		{
			const at = seek(stopToken, cursor);
			if (broken)
			{
				return;
			}

			const head = source.slice(cursor, at);
			const from = cursor + head.length - head.trimStart().length;
			push(type, from, from + head.trim().length);
		},

		// One part from the start of `from` to the end of `to`, so `Src : Field` stays a single
		// chunk together with the spacing typed inside it.
		cutSpan(type: string, from: string, to: string): void
		{
			const start = seek(from, cursor);
			if (broken)
			{
				return;
			}

			const end = seek(to, start + from.length);
			push(type, start, end + to.length);
		},

		// A closing brace: the last occurrence, so a brace inside the arguments is not taken for it.
		cutTail(type: string, token: string): void
		{
			const at = source.lastIndexOf(token);
			if (at < cursor)
			{
				broken = true;
			}

			push(type, at, at + token.length);
		},

		finish(): ?Array<FormulaPart>
		{
			if (broken)
			{
				return null;
			}

			if (cursor < source.length)
			{
				parts.push({ type: FORMULA_PART.plain, text: source.slice(cursor) });
			}

			return parts;
		},
	};
}

/**
 * Break a formula into typed parts (function / source / operator / value / modifier / brace /
 * plain) for highlighting. Parts carry plain text only: the caller renders them as text nodes,
 * never as HTML.
 *
 * The parts always join back into the value character for character: the block is presented as the
 * current value of the field, so a value typed by hand keeps its own spacing and letter case
 * instead of being redrawn in the form the builder would assemble.
 */
export function describeFormulaParts(value: mixed): Array<FormulaPart>
{
	const parsed = parseExpression(value);

	if (parsed.kind === 'empty')
	{
		return [];
	}

	// For a value the slicer cannot map onto the source: the text as it is, never a rebuilt one.
	const untouched = [{ type: FORMULA_PART.plain, text: parsed.raw }];

	if (parsed.kind === 'reference')
	{
		const slicer = createSlicer(parsed.raw);
		slicer.cut(FORMULA_PART.brace, '{=');
		slicer.cutSpan(FORMULA_PART.source, parsed.object, parsed.field);
		if (parsed.modifier)
		{
			slicer.cutPadded(FORMULA_PART.operator, '>');
			slicer.cut(FORMULA_PART.modifier, parsed.modifier);
		}
		slicer.cutTail(FORMULA_PART.brace, '}');

		return slicer.finish() ?? untouched;
	}

	if (parsed.kind === 'function')
	{
		const slicer = createSlicer(parsed.raw);
		slicer.cut(FORMULA_PART.brace, '{{=');
		slicer.cutBefore(FORMULA_PART.function, '(');
		slicer.cutTail(FORMULA_PART.brace, '}}');

		return slicer.finish() ?? untouched;
	}

	if (parsed.kind === 'arithmetic')
	{
		const slicer = createSlicer(parsed.raw);
		slicer.cut(FORMULA_PART.brace, '{{=');

		// round has no infix operator: it stays the call it is assembled into.
		if (parsed.operationId === CALC_OP.round)
		{
			slicer.cutBefore(FORMULA_PART.function, '(');
		}

		slicer.cut(operandType(parsed.operandA), parsed.operandA);
		if (parsed.operator)
		{
			slicer.cutPadded(FORMULA_PART.operator, parsed.operator);
		}
		slicer.cut(operandType(parsed.operandB), parsed.operandB);
		slicer.cutTail(FORMULA_PART.brace, '}}');

		return slicer.finish() ?? untouched;
	}

	return untouched;
}
