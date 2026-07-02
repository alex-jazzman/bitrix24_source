/**
 * @module tasks/statemanager/redux/slices/templates/meta
 */
jn.define('tasks/statemanager/redux/slices/templates/meta', (require, exports, module) => {
	const { createEntityAdapter } = require('statemanager/redux/toolkit');
	const { StateCache } = require('statemanager/redux/state-cache');

	const sliceName = 'tasks:templates';
	const templatesAdapter = createEntityAdapter();

	const defaultSorting = {
		type: 'CREATED_DATE',
		isASC: false,
	};

	const cachedState = StateCache.getReducerState(sliceName, {});
	const adapterState = templatesAdapter.getInitialState({
		sorting: defaultSorting,
	});

	const initialState = {
		...adapterState,
		...cachedState,
		ids: cachedState?.ids ?? adapterState.ids,
		entities: cachedState?.entities ?? adapterState.entities,
		sorting: cachedState?.sorting ?? defaultSorting,
	};

	module.exports = {
		sliceName,
		templatesAdapter,
		initialState,
		defaultSorting,
	};
});
