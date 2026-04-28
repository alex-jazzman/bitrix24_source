/**
 * @module im/messenger/lib/counters/update-system/action/read-message/server/src/error
 */
jn.define('im/messenger/lib/counters/update-system/action/read-message/server/src/error', (require, exports, module) => {
	const { PendingOperationType } = require('im/messenger/lib/counters/update-system/const');
	const { CounterAction } = require('im/messenger/lib/counters/update-system/action/base');

	/**
	 * @class ErrorReadMessageAction
	 */
	class ErrorReadMessageAction extends CounterAction
	{
		constructor({
			chatId,
			actionUuid,
			errors,
		})
		{
			super();
			this.chatId = chatId;
			this.actionUuid = actionUuid;
			this.errors = errors;
		}

		getType()
		{
			return PendingOperationType.errorReadMessageAction;
		}

		async execute(repository)
		{
			await repository.deleteOperationsByChatId(this.chatId);
		}
	}

	module.exports = { ErrorReadMessageAction };
});
