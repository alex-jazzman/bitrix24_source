/**
 * @module im/messenger/model/recent/filter/default-element
 */
jn.define('im/messenger/model/recent/filter/default-element', (require, exports, module) => {
	const { RecentFilterId } = require('im/messenger/const');

	/** @type {RecentFilterElement} */
	const recentFilterDefaultElement = Object.freeze({
		currentFilterId: RecentFilterId.all,
		idCollection: new Set(),
	});

	module.exports = {
		recentFilterDefaultElement,
	};
});
