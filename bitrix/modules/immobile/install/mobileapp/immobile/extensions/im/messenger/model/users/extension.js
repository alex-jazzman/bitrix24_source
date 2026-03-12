/**
 * @module im/messenger/model/users
 */
jn.define('im/messenger/model/users', (require, exports, module) => {
	const { usersModel } = require('im/messenger/model/users/src/model');
	const { userDefaultElement } = require('im/messenger/model/users/src/default-element');

	module.exports = {
		usersModel,
		userDefaultElement,
	};
});
