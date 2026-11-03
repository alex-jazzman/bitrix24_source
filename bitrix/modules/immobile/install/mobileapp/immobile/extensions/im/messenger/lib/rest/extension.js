/**
* @module im/messenger/lib/rest
*/
jn.define('im/messenger/lib/rest', (require, exports, module) => {
	const { getLogger } = require('im/messenger/lib/logger');
	const {
		isGuestUnauthorized,
		handleGuestSessionTerminated,
	} = require('im/messenger/lib/guest-session');

	const logger = getLogger('network');
	const ABORT_ERROR = 'AbortError';

	/**
	 * Builds the config representation for the network log.
	 * The `config.data` keys listed in `options.maskDataKeysInLog` are replaced
	 * with `{ fieldIds, masked: true }`, so the content of the user input never
	 * reaches the device log — only its field ids. The config itself
	 * is not changed and goes to the network as is.
	 *
	 * @param {ajaxConfig} config
	 * @param {{ maskDataKeysInLog?: Array<string> }} [options]
	 * @return {ajaxConfig}
	 */
	const createConfigForLog = (config, options = {}) => {
		const maskDataKeys = options.maskDataKeysInLog ?? [];
		if (maskDataKeys.length === 0 || !config?.data)
		{
			return config;
		}

		const maskedData = { ...config.data };
		for (const key of maskDataKeys)
		{
			if (!(key in maskedData))
			{
				continue;
			}

			const value = maskedData[key];
			maskedData[key] = {
				fieldIds: (value !== null && typeof value === 'object') ? Object.keys(value) : [],
				masked: true,
			};
		}

		return { ...config, data: maskedData };
	};

	/**
	 * @template T
	 * @param {string} action
	 * @param {ajaxConfig} config
	 * @param {{ maskDataKeysInLog?: Array<string> }} [options] - `config.data` keys
	 * whose content must not reach the device log (masked in the request,
	 * response and catch log entries)
	 * @return {Promise<T>}
	 */
	const runAction = (action, config = {}, options = {}) => {
		const logConfig = createConfigForLog(config, options);
		logger.log('ajax.runAction.request >>', action, logConfig);

		return new Promise((resolve, reject) => {
			BX.ajax.runAction(action, config)
				.then((response) => {
					logger.log('ajax.runAction.response <<', response, action, logConfig);

					return resolve(response.data);
				})
				.catch((response) => {
					logger.error('ajax.runAction.catch:', response, action, logConfig);

					const httpStatus = response?.data?.ajaxRejectData?.xhr?.status;
					if (isGuestUnauthorized(httpStatus))
					{
						handleGuestSessionTerminated();
					}

					return reject(response.errors);
				})
			;
		});
	};

	/**
	 * @param method
	 * @param [params]
	 * @returns {Promise<RestResult>}
	 */
	const callMethod = async (method, params) => {
		logger.log('BX.rest.callMethod request >>', method, params);

		return new Promise((resolve, reject) => {
			BX.rest.callMethod(method, params)
				.then((response) => {
					logger.log('BX.rest.callMethod response <<', response, method, params);

					return resolve(response);
				})
				.catch((response) => {
					logger.log('BX.rest.callMethod catch:', response, method, params);

					if (isGuestUnauthorized(response?.status))
					{
						handleGuestSessionTerminated();
					}

					return reject(response);
				})
			;
		});
	};

	/**
	 * @template T
	 * @param {string} action
	 * @param {ajaxConfig} config
	 * @return {{promise: Promise<T>, abort: () => void}}
	 */
	const runAbortableAction = (action, config = {}) => {
		let abortCallback = null;
		const abortPromise = new Promise((resolve, reject) => {
			abortCallback = () => {
				reject(new Error(ABORT_ERROR));
			};
		});

		const promise = Promise.race([
			runAction(action, config),
			abortPromise,
		]);

		return {
			promise,
			abort: abortCallback,
		};
	};

	module.exports = {
		runAction,
		runAbortableAction,
		callMethod,
		createConfigForLog,
		ABORT_ERROR,
	};
});
