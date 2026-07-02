/**
 * @module tasks/statemanager/redux/slices/templates/selector
 */
jn.define('tasks/statemanager/redux/slices/templates/selector', (require, exports, module) => {
	const {
		sliceName,
		defaultSorting,
		initialState,
		templatesAdapter,
	} = require('tasks/statemanager/redux/slices/templates/meta');

	const selectTemplatesState = (state) => {
		const templatesState = state?.[sliceName];

		return {
			...initialState,
			...templatesState,
			ids: templatesState?.ids ?? initialState.ids,
			entities: templatesState?.entities ?? initialState.entities,
			sorting: templatesState?.sorting ?? defaultSorting,
		};
	};

	const {
		selectAll,
		selectById,
		selectEntities,
		selectIds,
		selectTotal,
	} = templatesAdapter.getSelectors(selectTemplatesState);

	const selectSorting = (state) => {
		return selectTemplatesState(state).sorting;
	};

	module.exports = {
		selectAll,
		selectById,
		selectEntities,
		selectIds,
		selectTotal,
		selectSorting,
	};
});
