/* eslint-disable flowtype/require-return-type */

/**
 * @module im/messenger/provider/pull/base
 */
jn.define('im/messenger/provider/pull/base', (require, exports, module) => {
	const { BasePullHandler } = require('im/messenger/provider/pull/base/pull-handler');
	const { BaseApplicationPullHandler } = require('im/messenger/provider/pull/base/application');

	module.exports = {
		BasePullHandler,
		BaseApplicationPullHandler,
	};
});
