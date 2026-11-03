/**
 * @module im/messenger/lib/date-navigation
 */
jn.define('im/messenger/lib/date-navigation', (require, exports, module) => {
	const {
		DateNavigationService,
		DateNavigationStatus,
	} = require('im/messenger/lib/date-navigation/src/date-navigation-service');
	const { DateNavigationErrorCode } = require('im/messenger/lib/date-navigation/src/rest');
	const { DateNavigationTimezone } = require('im/messenger/lib/date-navigation/src/timezone');
	const { DateCode } = require('im/messenger/lib/date-navigation/src/date-code');

	module.exports = {
		DateNavigationService,
		DateNavigationStatus,
		DateNavigationErrorCode,
		DateNavigationTimezone,
		DateCode,
	};
});
