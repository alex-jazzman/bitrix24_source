import { Loc } from 'main.core';

import type { IndirectPhraseParts } from '../utils/crm-integration-settings-type';

export function preparedIndirectPhrase(phraseCode: string, indirectCode: string): IndirectPhraseParts
{
	const phrase = Loc.getMessage(phraseCode) ?? '';
	const parts = phrase.split(indirectCode);

	return {
		beforeText: parts[0] || null,
		afterText: parts[1] || null,
	};
}

export const PreparedIndirectPhraseMixin = {
	methods: {
		preparedIndirectPhrase,
	},
};
