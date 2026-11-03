/**
 * @module intranet/self-delete
 */
jn.define('intranet/self-delete', (require, exports, module) => {
	const { openSelfDeleteFlow } = require('intranet/self-delete/src/flow');

	module.exports = { openSelfDeleteFlow };
});
