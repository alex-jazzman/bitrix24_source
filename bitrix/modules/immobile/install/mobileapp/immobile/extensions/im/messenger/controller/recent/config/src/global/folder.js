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
	const { RecentServiceName } = require('im/messenger/controller/recent/const');

	const { ChannelConfig } = require('im/messenger/controller/recent/config/src/global/channel');
	const { ChatsConfig } = require('im/messenger/controller/recent/config/src/global/chats');
	const { CollabConfig } = require('im/messenger/controller/recent/config/src/global/collab');
	const { CopilotConfig } = require('im/messenger/controller/recent/config/src/global/copilot');
	const { OpenlinesConfig } = require('im/messenger/controller/recent/config/src/global/openlines');
	const { TaskConfig } = require('im/messenger/controller/recent/config/src/global/task');

	const SystemFolderConfigMap = {
		default: ChatsConfig,
		copilot: CopilotConfig,
		openChannel: ChannelConfig,
		collab: CollabConfig,
		openlines: OpenlinesConfig,
		tasksTask: TaskConfig,
	};

	/**
	 * @param {number|string} folderId
	 * @return {object|null}
	 */
	function resolveFolderConfig(folderId)
	{
		const normalizedFolderId = Number(folderId);
		const folder = serviceLocator.get('core').getStore().getters['folderModel/getById'](normalizedFolderId);
		if (!folder)
		{
			return null;
		}

		if (folder.type === 'system')
		{
			return SystemFolderConfigMap[folder.code] ?? null;
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
					},
				},
				[RecentServiceName.pagination]: {
					extension: 'im/messenger/controller/recent/service/pagination/common',
					props: {},
				},
				[RecentServiceName.search]: {
					extension: 'im/messenger/controller/recent/service/search/common',
					props: {
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
			},
		};
	}

	module.exports = { resolveFolderConfig };
});
