/**
 * @deprecated
 * @module push/listeners
 */
jn.define('push/listeners', (require, exports, module) => {
	const { pushListener } = require('push/listener');

	module.exports = {
		/**
		 * @deprecated use pushListener from 'push/listener' instead
		 */
		PushListener: pushListener,
	};
});
