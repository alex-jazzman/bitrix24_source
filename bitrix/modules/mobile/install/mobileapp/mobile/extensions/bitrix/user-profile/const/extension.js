/**
 * @module user-profile/const
 */
jn.define('user-profile/const', (require, exports, module) => {
	const AppTheme = require('apptheme');

	const TabType = {
		CALENDAR: 'calendar',
		COMMON: 'common',
		DOCUMENTS: 'documents',
		FILES: 'files',
		GROUPS: 'groups',
		LIVE_FEED: 'live_feed',
		TASKS: 'tasks',
	};
	const modalIcons = {
		darkArrowDown: '<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20.5052 11.1729C20.7786 10.8995 21.2212 10.8995 21.4945 11.1729C21.7679 11.4462 21.7678 11.8887 21.4945 12.1621L14.4945 19.1621C14.2211 19.4355 13.7786 19.4355 13.5052 19.1621L6.50525 12.1621C6.23193 11.8887 6.2319 11.4462 6.50525 11.1729C6.77861 10.8995 7.22115 10.8995 7.49451 11.1729L13.9994 17.6777L20.5052 11.1729Z" fill="#828385"/></svg>',
		lightArrowDown: '<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M7.4949 11.1718C7.22153 10.8985 6.77832 10.8985 6.50495 11.1718C6.23158 11.4452 6.23158 11.8884 6.50495 12.1618L13.505 19.1618C13.7783 19.4351 14.2215 19.4351 14.4949 19.1618L21.4949 12.1618C21.7683 11.8884 21.7683 11.4452 21.4949 11.1718C21.2215 10.8985 20.7783 10.8985 20.505 11.1718L13.9999 17.6768L7.4949 11.1718Z" fill="#A7A7A7"/></svg>',
	};
	const closeIcon = AppTheme.id === 'dark' ? modalIcons.darkArrowDown : modalIcons.lightArrowDown;

	module.exports = {
		TabType,
		closeIcon,
	};
});
