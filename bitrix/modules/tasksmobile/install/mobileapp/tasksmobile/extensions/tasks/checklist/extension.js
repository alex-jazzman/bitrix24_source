/** @module tasks/checklist */
jn.define('tasks/checklist', (require, exports, module) => {
	const { ChecklistController } = require('tasks/checklist/controller');
	const { openChecklistWithPreparedData } = require('tasks/checklist/utils');

	module.exports = {
		ChecklistController,
		openChecklistWithPreparedData,
	};
});
