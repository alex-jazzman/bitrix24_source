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
	}

	module.exports = { ChannelDialogPullHandler };
});
