/**
 * @module im/messenger-v2/application/lib/component-request-handler/src/component-request-handler
 */
jn.define('im/messenger-v2/application/lib/component-request-handler/src/component-request-handler', (require, exports, module) => {
	const { Type } = require('type');
	const {
		EventType ,
		MessengerComponentRequestMethod,
	} = require('im/messenger/const');
	const { getRecentUserListToCall } = require('im/messenger-v2/application/lib/component-request-handler/src/handler/get-recent-user-list-to-call');

	/**
	 * @class ComponentRequestHandler
	 */
	class ComponentRequestHandler
	{
		getMethodHandlersCollection()
		{
			return {
				[MessengerComponentRequestMethod.getRecentUserListToCall]: getRecentUserListToCall,
			};
		}

		/**
		 * @param {string} requestUuid
		 * @param {string} methodName
		 * @param {object} methodParams
		 */
		async handle(requestUuid, methodName, methodParams)
		{
			if (!Type.isStringFilled(requestUuid))
			{
				this.#sendError(requestUuid, new TypeError('requestUuid must be a filled string'));
			}

			if (!Type.isStringFilled(methodName))
			{
				this.#sendError(requestUuid, new TypeError('methodName must be a filled string'));
			}

			if (!Type.isFunction(this.getMethodHandlersCollection()[methodName]))
			{
				this.#sendError(requestUuid, new TypeError(`unsupported methodName "${methodName}"`));
			}

			if (!Type.isPlainObject(methodParams))
			{
				this.#sendError(requestUuid, new TypeError('methodParams must be a plain object'));
			}

			try
			{
				const result = await this.getMethodHandlersCollection()[methodName](methodParams);
				this.#sendResult(requestUuid, result);
			}
			catch (error)
			{
				this.#sendError(requestUuid, error);
			}
		}

		#sendResult(requestUuid, result)
		{
			BX.postComponentEvent(EventType.messenger.api.executeInComponentResult, [{
				requestUuid,
				result,
			}]);
		}

		#sendError(requestUuid, error)
		{
			BX.postComponentEvent(EventType.messenger.api.executeInComponentResult, [{
				requestUuid,
				errorText: `Messenger API: ComponentRequestHandler: ${error.name}: ${error.message}`,
			}]);
		}
	}

	module.exports = { ComponentRequestHandler };
});
