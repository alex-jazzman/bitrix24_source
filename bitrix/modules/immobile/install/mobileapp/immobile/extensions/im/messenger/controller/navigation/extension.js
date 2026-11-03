/**
 * @module im/messenger/controller/navigation
 */
jn.define('im/messenger/controller/navigation', (require, exports, module) => {
	const { NavigationManager } = require('im/messenger/controller/navigation/manager');
	const { NavigationHelper } = require('im/messenger/controller/navigation/helper');

	module.exports = { NavigationManager, NavigationHelper };
});
