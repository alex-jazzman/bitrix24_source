/**
 * @module im/messenger/provider/services/analytics/chat-delete
 */
jn.define('im/messenger/provider/services/analytics/chat-delete', (require, exports, module) => {
	const { AnalyticsEvent } = require('analytics');

	const { Analytics } = require('im/messenger/const');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');

	const { AnalyticsHelper } = require('im/messenger/provider/services/analytics/helper');

	/**
	 * @class ChatDelete
	 */
	class ChatDelete
	{
		constructor()
		{
			this.store = serviceLocator.get('core').getStore();
		}

		sendChatDeletePopupShown({ dialogId })
		{
			const chatData = this.store.getters['dialoguesModel/getById'](dialogId);
			const category = AnalyticsHelper.getCategoryByChat(chatData);

			const analyticsEvent = new AnalyticsEvent();

			analyticsEvent
				.setTool(Analytics.Tool.im)
				.setCategory(category)
				.setEvent(Analytics.Event.clickDelete)
				.setType(AnalyticsHelper.getTypeByDialog(chatData))
				.setSection(Analytics.Section.sidebar)
				.setSubSection(Analytics.SubSection.contextMenu)
				.setP1(AnalyticsHelper.getP1ByDialog(chatData))
			;

			analyticsEvent.send();
		}

		sendChatDeleteCanceled({ dialogId })
		{
			const chatData = this.store.getters['dialoguesModel/getById'](dialogId);
			const category = AnalyticsHelper.getCategoryByChat(chatData);

			const analyticsEvent = new AnalyticsEvent();

			analyticsEvent
				.setTool(Analytics.Tool.im)
				.setCategory(category)
				.setEvent(Analytics.Event.cancelDelete)
				.setType(AnalyticsHelper.getTypeByDialog(chatData))
				.setSection(Analytics.Section.popup)
				.setP1(AnalyticsHelper.getP1ByDialog(chatData))
			;

			analyticsEvent.send();
		}

		sendChatDeleteConfirmed({ dialogId })
		{
			const chatData = this.store.getters['dialoguesModel/getById'](dialogId);
			const category = AnalyticsHelper.getCategoryByChat(chatData);

			const analyticsEvent = new AnalyticsEvent();

			analyticsEvent
				.setTool(Analytics.Tool.im)
				.setCategory(category)
				.setEvent(Analytics.Event.delete)
				.setType(AnalyticsHelper.getTypeByDialog(chatData))
				.setSection(Analytics.Section.popup)
				.setP1(AnalyticsHelper.getP1ByDialog(chatData))
				.setP5(AnalyticsHelper.getFormattedChatId(chatData.chatId))
			;

			if (category === Analytics.Category.project)
			{
				const projectId = AnalyticsHelper.getFormattedProjectId(chatData);
				if (projectId)
				{
					analyticsEvent.setP4(projectId);
				}
			}

			analyticsEvent.send();
		}

		sendToastShownChatDelete({ dialogId, parentChatId, chatType, isChatOpened = false })
		{
			// The pull-driven delete notification fires AFTER the chat is removed from the
			// store, so rebuild the minimal model the resolvers need from the pre-removal
			// context (chatType + parentChatId; the parent collab survives) instead of the
			// gone record. getCategoryByChat walks the subtree via the surviving parent.
			const dialogModel = { dialogId, type: chatType, parentChatId };
			const category = AnalyticsHelper.getCategoryByChat(dialogModel);

			const analyticsEvent = new AnalyticsEvent();

			analyticsEvent
				.setTool(Analytics.Tool.im)
				.setCategory(Analytics.Category.chatPopup)
				.setEvent(Analytics.Event.view)
				.setType(`deleted_${category}`)
				.setP1(AnalyticsHelper.getP1ByDialog(dialogModel))
			;

			if (isChatOpened)
			{
				analyticsEvent.setSection(Analytics.Section.activeChat);
			}

			analyticsEvent.send();
		}
	}

	module.exports = { ChatDelete };
});
