/**
* @module im/messenger/lib/rest
*/
jn.define('im/messenger/lib/rest', (require, exports, module) => {
	const { getLogger } = require('im/messenger/lib/logger');
	const logger = getLogger('network');
	const ABORT_ERROR = 'AbortError';

	/**
	 * @template T
	 * @param {string} action
	 * @param {ajaxConfig} config
	 * @return {Promise<T>}
	 */
	const runAction = (action, config = {}) => {
		logger.log('ajax.runAction.request >>', action, config);

		return new Promise((resolve, reject) => {
			BX.ajax.runAction(action, config)
				.then((response) => {
					logger.log('ajax.runAction.response <<', response, action, config);

					return resolve(response.data);
				})
				.catch((response) => {
					logger.error('ajax.runAction.catch:', response, action, config);

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
		ABORT_ERROR,
	};
});
