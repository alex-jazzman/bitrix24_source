/**
 * @module im/messenger/controller/recent/config/openlines
 */
jn.define('im/messenger/controller/recent/config/openlines', (require, exports, module) => {
	const { RecentServiceName } = require('im/messenger/controller/recent/const/service');
	const { Feature } = require('im/messenger/lib/feature');

	const serviceCommonName = Feature.isOpenlinesInMessengerAvailable ? 'common' : 'dummy';
	const serviceOpenlinesName = Feature.isOpenlinesInMessengerAvailable ? 'openlines' : 'dummy';

	const OpenlinesConfig = {
		services: {
			[RecentServiceName.quickRecent]: {
				extension: `im/messenger/controller/recent/service/quick-recent/${serviceCommonName}`,
				props: {},
			},
			[RecentServiceName.databaseLoad]: {
				extension: 'im/messenger/controller/recent/service/database-load/dummy',
				props: {},
			},
			[RecentServiceName.serverLoad]: {
				extension: `im/messenger/controller/recent/service/server-load/${serviceOpenlinesName}`,
				props: {},
			},
			[RecentServiceName.floatingButton]: {
				extension: 'im/messenger/controller/recent/service/floating-button/common',
				props: {
					checkShouldShowButton: () => false,
					onTap: async () => {},
				},
			},
			[RecentServiceName.emptyState]: {
				extension: `im/messenger/controller/recent/service/empty-state/${serviceCommonName}`,
				props: {
					welcomeScreenExtension: `im/messenger/controller/recent/service/empty-state/lib/welcome-screen/${serviceOpenlinesName}`,
				},
			},
			[RecentServiceName.pagination]: {
				extension: `im/messenger/controller/recent/service/pagination/${serviceCommonName}`,
				props: {},
			},
			[RecentServiceName.search]: {
				extension: 'im/messenger/controller/recent/service/search/dummy',
				props: {},
			},
			[RecentServiceName.render]: {
				extension: `im/messenger/controller/recent/service/render/${serviceCommonName}`,
				props: {
					sections: ['new', 'work', 'answered'],
					defaultSection: 'answered',
					convertorExtension: `im/messenger/controller/recent/service/render/lib/convertor/${serviceOpenlinesName}`,
				},
			},
			[RecentServiceName.vuex]: {
				extension: `im/messenger/controller/recent/service/vuex/${serviceOpenlinesName}`,
				props: {},
			},
			[RecentServiceName.action]: {
				extension: `im/messenger/controller/recent/service/action/${serviceCommonName}`,
				props: {},
			},
			[RecentServiceName.select]: {
				extension: `im/messenger/controller/recent/service/select/${serviceCommonName}`,
				props: {},
			},
		},
	};

	module.exports = { OpenlinesConfig };
});
