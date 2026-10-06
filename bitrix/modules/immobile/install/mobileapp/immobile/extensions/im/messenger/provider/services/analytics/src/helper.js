/**
 * @module im/messenger/provider/services/analytics/helper
 */
jn.define('im/messenger/provider/services/analytics/helper', (require, exports, module) => {
	const { Type } = require('type');
	const { Analytics, DialogType, NavigationTabId, NavigationTabByFolderCode } = require('im/messenger/const');
	const { MessengerParams } = require('im/messenger/lib/params');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { ObjectUtils } = require('im/messenger/lib/utils');
	const { DialogHelper } = require('im/messenger/lib/helper');
	const { getLoggerWithContext } = require('im/messenger/lib/logger');

	const CUSTOM_CHAT_TYPE = 'custom';
	const COPILOT_CHAT_TYPE = 'general';

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
			const activeId = this.#recentManager?.getActiveRecentId();
			switch (activeId)
			{
				case NavigationTabId.channel:
					return Analytics.Section.channelTab;
				case NavigationTabId.copilot:
					return Analytics.Section.copilotTab;
				case NavigationTabId.collab:
					return Analytics.Section.collabTab;
				case NavigationTabId.task:
					return Analytics.Section.taskTab;
				case NavigationTabId.chats:
					return Analytics.Section.chatTab;
				default:
				{
					const folderId = Number(activeId);
					if (Number.isInteger(folderId) && folderId > 0)
					{
						const folder = serviceLocator.get('core').getStore()
							.getters['folderModel/getById'](folderId)
						;
						if (folder)
						{
							return Analytics.Section.userFolder;
						}
					}

					return Analytics.Section.chatTab;
				}
			}
		}

		/**
		 * @returns {string|null}
		 */
		getFolderSubSection()
		{
			const activeId = this.#recentManager?.getActiveRecentId();
			if (!activeId)
			{
				return null;
			}

			const store = serviceLocator.get('core').getStore();
			const standardTabIds = Object.values(NavigationTabId);
			if (standardTabIds.includes(activeId))
			{
				const folder = store.getters['folderModel/getList']()
					.find((f) => f.type === 'system' && NavigationTabByFolderCode[f.code] === activeId)
				;

				return folder?.code ?? null;
			}

			const folderId = Number(activeId);
			if (!Number.isInteger(folderId) || folderId <= 0)
			{
				return null;
			}

			const folder = store.getters['folderModel/getById'](folderId);

			return folder ? Analytics.Type.userFolder : null;
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
		 * @typedef {object} ModesState
		 * @property {boolean|null} mcp
		 * @property {string|null} mcpServerName
		 * @property {boolean|null} reasoning
		 * @property {boolean|null} webSearch
		 * @property {boolean|null} agentMode
		 */

		/**
		 * @desc Builds the p4 modes snapshot (camelCase keys) as a JSON string. A key is
		 *       added only when its button is available (snapshot field not nil). `role`
		 *       is set directly from the copilot main role for copilot dialogs.
		 * @param {DialogHelper} dialogHelper
		 * @param {ModesState} [modesState]
		 * @returns {?string}
		 */
		buildAssistantSettingsP4({ dialogHelper, modesState })
		{
			if (!dialogHelper)
			{
				return null;
			}

			const p4 = {};

			if (!Type.isNil(modesState?.mcp))
			{
				p4.mcp = modesState.mcp ? 'on' : 'off';
				if (modesState.mcp && Type.isStringFilled(modesState.mcpServerName))
				{
					p4.mcpServer = modesState.mcpServerName;
				}
			}

			if (!Type.isNil(modesState?.reasoning))
			{
				p4.reasoning = modesState.reasoning ? 'on' : 'off';
			}

			if (!Type.isNil(modesState?.webSearch))
			{
				p4.webSearch = modesState.webSearch ? 'on' : 'off';
			}

			if (!Type.isNil(modesState?.agentMode))
			{
				p4.agentMode = modesState.agentMode ? 'on' : 'off';
			}

			if (dialogHelper.isCopilot)
			{
				const store = serviceLocator.get('core').getStore();
				const role = store.getters['dialoguesModel/copilotModel/getMainRoleByDialogId'](dialogHelper.dialogId);
				if (role?.code)
				{
					p4.role = ObjectUtils.stringToCamelCase(role.code);
				}
			}

			p4.chatType = COPILOT_CHAT_TYPE;

			return JSON.stringify(p4);
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
