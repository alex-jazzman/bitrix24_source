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
			this.#sendAddParticipant(dialogId);
		}

		/**
		 * @param {DialogId} dialogId
		 */
		sendAddParticipantFromPopup(dialogId)
		{
			this.#sendAddParticipant(dialogId, {
				tool: Analytics.Tool.immobile,
				section: Analytics.Section.textareaMentionPopup,
			});
		}

		/**
		 * @param {DialogId} dialogId
		 * @param {{ tool?: string, section?: string }} [options]
		 */
		#sendAddParticipant(dialogId, { tool = Analytics.Tool.im, section } = {})
		{
			const chatData = this.store.getters['dialoguesModel/getById'](dialogId);
			if (!chatData)
			{
				return;
			}

			const category = AnalyticsHelper.getCategoryByChat(chatData);
			const analyticsEvent = new AnalyticsEvent()
				.setTool(tool)
				.setCategory(category)
				.setEvent(Analytics.Event.addMentionedUser)
				.setP1(AnalyticsHelper.getP1ByDialog(chatData))
			;

			if (category === Analytics.Category.project)
			{
				const projectId = AnalyticsHelper.getFormattedProjectId(chatData);
				if (projectId)
				{
					analyticsEvent.setP4(projectId);
				}
			}

			if (section)
			{
				analyticsEvent.setSection(section);
			}

			analyticsEvent.send();
		}
	}

	module.exports = { Mention };
});
