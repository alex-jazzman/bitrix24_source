import { Type } from 'main.core';

// The single scan of a calculator expression inside the value builder: the draft model, the
// highlight parts and the preview all read this one token stream, and no consumer parses again.

export const MAX_PARSE_LENGTH = 2000;

// MAX_PARSE_LENGTH / 10: a nesting level the builder can produce costs at least ten characters
// (`round(` plus `, N)`), so the limit is out of reach for any chain assembled by clicks and works
// as a guard only for a value typed by hand.
export const MAX_PAREN_DEPTH = 200;

export const TOKEN_KIND = Object.freeze({
	formulaOpen: 'formula-open',
	formulaClose: 'formula-close',
	reference: 'reference',
	string: 'string',
	number: 'number',
	functionName: 'function-name',
	parenOpen: 'paren-open',
	parenClose: 'paren-close',
	comma: 'comma',
	operator: 'operator',
	text: 'text',
	space: 'space',
});

export type RefPartOffsets = {
	start: number,
	end: number,
};

export type RefParts = {
	object: RefPartOffsets | null,
	field: RefPartOffsets | null,
	modifier: RefPartOffsets | null,
	secondModifier: RefPartOffsets | null,
};

export type ExpressionToken = {
	kind: string,
	text: string,
	start: number,
	end: number,
	depth: number | null,
	refParts: RefParts | null,
};

export type TokenizeResult = {
	ok: boolean,
	tokens: Array<ExpressionToken>,
	reason: string | null,
};

const FORMULA_OPEN = '{{=';
const FORMULA_CLOSE = '}}';

// Mirrors bizproc `CBPActivity::ValueSinglePattern` (`bizproc/classes/general/activity.php:42`):
// `{=Object:Field}` with an optional `> mod1` and `, mod2`.
const REFERENCE_SOURCE = '\\{=\\s*(\\w+)\\s*:\\s*([\\w.]+)(?:\\s*>\\s*([\\w:]+)(?:\\s*,\\s*(\\w+))?)?\\s*\\}';

// A lexical pattern per token kind, tried top down at every position: the first match wins. Kinds
// are lexical and not semantic on purpose - a predicate cannot say how `1.2.3`, `0x10` or a lone `-`
// is cut. The operand kinds are disjoint from `\s`, so no kind ever swallows whitespace.
// The number is the decimal form alone: the workflow parser (`bizproc/lib/Calc/Parser.php:151`)
// reads a number as `[\d.]+` and fails on the exponent form, so `1e5` is a text like any other.
const KIND_PATTERNS = Object.freeze([
	{ kind: TOKEN_KIND.reference, source: REFERENCE_SOURCE, flags: 'diy' },
	{ kind: TOKEN_KIND.string, source: '"[^"]*"|\'[^\']*\'', flags: 'y' },
	{ kind: TOKEN_KIND.number, source: '\\d+(?:\\.\\d+)?(?![\\w.])', flags: 'y' },
	{ kind: TOKEN_KIND.functionName, source: '[_a-z]\\w*(?=\\s*\\()', flags: 'iy' },
	{ kind: TOKEN_KIND.parenOpen, source: '\\(', flags: 'y' },
	{ kind: TOKEN_KIND.parenClose, source: '\\)', flags: 'y' },
	{ kind: TOKEN_KIND.comma, source: ',', flags: 'y' },
	{ kind: TOKEN_KIND.operator, source: '[+\\-*/]', flags: 'y' },
	{ kind: TOKEN_KIND.text, source: '[^\\s(),{}"\'+\\-*/]+', flags: 'y' },
	{ kind: TOKEN_KIND.space, source: '\\s+', flags: 'y' },
]);

// One scanner per kind for the whole module: `matchKind` sets `lastIndex` right before every `exec`
// and reads nothing the previous call left behind, so the shared instances hold no state between
// scans - neither between two values, nor between a value and the fragments of its operands.
const SCANNERS: Array<{ kind: string, regex: RegExp }> = KIND_PATTERNS.map(({ kind, source, flags }) => {
	return { kind, regex: new RegExp(source, flags) };
});

const toOffsets = (indices: ?Array<number>): RefPartOffsets | null => {
	return indices ? { start: indices[0], end: indices[1] } : null;
};

/**
 * Offsets of the reference parts, taken from the match itself: without them the highlight builder
 * would have to cut the reference text with a grammar of its own, which is the second parse the
 * single-scan invariant forbids.
 */
const readRefParts = (match: Object): RefParts => {
	const indices = match.indices ?? [];

	return {
		object: toOffsets(indices[1]),
		field: toOffsets(indices[2]),
		modifier: toOffsets(indices[3]),
		secondModifier: toOffsets(indices[4]),
	};
};

const createToken = (
	kind: string,
	value: string,
	start: number,
	end: number,
	extra: Object = {},
): ExpressionToken => {
	return {
		kind,
		text: value.slice(start, end),
		start,
		end,
		depth: extra.depth ?? null,
		refParts: extra.refParts ?? null,
	};
};

const failure = (reason: string): TokenizeResult => {
	return { ok: false, tokens: [], reason };
};

const guardInput = (value: mixed): TokenizeResult | null => {
	if (!Type.isStringFilled(value))
	{
		return failure('empty');
	}

	// Before any pattern runs: the ceiling is the duty of the scanner and not of its caller.
	if (value.length > MAX_PARSE_LENGTH)
	{
		return failure('too-long');
	}

	return null;
};

const matchKind = (value: string, position: number): Object | null => {
	for (const scanner of SCANNERS)
	{
		scanner.regex.lastIndex = position;
		const match = scanner.regex.exec(value);
		if (match !== null)
		{
			return { kind: scanner.kind, match };
		}
	}

	return null;
};

const matchFormulaBrace = (
	value: string,
	position: number,
	openAt: number,
	closeEnd: number,
): ExpressionToken | null => {
	if (position === openAt && value.startsWith(FORMULA_OPEN, position))
	{
		return createToken(TOKEN_KIND.formulaOpen, value, position, position + FORMULA_OPEN.length);
	}

	// Only at the last non-space position: a `}}` anywhere else closes nothing.
	if (value.startsWith(FORMULA_CLOSE, position) && position + FORMULA_CLOSE.length === closeEnd)
	{
		return createToken(TOKEN_KIND.formulaClose, value, position, position + FORMULA_CLOSE.length);
	}

	return null;
};

/**
 * One pass left to right, the index only growing. Covers the value character for character,
 * whitespace included, so `tokens.map((token) => token.text).join('')` gives the input back.
 */
const scanTokens = (value: string): TokenizeResult => {
	const openAt = value.search(/\S/);
	const closeEnd = value.trimEnd().length;
	const tokens = [];
	let position = 0;
	let depth = 0;

	while (position < value.length)
	{
		const brace = matchFormulaBrace(value, position, openAt, closeEnd);
		if (brace !== null)
		{
			tokens.push(brace);
			position = brace.end;
			continue;
		}

		const matched = matchKind(value, position);
		if (matched === null)
		{
			return failure('unknown-token');
		}

		const end = position + matched.match[0].length;

		switch (matched.kind)
		{
			case TOKEN_KIND.parenOpen:
				depth += 1;
				if (depth > MAX_PAREN_DEPTH)
				{
					return failure('too-deep');
				}

				tokens.push(createToken(matched.kind, value, position, end, { depth }));
				break;

			case TOKEN_KIND.parenClose:
				if (depth === 0)
				{
					return failure('unbalanced');
				}

				tokens.push(createToken(matched.kind, value, position, end, { depth }));
				depth -= 1;
				break;

			case TOKEN_KIND.reference:
			{
				const refParts = readRefParts(matched.match);
				tokens.push(createToken(matched.kind, value, position, end, { refParts }));
				break;
			}

			default:
				tokens.push(createToken(matched.kind, value, position, end));
		}

		position = end;
	}

	return depth === 0 ? { ok: true, tokens, reason: null } : failure('unbalanced');
};

const meaningfulTokens = (tokens: Array<ExpressionToken>): Array<ExpressionToken> => {
	return tokens.filter((token: ExpressionToken) => token.kind !== TOKEN_KIND.space);
};

/**
 * A value that is a single reference and nothing else: a field value the builder opens for
 * modification rather than as a formula, and the one stream shape without the formula braces.
 */
export const isSingleReferenceStream = (tokens: Array<ExpressionToken>): boolean => {
	const meaningful = meaningfulTokens(tokens);

	return meaningful.length === 1 && meaningful[0].kind === TOKEN_KIND.reference;
};

const isFormulaStream = (tokens: Array<ExpressionToken>): boolean => {
	const hasOpen = tokens.some((token: ExpressionToken) => token.kind === TOKEN_KIND.formulaOpen);
	const hasClose = tokens.some((token: ExpressionToken) => token.kind === TOKEN_KIND.formulaClose);

	return (hasOpen && hasClose) || isSingleReferenceStream(tokens);
};

/**
 * Tokens of a whole field value. An empty and an unparsable value are different outcomes: the
 * prefill of the builder stands on the difference.
 */
export const tokenizeExpression = (value: mixed): TokenizeResult => {
	const guarded = guardInput(value);
	if (guarded !== null)
	{
		return guarded;
	}

	const scanned = scanTokens(value);
	if (!scanned.ok)
	{
		return scanned;
	}

	return isFormulaStream(scanned.tokens) ? scanned : failure('not-a-formula');
};

/**
 * The same scanner over a piece of a value - one operand of the chain - where the formula braces of
 * a whole value are not expected.
 */
export const tokenizeFragment = (value: mixed): TokenizeResult => {
	return guardInput(value) ?? scanTokens(value);
};
