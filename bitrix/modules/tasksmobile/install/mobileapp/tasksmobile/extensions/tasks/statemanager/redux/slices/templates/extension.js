/**
 * @module tasks/statemanager/redux/slices/templates
 */
jn.define('tasks/statemanager/redux/slices/templates', (require, exports, module) => {
	const { ReducerRegistry } = require('statemanager/redux/reducer-registry');
	const { createSlice } = require('statemanager/redux/toolkit');

	const { sliceName, initialState } = require('tasks/statemanager/redux/slices/templates/meta');
	const {
		templatesAdded,
		templatesUpserted,
		templatesSortingSet,
		templatesSortingToggled,
	} = require('tasks/statemanager/redux/slices/templates/reducer');

	const {
		addTemplates,
		upsertTemplates,
		setTemplatesSorting,
		toggleTemplatesSorting,
	} = require('tasks/statemanager/redux/slices/templates/action');
	const {
		selectAll,
		selectById,
		selectEntities,
		selectIds,
		selectTotal,
		selectSorting,
	} = require('tasks/statemanager/redux/slices/templates/selector');

	const slice = createSlice({
		name: sliceName,
		initialState,
		reducers: {
			templatesAdded,
			templatesUpserted,
			templatesSortingSet,
			templatesSortingToggled,
		},
	});

	ReducerRegistry.register(sliceName, slice.reducer);

	module.exports = {
		// actions
		addTemplates,
		upsertTemplates,
		setTemplatesSorting,
		toggleTemplatesSorting,

		// selectors
		selectAll,
		selectById,
		selectEntities,
		selectIds,
		selectTotal,
		selectSorting,

		// slice
		slice,
	};
});
