/* eslint-disable promise/catch-or-return */

/**
 * @module im/messenger/provider/pull/chat/dialog
 */
jn.define('im/messenger/provider/pull/chat/dialog', (require, exports, module) => {
	const { BaseDialogPullHandler } = require('im/messenger/provider/pull/base');
	const { LoggerManager } = require('im/messenger/lib/logger');
	const logger = LoggerManager.getInstance().getLogger('pull-handler--chat-dialog');

	/**
	 * @class ChatDialogPullHandler
	 */
	class ChatDialogPullHandler extends BaseDialogPullHandler
	{
		constructor()
		{
			super({ logger });
		}
	}

	module.exports = {
		ChatDialogPullHandler,
	};
});
