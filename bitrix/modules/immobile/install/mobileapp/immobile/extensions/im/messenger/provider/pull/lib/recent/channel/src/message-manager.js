/**
 * @module im/messenger/provider/pull/lib/recent/channel/message-manager
 */
jn.define('im/messenger/provider/pull/lib/recent/channel/message-manager', (require, exports, module) => {
	const { BaseRecentMessageManager } = require('im/messenger/provider/pull/lib/recent/base');
	/**
	 * @class ChannelRecentMessageManager
	 */
	class ChannelRecentMessageManager extends BaseRecentMessageManager
	{
		needToSkipMessageEvent()
		{
			if (this.isLinesChat() || this.isCommentChat())
			{
				return true;
			}

			if (this.isOpenChannelChat() && this.isUserInChat())
			{
				return true;
			}

			return false;
		}
	}

	module.exports = { ChannelRecentMessageManager };
});
