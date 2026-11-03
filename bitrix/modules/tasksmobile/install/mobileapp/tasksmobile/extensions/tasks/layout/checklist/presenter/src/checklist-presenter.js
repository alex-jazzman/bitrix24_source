/** @module tasks/layout/checklist/presenter/src/checklist-presenter */
jn.define('tasks/layout/checklist/presenter/src/checklist-presenter', (require, exports, module) => {
	const getFilteredItems = (checklistView, conditions) => [...checklistView.computeVisibleItems(conditions)];

	module.exports = {
		getFilteredItems,
	};
});
