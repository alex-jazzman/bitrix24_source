/**
 * @module im/messenger/provider/pull/channel/dialog
 */
jn.define('im/messenger/provider/pull/channel/dialog', (require, exports, module) => {
	const { BaseDialogPullHandler } = require('im/messenger/provider/pull/base');
	/**
	 * @class ChannelDialogPullHandler
	 */
	class ChannelDialogPullHandler extends BaseDialogPullHandler
	{
		constructor()
		{
			super();
			this.supportSharedEvents = true;
		}

		async handleChatUserLeave(params, extra, command)
		{
			if (this.interceptEvent(params, extra, command))
			{
				return;
			}

			this.logger.info(`${this.getClassName()}.handleChatUserLeave`, params);

			const dialogId = params.dialogId;

			this.store.dispatch('dialoguesModel/removeParticipants', {
				dialogId,
				participants: [params.userId],
				userCounter: params.userCount,
			}).catch((err) => this.logger.error(`${this.getClassName()}.handleChatUserLeave.dialoguesModel/removeParticipants.catch:`, err));
		}
	}

	module.exports = { ChannelDialogPullHandler };
});
