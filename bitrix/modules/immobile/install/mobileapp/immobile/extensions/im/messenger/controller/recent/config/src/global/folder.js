/**
 * @module im/messenger/controller/recent/config/src/global/folder
 */
jn.define('im/messenger/controller/recent/config/src/global/folder', (require, exports, module) => {
	const {
		ActionByUserType,
		RecentTab,
	} = require('im/messenger/const');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { UserPermission } = require('im/messenger/lib/permission-manager');
	const { openChatCreateByActiveRecentTab } = require('im/messenger/lib/open-chat-create');
	const {
		createItemButtonItemOptions,
		createItemButtonServiceConfig,
	} = require('im/messenger/controller/recent/config/src/lib/item-button');
	const { RecentServiceName } = require('im/messenger/controller/recent/const');

	const { AllConfig } = require('im/messenger/controller/recent/config/src/global/all');
	const { ChannelConfig } = require('im/messenger/controller/recent/config/src/global/channel');
	const { ChatsConfig } = require('im/messenger/controller/recent/config/src/global/chats');
	const { CollabConfig } = require('im/messenger/controller/recent/config/src/global/collab');
	const { CopilotConfig } = require('im/messenger/controller/recent/config/src/global/copilot');
	const { OpenlinesConfig } = require('im/messenger/controller/recent/config/src/global/openlines');
	const { TaskConfig } = require('im/messenger/controller/recent/config/src/global/task');
	const { VibecodeAppConfig } = require('im/messenger/controller/recent/config/src/global/vibecode-app');

	const SystemFolderConfigMap = {
		all: AllConfig,
		default: ChatsConfig,
		copilot: CopilotConfig,
		openChannel: ChannelConfig,
		collab: CollabConfig,
		lines: OpenlinesConfig,
		tasksTask: TaskConfig,
		vibecodeApp: VibecodeAppConfig,
	};

	/**
	 * @param {number|string} folderId
	 * @return {object|null}
	 */
	function resolveFolderConfig(folderId)
	{
		const normalizedFolderId = Number(folderId);
		if (Number.isNaN(normalizedFolderId))
		{
			return SystemFolderConfigMap[folderId] ?? ChatsConfig;
		}

		const folder = serviceLocator.get('core').getStore().getters['folderModel/getById'](normalizedFolderId);
		if (!folder)
		{
			return null;
		}

		if (folder.type === 'system')
		{
			return SystemFolderConfigMap[folder.code] ?? ChatsConfig;
		}

		return createPersonalFolderConfig(normalizedFolderId);
	}

	/**
	 * @param {number} folderId
	 * @return {object}
	 */
	function createPersonalFolderConfig(folderId)
	{
		const store = serviceLocator.get('core').getStore();

		return {
			services: {
				[RecentServiceName.quickRecent]: {
					extension: 'im/messenger/controller/recent/service/quick-recent/common',
					props: {},
				},
				[RecentServiceName.databaseLoad]: {
					extension: 'im/messenger/controller/recent/service/database-load/common',
					props: {
						savePageAction: 'recentModel/set',
						saveFirstPageAction: 'recentModel/set',
						saveFirstPageActionName: 'setFolderFirstPage',
						filter: {
							chatIds: store.getters['folderModel/getChatIds'](folderId),
							limit: 50,
						},
					},
				},
				[RecentServiceName.serverLoad]: {
					extension: 'im/messenger/controller/recent/service/server-load/folder',
					props: { folderId },
				},
				[RecentServiceName.floatingButton]: {
					extension: 'im/messenger/controller/recent/service/floating-button/common',
					props: {
						checkShouldShowButton: () => {
							return (
								UserPermission.canPerformActionByUserType(ActionByUserType.createChat)
								|| UserPermission.canPerformActionByUserType(ActionByUserType.createChannel)
								|| UserPermission.canPerformActionByUserType(ActionByUserType.createCollab)
							);
						},
						onTap: async () => {
							void openChatCreateByActiveRecentTab();
						},
					},
				},
				[RecentServiceName.emptyState]: {
					extension: 'im/messenger/controller/recent/service/empty-state/common',
					props: {
						welcomeScreenExtension: 'im/messenger/controller/recent/service/empty-state/lib/welcome-screen/folder',
					},
				},
				[RecentServiceName.render]: {
					extension: 'im/messenger/controller/recent/service/render/common',
					props: {
						sections: ['pinned', 'general'],
						defaultSection: 'general',
						convertorExtension: 'im/messenger/controller/recent/service/render/lib/convertor/common',
						itemOptions: createItemButtonItemOptions(),
					},
				},
				[RecentServiceName.pagination]: {
					extension: 'im/messenger/controller/recent/service/pagination/common',
					props: {},
				},
				[RecentServiceName.search]: {
					extension: 'im/messenger/controller/recent/service/search/common',
					props: {
						// The server searches by the folder eligibility rule instead of a recent section:
						// the rule does not depend on the folder, so no folder id is passed. The local
						// section stays - it is a subset of the rule, so it can only find less, and the
						// server answer fills the rest in.
						folderEligibleOnly: true,
						recentTab: RecentTab.chat,
						searchUsers: true,
					},
				},
				[RecentServiceName.vuex]: {
					extension: 'im/messenger/controller/recent/service/vuex/folder',
					props: { folderId },
				},
				[RecentServiceName.action]: {
					extension: 'im/messenger/controller/recent/service/action/common',
					props: {},
				},
				[RecentServiceName.select]: {
					extension: 'im/messenger/controller/recent/service/select/common',
					props: {},
				},
				[RecentServiceName.itemButton]: createItemButtonServiceConfig(),
			},
		};
	}

	module.exports = { resolveFolderConfig };
});
