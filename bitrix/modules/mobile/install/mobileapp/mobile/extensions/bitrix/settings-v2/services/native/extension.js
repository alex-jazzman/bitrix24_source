/**
 * @module settings-v2/services/native
 */
jn.define('settings-v2/services/native', (require, exports, module) => {
	const { NativeLocService } = require('settings-v2/services/native/src/loc');
	const { NativeDebugService } = require('settings-v2/services/native/src/debug');
	const { NativeCacheService } = require('settings-v2/services/native/src/cache');
	const { NativeStyleService } = require('settings-v2/services/native/src/style');
	const { NativeFontSizeService } = require('settings-v2/services/native/src/font-size');
	const { NativeAppearanceBundleService } = require('settings-v2/services/native/src/appearance-bundle');

	module.exports = {
		NativeLocService,
		NativeDebugService,
		NativeCacheService,
		NativeStyleService,
		NativeFontSizeService,
		NativeAppearanceBundleService,
	};
});
