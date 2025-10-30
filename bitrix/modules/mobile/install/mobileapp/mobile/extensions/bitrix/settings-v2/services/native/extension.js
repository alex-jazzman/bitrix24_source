/**
 * @module settings-v2/services/native
 */
jn.define('settings-v2/services/native', (require, exports, module) => {
	const { NativeLocService } = require('settings-v2/services/native/src/loc');
	const { NativeDebugService } = require('settings-v2/services/native/src/debug');

	module.exports = {
		NativeLocService,
		NativeDebugService,
	};
});
