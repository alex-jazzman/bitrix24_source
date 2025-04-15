/**
 * @module im/messenger/model/sidebar
 */
jn.define('im/messenger/model/sidebar', (require, exports, module) => {
	const { sidebarModel } = require('im/messenger/model/sidebar/model');
	const { sidebarDefaultElement } = require('im/messenger/model/sidebar/default-element');

	module.exports = {
		sidebarModel,
		sidebarDefaultElement,
	};
});
