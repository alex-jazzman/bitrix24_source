/**
 * @module mail/mailbox/connector/steps/settings
 */
jn.define('mail/mailbox/connector/steps/settings', (require, exports, module) => {
	const { Settings } = require('mail/mailbox/connector/steps/settings/src/settings');
	const { SettingsLayout } = require('mail/mailbox/settings');

	module.exports = { Settings, SettingsLayout };
});
