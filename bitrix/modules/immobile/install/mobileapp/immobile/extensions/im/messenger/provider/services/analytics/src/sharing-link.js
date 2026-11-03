/**
 * @module im/messenger/provider/services/analytics/src/sharing-link
 */
jn.define('im/messenger/provider/services/analytics/src/sharing-link', (require, exports, module) => {
	const { AnalyticsEvent } = require('analytics');
	const { Analytics } = require('im/messenger/const');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { AnalyticsHelper } = require('im/messenger/provider/services/analytics/helper');

	/**
	 * @class SharingLinkAnalytics
	 */
	class SharingLinkAnalytics
	{
		/** @private */
		get store()
		{
			return serviceLocator.get('core').getStore();
		}

		/**
		 * @desc Copying the employee sharing link of a chat. Mirrors web ChatInviteLink: the
		 *       category follows the project subtree, the sub section tells the three copy
		 *       sources apart, and appendix A lists this event, so the label carries no p4.
		 *       The guest link of the same section has its own event (sendCopyGuestLink).
		 * @param {DialogId} dialogId
		 * @param {string} [subSection] - one of the Analytics.SubSection.sharingLink* values
		 */
		sendCopyChatLink(dialogId, subSection = Analytics.SubSection.sharingLinkRow)
		{
			const dialog = this.store.getters['dialoguesModel/getById'](dialogId);
			if (!dialog)
			{
				return;
			}

			const category = AnalyticsHelper.getCategoryByChat(dialog);
			const analytics = new AnalyticsEvent()
				.setTool(Analytics.Tool.im)
				.setCategory(category)
				.setEvent(Analytics.Event.copyChatLink)
				.setSection(Analytics.Section.sidebar)
				.setSubSection(subSection)
				.setP1(AnalyticsHelper.getP1ByDialog(dialog))
			;

			analytics.send();
		}
	}

	module.exports = { SharingLinkAnalytics };
});
