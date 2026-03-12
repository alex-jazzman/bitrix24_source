/**
 * @module im/messenger/provider/pull/collab
 */
jn.define('im/messenger/provider/pull/collab', (require, exports, module) => {
	const { CollabInfoPullHandler } = require('im/messenger/provider/pull/collab/collab-info');

	module.exports = {
		CollabInfoPullHandler,
	};
});
