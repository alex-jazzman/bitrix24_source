/**
 * @module im/messenger/lib/counters/tab-counters
 */
jn.define('im/messenger/lib/counters/tab-counters', (require, exports, module) => {
	const { TabCounters } = require('im/messenger/lib/counters/tab-counters/src/global');
	const { NestedTabCounters } = require('im/messenger/lib/counters/tab-counters/src/nested');

	module.exports = { TabCounters, NestedTabCounters };
});
