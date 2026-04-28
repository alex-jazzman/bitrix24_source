import { filterQueryParams } from './filter-query-params';

export function cleanQueryParamsString(queryParamsString: string, patterns: RegExp[]): string
{
	const queryParams = new URLSearchParams(queryParamsString);
	const filteredQueryParams = filterQueryParams(queryParams, patterns);

	return filteredQueryParams.toString();
}
