/**
 * @module tasks/statemanager/redux/slices/tasks-results-v2/extra-reducer
 */
jn.define('tasks/statemanager/redux/slices/tasks-results-v2/extra-reducer', (require, exports, module) => {
	const { tasksResultsAdapter } = require('tasks/statemanager/redux/slices/tasks-results-v2/meta');
	const { Type } = require('type');

	const tailFulfilled = (state, action) => {
		const { taskId } = action.meta.arg;
		const { items, map } = action.payload.data;

		const idsToRemove = (
			Object.values(state.results.entities)
				.filter((result) => result.taskId === taskId && !Object.keys(map).includes(result.id))
				.map((result) => result.id)
		);

		tasksResultsAdapter.removeMany(state.results, idsToRemove);
		tasksResultsAdapter.upsertMany(state.results, items);

		// eslint-disable-next-line no-param-reassign
		state.map[taskId] = map;
	};

	const getAllFulfilled = (state, action) => {
		const { taskId } = action.meta.arg;
		const { items, map } = action.payload.data;

		const idsToRemove = (
			Object.values(state.results.entities)
				.filter((result) => result.taskId === taskId)
				.map((result) => result.id)
		);

		tasksResultsAdapter.removeMany(state.results, idsToRemove);
		tasksResultsAdapter.upsertMany(state.results, items);

		// eslint-disable-next-line no-param-reassign
		state.map[taskId] = map;
	};

	const getFulfilled = (state, action) => {
		const { taskId } = action.meta.arg;
		const { items = [] } = action.payload.data || {};

		if (!Type.isArrayFilled(items))
		{
			return;
		}

		const result = items[0];

		tasksResultsAdapter.upsertOne(state.results, result);

		// eslint-disable-next-line no-param-reassign
		state.map[taskId] = {
			...state.map[taskId],
			[result.id]: result.messageId,
		};
	};

	const addFulfilled = (state, action) => {
		const { taskId } = action.meta.arg;
		const { items } = action.payload.data;

		const result = items[0];

		tasksResultsAdapter.addOne(state.results, result);

		// eslint-disable-next-line no-param-reassign
		state.map[taskId] = {
			...state.map[taskId],
			[result.id]: result.messageId,
		};
	};

	const updateFulfilled = (state, action) => {
		const { items } = action.payload.data;

		tasksResultsAdapter.upsertOne(state.results, items[0]);
	};

	const removeFulfilled = (state, action) => {
		const { taskId, resultId } = action.meta.arg;

		tasksResultsAdapter.removeOne(state.results, resultId);

		// eslint-disable-next-line no-param-reassign
		delete state.map[taskId][resultId];
	};

	module.exports = {
		tailFulfilled,
		getAllFulfilled,
		getFulfilled,
		addFulfilled,
		updateFulfilled,
		removeFulfilled,
	};
});
