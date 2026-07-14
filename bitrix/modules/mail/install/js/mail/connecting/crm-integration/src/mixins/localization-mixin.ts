import { Loc } from 'main.core';

export function loc(phraseCode: string, replacements: Record<string, string> = {}): string
{
	return Loc.getMessage(phraseCode, replacements) ?? '';
}

export const LocalizationMixin = {
	methods: {
		loc,
	},
};
