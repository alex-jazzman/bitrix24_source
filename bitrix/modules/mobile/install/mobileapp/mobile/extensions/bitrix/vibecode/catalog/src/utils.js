/**
 * @module vibecode/catalog/src/utils
 */
jn.define('vibecode/catalog/src/utils', (require, exports, module) => {
	const { withCurrentDomain } = require('utils/url');

	function normalizePositiveInteger(value = null)
	{
		const normalizedValue = Number(value);

		return (Number.isInteger(normalizedValue) && normalizedValue > 0 ? normalizedValue : null);
	}

	function normalizeAbsoluteUrl(value = '')
	{
		const normalizedValue = String(value ?? '').trim();
		if (!normalizedValue)
		{
			return '';
		}

		if (/^https?:\/\//i.test(normalizedValue))
		{
			return normalizedValue;
		}

		if (normalizedValue.startsWith('//'))
		{
			return `https:${normalizedValue}`;
		}

		return withCurrentDomain(normalizedValue.startsWith('/') ? normalizedValue : `/${normalizedValue}`);
	}

	function getSearchQueryFromEvent(params = {}, search = null)
	{
		if (typeof params === 'string')
		{
			return params;
		}

		const candidates = [
			params?.text,
			params?.query,
			params?.value,
			params?.searchText,
			search?.text,
		];
		const query = candidates.find((candidate) => candidate !== undefined && candidate !== null);

		return query === undefined ? null : String(query);
	}

	module.exports = {
		getSearchQueryFromEvent,
		normalizeAbsoluteUrl,
		normalizePositiveInteger,
	};
});
