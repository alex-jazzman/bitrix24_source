/** @module tasks/checklist/view-model */
jn.define('tasks/checklist/view-model', (require, exports, module) => {
	const { ChecklistView } = require('tasks/checklist/view-model/src/view/checklist-view');
	const { ChecklistItemView } = require('tasks/checklist/view-model/src/view/item-view');

	module.exports = {
		ChecklistView,
		ChecklistItemView,
	};
});
