/**
 * @module im/messenger/lib/popup-menu/recent-actions
 */
jn.define('im/messenger/lib/popup-menu/recent-actions', (require, exports, module) => {
	const {
		RecentActionsMenu,
		RecentActionsMenuSection,
	} = require('im/messenger/lib/popup-menu/recent-actions/recent-actions-menu');
	const { NestedRecentActionsMenu } = require('im/messenger/lib/popup-menu/recent-actions/nested-recent-actions-menu');

	module.exports = { RecentActionsMenu, RecentActionsMenuSection, NestedRecentActionsMenu };
});
