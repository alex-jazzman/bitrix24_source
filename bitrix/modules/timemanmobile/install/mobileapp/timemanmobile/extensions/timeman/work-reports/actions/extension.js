/**
 * @module timeman/work-reports/actions
 */
jn.define('timeman/work-reports/actions', (require, exports, module) => {
	const { openDiscussChat } = require('timeman/work-reports/actions/src/discuss-chat');
	const { openMonthPicker } = require('timeman/work-reports/actions/src/month-picker');
	const { openUserSelector } = require('timeman/work-reports/actions/src/user-selector');

	module.exports = {
		openDiscussChat,
		openMonthPicker,
		openUserSelector,
	};
});
