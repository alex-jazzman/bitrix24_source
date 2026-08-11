/**
 * @module im/messenger/provider/services/analytics/suggests
 */
jn.define('im/messenger/provider/services/analytics/suggests', (require, exports, module) => {
	const { AnalyticsEvent } = require('analytics');
	const { Analytics } = require('im/messenger/const');
	const { DialogHelper } = require('im/messenger/lib/helper');
	const { AnalyticsHelper } = require('im/messenger/provider/services/analytics/helper');

	/**
	 * @class Suggests
	 * @desc BitrixGPT 2.0 chat suggests analytics (tool=ai, category=chat_operations).
	 */
	class Suggests
	{
		/**
		 * @param {DialogId} dialogId
		 * @param {ModesState} [modesState]
		 */
		sendSuggestsShow({ dialogId, modesState })
		{
			const dialogHelper = DialogHelper.createByDialogId(dialogId);
			if (!dialogHelper)
			{
				return;
			}

			new AnalyticsEvent()
				.setTool(Analytics.Tool.ai)
				.setCategory(Analytics.Category.chatOperations)
				.setEvent(Analytics.Event.suggestsShow)
				.setSection(AnalyticsHelper.getSectionCode())
				.setP4(AnalyticsHelper.buildAssistantSettingsP4({ dialogHelper, modesState }))
				.setP5(AnalyticsHelper.getFormattedChatId(dialogHelper.chatId))
				.send()
			;
		}

		/**
		 * @param {DialogId} dialogId
		 * @param {string} suggestText
		 * @param {ModesState} [modesState]
		 */
		sendSuggestsClick({ dialogId, suggestText, modesState })
		{
			const dialogHelper = DialogHelper.createByDialogId(dialogId);
			if (!dialogHelper)
			{
				return;
			}

			new AnalyticsEvent()
				.setTool(Analytics.Tool.ai)
				.setCategory(Analytics.Category.chatOperations)
				.setEvent(Analytics.Event.suggestsClick)
				.setSection(AnalyticsHelper.getSectionCode())
				.setP1(suggestText)
				.setP4(AnalyticsHelper.buildAssistantSettingsP4({ dialogHelper, modesState }))
				.setP5(AnalyticsHelper.getFormattedChatId(dialogHelper.chatId))
				.send()
			;
		}
	}

	module.exports = { Suggests };
});
