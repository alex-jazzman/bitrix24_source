/**
 * @module tasks/statemanager/redux/slices/project-list/src/selector
 */
jn.define('tasks/statemanager/redux/slices/project-list/src/selector', (require, exports, module) => {
	const { sliceName, entityAdapter, initialState } = require('tasks/statemanager/redux/slices/project-list/meta');

	/**
	 * @param {object} state
	 * @returns {ProjectListState}
	 */
	const selectProjectListState = (state) => {
		return state?.[sliceName] ?? initialState;
	};

	const {
		selectAll,
		selectById,
		selectEntities,
		selectIds,
		selectTotal,
	} = entityAdapter.getSelectors(selectProjectListState);

	module.exports = {
		selectAll,
		selectById,
		selectEntities,
		selectIds,
		selectTotal,
	};
});
