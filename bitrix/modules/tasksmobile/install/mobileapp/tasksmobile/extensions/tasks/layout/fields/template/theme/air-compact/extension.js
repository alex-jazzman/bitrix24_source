/**
 * @module tasks/layout/fields/template/theme/air-compact
 */
jn.define('tasks/layout/fields/template/theme/air-compact', (require, exports, module) => {
	const { Loc } = require('loc');
	const { Icon } = require('assets/icons');
	const { AirCompactThemeView } = require('layout/ui/fields/base/theme/air-compact');
	const { withTheme } = require('layout/ui/fields/theme');
	const { TemplateField: TemplateFieldClass } = require('tasks/layout/fields/template');

	/**
	 * @param {TemplateField} field
	 * @return {Chip}
	 * @constructor
	 */
	const AirTheme = (field) => {
		return AirCompactThemeView({
			testId: field.testId,
			bindContainerRef: field.bindContainerRef,
			empty: field.isEmpty(),
			readOnly: field.isReadOnly(),
			leftIcon: {
				icon: Icon.TEMPLATE_TASK,
			},
			text: field.isEmpty() ? Loc.getMessage('TASKS_FIELDS_TEMPLATE_TITLE') : field.getTitleText(),
			onClick: field.openTemplateSelector(),
		});
	};

	/** @type {function(object): object} */
	const TemplateField = withTheme(TemplateFieldClass, AirTheme);

	module.exports = {
		AirTheme,
		TemplateField,
	};
});
