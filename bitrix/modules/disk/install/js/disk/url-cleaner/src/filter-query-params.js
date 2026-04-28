export function filterQueryParams(queryParams: URLSearchParams, patterns: RegExp[]): URLSearchParams
{
	const filteredQueryParams = new URLSearchParams();

	for (const [key, value] of queryParams)
	{
		const isValid = !patterns.some(pattern => pattern.test(key));

		if (isValid)
		{
			filteredQueryParams.append(key, value);
		}
	}

	return filteredQueryParams;
}
