import { Type } from 'main.core';

import {
	isSingleReferenceStream,
	tokenizeExpression,
	tokenizeFragment,
	MAX_PARSE_LENGTH,
	TOKEN_KIND,
	type ExpressionToken,
} from '../expression-tokenizer/expression-tokenizer';

// The flat n-ary draft of a calculator formula: operands, one sign per gap between neighbours and
// non-overlapping, non-nested groups. Assembly, reading back, preview and highlight parts all live
// here, over the single token stream of `expression-tokenizer`. No `eval` and no `new Function`:
// the preview computes over parsed numeric literals with plain math.

export const CALC_OP = Object.freeze({
	add: 'add',
	subtract: 'subtract',
	multiply: 'multiply',
	divide: 'divide',
	round: 'round',
});

// Operation id -> assembly metadata. `symbol` is the infix operator (null for round, whose scope is
// the whole prefix of the chain) and the only field the assembly reads. `displaySymbol` is the sign
// shown in the chain: a display-only field, never part of an assembled expression.
export const CALC_OPERATIONS = Object.freeze([
	{
		id: CALC_OP.add,
		symbol: '+',
		displaySymbol: '+',
		labelKey: 'BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_CALC_OP_ADD',
	},
	{
		id: CALC_OP.subtract,
		symbol: '-',
		displaySymbol: '−',
		labelKey: 'BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_CALC_OP_SUB',
	},
	{
		id: CALC_OP.multiply,
		symbol: '*',
		displaySymbol: '×',
		labelKey: 'BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_CALC_OP_MUL',
	},
	{
		id: CALC_OP.divide,
		symbol: '/',
		displaySymbol: '÷',
		labelKey: 'BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_CALC_OP_DIV',
	},
	{
		id: CALC_OP.round,
		symbol: null,
		displaySymbol: '≈',
		labelKey: 'BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_CALC_OP_ROUND',
	},
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

export const FORMULA_PART = Object.freeze({
	brace: 'brace',
	function: 'function',
	source: 'source',
	modifier: 'modifier',
	operator: 'operator',
	number: 'number',
	value: 'value',
	plain: 'plain',
	paren: 'paren',
});

export type FormulaGroup = {
	from: number,
	to: number,
};

export type FormulaDraft = {
	operands: Array<string>,
	signs: Array<string>,
	groups: Array<FormulaGroup>,
};

export type PreviewResult =
	| { kind: 'value', value: number }
	| { kind: 'depends-on-data' }
	| { kind: 'warning', code: 'not-a-number' | 'div-by-zero' };

export type FormulaPart = {
	type: string,
	text: string,
	depth: number | null,
};

const ROUND_FUNCTION_NAME = 'round';

const OPERATION_BY_ID = new Map(CALC_OPERATIONS.map((operation: Object) => [operation.id, operation]));

const OPERATION_BY_SYMBOL = Object.freeze({
	'+': CALC_OP.add,
	'-': CALC_OP.subtract,
	'*': CALC_OP.multiply,
	'/': CALC_OP.divide,
});

/**
 * The kinds of token a term is made of - the operands the workflow parser reads and no others
 * (`bizproc/lib/Calc/Parser.php`): unquoted text is a syntax error there, so `abc`, `1e5` and `0x10`
 * are terms of nothing, and a chain assembled around one would be saved only to fall on the start of
 * the process. None of the kinds carries a parenthesis or a formula brace of its own - a reference
 * and a number exclude both lexically, and a string is scanned whole - which is what
 * `isSingleTermOperand` stands on, so the table is exported for the test that walks it.
 */
export const TERM_TOKEN_KINDS = Object.freeze([
	TOKEN_KIND.reference,
	TOKEN_KIND.number,
	TOKEN_KIND.string,
]);

/**
 * A source-reference operand is any operand carrying a BP expression reference
 * (`{=...}` or `{{=...}}`): its runtime value is unknown at configuration time.
 */
export const isSourceReference = (operand: mixed): boolean => {
	return Type.isString(operand) && (operand.includes('{=') || operand.includes('{{='));
};

const isTermToken = (token: ?ExpressionToken): boolean => {
	return Boolean(token) && TERM_TOKEN_KINDS.includes(token.kind);
};

const isUnarySignToken = (token: ?ExpressionToken): boolean => {
	return Boolean(token) && token.kind === TOKEN_KIND.operator && (token.text === '+' || token.text === '-');
};

/**
 * The term a fragment consists of, past the unary sign the chain grammar absorbs into the operand,
 * or `null` for a fragment that is not one term. The stream is gapless, so spacing of its own would
 * make the fragment longer than two tokens - and a padded operand would come back from the round
 * trip trimmed.
 */
const readSingleTerm = (text: mixed): ExpressionToken | null => {
	const { ok, tokens } = tokenizeFragment(text);
	if (!ok)
	{
		return null;
	}

	if (tokens.length === 1)
	{
		return isTermToken(tokens[0]) ? tokens[0] : null;
	}

	const isSignedTerm = tokens.length === 2 && isUnarySignToken(tokens[0]) && isTermToken(tokens[1]);

	return isSignedTerm ? tokens[1] : null;
};

/** One operand of the chain: a single term, carrying the unary sign of its own. */
export const isSingleTerm = (text: mixed): boolean => {
	return readSingleTerm(text) !== null;
};

/**
 * The number the operand stands for, read by the grammar of the scanner and not by `Number()`: the
 * cast also takes the radix literals `0x10`, `0b1`, `0o7` and the exponent form `1e5`, and none of
 * those is a number to the workflow - the first three it casts to zero, the last it does not parse
 * at all. An operand that is a number already comes in as it is: there is no text anyone typed.
 */
const parseLiteralNumber = (operand: mixed): { ok: boolean, value?: number } => {
	if (Type.isNumber(operand))
	{
		return Number.isFinite(operand) ? { ok: true, value: operand } : { ok: false };
	}

	if (!Type.isString(operand))
	{
		return { ok: false };
	}

	const text = operand.trim();
	if (readSingleTerm(text)?.kind !== TOKEN_KIND.number)
	{
		return { ok: false };
	}

	const parsed = Number(text);

	return Number.isFinite(parsed) ? { ok: true, value: parsed } : { ok: false };
};

/**
 * A numeric-literal operand: what the preview computes over, and the same check the chain paints its
 * operands by. One check and not two on purpose: an operand painted as a string would otherwise get
 * a computed result promised under the chain, one the workflow would not give.
 */
export const isNumberLiteral = (operand: mixed): boolean => {
	return parseLiteralNumber(operand).ok;
};

const FORMULA_BRACES_LENGTH = '{{=}}'.length;

/**
 * The length half of `isSingleTermOperand`, asked on its own: the formula of this one operand alone
 * still fits the parse. Separate from the form on purpose - the scan refuses an input past the
 * ceiling before it reads a single token (`guardInput` of the tokenizer), so every operand longer
 * than that answers "not a term" to `isSingleTerm` no matter how it is written. A caller that asks
 * about the form first would name a length as a broken form, and send the one who filled the
 * operand to fix what is not broken.
 */
export const fitsOperandLength = (operand: mixed): boolean => {
	return Type.isString(operand) && operand.length + FORMULA_BRACES_LENGTH <= MAX_PARSE_LENGTH;
};

/**
 * Whether the text can stand as one operand of the chain: it is a single term, and the formula of
 * that one operand alone still fits the parse. The exact answer `isCanonicalDraft` gives for a chain
 * of a single operand, and the entry to ask it with per operand - one scan of the fragment instead
 * of assembling and reading a whole formula for every operand of the chain.
 *
 * The two answers meet only because no kind of term can carry a parenthesis or a formula brace of
 * its own (see TERM_TOKEN_KINDS): the balance and the depth the whole formula is read by are those
 * of the braces the assembly puts around the operand, and there is nothing left for the round trip
 * to reject. A kind of term that breaks this parts the two answers.
 */
export const isSingleTermOperand = (operand: mixed): boolean => {
	return fitsOperandLength(operand) && isSingleTerm(operand);
};

const isDraftShape = (draft: mixed): boolean => {
	return Type.isPlainObject(draft)
		&& Type.isArray(draft.operands)
		&& Type.isArray(draft.signs)
		&& Type.isArray(draft.groups)
	;
};

const areGroupsPlaced = (groups: Array<FormulaGroup>, operandCount: number): boolean => {
	let previousTo = -1;

	for (const group of groups)
	{
		if (!Type.isNumber(group?.from) || !Type.isNumber(group?.to))
		{
			return false;
		}

		if (group.from <= previousTo || group.from > group.to || group.to >= operandCount)
		{
			return false;
		}

		previousTo = group.to;
	}

	return true;
};

/**
 * Whether the last sign inside the group is a round one - the sign that puts the parenthesis of a
 * call on the right boundary of the range. A group of a single operand has no sign inside it at
 * all, and the sign at that index is the one standing right after the group.
 */
const endsWithRoundCall = (group: FormulaGroup, signs: Array<string>): boolean => {
	return group.to > group.from && signs[group.to - 1] === CALC_OP.round;
};

/**
 * Whether the group assembles the very string the chain assembles without it: on a group that
 * starts the chain and ends with a round call, both parentheses of the call already stand on the
 * boundaries of the range, so the string carries no group and the reading gives none back.
 */
const assemblesAsFlatCall = (group: FormulaGroup, signs: Array<string>): boolean => {
	return group.from === 0 && endsWithRoundCall(group, signs);
};

/**
 * Whether the range may stand as a group of the chain. Two placements are refused, and a round sign
 * inside the range is not one of them - limiting the reach of a rounding is what a group is for.
 */
const isGroupPlacementAllowed = (group: FormulaGroup, signs: Array<string>): boolean => {
	// The string of the group would take the place of the precision, and a precision is one operand.
	if (group.from > 0 && signs[group.from - 1] === CALC_OP.round)
	{
		return false;
	}

	return !assemblesAsFlatCall(group, signs);
};

const sameDrafts = (left: FormulaDraft, right: FormulaDraft): boolean => {
	return left.operands.length === right.operands.length
		&& left.signs.length === right.signs.length
		&& left.groups.length === right.groups.length
		&& left.operands.every((operand: string, index: number) => operand === right.operands[index])
		&& left.signs.every((signId: string, index: number) => signId === right.signs[index])
		&& left.groups.every((group: FormulaGroup, index: number) => {
			return group.from === right.groups[index].from && group.to === right.groups[index].to;
		})
	;
};

/**
 * The circular invariant holds exactly on canonical drafts, and confirmation is unavailable outside
 * of them: an operand that is not a single term, or a chain whose assembled string falls out of the
 * parse limits, would be silently lost on the next open.
 */
export const isCanonicalDraft = (draft: mixed): boolean => {
	if (!isDraftShape(draft))
	{
		return false;
	}

	const { operands, signs, groups } = draft;

	if (operands.length === 0 || signs.length !== operands.length - 1)
	{
		return false;
	}

	if (!signs.every((signId: string) => OPERATION_BY_ID.has(signId)))
	{
		return false;
	}

	if (!operands.every((operand: string) => isSingleTerm(operand)))
	{
		return false;
	}

	if (!areGroupsPlaced(groups, operands.length))
	{
		return false;
	}

	if (!groups.every((group: FormulaGroup) => isGroupPlacementAllowed(group, signs)))
	{
		return false;
	}

	const built = buildFormulaString(draft);
	if (built.length > MAX_PARSE_LENGTH)
	{
		return false;
	}

	// The paired guard on the assembly side, carried to its end: the scanner is the only place the
	// nesting level is measured, and a stream that merely tokenizes says nothing about the reading.
	// The proof of the round trip is the reading itself - the same chain, or no canonicity at all.
	const { ok, tokens } = tokenizeExpression(built);
	if (!ok)
	{
		return false;
	}

	const readBack = parseChainFromTokens(tokens);

	return readBack !== null && sameDrafts(readBack, draft);
};

const cloneDraft = (draft: FormulaDraft): FormulaDraft => {
	return {
		operands: [...draft.operands],
		signs: [...draft.signs],
		groups: draft.groups.map((group: FormulaGroup) => ({ ...group })),
	};
};

/** Appends an operand to the right end of the chain; the default sign of a new operand is `+`. */
export const appendOperand = (draft: FormulaDraft, operand: string, signId: string = CALC_OP.add): FormulaDraft => {
	const next = cloneDraft(draft);

	if (next.operands.length > 0)
	{
		next.signs.push(signId);
	}

	next.operands.push(operand);

	return next;
};

export const setOperand = (draft: FormulaDraft, index: number, operand: string): FormulaDraft => {
	const next = cloneDraft(draft);

	if (index >= 0 && index < next.operands.length)
	{
		next.operands[index] = operand;
	}

	return next;
};

export const setSign = (draft: FormulaDraft, gapIndex: number, signId: string): FormulaDraft => {
	const next = cloneDraft(draft);

	if (gapIndex >= 0 && gapIndex < next.signs.length)
	{
		next.signs[gapIndex] = signId;
	}

	return next;
};

/**
 * The sign a removed operand takes with it: the one on its left, except where the operand is the
 * first of a group opened by a round sign. That sign rounds the very operand being removed, and
 * after the shrink it would stand right before the group, where the group reads as the precision of
 * the call - so it goes together with its argument. The group is asked for an inner sign first: a
 * group of a single operand has none, and the sign at that index is the one standing after it.
 */
const signIndexRemovedWith = (draft: FormulaDraft, index: number): number => {
	const group = draft.groups.find((item: FormulaGroup) => item.from <= index && index <= item.to) ?? null;
	const losesRoundArgument = group !== null
		&& index === group.from
		&& group.from > 0
		&& group.to > group.from
		&& draft.signs[group.from] === CALC_OP.round
	;

	return losesRoundArgument ? index : Math.max(index - 1, 0);
};

/**
 * Removing an operand takes a sign with it and shrinks the group it belonged to; a group left
 * without operands is gone. Adjacency is a property of the model, so the chain does not recount
 * group indices itself.
 */
export const removeOperand = (draft: FormulaDraft, index: number): FormulaDraft => {
	const next = cloneDraft(draft);

	if (index < 0 || index >= next.operands.length)
	{
		return next;
	}

	const signIndex = signIndexRemovedWith(next, index);

	next.operands.splice(index, 1);
	if (next.signs.length > 0)
	{
		next.signs.splice(signIndex, 1);
	}

	next.groups = next.groups
		.map((group: FormulaGroup) => ({
			from: group.from > index ? group.from - 1 : group.from,
			to: group.to >= index ? group.to - 1 : group.to,
		}))
		.filter((group: FormulaGroup) => group.to >= group.from)
		// A chain shrunk from the left can leave a group at its head that the assembly says flat,
		// and the reading would give no group back. Dropping it changes not a character of the
		// string and keeps the draft one the window can confirm.
		.filter((group: FormulaGroup) => !assemblesAsFlatCall(group, next.signs))
	;

	return next;
};

/**
 * Whether the range can become a group: it holds a placement the assembly can say (see
 * isGroupPlacementAllowed) and overlaps no group already standing in the chain. The placement is
 * asked here and not only on the assembled draft, so the window never offers an action that leads
 * to a draft it would then refuse.
 */
export const canGroupOperands = (draft: FormulaDraft, from: number, to: number): boolean => {
	if (!isDraftShape(draft) || from < 0 || from > to || to >= draft.operands.length)
	{
		return false;
	}

	if (!isGroupPlacementAllowed({ from, to }, draft.signs))
	{
		return false;
	}

	return !draft.groups.some((group: FormulaGroup) => group.from <= to && from <= group.to);
};

export const groupOperands = (draft: FormulaDraft, from: number, to: number): FormulaDraft | null => {
	if (!canGroupOperands(draft, from, to))
	{
		return null;
	}

	const next = cloneDraft(draft);
	next.groups = [...next.groups, { from, to }].sort((left: FormulaGroup, right: FormulaGroup) => {
		return left.from - right.from;
	});

	return next;
};

/** Drops the group the operand belongs to; a draft without such a group comes back as it was. */
export const ungroupOperands = (draft: FormulaDraft, index: number): FormulaDraft => {
	const next = cloneDraft(draft);
	next.groups = next.groups.filter((group: FormulaGroup) => index < group.from || index > group.to);

	return next;
};

const infixSymbol = (signId: string): string => {
	return OPERATION_BY_ID.get(signId)?.symbol ?? '';
};

/**
 * One pass left to right over the terms of a chain: an infix sign appends a term to the accumulated
 * prefix, a round sign closes the whole prefix into a call and the chain continues over its result.
 */
const assembleChain = (terms: Array<string>, signs: Array<string>): string => {
	let acc = terms[0] ?? '';

	for (const [index, term] of terms.entries())
	{
		if (index === 0)
		{
			continue;
		}

		acc = signs[index - 1] === CALC_OP.round
			? `round(${acc}, ${term})`
			: `${acc} ${infixSymbol(signs[index - 1])} ${term}`
		;
	}

	return acc;
};

/**
 * The one term a group stands as in the chain above it. Its own parentheses are left out where the
 * call already put a pair on both boundaries of the range (see endsWithRoundCall): a second pair
 * would read back as a nesting the model does not express.
 */
const groupTerm = (draft: FormulaDraft, group: FormulaGroup): string => {
	const inner = assembleChain(
		draft.operands.slice(group.from, group.to + 1),
		draft.signs.slice(group.from, group.to),
	);

	return endsWithRoundCall(group, draft.signs) ? inner : `(${inner})`;
};

/**
 * Assembly goes in two levels: the chain of a group is assembled by the very rules of the chain
 * above it, and the string it gives stands there as a single term. Groups do not nest, so two
 * levels is all there is. No parenthesis of precedence is ever added.
 */
export const buildFormulaString = (draft: FormulaDraft): string => {
	const { operands, signs, groups } = draft;
	const groupStarts = new Map(groups.map((group: FormulaGroup) => [group.from, group]));
	const terms = [];
	const termSigns = [];
	let index = 0;

	while (index < operands.length)
	{
		const group = groupStarts.get(index) ?? null;
		const to = group === null ? index : group.to;

		terms.push(group === null ? operands[index] : groupTerm(draft, group));

		if (to + 1 < operands.length)
		{
			termSigns.push(signs[to]);
		}

		index = Math.max(to, index) + 1;
	}

	return `{{=${assembleChain(terms, termSigns)}}}`;
};

/**
 * Whether the parentheses of the group are left out of the string buildFormulaString assembles (see
 * groupTerm). The rule of the assembly belongs to the assembly, so the drawing of the chain asks it
 * here instead of keeping a second copy of the condition.
 */
export const omitsGroupParens = (draft: FormulaDraft, group: FormulaGroup): boolean => {
	return endsWithRoundCall(group, draft.signs);
};

const meaningfulTokens = (tokens: Array<ExpressionToken>): Array<ExpressionToken> => {
	return tokens.filter((token: ExpressionToken) => token.kind !== TOKEN_KIND.space);
};

/**
 * Appends a parsed term to the chain being read, in place. The chain is a mutable accumulator owned
 * by the reading alone, so an operator costs one term and not a copy of the whole prefix before it.
 */
const appendTermToChain = (chain: FormulaDraft, signId: string, term: FormulaDraft): void => {
	const offset = chain.operands.length;

	chain.signs.push(signId, ...term.signs);
	chain.operands.push(...term.operands);

	for (const group of term.groups)
	{
		chain.groups.push({ from: group.from + offset, to: group.to + offset });
	}
};

const singleOperandDraft = (operand: string): FormulaDraft => {
	return { operands: [operand], signs: [], groups: [] };
};

const isRoundCallAt = (tokens: Array<ExpressionToken>, index: number): boolean => {
	return tokens[index]?.kind === TOKEN_KIND.functionName
		&& tokens[index].text.toLowerCase() === ROUND_FUNCTION_NAME
		&& tokens[index + 1]?.kind === TOKEN_KIND.parenOpen
	;
};

const parseGroupTerm = (tokens: Array<ExpressionToken>, start: number): Object | null => {
	const inner = parseChain(tokens, start + 1);
	if (inner === null || tokens[inner.cursor]?.kind !== TOKEN_KIND.parenClose)
	{
		return null;
	}

	// A group inside a group is a nesting the model does not express. A round call read past the
	// head of the inner chain has become a group of its own, so it arrives here as the same nesting.
	if (inner.draft.groups.length > 0)
	{
		return null;
	}

	// Copied out and not spread: what the group hands back becomes the accumulator its caller
	// appends to, and a spread would leave that caller writing into the arrays of the chain read
	// inside the parentheses. One copy per group, the length of that group.
	return {
		draft: {
			operands: [...inner.draft.operands],
			signs: [...inner.draft.signs],
			groups: [{ from: 0, to: inner.draft.operands.length - 1 }],
		},
		cursor: inner.cursor + 1,
	};
};

const parseRoundTerm = (tokens: Array<ExpressionToken>, start: number): Object | null => {
	const inner = parseChain(tokens, start + 2);
	if (inner === null || tokens[inner.cursor]?.kind !== TOKEN_KIND.comma)
	{
		return null;
	}

	// The precision is read the same way as any other operand, unary sign and all: the chain assembles
	// `round(x, -2)` from an operand the calculator carries, so the reading has to give it back.
	const precision = parseOperandTerm(tokens, inner.cursor + 1);
	if (precision === null || tokens[precision.cursor]?.kind !== TOKEN_KIND.parenClose)
	{
		return null;
	}

	appendTermToChain(inner.draft, CALC_OP.round, precision.draft);

	return { draft: inner.draft, cursor: precision.cursor + 1 };
};

// `[unary sign] operand`: the sign is absorbed by the operand at the head of a chain and right after
// another operator; anywhere else `-` and `+` are the infix operators they look like.
const parseOperandTerm = (tokens: Array<ExpressionToken>, start: number): Object | null => {
	const sign = isUnarySignToken(tokens[start]) ? tokens[start] : null;
	const operand = sign === null ? tokens[start] : tokens[start + 1];
	if (!isTermToken(operand))
	{
		return null;
	}

	const text = sign === null ? operand.text : `${sign.text}${operand.text}`;

	return { draft: singleOperandDraft(text), cursor: sign === null ? start + 1 : start + 2 };
};

const parseTerm = (tokens: Array<ExpressionToken>, start: number): Object | null => {
	const token = tokens[start];
	if (!token)
	{
		return null;
	}

	if (token.kind === TOKEN_KIND.parenOpen)
	{
		return parseGroupTerm(tokens, start);
	}

	return isRoundCallAt(tokens, start) ? parseRoundTerm(tokens, start) : parseOperandTerm(tokens, start);
};

/**
 * The draft of a round call read past the head of its chain: its first argument is written out
 * between its own parentheses and not taken from the prefix on its left, which is exactly what a
 * group is. A group already inside the call is a nesting the model does not express - and the
 * parentheses of precedence it stands for carry meaning, so the value stays raw instead of losing
 * them: `1 + round((2 + 3) * 4, 5)` counts 20, and the same chain without them counts 14.
 */
const closeCallIntoGroup = (draft: FormulaDraft): FormulaDraft | null => {
	if (draft.groups.length > 0)
	{
		return null;
	}

	return { ...draft, groups: [{ from: 0, to: draft.operands.length - 1 }] };
};

const parseChain = (tokens: Array<ExpressionToken>, start: number): Object | null => {
	// The leftmost term is the one place a round call is read flat: there its first argument is the
	// whole prefix of the chain by construction, and that is how every value saved so far is read.
	const first = parseTerm(tokens, start);
	if (first === null)
	{
		return null;
	}

	// Every term hands over a draft of its own, so the chain grows into the draft of its first term
	// and the accumulated prefix is never copied again: the reading stays linear in the operands.
	const draft = first.draft;
	let cursor = first.cursor;

	while (tokens[cursor]?.kind === TOKEN_KIND.operator)
	{
		const signId = OPERATION_BY_SYMBOL[tokens[cursor].text];
		const isRoundCall = isRoundCallAt(tokens, cursor + 1);
		const term = parseTerm(tokens, cursor + 1);
		if (!signId || term === null)
		{
			return null;
		}

		const termDraft = isRoundCall ? closeCallIntoGroup(term.draft) : term.draft;
		if (termDraft === null)
		{
			return null;
		}

		appendTermToChain(draft, signId, termDraft);
		cursor = term.cursor;
	}

	return { draft, cursor };
};

/**
 * The chain a stream spells out, before any judgement about it: the canonicity predicate reads the
 * string it assembles through this same entry, so the two sides of the round trip cannot part ways.
 */
const parseChainFromTokens = (tokens: Array<ExpressionToken>): FormulaDraft | null => {
	const meaningful = meaningfulTokens(tokens);
	const lastIndex = meaningful.length - 1;

	if (lastIndex < 1
		|| meaningful[0].kind !== TOKEN_KIND.formulaOpen
		|| meaningful[lastIndex].kind !== TOKEN_KIND.formulaClose)
	{
		return null;
	}

	const chain = parseChain(meaningful, 1);

	return chain !== null && chain.cursor === lastIndex ? chain.draft : null;
};

/**
 * The draft behind a stream already scanned: the entry for a caller holding the tokens of the value,
 * so the value is read once and not once per question asked about it.
 */
export const readDraftFromTokens = (tokens: Array<ExpressionToken>): FormulaDraft | null => {
	const draft = parseChainFromTokens(tokens);

	return draft !== null && isCanonicalDraft(draft) ? draft : null;
};

/**
 * The draft behind a saved value, or `null` for a value that does not fit the model: the caller
 * shows such a value as it is and never rewrites it.
 */
export const readFormulaDraft = (value: mixed): FormulaDraft | null => {
	const { ok, tokens } = tokenizeExpression(value);

	return ok ? readDraftFromTokens(tokens) : null;
};

/** The call behind a stream already scanned, on the same terms as `readDraftFromTokens`. */
export const readCallFromTokens = (tokens: Array<ExpressionToken>): { name: string } | null => {
	const meaningful = meaningfulTokens(tokens);
	const lastIndex = meaningful.length - 1;

	if (lastIndex < 4
		|| meaningful[0].kind !== TOKEN_KIND.formulaOpen
		|| meaningful[1].kind !== TOKEN_KIND.functionName
		|| meaningful[2].kind !== TOKEN_KIND.parenOpen
		|| meaningful[lastIndex - 1].kind !== TOKEN_KIND.parenClose
		|| meaningful[lastIndex].kind !== TOKEN_KIND.formulaClose)
	{
		return null;
	}

	return { name: meaningful[1].text };
};

/**
 * A whole value that is one function call, recognized by the callee name only. Such a value does not
 * fit the model, and the window opens in its function mode instead of rewriting it.
 */
export const readFunctionCall = (value: mixed): { name: string } | null => {
	const { ok, tokens } = tokenizeExpression(value);

	return ok ? readCallFromTokens(tokens) : null;
};

/**
 * Moves the decimal point through the exponent notation instead of multiplying by a power of ten:
 * `1.005 * 100` is 100.49999999999999 and would round down, while the server rounds 1.005 to 1.01.
 * A value already written with an exponent cannot take a second one - such a number falls back to
 * the multiplication, where the precision it has left no longer matters.
 */
const shiftExponent = (value: number, exponent: number): number => {
	if (exponent === 0 || !Number.isFinite(value))
	{
		return value;
	}

	const shifted = Number(`${value}e${exponent}`);

	return Number.isFinite(shifted) ? shifted : value * (10 ** exponent);
};

/**
 * The semantics of the server-side `round((float) $value, (int) $precision)` the workflow will run
 * (bizproc `MathLib::callRound()`): the precision is truncated to an integer and halves are rounded
 * away from zero, unlike `Math.round`, which takes them towards positive infinity.
 */
const roundTo = (value: number, digits: number): number => {
	const precision = Math.trunc(digits);
	const scaled = shiftExponent(value, precision);

	return shiftExponent(Math.sign(scaled) * Math.round(Math.abs(scaled)), -precision);
};

const divByZero = Object.freeze({ ok: false, code: PREVIEW_WARNING.divByZero });

/**
 * What an operand whose value the preview cannot know stands for - a source reference above all,
 * whose value the workflow resolves on start. The computation carries it through instead of stopping
 * on it, so an error that holds at every value of the unknowns is still found (see
 * `evaluateFormulaDraft`).
 */
const UNKNOWN = null;

type PreviewValue = number | null;

/** An operation over an unknown gives an unknown: there is nothing to compute it from. */
const overKnown = (
	left: PreviewValue,
	right: PreviewValue,
	operation: (left: number, right: number) => number,
): PreviewValue => {
	return left === UNKNOWN || right === UNKNOWN ? UNKNOWN : operation(left, right);
};

const sum = (left: number, right: number): number => left + right;
const difference = (left: number, right: number): number => left - right;
const product = (left: number, right: number): number => left * right;
const quotient = (left: number, right: number): number => left / right;

/**
 * `*` and `/` before `+` and `-`. Division by zero is signalled from inside the computation: by the
 * end `x / 0` has become infinity and `0 / 0` a non-number, and a literal zero divisor is no longer
 * distinguishable from an overflow.
 */
const evaluateInfix = (values: Array<PreviewValue>, signs: Array<string>): Object => {
	const terms = [values[0]];
	const additive = [];

	for (const [index, signId] of signs.entries())
	{
		const right = values[index + 1];

		if (signId === CALC_OP.multiply)
		{
			terms[terms.length - 1] = overKnown(terms[terms.length - 1], right, product);
		}
		else if (signId === CALC_OP.divide)
		{
			// A divisor known to be zero is an error whatever the unknowns around it turn out to be:
			// the workflow computes the whole expression and stops on the division either way.
			if (right === 0)
			{
				return divByZero;
			}

			terms[terms.length - 1] = overKnown(terms[terms.length - 1], right, quotient);
		}
		else
		{
			additive.push(signId);
			terms.push(right);
		}
	}

	let result = terms[0];
	for (const [index, signId] of additive.entries())
	{
		result = overKnown(result, terms[index + 1], signId === CALC_OP.add ? sum : difference);
	}

	return { ok: true, value: result };
};

// Groups first: the chain of a group is computed by the very rules of the chain above it (see
// evaluateSegments), so a rounding inside a group reaches exactly the operands of that group - the
// same two levels the assembly writes into the string. Reduced to single values, the groups leave a
// chain of items the top level then computes the same way.
const reduceGroups = (
	values: Array<PreviewValue>,
	signs: Array<string>,
	groups: Array<FormulaGroup>,
): Object => {
	const groupStarts = new Map(groups.map((group: FormulaGroup) => [group.from, group]));
	const items = [];
	const itemSigns = [];
	let index = 0;

	while (index < values.length)
	{
		const group = groupStarts.get(index) ?? null;
		const to = group === null ? index : group.to;
		const reduced = group === null
			? { ok: true, value: values[index] }
			: evaluateSegments(values.slice(index, to + 1), signs.slice(index, to))
		;

		if (!reduced.ok)
		{
			return reduced;
		}

		items.push(reduced.value);
		if (to + 1 < values.length)
		{
			itemSigns.push(signs[to]);
		}

		index = Math.max(to, index) + 1;
	}

	return { ok: true, items, itemSigns };
};

// A round sign is a boundary of the computation: the prefix is computed by the usual precedence, the
// result is rounded and the chain continues over that result.
const evaluateSegments = (items: Array<PreviewValue>, itemSigns: Array<string>): Object => {
	let values = [items[0]];
	let signs = [];

	for (const [index, item] of items.entries())
	{
		if (index === 0)
		{
			continue;
		}

		if (itemSigns[index - 1] === CALC_OP.round)
		{
			const segment = evaluateInfix(values, signs);
			if (!segment.ok)
			{
				return segment;
			}

			values = [overKnown(segment.value, item, roundTo)];
			signs = [];
		}
		else
		{
			values.push(item);
			signs.push(itemSigns[index - 1]);
		}
	}

	return evaluateInfix(values, signs);
};

/**
 * Preview over the chain, with the operands the preview cannot read as numbers carried through as
 * unknowns instead of stopping it: the workflow computes the whole expression by precedence, so
 * `{=Document:PRICE} + 8 / 0` is an error at every value the reference can take, and the chain has
 * to say so while Apply is still available. What the unknowns leave undecided is undecided here as
 * well - `8 / {=Document:PRICE}` depends on the data and is no warning of ours.
 *
 * A chain that comes out unknown is read by what made it so: a source reference means the value is
 * waiting for the run, and anything else the preview could not read as a number means the value is
 * not a number.
 */
export const evaluateFormulaDraft = (draft: FormulaDraft): PreviewResult => {
	const { operands, signs, groups } = draft;
	const notANumber = { kind: PREVIEW_KIND.warning, code: PREVIEW_WARNING.notANumber };

	if (operands.length === 0)
	{
		return notANumber;
	}

	const values = operands.map((operand: string) => {
		const parsed = parseLiteralNumber(operand);

		return parsed.ok ? parsed.value : UNKNOWN;
	});
	const reduced = reduceGroups(values, signs, groups);
	if (!reduced.ok)
	{
		return { kind: PREVIEW_KIND.warning, code: reduced.code };
	}

	const evaluated = evaluateSegments(reduced.items, reduced.itemSigns);
	if (!evaluated.ok)
	{
		return { kind: PREVIEW_KIND.warning, code: evaluated.code };
	}

	if (evaluated.value !== UNKNOWN)
	{
		return { kind: PREVIEW_KIND.value, value: evaluated.value };
	}

	return operands.some((operand: string) => isSourceReference(operand))
		? { kind: PREVIEW_KIND.dependsOnData }
		: notANumber
	;
};

const PART_BY_TOKEN_KIND = Object.freeze({
	[TOKEN_KIND.formulaOpen]: FORMULA_PART.brace,
	[TOKEN_KIND.formulaClose]: FORMULA_PART.brace,
	[TOKEN_KIND.functionName]: FORMULA_PART.function,
	[TOKEN_KIND.string]: FORMULA_PART.value,
	// A reference is a kind of its own and never arrives as `text`: the kind excludes the braces.
	[TOKEN_KIND.text]: FORMULA_PART.value,
	[TOKEN_KIND.number]: FORMULA_PART.number,
	[TOKEN_KIND.operator]: FORMULA_PART.operator,
	[TOKEN_KIND.parenOpen]: FORMULA_PART.paren,
	[TOKEN_KIND.parenClose]: FORMULA_PART.paren,
	[TOKEN_KIND.comma]: FORMULA_PART.plain,
	[TOKEN_KIND.space]: FORMULA_PART.plain,
});

type PartSpan = {
	type: string,
	start: number,
	end: number,
	depth: number | null,
};

const referenceSpans = (value: string, token: ExpressionToken): Array<PartSpan> => {
	const { object, field, modifier, secondModifier } = token.refParts ?? {};
	const spans = [{ type: FORMULA_PART.brace, start: token.start, end: token.start + 2, depth: null }];

	for (const offsets of [object, field])
	{
		if (offsets)
		{
			spans.push({ type: FORMULA_PART.source, start: offsets.start, end: offsets.end, depth: null });
		}
	}

	if (modifier)
	{
		// The one `>` between the field and the modifier: located inside the span the offsets give,
		// never by parsing the reference again.
		const operatorAt = value.indexOf('>', field ? field.end : token.start);
		if (operatorAt !== -1 && operatorAt < modifier.start)
		{
			spans.push({ type: FORMULA_PART.operator, start: operatorAt, end: operatorAt + 1, depth: null });
		}

		spans.push({ type: FORMULA_PART.modifier, start: modifier.start, end: modifier.end, depth: null });
	}

	if (secondModifier)
	{
		// The named exception to "fits the model or stays raw": recognition leaves a value with a
		// second modifier raw, because the modification panel cannot carry two transforms at once
		// and Apply would drop one (`recognizeReference` in the assembler of the builder), while the
		// highlight still marks the reference up by roles. Highlighting rewrites nothing, and the
		// offsets of both modifiers come from the same scan - painting the second one plainly would
		// only tell the reader that a part of the reference is unrecognized, which it is not.
		spans.push({
			type: FORMULA_PART.modifier,
			start: secondModifier.start,
			end: secondModifier.end,
			depth: null,
		});
	}

	spans.push({ type: FORMULA_PART.brace, start: token.end - 1, end: token.end, depth: null });

	return spans;
};

const tokenSpans = (value: string, tokens: Array<ExpressionToken>): Array<PartSpan> => {
	const spans = [];

	for (const token of tokens)
	{
		if (token.kind === TOKEN_KIND.reference)
		{
			spans.push(...referenceSpans(value, token));
			continue;
		}

		const type = PART_BY_TOKEN_KIND[token.kind];

		spans.push({ type, start: token.start, end: token.end, depth: token.depth });
	}

	return spans;
};

/**
 * Parts carry text only - a slice of the source - so spacing and letter case stay the ones that were
 * typed. Gaps between typed parts are filled with the `plain` role, and neighbouring fillers join:
 * the caller renders parts as text nodes and never as markup.
 */
const fillGaps = (value: string, spans: Array<PartSpan>): Array<FormulaPart> => {
	const parts = [];
	let cursor = 0;

	const pushPart = (type: string, from: number, to: number, depth: number | null): void => {
		const previous = parts[parts.length - 1];

		if (type === FORMULA_PART.plain && previous?.type === FORMULA_PART.plain)
		{
			previous.text += value.slice(from, to);

			return;
		}

		parts.push({ type, text: value.slice(from, to), depth });
	};

	for (const span of spans)
	{
		if (span.start > cursor)
		{
			pushPart(FORMULA_PART.plain, cursor, span.start, null);
		}

		pushPart(span.type, span.start, span.end, span.depth ?? null);
		cursor = span.end;
	}

	if (cursor < value.length)
	{
		pushPart(FORMULA_PART.plain, cursor, value.length, null);
	}

	return parts;
};

const plainOnly = (value: string): Array<FormulaPart> => {
	return [{ type: FORMULA_PART.plain, text: value, depth: null }];
};

/**
 * Typed parts of a whole value for the highlight. The decision "fits the model or not" is the same
 * one recognition makes: a value `readFormulaDraft` refuses gives a single `plain` part, and typed
 * parts appear only for a value that fits, a single reference or a single function call.
 *
 * `maxParts` is how many parts the caller is willing to show at once: every part is an element of
 * the document, and the parse alone allows a value of some two thousand of them - a value that no
 * one assembled by hand and that the caller is about to render synchronously. Past the ceiling the
 * value is given as it is, in the one filler part, the way any value the model does not express is.
 * The ceiling belongs to the caller and not here: it follows from what the caller shows the value
 * with, see MAX_HIGHLIGHT_PARTS of the window.
 */
export const describeFormulaParts = (value: mixed, maxParts: number = Infinity): Array<FormulaPart> => {
	if (!Type.isStringFilled(value))
	{
		return [];
	}

	const { ok, tokens } = tokenizeExpression(value);
	if (!ok)
	{
		return plainOnly(value);
	}

	const fits = readDraftFromTokens(tokens) !== null
		|| isSingleReferenceStream(tokens)
		|| readCallFromTokens(tokens) !== null
	;

	if (!fits)
	{
		return plainOnly(value);
	}

	const parts = fillGaps(value, tokenSpans(value, tokens));

	return parts.length > maxParts ? plainOnly(value) : parts;
};

/** Typed parts of one operand of the chain: the chain shows its operands separately. */
export const describeOperandParts = (operand: mixed): Array<FormulaPart> => {
	if (!Type.isStringFilled(operand))
	{
		return [];
	}

	const { ok, tokens } = tokenizeFragment(operand);

	return ok ? fillGaps(operand, tokenSpans(operand, tokens)) : plainOnly(operand);
};
