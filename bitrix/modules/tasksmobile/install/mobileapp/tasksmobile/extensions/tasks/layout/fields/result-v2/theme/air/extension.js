/**
 * @module tasks/layout/fields/result-v2/theme/air
 */
jn.define('tasks/layout/fields/result-v2/theme/air', (require, exports, module) => {
	const { withTheme } = require('layout/ui/fields/theme');
	const { TaskResultField: TaskResultFieldClass } = require('tasks/layout/fields/result-v2');
	const { TaskResultAirReduxContent } = require('tasks/layout/fields/result-v2/theme/air/src/redux-content');

	/**
	 * @param {TaskResultFieldClass} field
	 */
	const AirTheme = (field) => TaskResultAirReduxContent({ field });

	/** @type {function(object): object} */
	const TaskResultField = withTheme(TaskResultFieldClass, AirTheme);

	module.exports = {
		AirTheme,
		TaskResultField,
	};
});
