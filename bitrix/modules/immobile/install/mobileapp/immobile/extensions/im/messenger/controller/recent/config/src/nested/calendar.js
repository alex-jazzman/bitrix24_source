/**
 * @module im/messenger/controller/recent/config/src/nested/calendar
 */
jn.define('im/messenger/controller/recent/config/src/nested/calendar', (require, exports, module) => {
	const { RecentTab } = require('im/messenger/const');
	const { RecentServiceName } = require('im/messenger/controller/recent/const');

	const CalendarConfig = {
		services: {
			[RecentServiceName.render]: {
				extension: 'im/messenger/controller/recent/service/render/common',
				props: {
					sections: ['pinned', 'general'],
					defaultSection: 'general',
					convertorExtension: 'im/messenger/controller/recent/service/render/lib/convertor/common',
				},
			},
			[RecentServiceName.serverLoad]: {
				extension: 'im/messenger/controller/recent/service/server-load/nested-list',
				props: {
					recentSection: RecentTab.calendar,
				},
			},
			[RecentServiceName.vuex]: {
				extension: 'im/messenger/controller/recent/service/vuex/nested-list',
				props: {},
			},
			[RecentServiceName.emptyState]: {
				extension: 'im/messenger/controller/recent/service/empty-state/dummy',
				props: {},
			},
			[RecentServiceName.floatingButton]: {
				extension: 'im/messenger/controller/recent/service/floating-button/nested',
				props: {},
			},
			[RecentServiceName.select]: {
				extension: 'im/messenger/controller/recent/service/select/common',
				props: {},
			},
			[RecentServiceName.pagination]: {
				extension: 'im/messenger/controller/recent/service/pagination/common',
				props: {},
			},
			[RecentServiceName.action]: {
				extension: 'im/messenger/controller/recent/service/action/common',
				props: {},
			},
		},
	};

	module.exports = { CalendarConfig };
});
