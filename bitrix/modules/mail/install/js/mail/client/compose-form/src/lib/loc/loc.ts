import { Loc } from 'main.core';

/** A phrase missing from the page gives an empty string, so `null` never reaches the markup. */
export function loc(phraseCode: string, replacements: Record<string, string> = {}): string
{
	return Loc.getMessage(phraseCode, replacements) ?? '';
}
