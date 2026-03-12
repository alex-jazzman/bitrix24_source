/**
 * @module im/messenger/controller/navigation
 */
jn.define('im/messenger/controller/navigation', (require, exports, module) => {
	const { NavigationController } = require('im/messenger/controller/navigation/controller');
	const { NavigationApiHandler } = require('im/messenger/controller/navigation/api-handler');

	module.exports = { NavigationController, NavigationApiHandler };
});
