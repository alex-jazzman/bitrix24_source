/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
(function (exports, main_core, main_core_events, im_v2_const, im_v2_application_core) {
	'use strict';

	const prepareRequestData = data => {
		if (data instanceof FormData) {
			return data;
		}
		if (!main_core.Type.isObjectLike(data)) {
			return {};
		}
		return prepareValue(data);
	};
	const prepareValue = value => {
		if (main_core.Type.isBoolean(value)) {
			return value === true ? 'Y' : 'N';
		}
		if (main_core.Type.isArray(value)) {
			return value.map(item => prepareValue(item));
		}
		if (main_core.Type.isObject(value)) {
			const prepared = {};
			for (const [key, nestedValue] of Object.entries(value)) {
				prepared[key] = prepareValue(nestedValue);
			}
			return prepared;
		}
		return value;
	};

	const INVALID_AUTH_ERROR_CODE = 'invalid_authentication';
	const errorCodesConfig = {
		[INVALID_AUTH_ERROR_CODE]: {
			retryCount: 1,
			timeout: null
		}
	};
	const needRetryRequest = responseErrors => {
		return responseErrors.some(responseError => errorCodesConfig[responseError.code]);
	};
	const getErrorConfig = responseErrors => {
		const error = responseErrors.find(responseError => errorCodesConfig[responseError.code]);
		return errorCodesConfig[error.code];
	};
	const hasInvalidAuthError = responseErrors => {
		return responseErrors.some(error => error.code === INVALID_AUTH_ERROR_CODE);
	};

	const runAction = (action, config = {}) => {
		const preparedConfig = {
			...config,
			data: prepareRequestData(config.data)
		};
		return runActionWithRetries(action, preparedConfig);
	};
	const runActionWithRetries = (action, config, retriesLeft = null) => {
		return new Promise((resolve, reject) => {
			main_core.ajax.runAction(action, config).then(response => {
				return resolve(response.data);
			}).catch(response => {
				const errors = main_core.Type.isArray(response?.errors) ? response.errors.filter(error => main_core.Type.isObject(error)) : [];
				if (retriesLeft === 0) {
					return reject(errors);
				}
				if (needRetryRequest(errors)) {
					return resolve(handleErrors(action, config, errors, retriesLeft));
				}
				return reject(errors);
			});
		});
	};
	const callBatch = query => {
		const preparedQuery = {};
		const methodsToCall = new Set();
		Object.entries(query).forEach(([method, params]) => {
			methodsToCall.add(method);
			preparedQuery[method] = [method, params];
		});
		return new Promise((resolve, reject) => {
			im_v2_application_core.Core.getRestClient().callBatch(preparedQuery, result => {
				const data = {};
				for (const method of methodsToCall) {
					const methodResult = result[method];
					if (methodResult.error()) {
						const {
							error: code,
							error_description: description
						} = methodResult.error().ex;
						reject({
							method,
							code,
							description
						});
						break;
					}
					data[method] = methodResult.data();
				}
				return resolve(data);
			});
		});
	};
	const handleErrors = async (action, config, errors, retriesLeft) => {
		const errorConfig = getErrorConfig(errors);
		const nextRetriesLeft = (retriesLeft ?? errorConfig.retryCount) - 1;
		if (hasInvalidAuthError(errors)) {
			await main_core_events.EventEmitter.emitAsync(im_v2_const.EventType.request.onAuthError, {
				errors
			});
		}
		if (errorConfig.timeout) {
			return new Promise(resolve => {
				setTimeout(() => {
					resolve(runActionWithRetries(action, config, nextRetriesLeft));
				}, errorConfig.timeout);
			});
		}
		return runActionWithRetries(action, config, nextRetriesLeft);
	};

	exports.callBatch = callBatch;
	exports.runAction = runAction;

})(this.BX.Messenger.v2.Lib = this.BX.Messenger.v2.Lib || {}, BX, BX.Event, BX.Messenger.v2.Const, BX.Messenger.v2.Application);
//# sourceMappingURL=rest.bundle.js.map
