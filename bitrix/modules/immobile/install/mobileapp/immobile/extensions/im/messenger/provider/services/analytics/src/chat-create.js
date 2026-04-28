/**
 * @module im/messenger/provider/services/analytics/chat-create
 */
jn.define('im/messenger/provider/services/analytics/chat-create', (require, exports, module) => {
	const { AnalyticsEvent } = require('analytics');
	const { Analytics } = require('im/messenger/const');

	const { AnalyticsHelper } = require('im/messenger/provider/services/analytics/helper');

	/**
	 * @class ChatCreate
	 */
	class ChatCreate
	{
		sendStartCreation({ category, type, section = Analytics.Section.chatTab })
		{
			try
			{
				const analytics = new AnalyticsEvent()
					.setTool(Analytics.Tool.im)
					.setSection(section)
					.setCategory(category)
					.setEvent(Analytics.Event.clickCreateNew)
					.setType(type)
					.setP2(AnalyticsHelper.getP2ByUserType())
				;

				analytics.send();
			}
			catch (e)
			{
				console.error(`${this.constructor.name}.sendStartCreation.catch:`, e);
			}
		}

		/**
		 * @param {{chatId: number}} params
		 */
		sendCreateCopilotDialog({ chatId })
		{
			try
			{
				const analytics = new AnalyticsEvent()
					.setTool(Analytics.Tool.ai)
					.setCategory(Analytics.Category.chatOperations)
					.setEvent(Analytics.Event.createNewChat)
					.setType(Analytics.Type.ai)
					.setSection(Analytics.Section.copilotTab)
					.setP3(Analytics.CopilotChatType.private)
					.setP5(`chatId_${chatId}`);

				analytics.send();
			}
			catch (e)
			{
				console.error(`${this.constructor.name}.sendCreateCopilotDialog.catch:`, e);
			}
		}
	}

	module.exports = { ChatCreate };
});
