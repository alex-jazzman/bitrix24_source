import { ajax } from 'main.core';
import { EventEmitter } from 'main.core.events';

import { EventType } from 'im.v2.const';
import { Core } from 'im.v2.application.core';

import { prepareRequestData } from './helpers/prepare-request-data';
import { needRetryRequest, getErrorConfig, hasInvalidAuthError } from './helpers/handle-errors';
import { type RunActionConfig, type RunActionResult, type RunActionResponse } from './types/run-action';
import { type BatchQuery } from './types/call-batch';

export type { RunActionError } from './types/run-action';
export type { CallBatchError } from './types/call-batch';

let retryCounter = null;

export const runAction = (action: string, config: RunActionConfig = {}): Promise<RunActionResponse> => {
	const preparedConfig = { ...config, data: prepareRequestData(config.data) };

	return new Promise((resolve, reject) => {
		ajax.runAction(action, preparedConfig).then((response: RunActionResult) => {
			retryCounter = null;

			return resolve(response.data);
		}).catch((response: RunActionResult) => {
			if (retryCounter === 0)
			{
				return reject(response.errors);
			}

			if (needRetryRequest(response.errors))
			{
				return handleErrors(action, preparedConfig, response);
			}

			return reject(response.errors);
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
	response: RunActionResult,
): Promise<RunActionResult> => {
	const errorConfig = getErrorConfig(response.errors);

	if (!retryCounter)
	{
		retryCounter = errorConfig.retryCount;
	}

	retryCounter--;

	if (hasInvalidAuthError(response.errors))
	{
		await EventEmitter.emitAsync(EventType.request.onAuthError, { errors: response.errors });
	}

	if (errorConfig.timeout)
	{
		return new Promise((resolve) => {
			setTimeout(() => {
				resolve(runAction(action, config));
			}, errorConfig.timeout);
		});
	}

	return runAction(action, config);
};
