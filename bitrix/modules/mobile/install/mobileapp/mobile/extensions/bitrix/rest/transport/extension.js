/**
 * @module rest/transport
 */
jn.define('rest/transport', (require, exports, module) => {
	const { isValidAnalyticsData } = require('analytics/validator');
	const { Type } = require('type');

	const AJAX_URL = '/bitrix/services/main/ajax.php';

	/**
	 * @param {Promise} promise
	 * @return {Promise<ActionResponse>}
	 */
	const ActionPromiseWrapper = (promise) => {
		return new Promise((resolve, reject) => {
			promise.then((result) => {
				if (result.status === 'error')
				{
					console.error(result);
					reject(result);
				}
				else
				{
					resolve(result);
				}
			})
				.catch((result) => {
					if (result && result.status && Object.hasOwn(result, 'data'))
					{
						console.error(result);
						reject(result);
					}
					else
					{
						const networkErrorResult = {
							status: 'error',
							data: {
								ajaxRejectData: result,
							},
							errors: [
								{
									code: 'NETWORK_ERROR',
									message: 'Network error',
								},
							],
						};
						console.error(networkErrorResult);
						reject(networkErrorResult);
					}
				});
		});
	};

	/**
	 * @param {AjaxAnalyticsDTO} analytics
	 * @returns {{ st?: AjaxAnalyticsDTO }} empty when the data does not pass validation
	 */
	const prepareAnalytics = (analytics) => {
		if (!isValidAnalyticsData(analytics))
		{
			console.error('BX.ajax: {analytics} is invalid and will be ignored.');

			return {};
		}

		return { st: analytics };
	};

	/**
	 * @param {TransportNavigation} navigation
	 * @returns {{ nav?: string }} empty when there is nothing to paginate
	 */
	const prepareNavigation = (navigation) => {
		const parts = [];

		if (navigation.page)
		{
			parts.push(`page-${navigation.page}`);
		}

		if (navigation.size > 0)
		{
			parts.push(`size-${navigation.size}`);
		}

		return parts.length > 0 ? { nav: parts.join('-') } : {};
	};

	/**
	 * @param {RunActionConfig} config
	 * @returns {Record<string, unknown>} the query string parameters of the request
	 */
	const prepareAjaxGetParameters = (config) => {
		const getParameters = { ...config.getParameters };
		const hasAnalytics = Type.isObject(config.analytics);

		if (Type.isString(config.analyticsLabel) || Type.isObject(config.analyticsLabel))
		{
			getParameters.analyticsLabel = config.analyticsLabel;
		}

		if (hasAnalytics && config.analyticsLabel)
		{
			delete getParameters.analyticsLabel;

			console.error(
				'BX.ajax: Only {analytics} or {analyticsLabel} should be used. If both are present, {analyticsLabel} will be ignored.',
			);
		}

		if (!Type.isUndefined(config.mode))
		{
			getParameters.mode = config.mode || 'ajax';
		}

		return {
			...getParameters,
			...(hasAnalytics ? prepareAnalytics(config.analytics) : {}),
			...(config.navigation ? prepareNavigation(config.navigation) : {}),
		};
	};

	// typeof null === 'object', so a null value has always gone into the recursion below and come
	// back empty: the value is dropped while its separator stays. Kept as is - the transport
	// serves every mobile module and the query strings it builds are already relied upon.
	const shouldDescend = (value) => Type.isObject(value) || value === null;

	/**
	 * @param {?Object} originalData
	 * @param {?string} [prefix]
	 * @param {boolean} [encode=true]
	 * @return {string}
	 */
	const prepareData = (originalData, prefix, encode = true) => {
		if (Type.isNil(originalData))
		{
			return '';
		}

		let data = '';

		Object.entries(originalData).forEach(([paramName, value]) => {
			if (data.length > 0)
			{
				data += '&';
			}

			const encodedName = encode ? encodeURIComponent(paramName) : paramName;
			const name = prefix ? `${prefix}[${encodedName}]` : encodedName;

			data += shouldDescend(value)
				? prepareData(value, name, encode)
				: `${name}=${encode ? encodeURIComponent(value) : value}`;
		});

		return data;
	};

	/**
	 * @param {string} action
	 * @param {RunActionConfig} [config]
	 * @return {Promise<ActionResponse>}
	 */
	const runAction = (action, config = {}) => {
		const getParameters = { ...prepareAjaxGetParameters(config), action };
		const onCreate = Type.isFunction(config.onCreate) ? config.onCreate : () => {};
		const isJson = Boolean(config.json);

		const ajaxConfig = {
			url: `${AJAX_URL}?${prepareData(getParameters, null, false)}`,
			method: 'POST',
			uploadBinary: Boolean(config.binary),
			dataType: 'json',
			data: isJson ? JSON.stringify(config.json) : config.data,
			headers: isJson ? { ...config.headers, 'Content-Type': 'application/json' } : config.headers,
			onUploadProgress: config.onprogressupload || (() => {}),
			prepareData: !isJson && (Type.isUndefined(config.prepareData) || Boolean(config.prepareData)),
		};

		const ajaxPromise = BX.ajax(ajaxConfig);
		onCreate(ajaxConfig.xhr);

		return ActionPromiseWrapper(ajaxPromise);
	};

	/**
	 * @param {string} component
	 * @param {string} action
	 * @param {RunActionConfig} [config]
	 * @return {Promise<ActionResponse>}
	 */
	const runComponentAction = (component, action, config = {}) => {
		const getParameters = { ...prepareAjaxGetParameters(config), action, c: component };
		const onCreate = Type.isFunction(config.onCreate) ? config.onCreate : () => {};

		const ajaxConfig = {
			/**
			 * We need to avoid double encoding causing by mobile implementation of underlying
			 * XMLHttpRequest.open. It encodes URL when it is passed without domain.
			 *
			 * Until we are passing URL here without domain here we are safe to not encode parameters
			 */
			url: `${AJAX_URL}?${prepareData(getParameters, null, false)}`,
			method: 'POST',
			dataType: 'json',
			data: config.data,
		};

		const ajaxPromise = BX.ajax(ajaxConfig);
		onCreate(ajaxConfig.xhr);

		return ActionPromiseWrapper(ajaxPromise);
	};

	// Legacy surface: everything written before this module reaches the transport through globals.
	// todo remove after all BX.ajax.* usages in other modules will be cleaned
	BX.ajax.runAction = runAction;
	BX.ajax.runComponentAction = runComponentAction;
	BX.ajax.prepareData = prepareData;

	module.exports = { runAction, runComponentAction, prepareData };
});
