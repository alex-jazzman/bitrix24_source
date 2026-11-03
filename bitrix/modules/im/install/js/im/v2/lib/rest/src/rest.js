import { ajax, Type } from 'main.core';
import { EventEmitter } from 'main.core.events';

import { EventType } from 'im.v2.const';
import { Core } from 'im.v2.application.core';

import { prepareRequestData } from './helpers/prepare-request-data';
import { needRetryRequest, getErrorConfig, hasInvalidAuthError } from './helpers/handle-errors';
import {
	type RunActionConfig,
	type RunActionError,
	type RunActionResult,
	type RunActionResponse,
} from './types/run-action';
import { type BatchQuery } from './types/call-batch';

export type { RunActionError } from './types/run-action';
export type { CallBatchError } from './types/call-batch';

export const runAction = (action: string, config: RunActionConfig = {}): Promise<RunActionResponse> => {
	const preparedConfig = { ...config, data: prepareRequestData(config.data) };

	return runActionWithRetries(action, preparedConfig);
};

const runActionWithRetries = (
	action: string,
	config: RunActionConfig,
	retriesLeft: ?number = null,
): Promise<RunActionResponse> => {
	return new Promise((resolve, reject) => {
		ajax.runAction(action, config).then((response: RunActionResult) => {
			return resolve(response.data);
		}).catch((response: RunActionResult) => {
			const errors = Type.isArray(response?.errors)
				? response.errors.filter((error) => Type.isObject(error))
				: []
			;

			if (retriesLeft === 0)
			{
				return reject(errors);
			}

			if (needRetryRequest(errors))
			{
				return resolve(handleErrors(action, config, errors, retriesLeft));
			}

			return reject(errors);
		});
	});
};

export const callBatch = (query: BatchQuery): Promise<{[method: string]: any}> => {
	const preparedQuery = {};
	const methodsToCall = new Set();
	Object.entries(query).forEach(([method, params]) => {
		methodsToCall.add(method);
		preparedQuery[method] = [method, params];
	});

	return new Promise((resolve, reject) => {
		Core.getRestClient().callBatch(preparedQuery, (result) => {
			const data = {};
			for (const method of methodsToCall)
			{
				const methodResult: RestResult = result[method];
				if (methodResult.error())
				{
					const { error: code, error_description: description } = methodResult.error().ex;
					reject({ method, code, description });
					break;
				}
				data[method] = methodResult.data();
			}

			return resolve(data);
		});
	});
};

const handleErrors = async (
	action: string,
	config: RunActionConfig,
	errors: RunActionError[],
	retriesLeft: ?number,
): Promise<RunActionResponse> => {
	const errorConfig = getErrorConfig(errors);
	const nextRetriesLeft = (retriesLeft ?? errorConfig.retryCount) - 1;

	if (hasInvalidAuthError(errors))
	{
		await EventEmitter.emitAsync(EventType.request.onAuthError, { errors });
	}

	if (errorConfig.timeout)
	{
		return new Promise((resolve) => {
			setTimeout(() => {
				resolve(runActionWithRetries(action, config, nextRetriesLeft));
			}, errorConfig.timeout);
		});
	}

	return runActionWithRetries(action, config, nextRetriesLeft);
};
