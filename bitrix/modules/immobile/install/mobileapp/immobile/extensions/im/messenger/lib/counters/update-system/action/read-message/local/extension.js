/**
 * @module im/messenger/lib/counters/update-system/action/read-message/local
 */
jn.define('im/messenger/lib/counters/update-system/action/read-message/local', (require, exports, module) => {
	const { Type } = require('type');
	const { COUNTER_OVERFLOW_LIMIT } = require('im/messenger/const');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');

	const { PendingOperationType } = require('im/messenger/lib/counters/update-system/const');
	const { CounterAction } = require('im/messenger/lib/counters/update-system/action/base');

	/**
	 * @class LocalReadMessageAction
	 */
	class LocalReadMessageAction extends CounterAction
	{
		/**
		 * @param {number} chatId
		 * @param {Array<number>} messageIdList
		 * @param {number} lastReadId
		 * @param {Array<number>} unreadMessages
		 * @param {string} actionUuid
		 * @param {number} lastMessageId
		 */
		constructor({
			chatId,
			messageIdList,
			lastReadId,
			unreadMessages,
			actionUuid,
			lastMessageId,
		})
		{
			super();
			this.chatId = chatId;
			this.messageIdList = messageIdList;
			this.actionUuid = actionUuid;
			this.lastReadId = lastReadId;
			/** @type {Set<number>} */
			this.unreadMessages = new Set(unreadMessages);
			this.lastMessageId = lastMessageId;
		}

		getType()
		{
			return PendingOperationType.localReadMessage;
		}

		/**
		 * @param {ChatCounterRepository} repository
		 * @return {Promise<unknown>}
		 */
		async execute(repository)
		{
			const counterState = repository.getCounterState(this.chatId);
			let pendingOperation = null;
			if (this.#canChangeCounter(counterState))
			{
				const { delta, expectedCounter } = this.#calculateExpectedCounter(counterState);

				pendingOperation = this.#createPendingOperation({ delta, expectedCounter });

				const counterStateToSave = {
					...counterState,
					counter: expectedCounter,
				};

				await repository.saveCounterStateWithPendingOperation(this.chatId, counterStateToSave, pendingOperation);
			}

			// The default value is when the counterState cannot be changed, but there are messages to read.
			pendingOperation ??= this.#createPendingOperation({
				delta: 0,
				expectedCounter: counterState?.counter ?? 0,
			});

			serviceLocator.get('counters-update-system').addReadRequestToQueue(pendingOperation)
				.catch((error) => {
					this.logger.error('execute: addReadRequestToQueue error', error, pendingOperation);
				});
		}

		/**
		 * @param {CounterModelState} counterState
		 * @return {{delta: number, expectedCounter: number}}
		 */
		#calculateExpectedCounter(counterState)
		{
			if (this.#hasLastMessageRead())
			{
				return {
					delta: counterState.counter,
					expectedCounter: 0,
				};
			}

			const delta = this.messageIdList.reduce((counter, messageId) => {
				if (this.unreadMessages.has(messageId))
				{
					return counter + 1;
				}

				return counter;
			}, 0);

			return {
				delta,
				expectedCounter: counterState.counter - delta >= 0 ? counterState.counter - delta : 0,
			};
		}

		/**
		 * @param {CounterModelState} counterState
		 * @return {boolean}
		 */
		#canChangeCounter(counterState)
		{
			if (!Type.isPlainObject(counterState))
			{
				return false;
			}

			return counterState.counter > 0 && counterState.counter < COUNTER_OVERFLOW_LIMIT;
		}

		/**
		 * @param delta
		 * @param expectedCounter
		 * @return {PendingOperation<LocalReadMessage>}
		 */
		#createPendingOperation({ delta, expectedCounter })
		{
			return {
				actionUuid: this.actionUuid,
				chatId: this.chatId,
				timestamp: Date.now(),
				type: this.getType(),
				data: {
					messageIdList: this.messageIdList,
					unreadMessages: [...this.unreadMessages],
					lastReadId: this.lastReadId,
					lastMessageId: this.lastMessageId,
					delta,
					expectedCounter,
				},
			};
		}

		#hasLastMessageRead()
		{
			return this.unreadMessages.has(this.lastMessageId);
		}
	}

	module.exports = { LocalReadMessageAction };
});
