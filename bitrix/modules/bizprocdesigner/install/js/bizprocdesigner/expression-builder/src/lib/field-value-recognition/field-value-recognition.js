import { Type } from 'main.core';

import {
	readCallFromTokens,
	readDraftFromTokens,
	type FormulaDraft,
} from '../formula-draft/formula-draft';
import {
	isSingleReferenceStream,
	tokenizeExpression,
	TOKEN_KIND,
	type ExpressionToken,
	type RefPartOffsets,
} from '../expression-tokenizer/expression-tokenizer';

// What a saved field value turns out to be. The answer is built over the single token stream of
// `expression-tokenizer` and the flat model of `formula-draft` - the value is never parsed a second
// time - so the recognition belongs here, beside them, and the window reaches it through the
// calculator facade.

/** What a saved field value turns out to be, and everything the window needs to open on it. */
export type RecognizedValue =
	| { kind: 'empty' }
	| { kind: 'reference', object: string, field: string, modifier: string | null, raw: string }
	| { kind: 'function', name: string, raw: string }
	| { kind: 'draft', draft: FormulaDraft, raw: string }
	| { kind: 'raw', raw: string, secondModifier?: string };

const referencePart = (value: string, offsets: ?RefPartOffsets): string | null => {
	return offsets ? value.slice(offsets.start, offsets.end) : null;
};

/**
 * The parts of a single reference, cut by the offsets its own token carries: the reference is not
 * read a second time. A second modifier has no place in the modification panel (one transform at a
 * time), and prefilling from the first one alone would let Apply drop it, so such a value stays raw
 * like any other the window does not express.
 */
const recognizeReference = (value: string, token: ExpressionToken): RecognizedValue => {
	const { object, field, modifier, secondModifier } = token.refParts ?? {};
	const secondModifierText = referencePart(value, secondModifier);

	if (Type.isStringFilled(secondModifierText))
	{
		return { kind: 'raw', raw: value, secondModifier: secondModifierText };
	}

	return {
		kind: 'reference',
		object: referencePart(value, object) ?? '',
		field: referencePart(value, field) ?? '',
		modifier: referencePart(value, modifier),
		raw: value,
	};
};

/**
 * What a saved field value is: the empty value, a single reference, a chain the model expresses, a
 * single function call, or a value that is none of those. The mode the window opens in and the chain
 * it is prefilled with both follow from this one answer, and a `raw` value is shown as it is and
 * never rewritten.
 *
 * A chain is looked for before a call: `round(A, N)` is a sign of the chain, while `round` with any
 * other number of arguments is the function call it looks like. The ceiling of the parse belongs to
 * the scanner, so a value longer than it never reaches the model at all.
 */
export function recognizeFieldValue(value: mixed): RecognizedValue
{
	if (!Type.isStringFilled(value))
	{
		return { kind: 'empty' };
	}

	const { ok, tokens } = tokenizeExpression(value);
	if (!ok)
	{
		return { kind: 'raw', raw: value };
	}

	if (isSingleReferenceStream(tokens))
	{
		// The predicate holds on one meaningful token only, and that token is the reference itself.
		const reference = tokens.find((token: ExpressionToken) => token.kind === TOKEN_KIND.reference);

		return recognizeReference(value, reference);
	}

	const draft = readDraftFromTokens(tokens);
	if (draft !== null)
	{
		return { kind: 'draft', draft, raw: value };
	}

	const call = readCallFromTokens(tokens);

	return call === null
		? { kind: 'raw', raw: value }
		: { kind: 'function', name: call.name, raw: value }
	;
}
