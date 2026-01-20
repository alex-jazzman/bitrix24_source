/**
 * @module tasks/statemanager/redux/slices/tasks-results-v2
 */
jn.define('tasks/statemanager/redux/slices/tasks-results-v2', (require, exports, module) => {
	const { ReducerRegistry } = require('statemanager/redux/reducer-registry');
	const { createSlice } = require('statemanager/redux/toolkit');

	const {
		sliceName,
		tasksResultsAdapter,
		initialState,
	} = require('tasks/statemanager/redux/slices/tasks-results-v2/meta');
	const {
		selectResultsByTaskId,
		selectMapByTaskId,
		selectLastResult,
		selectResultById,
		selectResultIdByTaskIdAndMessageId,
	} = require('tasks/statemanager/redux/slices/tasks-results-v2/selector');
	const {
		tail,
		getAll,
		get,
		addFromMessage,
		add,
		update,
		remove,
	} = require('tasks/statemanager/redux/slices/tasks-results-v2/thunk');
	const {
		tailFulfilled,
		getAllFulfilled,
		getFulfilled,
		addFulfilled,
		updateFulfilled,
		removeFulfilled,
	} = require('tasks/statemanager/redux/slices/tasks-results-v2/extra-reducer');

	const tasksResultsSlice = createSlice({
		initialState,
		name: sliceName,
		reducers: {
			upsertResults: (state, { payload }) => {
				const { taskId, items, map } = payload;

				tasksResultsAdapter.upsertMany(state.results, items);

				// eslint-disable-next-line no-param-reassign
				state.map[taskId] = {
					...state.map[taskId],
					...map,
				};
			},
			removeResults: (state, { payload }) => {
				const { taskId, resultIds } = payload;

				tasksResultsAdapter.removeMany(state.results, resultIds);

				// eslint-disable-next-line no-param-reassign
				resultIds.forEach((id) => delete state.map[taskId][id]);
			},
		},
		extraReducers: (builder) => {
			builder
				.addCase(tail.fulfilled, tailFulfilled)
				.addCase(getAll.fulfilled, getAllFulfilled)
				.addCase(get.fulfilled, getFulfilled)
				.addCase(addFromMessage.fulfilled, addFulfilled)
				.addCase(add.fulfilled, addFulfilled)
				.addCase(update.fulfilled, updateFulfilled)
				.addCase(remove.fulfilled, removeFulfilled)
			;
		},
	});

	const { reducer: tasksResultsReducer, actions } = tasksResultsSlice;
	const { upsertResults, removeResults } = actions;

	ReducerRegistry.register(sliceName, tasksResultsReducer);

	module.exports = {
		tasksResultsReducer,

		upsertResults,
		removeResults,

		selectResultsByTaskId,
		selectMapByTaskId,
		selectLastResult,
		selectResultById,
		selectResultIdByTaskIdAndMessageId,

		tail,
		getAll,
		get,
		addFromMessage,
		add,
		update,
		remove,
	};
});
