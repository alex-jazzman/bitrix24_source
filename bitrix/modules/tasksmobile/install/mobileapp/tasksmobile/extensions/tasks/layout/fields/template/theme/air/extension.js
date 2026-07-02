/**
 * @module tasks/layout/fields/template/theme/air
 */
jn.define('tasks/layout/fields/template/theme/air', (require, exports, module) => {

	const { withTheme } = require('layout/ui/fields/theme');
	const { TemplateField: TemplateFieldClass } = require('tasks/layout/fields/template');
	const { TemplateAirContent } = require('tasks/layout/fields/template/theme/air/src/content');

	/**
	 * @param {TemplateFieldClass} field
	 */
	const AirTheme = (field) => TemplateAirContent({ field });

	/** @type {function(object): object} */
	const TemplateField = withTheme(TemplateFieldClass, AirTheme);

	module.exports = {
		AirTheme,
		TemplateField,
	};
});
