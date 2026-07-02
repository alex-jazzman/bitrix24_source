/**
 * @module im/messenger/provider/services/analytics/message-pin
 */
jn.define('im/messenger/provider/services/analytics/message-pin', (require, exports, module) => {
	const { AnalyticsEvent } = require('analytics');
	const { Analytics } = require('im/messenger/const');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { AnalyticsHelper } = require('im/messenger/provider/services/analytics/helper');

	class MessagePin
	{
		constructor()
		{
			/**
			 * @type {MessengerCoreStore}
			 */
			this.store = serviceLocator.get('core').getStore();
		}

		/**
		 * @param {DialogId} dialogId
		 * @param {number} chatId
		 * @param {boolean} isNestedSection
		 */
		sendMessagePin({ dialogId, chatId, isNestedSection })
		{
			const chatData = this.store.getters['dialoguesModel/getById'](dialogId);

			if (!chatData)
			{
				return;
			}

			const pinsCounter = this.store.getters['messagesModel/pinModel/getPinsCounter'](chatId);
			const type = pinsCounter > 1 ? Analytics.Type.multiplePins : Analytics.Type.singlePin;
			const p3Value = `pinnedCount_${pinsCounter}`;
			const analyticsEvent = new AnalyticsEvent()
				.setTool(Analytics.Tool.im)
				.setCategory(AnalyticsHelper.getCategoryByChatType(chatData.type))
				.setEvent(Analytics.Event.pinMessage)
				.setType(type)
				.setSection(Analytics.Section.chatWindow)
				.setSubSection(Analytics.SubSection.contextMenu)
				.setP1(AnalyticsHelper.getP1ByDialog(chatData))
				.setP3(p3Value)
			;

			if (isNestedSection)
			{
				analyticsEvent.setElement(Analytics.Element.more);
			}

			analyticsEvent.send();
		}

		/**
		 * @param {DialogId} dialogId
		 * @param {number} chatId
		 * @param {boolean} [isNestedSection]
		 * @param {boolean} [isContextMenu]
		 */
		sendMessageUnpin({ dialogId, chatId, isNestedSection = false, isContextMenu = false })
		{
			const chatData = this.store.getters['dialoguesModel/getById'](dialogId);

			if (!chatData)
			{
				return;
			}

			const pinsCounter = this.store.getters['messagesModel/pinModel/getPinsCounter'](chatId);
			const type = pinsCounter ? Analytics.Type.selectedPin : Analytics.Type.singlePin;
			const analyticsEvent = new AnalyticsEvent()
				.setTool(Analytics.Tool.im)
				.setCategory(AnalyticsHelper.getCategoryByChatType(chatData.type))
				.setEvent(Analytics.Event.unpinMessage)
				.setType(type)
				.setP1(AnalyticsHelper.getP1ByDialog(chatData))
			;

			if (isNestedSection)
			{
				analyticsEvent.setElement(Analytics.Element.more);
			}

			if (isContextMenu)
			{
				analyticsEvent.setSection(Analytics.Section.chatWindow);
				analyticsEvent.setSubSection(Analytics.SubSection.contextMenu);
			}

			analyticsEvent.send();
		}

		/**
		 * @param {DialogId} dialogId
		 */
		sendPinListOpened({ dialogId })
		{
			const chatData = this.store.getters['dialoguesModel/getById'](dialogId);

			if (!chatData)
			{
				return;
			}

			const analyticsEvent = new AnalyticsEvent()
				.setTool(Analytics.Tool.im)
				.setCategory(AnalyticsHelper.getCategoryByChatType(chatData.type))
				.setEvent(Analytics.Event.openPinList)
				.setP1(AnalyticsHelper.getP1ByDialog(chatData))
			;

			analyticsEvent.send();
		}

		/**
		 * @param {DialogId} dialogId
		 */
		sendPinnedMessageLimitException({ dialogId })
		{
			const chatData = this.store.getters['dialoguesModel/getById'](dialogId);

			if (!chatData)
			{
				return;
			}

			const analyticsEvent = new AnalyticsEvent()
				.setTool(Analytics.Tool.im)
				.setCategory(AnalyticsHelper.getCategoryByChatType(chatData.type))
				.setEvent(Analytics.Event.pinnedMessageLimitException)
				.setP1(AnalyticsHelper.getP1ByDialog(chatData))
			;

			analyticsEvent.send();
		}
	}

	module.exports = { MessagePin };
});
