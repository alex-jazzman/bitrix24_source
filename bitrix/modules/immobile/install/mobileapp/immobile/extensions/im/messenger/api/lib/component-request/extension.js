/**
 * @module im/messenger/api/lib/component-request
 */
jn.define('im/messenger/api/lib/component-request', (require, exports, module) => {
	const { Type } = require('type');
	const { Uuid } = require('utils/uuid');
	const { EntityReady } = require('entity-ready');
	const { createPromiseWithResolvers } = require('im/messenger/api/lib/utils/promise');
	const { getApiVersion } = require('im/messenger/api/api-version');
	const {
		EventType,
		ComponentCode,
		WaitingEntity,
	} = require('im/messenger/const');

	const debug = {
		showExecutionTime: false,
	};

	/**
	 * @param {string} methodName
	 * @param {object} [methodParams]
	 * @return {Promise<unknown>}
	 */
	async function executeMethodInMessengerComponent(methodName, methodParams = {})
	{
		const apiVersion = await getApiVersion();
		if (apiVersion === 1)
		{
			throw new Error(`Messenger API v${apiVersion}: unsupported method executeMethodInMessengerComponent`);
		}

		const start = Date.now();
		const printExecutionTimeIfNeeded = () => {
			if (debug.showExecutionTime)
			{
				const finish = Date.now();
				const time = `${finish - start} ms.`;

				// eslint-disable-next-line no-console
				console.info(time);
			}
		};

		await EntityReady.wait(WaitingEntity.chat);

		const {
			promise,
			resolve,
			reject,
		} = createPromiseWithResolvers();

		const successHandler = (result) => {
			printExecutionTimeIfNeeded();

			resolve(result);
		};

		const errorHandler = (error) => {
			printExecutionTimeIfNeeded();

			reject(error);
		};

		const requestUuid = `${methodName}::${Uuid.getV4()}`;

		registerExecuteInComponentResultHandler(requestUuid, successHandler, errorHandler);
		sendExecuteInComponentRequestEvent(requestUuid, methodName, methodParams);

		return promise;
	}

	/**
	 * @param {string} requestUuid
	 * @param {string} methodName
	 * @param {object} methodParams
	 */
	function sendExecuteInComponentRequestEvent(requestUuid, methodName, methodParams)
	{
		const eventParams = [requestUuid, methodName, methodParams];
		BX.postComponentEvent(EventType.messenger.api.executeInComponentRequest, eventParams, ComponentCode.imMessenger);
	}

	/**
	 * @param {string} requestUuid
	 * @param {function} successHandler
	 * @param {function} errorHandler
	 * @return {function}
	 */
	function registerExecuteInComponentResultHandler(requestUuid, successHandler, errorHandler)
	{
		const handler = ({ requestUuid: resultUuid, result, errorText }) => {
			if (requestUuid !== resultUuid)
			{
				return;
			}

			BX.removeCustomEvent(EventType.messenger.api.executeInComponentResult, handler);
			if (Type.isStringFilled(errorText))
			{
				errorHandler(new Error(errorText));

				return;
			}

			successHandler(result);
		};

		BX.addCustomEvent(EventType.messenger.api.executeInComponentResult, handler);

		return handler;
	}

	module.exports = {
		executeMethodInMessengerComponent,
		debug,
	};
});
