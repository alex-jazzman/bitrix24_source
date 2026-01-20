/**
 * @module tasks/layout/fields/result-v2/theme/air-compact
 */
jn.define('tasks/layout/fields/result-v2/theme/air-compact', (require, exports, module) => {
	const { Loc } = require('loc');
	const { AirCompactThemeView } = require('layout/ui/fields/base/theme/air-compact');
	const { withTheme } = require('layout/ui/fields/theme');
	const { TaskResultField: TaskResultFieldClass } = require('tasks/layout/fields/result-v2');
	const { Icon } = require('ui-system/blocks/icon');

	/**
	 * @param {TaskResultField} field
	 */
	const AirTheme = (field) => {
		return AirCompactThemeView({
			testId: field.testId,
			empty: field.isEmpty(),
			readOnly: field.isReadOnly(),
			multiple: true,
			wideMode: true,
			defaultLeftIcon: Icon.WINDOW_FLAG,
			text: Loc.getMessage('TASKS_FIELDS_RESULT_V2_AIR_COMPACT_TITLE'),
			textMultiple: Loc.getMessage('TASKS_FIELDS_RESULT_V2_AIR_COMPACT_TITLE_MULTI'),
			count: field.getResultsCount(),
			onClick: () => (field.isEmpty() ? field.openResultCreation() : field.openResultList()),
		});
	};

	/** @type {function(object): object} */
	const TaskResultField = withTheme(TaskResultFieldClass, AirTheme);

	module.exports = {
		AirTheme,
		TaskResultField,
	};
});
