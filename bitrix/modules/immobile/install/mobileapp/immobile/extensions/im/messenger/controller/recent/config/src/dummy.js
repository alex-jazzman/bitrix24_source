/**
 * @module im/messenger/controller/recent/config/dummy
 */
jn.define('im/messenger/controller/recent/config/dummy', (require, exports, module) => {
	const { RecentServiceName } = require('im/messenger/controller/recent/const/service');

	// TODO only developer example
	const DummyConfig = {
		services: {
			[RecentServiceName.quickRecent]: {
				extension: 'im/messenger/controller/recent/service/quick-recent/dummy',
				props: {},
			},
			[RecentServiceName.databaseLoad]: {
				extension: 'im/messenger/controller/recent/service/database-load/dummy',
				props: {},
			},
			[RecentServiceName.serverLoad]: {
				extension: 'im/messenger/controller/recent/service/server-load/dummy',
				props: {},
			},
			[RecentServiceName.floatingButton]: {
				extension: 'im/messenger/controller/recent/service/floating-button/dummy',
				props: {},
			},
			[RecentServiceName.emptyState]: {
				extension: 'im/messenger/controller/recent/service/empty-state/dummy',
				props: {},
			},
			[RecentServiceName.pagination]: {
				extension: 'im/messenger/controller/recent/service/pagination/dummy',
				props: {},
			},
			[RecentServiceName.search]: {
				extension: 'im/messenger/controller/recent/service/search/dummy',
				props: {},
			},
			[RecentServiceName.filter]: {
				extension: 'im/messenger/controller/recent/service/filter/dummy',
				props: {},
			},
			[RecentServiceName.render]: {
				extension: 'im/messenger/controller/recent/service/render/dummy',
				props: {},
			},
			[RecentServiceName.vuex]: {
				extension: 'im/messenger/controller/recent/service/vuex/dummy',
				props: {},
			},
			[RecentServiceName.action]: {
				extension: 'im/messenger/controller/recent/service/action/dummy',
				props: {},
			},
			[RecentServiceName.select]: {
				extension: 'im/messenger/controller/recent/service/select/dummy',
				props: {},
			},
		},
	};

	module.exports = { DummyConfig };
});
