/**
 * @module mail/templates/compose
 */
jn.define('mail/templates/compose', (require, exports, module) => {
	const { TemplateApi, MailTemplateApiError } = require('mail/templates/compose/src/template-api');
	const { TemplateSearch } = require('mail/templates/compose/src/template-search');
	const { MailTemplateSession } = require('mail/templates/compose/src/template-session');
	const { TemplateApplicationController } = require('mail/templates/compose/src/template-application');

	module.exports = {
		TemplateApi,
		MailTemplateApiError,
		TemplateSearch,
		MailTemplateSession,
		TemplateApplicationController,
	};
});
