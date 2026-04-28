/**
 * @module im/messenger/lib/counters/update-system/delivery/read-request-queue
 */
jn.define('im/messenger/lib/counters/update-system/delivery/read-request-queue', (require, exports, module) => {
	const { Type } = require('type');
	const { RestMethod } = require('im/messenger/const');
	const { runAction } = require('im/messenger/lib/rest');
	const { getLoggerWithContext } = require('im/messenger/lib/logger');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');

	const {
		ConfirmationReadMessageAction,
		ErrorReadMessageAction,
	} = require('im/messenger/lib/counters/update-system/action/read-message/server');

	const logger = getLoggerWithContext('counters-update-system', 'ReadRequestQueue');

	/**
	 * @class ReadRequestQueue
	 */
	class ReadRequestQueue
	{
		constructor()
		{
			/** @type {Array<PendingOperation<LocalReadMessage>>} */
			this.operationQueue = [];
			this.isEnable = false;
			this.isProcessing = false;
		}

		/**
		 * @return {CountersUpdateSystem}
		 */
		get updateSystem()
		{
			return serviceLocator.get('counters-update-system');
		}

		/**
		 * @param {Array<PendingOperation<LocalReadMessage>>} operationList
		 */
		fillQueue(operationList)
		{
			this.operationQueue = operationList;
		}

		/**
		 * @param {PendingOperation<LocalReadMessage>} pendingOperation
		 */
		addOperation(pendingOperation)
		{
			this.operationQueue.push(pendingOperation);
		}

		/**
		 * @param {Array<number>} chatIdList
		 */
		clearQueueOfChatIdList(chatIdList)
		{
			if (!Type.isArrayFilled(chatIdList))
			{
				return;
			}
			const chatIdsSet = new Set(chatIdList);

			this.operationQueue = this.operationQueue
				.filter((operation) => !chatIdsSet.has(operation.chatId))
			;
		}

		enable()
		{
			this.isEnable = true;
		}

		disable()
		{
			this.isEnable = false;
		}

		tryReading()
		{
			if (!this.#shouldRead())
			{
				return;
			}
			this.isProcessing = true;
			const currentOperation = this.operationQueue.shift();

			this.#sendRequest(currentOperation)
				.then(() => {
					this.isProcessing = false;

					this.tryReading();
				})
				.catch((error) => {
					logger.error('tryReading error', error);
				})
			;
		}

		#shouldRead()
		{
			if (!this.isEnable)
			{
				return false;
			}

			if (!Type.isArrayFilled(this.operationQueue))
			{
				return false;
			}

			if (this.isProcessing)
			{
				return false;
			}

			return true;
		}

		/**
		 * @param {PendingOperation<LocalReadMessage>} currentOperation
		 * @return {Promise}
		 */
		async #sendRequest(currentOperation)
		{
			try
			{
				const result = await runAction(RestMethod.imV2ChatMessageRead, {
					data: {
						chatId: currentOperation.chatId,
						ids: currentOperation.data.messageIdList,
						actionUuid: currentOperation.actionUuid,
					},
				});

				this.#processResult(result, currentOperation);
			}
			catch (errors)
			{
				if (!Type.isArray(errors))
				{
					// eslint-disable-next-line no-ex-assign
					errors = [errors];
				}

				this.#processError(errors, currentOperation);
			}
		}

		#processResult(result, pendingOperation)
		{
			const {
				chatId,
				counter,
				lastId,
			} = result;

			this.updateSystem.dispatch(new ConfirmationReadMessageAction({
				chatId,
				counter,
				actionUuid: pendingOperation.actionUuid,
				lastReadId: lastId,
			}))
				.catch((error) => {
					logger.error('processResult: dispatch ConfirmationReadMessageAction error', error);
				});
		}

		#processError(errors, pendingOperation)
		{
			const networkError = errors
				.find((error) => error?.code === 'NETWORK_ERROR')
			;

			if (networkError)
			{
				this.operationQueue.unshift(pendingOperation);

				return;
			}

			logger.error('processError: errors without NETWORK_ERROR. delete from queue', pendingOperation.chatId);

			this.#clearQueueOfChatId(pendingOperation.chatId);
			this.updateSystem.dispatch(new ErrorReadMessageAction({
				errors,
				chatId: pendingOperation.chatId,
				actionUuid: pendingOperation.actionUuid,
			}))
				.catch((error) => {
					logger.error('processError: dispatch ErrorReadMessageAction error', error);
				});
		}

		#clearQueueOfChatId(chatId)
		{
			this.operationQueue = this.operationQueue
				.filter((operation) => operation.chatId !== chatId)
			;
		}
	}

	module.exports = { ReadRequestQueue };
});
