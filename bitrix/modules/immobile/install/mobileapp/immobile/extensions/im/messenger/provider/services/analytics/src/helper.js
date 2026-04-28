/**
 * @module im/messenger/provider/services/analytics/helper
 */
jn.define('im/messenger/provider/services/analytics/helper', (require, exports, module) => {
	const { Analytics, DialogType, NavigationTabId } = require('im/messenger/const');
	const { MessengerParams } = require('im/messenger/lib/params');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { ObjectUtils } = require('im/messenger/lib/utils');
	const { DialogHelper } = require('im/messenger/lib/helper');
	const { getLoggerWithContext } = require('im/messenger/lib/logger');

	const CUSTOM_CHAT_TYPE = 'custom';

	/**
	 * @class AnalyticsHelper
	 */
	class AnalyticsHelper
	{
		constructor()
		{
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

		/**
		 * @param {DialogId} dialogId
		 */
		getFormattedCollabIdByDialogId(dialogId)
		{
			const collabId = serviceLocator.get('core').getStore()
				.getters['dialoguesModel/collabModel/getCollabIdByDialogId'](dialogId)
			;

			return `collabId_${collabId}`;
		}

		/**
		 * @param {number} chatId
		 * @returns {string}
		 */
		getFormattedChatId(chatId)
		{
			return `chatId_${chatId}`;
		}

		/**
		 * @param {number} parentChatId
		 * @returns {string}
		 */
		getFormattedParentChatId(parentChatId)
		{
			return `parentChatId_${parentChatId}`;
		}

		/**
		 * @param {string} type
		 * @returns {string}
		 */
		getTypeByChatType(type)
		{
			return this.prepareChatType(type);
		}

		/**
		 * @param {role} role
		 * @returns {string}
		 */
		getCopilotRole(role)
		{
			return `role_${ObjectUtils.stringToCamelCase(role)}`;
		}

		/**
		 * @see DialogType
		 * @param {string} type
		 * @returns {string}
		 */
		getCategoryByChatType(type)
		{
			switch (type)
			{
				case DialogType.channel:
				case DialogType.openChannel:
				case DialogType.comment:
				case DialogType.generalChannel:
					return Analytics.Category.channel;
				case DialogType.copilot:
					return Analytics.Category.copilot;
				case DialogType.videoconf:
					return Analytics.Category.videoconf;
				case DialogType.collab:
					return Analytics.Category.collab;
				default:
					return Analytics.Category.chat;
			}
		}

		getSectionCode()
		{
			switch (this.#recentManager?.getActiveRecentId())
			{
				case NavigationTabId.channel:
					return Analytics.Section.channelTab;
				case NavigationTabId.copilot:
					return Analytics.Section.copilotTab;
				case NavigationTabId.collab:
					return Analytics.Section.collabTab;
				case NavigationTabId.task:
					return Analytics.Section.taskTab;
				default:
					return Analytics.Section.chatTab;
			}
		}

		/**
		 * @param {DialoguesModelState} dialog
		 * @returns {string}
		 */
		getP1ByDialog(dialog)
		{
			const dialogHelper = DialogHelper.createByModel(dialog);
			let type = this.prepareChatType(dialog.type);

			if (dialogHelper?.isAiAssistant)
			{
				type = Analytics.Type.Dialog.aiAssistant;
			}

			if (dialogHelper?.isNotes)
			{
				type = Analytics.Type.Dialog.notes;
			}

			return `chatType_${type}`;
		}

		getP2ByUserType()
		{
			const userInfo = MessengerParams.getUserInfo();

			return Analytics.P2[userInfo.type] ?? Analytics.P2.user;
		}

		/**
		 * @param {string} type
		 * @returns {string}
		 */
		prepareChatType(type)
		{
			if ([DialogType.private, DialogType.user].includes(type))
			{
				return DialogType.user;
			}

			const isInternalChatType = Boolean(DialogType[type]);

			if (isInternalChatType)
			{
				return type;
			}

			return CUSTOM_CHAT_TYPE;
		}
	}

	module.exports = {
		AnalyticsHelper: new AnalyticsHelper(),
		AnalyticsHelperClass: AnalyticsHelper,
	};
});
