import { Loc, Type } from 'main.core';

const fallbackForm = 1;

function toSuffix(forms: number[]): string
{
	return forms.map((form: number): string => `_PLURAL_${form}`).join('');
}

function toCandidateSuffixes(forms: number[]): string[]
{
	const countFallbacks = (candidate: number[]): number => candidate.filter(
		(form: number, axis: number): boolean => form !== forms[axis],
	).length;

	// Safety net for an incomplete key set: every axis either keeps its own form or
	// falls back to the form 1 the core itself falls back to. Fewer fallbacks come
	// first, so a key that keeps the right form on some axis wins over the
	// all-purpose one: a language reading another locale's messages then loses only
	// the forms that locale does not have.
	return forms
		.reduce<number[][]>(
			(candidates: number[][], form: number): number[][] => candidates.flatMap(
				(candidate: number[]): number[][] => (form === fallbackForm
					? [[...candidate, form]]
					: [[...candidate, form], [...candidate, fallbackForm]]),
			),
			[[]],
		)
		.sort((first: number[], second: number[]): number => countFallbacks(first) - countFallbacks(second))
		.map((candidate: number[]): string => toSuffix(candidate));
}

export function formatPluralPhrase(
	baseCode: string,
	values: number[],
	replacements: Record<string, string> | null = null,
): string | null
{
	const forms = values.map((value: number): number => Loc.getPluralForm(value));

	for (const suffix of toCandidateSuffixes(forms))
	{
		const code = `${baseCode}${suffix}`;

		// hasMessage() comes first: getMessage() stores an empty string for a missing
		// code, and the next hasMessage() call would then report it as existing.
		if (Loc.hasMessage(code))
		{
			const phrase = Loc.getMessage(code, replacements);
			if (Type.isStringFilled(phrase))
			{
				return phrase;
			}
		}
	}

	return null;
}
