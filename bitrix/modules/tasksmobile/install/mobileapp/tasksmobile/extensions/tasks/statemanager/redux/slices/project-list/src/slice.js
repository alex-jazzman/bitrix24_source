/**
 * @module tasks/statemanager/redux/slices/project-list/src/slice
 */
jn.define('tasks/statemanager/redux/slices/project-list/src/slice', (require, exports, module) => {
	const { ReducerRegistry } = require('statemanager/redux/reducer-registry');
	const { createSlice } = require('statemanager/redux/toolkit');
	const { sliceName, initialState } = require('tasks/statemanager/redux/slices/project-list/meta');
	const {
		projectListAdded,
		projectListUpserted,
		projectListRemoved,
		projectListCleared,
	} = require('tasks/statemanager/redux/slices/project-list/src/reducer');

	/** @type {object} */
	const slice = createSlice({
		name: sliceName,
		initialState,
		reducers: {
			projectListAdded,
			projectListUpserted,
			projectListRemoved,
			projectListCleared,
		},
	});

	ReducerRegistry.register(sliceName, slice.reducer);

	module.exports = {
		slice,
	};
});
