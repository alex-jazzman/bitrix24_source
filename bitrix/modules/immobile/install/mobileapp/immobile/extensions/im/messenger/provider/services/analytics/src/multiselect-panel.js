/**
 * @module im/messenger/provider/services/analytics/src/multiselect-panel
 */
jn.define('im/messenger/provider/services/analytics/src/multiselect-panel', (require, exports, module) => {
	const { AnalyticsEvent } = require('analytics');
	const { Analytics } = require('im/messenger/const');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { AnalyticsHelper } = require('im/messenger/provider/services/analytics/helper');

	/**
	 * @class MultiselectPanelAnalytics
	 */
	class MultiselectPanelAnalytics
	{
		/** @private */
		get store()
		{
			return serviceLocator.get('core').getStore();
		}

		/**
		 * @desc Building an AI task out of the selected messages. The event is shared with the message
		 *       context menu, and only the sub section tells the two entry points apart. The panel is
		 *       not a menu and has no levels, so the label carries no c_element.
		 * @param {DialogId} dialogId
		 */
		sendCreateAiTaskTap(dialogId)
		{
			const dialogModel = this.store.getters['dialoguesModel/getById'](dialogId);
			if (!dialogModel)
			{
				return;
			}

			new AnalyticsEvent()
				.setTool(Analytics.Tool.im)
				.setCategory(AnalyticsHelper.getCategoryByChat(dialogModel))
				.setEvent(Analytics.Event.clickCreateAiTask)
				.setSection(Analytics.Section.chatWindow)
				.setSubSection(Analytics.SubSection.multiselectPanel)
				.setP1(AnalyticsHelper.getP1ByDialog(dialogModel))
				.setP2(AnalyticsHelper.getP2ByUserType())
				.send();
		}
	}

	module.exports = { MultiselectPanelAnalytics };
});
