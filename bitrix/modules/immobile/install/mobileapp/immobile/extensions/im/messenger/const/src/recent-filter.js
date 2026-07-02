/**
 * @module im/messenger/const/recent-filter
 */
jn.define('im/messenger/const/recent-filter', (require, exports, module) => {
	const RecentFilterId = {
		all: 'filter-all',
		unread: 'filter-unread',
	};

	const RecentActionId = {
		readAll: 'read-all',
	};

	module.exports = { RecentFilterId, RecentActionId };
});
