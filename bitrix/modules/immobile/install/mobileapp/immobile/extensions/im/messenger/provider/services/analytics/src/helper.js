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

	// Tab id -> folder code, the reverse of NavigationTabByFolderCode. The context of a chat event is
	// the folder the user stands in, and a tab is how the runtime names that folder; the report value
	// of the folder is then the same one every folder label uses. Built from the registry rather than
	// written out, so a tab added to the navigation cannot silently keep the historical value.
	const FolderCodeByTabId = Object.freeze(
		Object.fromEntries(Object.entries(NavigationTabByFolderCode).map(([code, tabId]) => [tabId, code])),
	);

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
		 * @desc Dialog id of the collab governing a chat's project subtree: the chat itself
		 *       when it is a collab, or its direct parent when that parent is a collab
		 *       (Variant B, one-level detect). Null when the chat is outside any project subtree.
		 * @param {DialoguesModelState} dialog
		 * @returns {?DialogId}
		 */
		getProjectCollabDialogId(dialog)
		{
			if (!dialog)
			{
				return null;
			}

			if (dialog.type === DialogType.collab)
			{
				return dialog.dialogId;
			}

			if (!(dialog.parentChatId > 0))
			{
				return null;
			}

			const parentDialog = serviceLocator.get('core').getStore()
				.getters['dialoguesModel/getByChatId'](dialog.parentChatId)
			;

			return parentDialog?.type === DialogType.collab ? parentDialog.dialogId : null;
		}

		/**
		 * @desc Numeric collab entity id behind a collab dialog, or null when missing/zero.
		 *       On cold open the collabModel may lack the parent record, so fall back to the
		 *       entityId of the saved short-format dialog model.
		 * @param {DialogId} dialogId
		 * @returns {?number}
		 */
		getCollabEntityId(dialogId)
		{
			const store = serviceLocator.get('core').getStore();
			const collabId = store.getters['dialoguesModel/collabModel/getCollabIdByDialogId'](dialogId);
			if (collabId > 0)
			{
				return collabId;
			}

			const collabDialog = store.getters['dialoguesModel/getById'](dialogId);
			const entityId = Number(collabDialog?.entityId ?? 0);

			return entityId > 0 ? entityId : null;
		}

		/**
		 * @desc projectId_ label for a chat anywhere inside a collab subtree, or null when the
		 *       governing collab / its entity id is unknown (never projectId_0 / projectId_null).
		 * @param {DialoguesModelState} dialog
		 * @returns {?string}
		 */
		getFormattedProjectId(dialog)
		{
			const collabDialogId = this.getProjectCollabDialogId(dialog);
			if (collabDialogId === null)
			{
				return null;
			}

			const collabEntityId = this.getCollabEntityId(collabDialogId);

			return collabEntityId === null ? null : `projectId_${collabEntityId}`;
		}

		/**
		 * @desc collabId_ label for a collab dialog, or null when the entity id is unknown
		 *       (0/absent). Prevents the legacy collabId_null / collabId_0 p4.
		 * @param {DialogId} dialogId
		 * @returns {?string}
		 */
		getFormattedCollabIdByDialogId(dialogId)
		{
			const collabEntityId = this.getCollabEntityId(dialogId);

			return collabEntityId === null ? null : `collabId_${collabEntityId}`;
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
					return Analytics.Category.project;
				default:
					return Analytics.Category.chat;
			}
		}

		/**
		 * @desc Category honoring chat-type priority (channel/comment stay channel) and the
		 *       project subtree: a collab root or any chat nested directly under a collab -> project.
		 * @param {DialoguesModelState} dialog
		 * @returns {string}
		 */
		getCategoryByChat(dialog)
		{
			if (!dialog)
			{
				return Analytics.Category.chat;
			}

			const dialogHelper = DialogHelper.createByModel(dialog);
			if (dialogHelper?.isChannelOrComment)
			{
				return Analytics.Category.channel;
			}

			if (this.getProjectCollabDialogId(dialog) !== null)
			{
				return Analytics.Category.project;
			}

			return this.getCategoryByChatType(dialog.type);
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
					return Analytics.Section.projectTab;
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
		 * @desc The context of a chat event is the folder of the screen: every tab that stands for a
		 *       folder of the label table reports that folder, and the web sends the same values for
		 *       the same screens. What has no folder value left keeps the historical `<tab>_tab` -
		 *       the "Chats" tab is the one such screen, and its value is already in the reports.
		 * @returns {string}
		 */
		getFolderSectionCode()
		{
			return this.getFolderSectionByTabId(this.#recentManager?.getActiveRecentId())
				?? this.getSectionCode();
		}

		/**
		 * @desc The same question asked about a named tab and not about the active one: the labels of
		 *       the chat list are sent for the tab they were raised on, which the caller holds and the
		 *       navigation may already have left.
		 * @param {?string} tabId
		 * @returns {string|undefined} undefined when the tab stands for no folder of the label table
		 */
		getFolderSectionByTabId(tabId)
		{
			const folderCode = FolderCodeByTabId[tabId];

			return folderCode ? Analytics.Type.Folder[folderCode] : undefined;
		}

		/**
		 * @desc True while a project's nested navigation is open. Nested navigation is opened for
		 *       a collab chat only, so its presence is the sign of "inside a project"; the nested
		 *       tab id is not, because the nested tasks tab shares the id of the global one.
		 * @returns {boolean}
		 */
		isInsideProjectNavigation()
		{
			return Boolean(this.#recentManager?.getActiveNestedRecent());
		}

		/**
		 * @desc c_section of an event fired from a recent list. A project opens its own nested
		 *       navigation, whose tabs are lists of one project - such a list reports `project`,
		 *       while the global tabs (the projects tab / folder included) keep their own section.
		 * @returns {string}
		 */
		getRecentSectionCode()
		{
			if (this.isInsideProjectNavigation())
			{
				return Analytics.Section.project;
			}

			return this.getSectionCode();
		}

		/**
		 * @desc Bare analytics chat type honoring the FIX-01 contract: `project` for a ROOT
		 *       collab chat, else the intrinsic prepared type (aiAssistant / notes / prepareChatType).
		 *       Parallel to getP1ByDialog (which prefixes this with `chatType_`).
		 * @param {DialoguesModelState} dialog
		 * @returns {string}
		 */
		getTypeByDialog(dialog)
		{
			const dialogHelper = DialogHelper.createByModel(dialog);
			let type = this.prepareChatType(dialog.type);

			if (dialog.type === DialogType.collab)
			{
				type = Analytics.Type.Dialog.project;
			}

			if (dialogHelper?.isAiAssistant)
			{
				type = Analytics.Type.Dialog.aiAssistant;
			}

			if (dialogHelper?.isNotes)
			{
				type = Analytics.Type.Dialog.notes;
			}

			return type;
		}

		/**
		 * @param {DialoguesModelState} dialog
		 * @returns {string}
		 */
		getP1ByDialog(dialog)
		{
			const dialogHelper = DialogHelper.createByModel(dialog);
			let type = this.prepareChatType(dialog.type);

			if (dialog.type === DialogType.collab)
			{
				type = Analytics.Type.Dialog.project;
			}

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
