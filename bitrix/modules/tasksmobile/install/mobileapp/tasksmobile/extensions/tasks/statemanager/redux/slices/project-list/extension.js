/**
 * @module tasks/statemanager/redux/slices/project-list
 */
jn.define('tasks/statemanager/redux/slices/project-list', (require, exports, module) => {
	const {
		addProjectListItems,
		upsertProjectListItems,
		removeProjectListItems,
		clearProjectList,
	} = require('tasks/statemanager/redux/slices/project-list/src/action');
	const {
		selectAll,
		selectById,
		selectEntities,
		selectIds,
		selectTotal,
	} = require('tasks/statemanager/redux/slices/project-list/src/selector');
	const { slice } = require('tasks/statemanager/redux/slices/project-list/src/slice');

	module.exports = {
		// actions
		addProjectListItems,
		upsertProjectListItems,
		removeProjectListItems,
		clearProjectList,

		// selectors
		selectAll,
		selectById,
		selectEntities,
		selectIds,
		selectTotal,

		// slice
		slice,
	};
});
