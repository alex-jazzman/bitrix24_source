/**
 * @module push/notifications-register
 */
jn.define('push/notifications-register', (require, exports, module) => {
	const { extensions } = require('push/notifications-register/src/extensions');
	const { loadExtensions } = require('require-lazy/extension-loader');

	function registerPushNotificationHandlers()
	{
		return loadExtensions({
			extensions,
			logPrefix: 'register-push-notifications',
		});
	}

	module.exports = {
		registerPushNotificationHandlers,
	};
});
