/**
 * @module im/messenger/controller/recent/const
 */
jn.define('im/messenger/controller/recent/const', (require, exports, module) => {
	const { RecentEventType } = require('im/messenger/controller/recent/const/event-type');
	const { RecentServiceName } = require('im/messenger/controller/recent/const/service');

	module.exports = {
		RecentEventType,
		RecentServiceName,
	};
});
