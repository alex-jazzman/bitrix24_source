/**
 * @module im/messenger/controller/recent/config/src/nested/collab-chat
 */
jn.define('im/messenger/controller/recent/config/src/nested/collab-chat', (require, exports, module) => {
	const { RecentTab, ChatSearchSelectorSection, ActionByUserType } = require('im/messenger/const');
	const { RecentServiceName } = require('im/messenger/controller/recent/const');
	const { UserPermission } = require('im/messenger/lib/permission-manager');

	const CollabChatConfig = {
		services: {
			[RecentServiceName.render]: {
				extension: 'im/messenger/controller/recent/service/render/common',
				props: {
					sections: ['pinned', 'general'],
					defaultSection: 'general',
					convertorExtension: 'im/messenger/controller/recent/service/render/lib/convertor/common',
				},
			},
			[RecentServiceName.databaseLoad]: {
				extension: 'im/messenger/controller/recent/service/database-load/common',
				props: {
					savePageAction: 'recentModel/setByRecentSection',
					filter: {
						limit: 50,
					},
				},
			},
			[RecentServiceName.serverLoad]: {
				extension: 'im/messenger/controller/recent/service/server-load/nested-list',
				props: {
					recentSection: RecentTab.collabChat,
				},
			},
			[RecentServiceName.vuex]: {
				extension: 'im/messenger/controller/recent/service/vuex/nested-list',
				props: {},
			},
			[RecentServiceName.emptyState]: {
				extension: 'im/messenger/controller/recent/service/empty-state/common',
				props: {
					welcomeScreenExtension: 'im/messenger/controller/recent/service/empty-state/lib/welcome-screen/nested',
					welcomeScreenProps: {
						recentSection: RecentTab.collabChat
					}
				},
			},
			[RecentServiceName.floatingButton]: {
				extension: 'im/messenger/controller/recent/service/floating-button/nested',
				props: {
					checkShouldShowButton: () => UserPermission.canPerformActionByUserType(ActionByUserType.createChat),
				},
			},
			[RecentServiceName.select]: {
				extension: 'im/messenger/controller/recent/service/select/common',
				props: {},
			},
			[RecentServiceName.pagination]: {
				extension: 'im/messenger/controller/recent/service/pagination/common',
				props: {},
			},
			[RecentServiceName.filter]: {
				extension: 'im/messenger/controller/recent/service/filter/common',
				props: {},
			},
			[RecentServiceName.action]: {
				extension: 'im/messenger/controller/recent/service/action/common',
				props: {},
			},
			[RecentServiceName.search]: {
				extension: 'im/messenger/controller/recent/service/search/common',
				props: {
					recentTab: RecentTab.collabDefault,
					sections: [ChatSearchSelectorSection.recent, ChatSearchSelectorSection.common],
				},
			},
		},
	};

	module.exports = { CollabChatConfig };
});
