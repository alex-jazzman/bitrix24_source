import { Loc } from 'main.core';

/** A phrase missing from the page gives an empty string, so `null` never reaches the markup. */
export function loc(phraseCode: string, replacements: Record<string, string> = {}): string
{
	return Loc.getMessage(phraseCode, replacements) ?? '';
}

/** Same for the phrases that decline by a number: the count picks the form. */
export function locPlural(phraseCode: string, count: number, replacements: Record<string, string> = {}): string
{
	return Loc.getMessagePlural(phraseCode, count, replacements) ?? '';
}
