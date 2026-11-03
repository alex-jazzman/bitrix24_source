/**
 * @module im/messenger/provider/services/analytics/entity-manager
 */
jn.define('im/messenger/provider/services/analytics/entity-manager', (require, exports, module) => {
	const { AnalyticsEvent } = require('analytics');

	const { Analytics } = require('im/messenger/const');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { AnalyticsHelper } = require('im/messenger/provider/services/analytics/helper');

	/**
	 * @class EntityManager
	 */
	class EntityManager
	{
		constructor()
		{
			this.store = serviceLocator.get('core').getStore();
		}

		/**
		 * @param {DialogId} dialogId
		 */
		sendClickToOpenCreateTask(dialogId)
		{
			const dialog = this.store.getters['dialoguesModel/getById'](dialogId);

			new AnalyticsEvent()
				.setTool(Analytics.Tool.im)
				.setCategory(AnalyticsHelper.getCategoryByChat(dialog))
				.setEvent(Analytics.Event.clickCreateTask)
				.setSection(Analytics.Section.chatTextarea)
				.setP1(AnalyticsHelper.getP1ByDialog(dialog))
				.setP2(AnalyticsHelper.getP2ByUserType())
				.send();
		}

		/**
		 * @param {DialogId} dialogId
		 */
		sendClickToOpenCreateMeeting(dialogId)
		{
			const dialog = this.store.getters['dialoguesModel/getById'](dialogId);

			new AnalyticsEvent()
				.setTool(Analytics.Tool.im)
				.setCategory(AnalyticsHelper.getCategoryByChat(dialog))
				.setEvent(Analytics.Event.clickCreateEvent)
				.setSection(Analytics.Section.chatTextarea)
				.setP1(AnalyticsHelper.getP1ByDialog(dialog))
				.setP2(AnalyticsHelper.getP2ByUserType())
				.send();
		}
	}

	module.exports = { EntityManager };
});
