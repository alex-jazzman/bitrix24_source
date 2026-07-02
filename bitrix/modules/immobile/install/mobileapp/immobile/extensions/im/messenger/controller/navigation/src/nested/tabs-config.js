/**
 * @module im/messenger/controller/navigation/src/nested/tabs-config
 */
jn.define('im/messenger/controller/navigation/src/nested/tabs-config', (require, exports, module) => {
	const { NavigationTabId } = require('im/messenger/const');
	const { Loc } = require('im/messenger/loc');

	const NestedTabsConfig = [
		{
			id: NavigationTabId.collabDefault,
			title: Loc.getMessage('IMMOBILE_NAVIGATION_NESTED_TAB_ALL'),
			selectable: true,
			active: true,
			widget: {
				name: 'chat.recent',
				id: NavigationTabId.collabDefault,
				code: NavigationTabId.collabDefault,
				useSearch: true,
			},
		},
		{
			id: NavigationTabId.task,
			title: Loc.getMessage('IMMOBILE_NAVIGATION_NESTED_TAB_TASKS'),
			widget: {
				name: 'chat.recent',
				id: NavigationTabId.task,
				code: NavigationTabId.task,
				useSearch: true,
			},
		},
		{
			id: NavigationTabId.collabChat,
			title: Loc.getMessage('IMMOBILE_NAVIGATION_NESTED_TAB_COLLAB_CHATS'),
			widget: {
				name: 'chat.recent',
				id: NavigationTabId.collabChat,
				code: NavigationTabId.collabChat,
				useSearch: true,
			},
		},
		{
			id: NavigationTabId.calendar,
			title: Loc.getMessage('IMMOBILE_NAVIGATION_NESTED_TAB_CALENDAR'),
			widget: {
				name: 'chat.recent',
				id: NavigationTabId.calendar,
				code: NavigationTabId.calendar,
				useSearch: true,
			},
		},
	];

	module.exports = { NestedTabsConfig };
});
