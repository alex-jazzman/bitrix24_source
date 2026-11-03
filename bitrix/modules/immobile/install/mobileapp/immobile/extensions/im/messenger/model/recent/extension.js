/**
 * @module im/messenger/model/recent
 */
jn.define('im/messenger/model/recent', (require, exports, module) => {
	const {
		recentModel,
		sortByAggregatedActivityDateWithPinned,
		getLastActivityDate,
	} = require('im/messenger/model/recent/model');
	const { recentDefaultElement } = require('im/messenger/model/recent/default-element');

	module.exports = {
		recentModel,
		recentDefaultElement,
		sortByAggregatedActivityDateWithPinned,
		getLastActivityDate,
	};
});
