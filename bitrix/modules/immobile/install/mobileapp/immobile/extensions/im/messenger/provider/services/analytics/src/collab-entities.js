/**
 * @module im/messenger/provider/services/analytics/collab-entities
 */
jn.define('im/messenger/provider/services/analytics/collab-entities', (require, exports, module) => {
	const { AnalyticsEvent } = require('analytics');

	const { CollabEntity, Analytics } = require('im/messenger/const');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { DialogHelper } = require('im/messenger/lib/helper');

	const { AnalyticsHelper } = require('im/messenger/provider/services/analytics/helper');

	const EventToEventMap = {
		[CollabEntity.calendar]: Analytics.Event.openCalendar,
		[CollabEntity.tasks]: Analytics.Event.openTasks,
		[CollabEntity.files]: Analytics.Event.openFiles,
	};

	/**
	 * @class CollabEntities
	 */
	class CollabEntities
	{
		sendCollabEntityOpened({ dialogId, entityType })
		{
			const dialogModel = serviceLocator.get('core').getStore()
				.getters['dialoguesModel/getById'](dialogId)
			;
			const dialogHelper = DialogHelper.createByModel(dialogModel);
			if (!dialogHelper)
			{
				return;
			}

			const analyticsEvent = new AnalyticsEvent()
				.setTool(Analytics.Tool.im)
				.setCategory(Analytics.Category.project)
				.setEvent(EventToEventMap[entityType])
				.setSection(Analytics.Section.chatSidebar)
				.setP2(AnalyticsHelper.getP2ByUserType())
				.setP5(AnalyticsHelper.getFormattedChatId(dialogModel.chatId))
			;

			const projectId = AnalyticsHelper.getFormattedProjectId(dialogModel);
			if (projectId)
			{
				analyticsEvent.setP4(projectId);
			}

			analyticsEvent.send();
		}
	}

	module.exports = { CollabEntities };
});
