/**
 * @module im/messenger/controller/dialog/lib/date-calendar
 */
jn.define('im/messenger/controller/dialog/lib/date-calendar', (require, exports, module) => {
	const { DateCalendarWidget } = require('im/messenger/controller/dialog/lib/date-calendar/src/widget');
	const {
		DateCalendarSearchEntry,
	} = require('im/messenger/controller/dialog/lib/date-calendar/src/search-entry');
	const {
		DateCalendarSearchShow,
	} = require('im/messenger/controller/dialog/lib/date-calendar/src/search-show');
	const {
		DateCalendarSeparatorEntry,
	} = require('im/messenger/controller/dialog/lib/date-calendar/src/separator-entry');
	const {
		DateCalendarJump,
		DIALOG_LOCATOR_KEY,
	} = require('im/messenger/controller/dialog/lib/date-calendar/src/jump');

	module.exports = {
		DateCalendarWidget,
		DateCalendarSearchEntry,
		DateCalendarSearchShow,
		DateCalendarSeparatorEntry,
		DateCalendarJump,
		/** Name the jump of a dialog is registered in the locator of that dialog under. */
		DateCalendarJumpLocatorKey: DIALOG_LOCATOR_KEY,
	};
});
