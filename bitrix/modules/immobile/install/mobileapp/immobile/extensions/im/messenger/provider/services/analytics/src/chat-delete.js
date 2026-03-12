/**
 * @module im/messenger/provider/services/analytics/chat-delete
 */
jn.define('im/messenger/provider/services/analytics/chat-delete', (require, exports, module) => {
	const { AnalyticsEvent } = require('analytics');

	const { Analytics, NavigationTabId } = require('im/messenger/const');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { getLoggerWithContext } = require('im/messenger/lib/logger');

	const { AnalyticsHelper } = require('im/messenger/provider/services/analytics/helper');

	/**
	 * @class ChatDelete
	 */
	class ChatDelete
	{
		constructor()
		{
			this.store = serviceLocator.get('core').getStore();
			this.logger = getLoggerWithContext('analytics-service', this);
		}

		get #recentManager()
		{
			const recentManager = serviceLocator.get('recent-manager');
			if (recentManager)
			{
				return recentManager;
			}

			this.logger.error('recentManager is not initialized.');

			return null;
		}

		sendChatDeletePopupShown({ dialogId })
		{
			const chatData = this.store.getters['dialoguesModel/getById'](dialogId);

			const analyticsEvent = new AnalyticsEvent();

			analyticsEvent
				.setTool(Analytics.Tool.im)
				.setCategory(this.#getChatCategory())
				.setEvent(Analytics.Event.clickDelete)
				.setType(AnalyticsHelper.getTypeByChatType(chatData.type))
				.setSection(Analytics.Section.sidebar)
				.setSubSection(Analytics.SubSection.contextMenu)
				.setP1(AnalyticsHelper.getP1ByDialog(chatData))
			;

			analyticsEvent.send();
		}

		sendChatDeleteCanceled({ dialogId })
		{
			const chatData = this.store.getters['dialoguesModel/getById'](dialogId);

			const analyticsEvent = new AnalyticsEvent();

			analyticsEvent
				.setTool(Analytics.Tool.im)
				.setCategory(this.#getChatCategory())
				.setEvent(Analytics.Event.cancelDelete)
				.setType(AnalyticsHelper.getTypeByChatType(chatData.type))
				.setSection(Analytics.Section.popup)
				.setP1(AnalyticsHelper.getP1ByDialog(chatData))
			;

			analyticsEvent.send();
		}

		sendChatDeleteConfirmed({ dialogId })
		{
			const chatData = this.store.getters['dialoguesModel/getById'](dialogId);

			const analyticsEvent = new AnalyticsEvent();

			analyticsEvent
				.setTool(Analytics.Tool.im)
				.setCategory(this.#getChatCategory())
				.setEvent(Analytics.Event.delete)
				.setType(AnalyticsHelper.getTypeByChatType(chatData.type))
				.setSection(Analytics.Section.popup)
				.setP1(AnalyticsHelper.getP1ByDialog(chatData))
				.setP5(AnalyticsHelper.getFormattedChatId(chatData.chatId))
			;

			analyticsEvent.send();
		}

		sendToastShownChatDelete({ chatId, chatType, isChatOpened = false })
		{
			const analyticsEvent = new AnalyticsEvent();

			analyticsEvent
				.setTool(Analytics.Tool.im)
				.setCategory(Analytics.Category.chatPopup)
				.setEvent(Analytics.Event.view)
				.setType(this.#getDeletingChatCategory())
				.setP1(this.#prepareChatType(chatType))
			;

			if (isChatOpened)
			{
				analyticsEvent.setSection(Analytics.Section.activeChat);
			}

			analyticsEvent.send();
		}

		#getChatCategory()
		{
			switch (this.#recentManager?.getActiveRecentId())
			{
				case NavigationTabId.chats: return Analytics.Category.chat;
				case NavigationTabId.copilot: return Analytics.Category.copilot;
				case NavigationTabId.channel: return Analytics.Category.channel;
				default: return Analytics.Category.chat;
			}
		}

		#getDeletingChatCategory()
		{
			switch (this.#recentManager?.getActiveRecentId())
			{
				case NavigationTabId.chats: return 'deleted_chat';
				case NavigationTabId.copilot: return 'deleted_copilot';
				case NavigationTabId.channel: return 'deleted_channel';
				default: return 'deleted_chat';
			}
		}

		/**
		 * @param {string} type
		 * @returns {string}
		 */
		#prepareChatType(type)
		{
			return `chatType_${AnalyticsHelper.prepareChatType(type)}`;
		}
	}

	module.exports = { ChatDelete };
});
