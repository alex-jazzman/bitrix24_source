/* eslint-disable promise/catch-or-return */

/**
 * @module im/messenger/provider/pull/copilot/dialog
 */
jn.define('im/messenger/provider/pull/copilot/dialog', (require, exports, module) => {
	const { ChatDialogPullHandler } = require('im/messenger/provider/pull/chat/dialog');
	const { getLogger } = require('im/messenger/lib/logger');
	const { TabCounters } = require('im/messenger/lib/counters/tab-counters');
	const { DialogHelper } = require('im/messenger/lib/helper');

	const logger = getLogger('pull-handler--copilot-dialog');

	/**
	 * @class CopilotDialogPullHandler
	 */
	class CopilotDialogPullHandler extends ChatDialogPullHandler
	{
		constructor()
		{
			super({ logger });
		}

		handleGeneralChatId(params, extra, command)
		{
			logger.info(`${this.getClassName()}.handleGeneralChatId and nothing happened`, params);
			// TODO general change action is not available now for copilot chat
		}

		handleChatAvatar(params, extra, command)
		{
			logger.info(`${this.getClassName()}.handleChatAvatar and nothing happened`, params);
			// TODO change avatar action is not available now for copilot chat
		}

		handleChatChangeColor(params, extra, command)
		{
			logger.info(`${this.getClassName()}.handleChatChangeColor and nothing happened`, params);
			// TODO change color action is not available now for copilot chat
		}

		/**
		 * @override
		 * @param {String} dialogId
		 * @void
		 */
		deleteCounters(dialogId)
		{
			delete TabCounters.copilotCounter.detail[dialogId];
		}

		/**
		 * @param {DialoguesModelState} chatData
		 * @return {boolean}
		 */
		shouldDeleteChat(chatData)
		{
			const helper = DialogHelper.createByModel(chatData);

			if (!helper?.isCopilot)
			{
				return false;
			}

			return true;
		}
	}

	module.exports = {
		CopilotDialogPullHandler,
	};
});
