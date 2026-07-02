/**
 * @module im/messenger/lib/element/dialog/message/builder/button/system-configuration
 */
jn.define('im/messenger/lib/element/dialog/message/builder/button/system-configuration', (require, exports, module) => {
	const { AnalyticsEvent } = require('analytics');

	const { Loc } = require('im/messenger/loc');
	const { Analytics } = require('im/messenger/const');
	const { openPlanLimitsWidget } = require('im/messenger/lib/plan-limit');
	const { getLoggerWithContext } = require('im/messenger/lib/logger');
	const { DialogTextHelper } = require('im/messenger/controller/dialog/lib/helper/text');

	const logger = getLoggerWithContext('dialog-element--customMessage', 'SystemButtonConfiguration');

	// TODO change this collection to const require
	const SYSTEM_BUTTON_ACTION_ID_COLLECTION = {
		inviteToChat: 'inviteToChat',
		copyLink: 'copyLink',
		planLimitsUnlock: 'planLimitsUnlock',
	};

	/**
	 * @class SystemButtonConfiguration
	 */
	class SystemButtonConfiguration
	{
		/**
		 * @param {string} actionId
		 * @return {boolean}
		 */
		static isSystemButton(actionId)
		{
			return Object.values(SYSTEM_BUTTON_ACTION_ID_COLLECTION).includes(actionId);
		}

		/**
		 * @return {SystemButtonMetaDataCollection}
		 */
		static getMeta()
		{
			return {
				[SYSTEM_BUTTON_ACTION_ID_COLLECTION.inviteToChat]: {
					callback: ({ dialogLocator }) => {
						try
						{
							const { SidebarManager } = require('im/messenger/controller/dialog/lib/sidebar');

							SidebarManager.getInstance(dialogLocator, null).open();
						}
						catch (error)
						{
							logger.error('messageBuilderButtonTap.callback to SidebarManager catch:', error);
						}
					},
				},
				[SYSTEM_BUTTON_ACTION_ID_COLLECTION.copyLink]: {
					callback: ({ dialogLocator }) => {
						try
						{
							const dialogId = dialogLocator.get('dialogId');
							const dialog = dialogLocator.get('store').getters['dialoguesModel/getById'](dialogId);
							const link = dialog.public.link;

							DialogTextHelper.copyToClipboard(
								link,
								{
									notificationText: Loc.getMessage('IMMOBILE_MESSENGER_DIALOG_COPY_LINK_TEXT'),
									parentWidget: dialogLocator.get('view')?.ui,
								},
							);
						}
						catch (error)
						{
							logger.error('messageBuilderButtonTap.callback to SidebarManager catch:', error);
						}
					},
				},
				[SYSTEM_BUTTON_ACTION_ID_COLLECTION.planLimitsUnlock]: {
					callback: () => {
						try
						{
							const analytics = new AnalyticsEvent()
								.setSection(Analytics.Section.chatWindow);

							void openPlanLimitsWidget(analytics);
						}
						catch (error)
						{
							logger.error('messageBuilderButtonTap.callback to SidebarManager catch:', error);
						}
					},
				},
			};
		}

		/**
		 * @param {string} actionId
		 * @return {SystemButtonMetaData|null}
		 */
		static getMetaByActionId(actionId)
		{
			const meta = this.getMeta();

			return meta[actionId] || null;
		}
	}

	module.exports = {
		SystemButtonConfiguration,
	};
});
