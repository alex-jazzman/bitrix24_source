/**
 * @module im/messenger/provider/services/analytics/chat-create
 */
jn.define('im/messenger/provider/services/analytics/chat-create', (require, exports, module) => {
	const { AnalyticsEvent } = require('analytics');
	const { Analytics } = require('im/messenger/const');

	const { Feature } = require('im/messenger/lib/feature');
	const { AnalyticsHelper } = require('im/messenger/provider/services/analytics/helper');

	/**
	 * @class ChatCreate
	 */
	class ChatCreate
	{
		/**
		 * @desc The section is the folder of the screen, the answer every other chat event gives. The
		 *       creation menu of a project's nested tab is the one caller naming its section itself:
		 *       the label table keeps that label on `project_tab` for both platforms, and the nested
		 *       navigation stands for no folder of the dictionary.
		 * @param {{category: string, type: string, section?: string}} params
		 */
		sendStartCreation({ category, type, section })
		{
			try
			{
				const analytics = new AnalyticsEvent()
					.setTool(Analytics.Tool.im)
					.setSection(section ?? AnalyticsHelper.getFolderSectionCode())
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
			// Under BitrixGPT v2 the backend emits create_new_chat for every client, so sending it
			// here too would count the same chat twice. The server flag is used on purpose: it is the
			// exact condition the backend emitter is gated by.
			if (Feature.isBitrixGptV2Available)
			{
				return;
			}

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
