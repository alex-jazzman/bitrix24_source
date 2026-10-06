/**
 * @module push/notifications-register/src/extensions
 */
jn.define('push/notifications-register/src/extensions', (require, exports, module) => {

	const extensions = [
		'background/notifications',
		'crm:background/crm-notifications',
		'calendar:background/notifications',
	];

	module.exports = {
		extensions,
	};
});
