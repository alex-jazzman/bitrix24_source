/**
 * @module im/messenger/provider/services/analytics/src/assistant-button
 */
jn.define('im/messenger/provider/services/analytics/src/assistant-button', (require, exports, module) => {
	const { AnalyticsEvent } = require('analytics');
	const { Analytics } = require('im/messenger/const');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { DialogHelper } = require('im/messenger/lib/helper');
	const { MessengerParams } = require('im/messenger/lib/params');
	const { AnalyticsHelper } = require('im/messenger/provider/services/analytics/helper');

	/**
	 * @class AssistantButtonAnalytics
	 */
	class AssistantButtonAnalytics
	{
		constructor()
		{
			this.store = serviceLocator.get('core').getStore();
		}

		/**
		 * @param {DialogId} dialogId
		 * @param {boolean} isActive
		 */
		sendToggleReasoning({ dialogId, isActive })
		{
			/** @type {DialoguesModelState} */
			const dialogModel = DialogHelper.createByDialogId(dialogId)?.dialogModel;

			const event = isActive ? Analytics.Event.modeOn : Analytics.Event.modeOff;
			const analytics = new AnalyticsEvent()
				.setTool(Analytics.Tool.im)
				.setCategory(Analytics.Category.copilot)
				.setEvent(event)
				.setType(Analytics.Type.think)
				.setSection(AnalyticsHelper.getSectionCode())
			;

			const copilotMainRole = this.store.getters['dialoguesModel/copilotModel/getMainRoleByDialogId'](dialogId);
			if (copilotMainRole)
			{
				analytics.setP4(AnalyticsHelper.getCopilotRole(copilotMainRole.code));
			}

			const copilotModel = this.store.getters['dialoguesModel/copilotModel/getByDialogId'](dialogId);
			if (copilotModel)
			{
				const engineCode = copilotModel.chats?.[0].engine;
				const engine = MessengerParams.getCopilotAvailableEngines().find((item) => item.code === engineCode);
				analytics.setP2(`provider_${engine.name}`);
			}

			if (dialogModel?.chatId)
			{
				analytics
					.setP1(AnalyticsHelper.getP1ByChatType(dialogModel.type))
					.setP5(AnalyticsHelper.getFormattedChatId(dialogModel.chatId))
				;
			}

			analytics.send();
		}

		sendClickMCPIntegrations()
		{
			new AnalyticsEvent()
				.setTool(Analytics.Tool.im)
				.setCategory(Analytics.Category.chat)
				.setEvent(Analytics.Event.clickMCPIntegrations)
				.setSection(Analytics.Section.chatTextarea)
				.setP1(AnalyticsHelper.getP1ByChatType(Analytics.Type.aiAssistant))
				.send()
			;
		}
	}

	module.exports = {
		AssistantButtonAnalytics,
	};
});
