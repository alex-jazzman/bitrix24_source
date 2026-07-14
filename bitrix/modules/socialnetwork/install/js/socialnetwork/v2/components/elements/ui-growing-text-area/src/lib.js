import { Type } from 'main.core';

import { URL_REGEXP, EMAIL_REGEXP } from './const';
import type { LinkMatch } from './types';

function createLinkMatcherWithRegExp(regExp, urlTransformer = (text) => text): (text: string) => LinkMatch | null
{
	return (text: string) => {
		const match = regExp.exec(text);
		if (match === null)
		{
			return null;
		}

		return {
			index: match.index,
			length: match[0].length,
			text: match[0],
			url: urlTransformer(match[0]),
		};
	};
}

const LINK_MATCHERS = [
	createLinkMatcherWithRegExp(URL_REGEXP, (text) => (text.startsWith('http') ? text : `https://${text}`)),
	createLinkMatcherWithRegExp(EMAIL_REGEXP, (text) => `mailto:${text}`),
];

export function getFirstLinkMatch(text: string): LinkMatch | null
{
	if (!Type.isStringFilled(text))
	{
		return null;
	}

	for (const matcher of LINK_MATCHERS)
	{
		const match = matcher(text);
		if (match)
		{
			return match;
		}
	}

	return null;
}
