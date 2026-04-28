/**
 * @module im/messenger/provider/services/analytics/src/mention
 */
jn.define('im/messenger/provider/services/analytics/src/mention', (require, exports, module) => {
	const { AnalyticsEvent } = require('analytics');
	const { Analytics } = require('im/messenger/const');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { AnalyticsHelper } = require('im/messenger/provider/services/analytics/helper');

	class Mention
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
		 */
		sendAddParticipant(dialogId)
		{
			const chatData = this.store.getters['dialoguesModel/getById'](dialogId);
			if (!chatData)
			{
				return;
			}

			const analyticsEvent = new AnalyticsEvent()
				.setTool(Analytics.Tool.im)
				.setCategory(Analytics.Category.chat)
				.setEvent(Analytics.Event.addMentionedUser)
				.setP1(AnalyticsHelper.getP1ByDialog(chatData))
			;

			analyticsEvent.send();
		}
	}

	module.exports = { Mention };
});
