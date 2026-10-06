/**
 * @module tasks/statemanager/redux/slices/project-list/src/reducer
 */
jn.define('tasks/statemanager/redux/slices/project-list/src/reducer', (require, exports, module) => {
	const { entityAdapter } = require('tasks/statemanager/redux/slices/project-list/meta');
	const { normalizeId, prepareProjectListItems } = require('tasks/statemanager/redux/slices/project-list/src/tools');

	/**
	 * @param {ProjectListState} state
	 * @param {ProjectListAction} action
	 */
	const projectListAdded = (state, action) => {
		if (action.payload)
		{
			entityAdapter.addMany(state, prepareProjectListItems(state, action.payload));
		}
	};

	/**
	 * @param {ProjectListState} state
	 * @param {ProjectListAction} action
	 */
	const projectListUpserted = (state, action) => {
		if (action.payload)
		{
			entityAdapter.upsertMany(state, prepareProjectListItems(state, action.payload));
		}
	};

	/**
	 * @param {ProjectListState} state
	 * @param {ProjectListAction} action
	 */
	const projectListRemoved = (state, action) => {
		if (action.payload)
		{
			const ids = Array.isArray(action.payload) ? action.payload : [action.payload];

			entityAdapter.removeMany(
				state,
				ids
					.map((id) => normalizeId(id))
					.filter((id) => id > 0),
			);
		}
	};

	/**
	 * @param {ProjectListState} state
	 */
	const projectListCleared = (state) => {
		entityAdapter.removeAll(state);
	};

	module.exports = {
		projectListAdded,
		projectListUpserted,
		projectListRemoved,
		projectListCleared,
	};
});
