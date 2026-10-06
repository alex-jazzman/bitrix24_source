/**
 * @module im/messenger/provider/services/analytics/src/guest
 */
jn.define('im/messenger/provider/services/analytics/src/guest', (require, exports, module) => {
	const { AnalyticsEvent } = require('analytics');
	const { Analytics } = require('im/messenger/const');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { AnalyticsHelper } = require('im/messenger/provider/services/analytics/helper');

	class GuestAnalytics
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
		sendCopyGuestLink(dialogId)
		{
			const dialog = this.store.getters['dialoguesModel/getById'](dialogId);
			if (!dialog)
			{
				return;
			}

			new AnalyticsEvent()
				.setTool(Analytics.Tool.im)
				.setCategory(Analytics.Category.messenger)
				.setEvent(Analytics.Event.copyGuestLink)
				.setP1(AnalyticsHelper.getP1ByDialog(dialog))
				.send()
			;
		}

		/**
		 * @description Fired when the guest opens the "enter your name" bottom-sheet on
		 * the very first dialog visit. Current user is always a guest in this scenario,
		 * so p2 is resolved via getP2ByUserType() → 'user_guest'.
		 * @param {DialogId} dialogId
		 */
		sendViewJoinPopup(dialogId)
		{
			const dialog = this.store.getters['dialoguesModel/getById'](dialogId);
			if (!dialog)
			{
				return;
			}

			new AnalyticsEvent()
				.setTool(Analytics.Tool.im)
				.setCategory(Analytics.Category.messenger)
				.setEvent(Analytics.Event.viewJoinPopup)
				.setP1(AnalyticsHelper.getP1ByDialog(dialog))
				.setP2(AnalyticsHelper.getP2ByUserType())
				.send()
			;
		}
	}

	module.exports = { GuestAnalytics };
});
