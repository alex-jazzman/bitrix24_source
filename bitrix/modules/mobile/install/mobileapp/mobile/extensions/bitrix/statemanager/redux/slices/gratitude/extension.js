/**
 * @module statemanager/redux/slices/gratitude
 */
jn.define('statemanager/redux/slices/gratitude', (require, exports, module) => {
	const { ReducerRegistry } = require('statemanager/redux/reducer-registry');
	const { createSlice } = require('statemanager/redux/toolkit');
	const { sliceName, gratitudeAdapter, initialState } = require('statemanager/redux/slices/gratitude/meta');
	const {
		selectGratitudesQuantityByOwnerId,
		selectGratitudesByOwnerId,
		selectGratitudeById,
		selectNameById,
		selectRelatedPostIdById,
		selectCreatedAtById,
		selectTitleById,
	} = require('statemanager/redux/slices/gratitude/selector');

	const gratitudeSlice = createSlice({
		name: sliceName,
		initialState,
		reducers: {
			gratitudesUpserted: (state, { payload }) => {
				gratitudeAdapter.upsertMany(state, payload);
			},
			gratitudeUpserted: (state, { payload }) => {
				gratitudeAdapter.upsertOne(state, payload);
			},
			gratitudesAdded: (state, { payload }) => {
				gratitudeAdapter.addMany(state, payload);
			},
			gratitudeAdded: (state, { payload }) => {
				gratitudeAdapter.addOne(state, payload);
			},
		},
	});

	const {
		gratitudesUpserted,
		gratitudeUpserted,
		gratitudesAdded,
		gratitudeAdded,
	} = gratitudeSlice.actions;

	ReducerRegistry.register(sliceName, gratitudeSlice.reducer);

	module.exports = {
		gratitudesUpserted,
		gratitudeUpserted,
		gratitudesAdded,
		gratitudeAdded,
		selectGratitudesQuantityByOwnerId,
		selectGratitudesByOwnerId,
		selectGratitudeById,
		selectNameById,
		selectRelatedPostIdById,
		selectCreatedAtById,
		selectTitleById,
	};
});
