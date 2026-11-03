import { Loc } from 'main.core';

export function phrase(code: string, replacements?: Record<string, string>): string
{
	return Loc.getMessage(code, replacements) ?? '';
}
