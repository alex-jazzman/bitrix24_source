/**
 * @module crm/in-app-url/routes/query-params
 */
jn.define('crm/in-app-url/routes/query-params', (require, exports, module) => {
	const SUPPORTED_QUERY_PARAMS = [
		'uid',
		'changeTab',
		'phone',
		'categoryId',
		'origin_id',
		'contact_id',
		'lead_id',
		'quote_id',
		'conv_quote_id',
		'conv_deal_id',
		'conv_source_type_id',
		'conv_source_id',
	];

	const isBooleanFlag = (value) => value === 'Y' || value === 'N';

	/**
	 * Keeps only the query params an entity card understands, turning Y/N flags into booleans.
	 *
	 * @param {Object} [queryParams]
	 * @return {Object}
	 */
	const filterSupportedQueryParams = (queryParams) => {
		const result = {};

		SUPPORTED_QUERY_PARAMS.forEach((key) => {
			if (!queryParams || !Object.hasOwn(queryParams, key))
			{
				return;
			}

			const value = queryParams[key];
			result[key] = isBooleanFlag(value) ? value === 'Y' : value;
		});

		return result;
	};

	module.exports = { filterSupportedQueryParams };
});
