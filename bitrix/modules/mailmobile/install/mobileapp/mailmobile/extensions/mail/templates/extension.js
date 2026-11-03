/**
 * @module mail/templates
 */
jn.define('mail/templates', (require, exports, module) => {
	const { TemplatePicker } = require('mail/templates/src/template-picker');
	const { TemplateNavigator } = require('mail/templates/src/template-navigator');
	const { showTemplateApplyDialog } = require('mail/templates/src/template-apply-dialog');

	module.exports = { TemplatePicker, TemplateNavigator, showTemplateApplyDialog };
});
