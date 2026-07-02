/**
 * @module im/messenger/controller/recent/const/src/service
 */
jn.define('im/messenger/controller/recent/const/src/service', (require, exports, module) => {
	const RecentServiceName = {
		quickRecent: 'quick-recent',
		databaseLoad: 'database-load',
		serverLoad: 'server-load',
		floatingButton: 'floating-button',
		emptyState: 'empty-state',
		pagination: 'pagination',
		search: 'search',
		filter: 'filter',
		render: 'render',
		vuex: 'vuex',
		action: 'action',
		select: 'select',
		external: 'external',
		inviteBanner: 'invite-banner',
	};

	module.exports = { RecentServiceName };
});
