/**
 * @module im/messenger/controller/recent/config/copilot
 */
jn.define('im/messenger/controller/recent/config/copilot', (require, exports, module) => {
	const { DialogType } = require('im/messenger/const');
	const { openChatCreateByActiveRecentTab } = require('im/messenger/lib/open-chat-create');
	const { RecentServiceName } = require('im/messenger/controller/recent/const/service');

	const CopilotConfig = {
		services: {
			[RecentServiceName.quickRecent]: {
				extension: 'im/messenger/controller/recent/service/quick-recent/common',
				props: {},
			},
			[RecentServiceName.databaseLoad]: {
				extension: 'im/messenger/controller/recent/service/database-load/common',
				props: {
					savePageAction: 'recentModel/setCopilot',
					filter: {
						dialogTypes: [DialogType.copilot],
						limit: 50,
					},
				},
			},
			[RecentServiceName.serverLoad]: {
				extension: 'im/messenger/controller/recent/service/server-load/copilot',
				props: {},
			},
			[RecentServiceName.floatingButton]: {
				extension: 'im/messenger/controller/recent/service/floating-button/common',
				props: {
					onTap: async () => {
						return openChatCreateByActiveRecentTab();
					},
				},
			},
			[RecentServiceName.emptyState]: {
				extension: 'im/messenger/controller/recent/service/empty-state/common',
				props: {
					welcomeScreenExtension: 'im/messenger/controller/recent/service/empty-state/lib/welcome-screen/copilot',
				},
			},
			[RecentServiceName.pagination]: {
				extension: 'im/messenger/controller/recent/service/pagination/common',
				props: {},
			},
			[RecentServiceName.render]: {
				extension: 'im/messenger/controller/recent/service/render/common',
				props: {
					sections: ['pinned', 'general'],
					defaultSection: 'general',
					convertorExtension: 'im/messenger/controller/recent/service/render/lib/convertor/common',
				},
			},
			[RecentServiceName.vuex]: {
				extension: 'im/messenger/controller/recent/service/vuex/copilot',
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
		},
	};

	module.exports = { CopilotConfig };
});
