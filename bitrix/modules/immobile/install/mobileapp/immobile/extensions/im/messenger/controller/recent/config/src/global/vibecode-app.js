/**
 * @module im/messenger/controller/recent/config/src/global/vibecode-app
 */
jn.define('im/messenger/controller/recent/config/src/global/vibecode-app', (require, exports, module) => {
	const {
		ChatSearchSelectorSection,
		RecentTab,
	} = require('im/messenger/const');
	const {
		createItemButtonItemOptions,
		createItemButtonServiceConfig,
	} = require('im/messenger/controller/recent/config/src/lib/item-button');
	const { RecentServiceName } = require('im/messenger/controller/recent/const');

	const VibecodeAppConfig = {
		services: {
			[RecentServiceName.quickRecent]: {
				extension: 'im/messenger/controller/recent/service/quick-recent/common',
				props: {},
			},
			[RecentServiceName.databaseLoad]: {
				extension: 'im/messenger/controller/recent/service/database-load/common',
				props: {
					recentSection: RecentTab.vibecodeApp,
					savePageAction: 'recentModel/setByRecentSection',
					filter: {
						limit: 50,
					},
				},
			},
			[RecentServiceName.serverLoad]: {
				extension: 'im/messenger/controller/recent/service/server-load/nested-list',
				props: {
					recentSection: RecentTab.vibecodeApp,
				},
			},
			[RecentServiceName.floatingButton]: {
				extension: 'im/messenger/controller/recent/service/floating-button/dummy',
				props: {},
			},
			[RecentServiceName.emptyState]: {
				extension: 'im/messenger/controller/recent/service/empty-state/common',
				props: {
					welcomeScreenExtension: 'im/messenger/controller/recent/service/empty-state/lib/welcome-screen/vibecode-app',
				},
			},
			[RecentServiceName.pagination]: {
				extension: 'im/messenger/controller/recent/service/pagination/common',
				props: {},
			},
			[RecentServiceName.search]: {
				extension: 'im/messenger/controller/recent/service/search/common',
				props: {
					recentTab: RecentTab.vibecodeApp,
					sections: [ChatSearchSelectorSection.recent, ChatSearchSelectorSection.common],
				},
			},
			[RecentServiceName.filter]: {
				extension: 'im/messenger/controller/recent/service/filter/common',
				props: {},
			},
			[RecentServiceName.render]: {
				extension: 'im/messenger/controller/recent/service/render/common',
				props: {
					sections: ['pinned', 'general'],
					defaultSection: 'general',
					convertorExtension: 'im/messenger/controller/recent/service/render/lib/convertor/vibecode-app',
					itemOptions: createItemButtonItemOptions(),
				},
			},
			[RecentServiceName.vuex]: {
				extension: 'im/messenger/controller/recent/service/vuex/vibecode-app',
				props: {},
			},
			[RecentServiceName.action]: {
				extension: 'im/messenger/controller/recent/service/action/common',
				props: {},
			},
			[RecentServiceName.select]: {
				extension: 'im/messenger/controller/recent/service/select/common',
				props: {
					openDialogOptions: {
						skipNestedStrategy: true,
					},
				},
			},
			[RecentServiceName.itemButton]: createItemButtonServiceConfig(),
		},
	};

	module.exports = { VibecodeAppConfig };
});
