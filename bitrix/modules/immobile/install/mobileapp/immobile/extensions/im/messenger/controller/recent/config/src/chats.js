/**
 * @module im/messenger/controller/recent/config/chats
 */
jn.define('im/messenger/controller/recent/config/chats', (require, exports, module) => {
	const {
		DialogType,
		ActionByUserType,
		RecentTab,
	} = require('im/messenger/const');
	const { UserPermission } = require('im/messenger/lib/permission-manager');
	const { openChatCreateByActiveRecentTab } = require('im/messenger/lib/open-chat-create');
	const { RecentServiceName } = require('im/messenger/controller/recent/const/service');

	const ChatsConfig = {
		services: {
			[RecentServiceName.quickRecent]: {
				extension: 'im/messenger/controller/recent/service/quick-recent/common',
				props: {},
			},
			[RecentServiceName.databaseLoad]: {
				extension: 'im/messenger/controller/recent/service/database-load/common',
				props: {
					savePageAction: 'recentModel/setChat',
					filter: {
						exceptDialogTypes: [
							DialogType.lines,
							DialogType.comment,
							DialogType.tasksTask,
						],
						limit: 50,
					},
				},
			},
			[RecentServiceName.serverLoad]: {
				extension: 'im/messenger/controller/recent/service/server-load/chat',
				props: {},
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
					welcomeScreenExtension: 'im/messenger/controller/recent/service/empty-state/lib/welcome-screen/chat',
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
				},
			},
			[RecentServiceName.filter]: {
				extension: 'im/messenger/controller/recent/service/filter/common',
				props: {},
			},
			[RecentServiceName.render]: {
				extension: 'im/messenger/controller/recent/service/render/common',
				props: {
					sections: ['call', 'pinned', 'general'],
					defaultSection: 'general',
					convertorExtension: 'im/messenger/controller/recent/service/render/lib/convertor/chats',
				},
			},
			[RecentServiceName.vuex]: {
				extension: 'im/messenger/controller/recent/service/vuex/chat',
				props: {},
			},
			[RecentServiceName.action]: {
				extension: 'im/messenger/controller/recent/service/action/common',
				props: {},
			},
			[RecentServiceName.select]: {
				extension: 'im/messenger/controller/recent/service/select/common',
				props: {},
			},
			[RecentServiceName.external]: {
				extension: 'im/messenger/controller/recent/service/external/chat',
				props: {},
			},
		},
	};

	module.exports = { ChatsConfig };
});
