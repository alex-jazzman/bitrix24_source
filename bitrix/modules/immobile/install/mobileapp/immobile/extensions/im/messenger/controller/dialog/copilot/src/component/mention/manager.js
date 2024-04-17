/**
 * @module im/messenger/controller/dialog/copilot/component/mention/manager
 */
jn.define('im/messenger/controller/dialog/copilot/component/mention/manager', (require, exports, module) => {
	const { MentionManager } = require('im/messenger/controller/dialog/lib/mention');
	/**
	 * @class CopilotMentionManager
	 */
	class CopilotMentionManager extends MentionManager
	{

		subscribeEvents()
		{
			return; // blocked mentions
		}

		unsubscribeEvents()
		{
			return; // blocked mentions
		}
	}

	module.exports = { CopilotMentionManager };
});
