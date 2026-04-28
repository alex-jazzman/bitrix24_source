import { Type } from 'main.core';
import { cleanQueryParamsString } from './clean-query-params-string';

export function cleanUrl(location: Location, history: History, patterns: RegExp[]): void
{
	const cleanedQueryParamsString = cleanQueryParamsString(location.search, patterns);
	let cleanedPathname = location.pathname;

	if (Type.isStringFilled(cleanedQueryParamsString))
	{
		cleanedPathname += `?${cleanedQueryParamsString}`;
	}

	if (Type.isStringFilled(location.hash))
	{
		cleanedPathname += location.hash;
	}

	history.replaceState(null, '', cleanedPathname);
}
