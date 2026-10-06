/**
 * @module im/messenger/lib/counters/update-system/action/new-message/pull/src/own-message
 */
jn.define('im/messenger/lib/counters/update-system/action/new-message/pull/src/own-message', (require, exports, module) => {
	const { PendingOperationType } = require('im/messenger/lib/counters/update-system/const');
	const { CounterAction } = require('im/messenger/lib/counters/update-system/action/base');
	/**
	 * @class NewOwnPullMessageAction
	 */
	class NewOwnPullMessageAction extends CounterAction
	{
		/**
		 * @param {number} chatId
		 * @param {CounterModelState} counterState
		 * @param {?number} messageId
		 */
		constructor({
			chatId,
			counterState,
			messageId = null,
		})
		{
			super();
			this.chatId = chatId;
			this.counterState = counterState;
			this.messageId = messageId;
		}

		async execute(repository)
		{
			if (await this.isOutdatedByLastMessageId(this.chatId, this.messageId))
			{
				this.logger.warn('NewOwnPullMessageAction: skip outdated message event', {
					chatId: this.chatId,
					messageId: this.messageId,
				});

				return;
			}

			await repository.deleteOperationsByChatId(this.chatId);
			await repository.saveCounterStateList([{
				...this.counterState,
				counter: 0,
			}]);
		}

		getType()
		{
			return PendingOperationType.newOwnPullMessage;
		}
	}

	module.exports = { NewOwnPullMessageAction };
});
