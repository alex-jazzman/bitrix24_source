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
		 */
		constructor({
			chatId,
			counterState,
		})
		{
			super();
			this.chatId = chatId;
			this.counterState = counterState;
		}

		async execute(repository)
		{
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
