/**
 * @module mail/statemanager/redux/slices/labels
 */
jn.define('mail/statemanager/redux/slices/labels', (require, exports, module) => {
	const { createSlice } = require('statemanager/redux/toolkit');
	const { ReducerRegistry } = require('statemanager/redux/reducer-registry');
	const { StateCache } = require('statemanager/redux/state-cache');
	const { setLabelsAvailability } = require('mail/statemanager/redux/slices/folders');
	const { setCurrentMailbox } = require('mail/statemanager/redux/slices/mailboxes');
	const { sliceName } = require('mail/statemanager/redux/slices/labels/meta');
	const {
		applyCurrentMailbox,
		applyLabelsAvailability,
		createLabelsReducers,
		createLabelsState,
	} = require('mail/statemanager/redux/slices/labels/src/state');

	const labelsSlice = createSlice({
		name: sliceName,
		initialState: StateCache.getReducerState(sliceName, createLabelsState()),
		reducers: createLabelsReducers(),
		extraReducers: (builder) => {
			builder.addCase(setLabelsAvailability, (state, { payload }) => {
				applyLabelsAvailability(state, payload?.labelsAvailable);
			});
			builder.addCase(setCurrentMailbox, (state, { payload }) => {
				applyCurrentMailbox(state, payload?.mailboxId);
			});
		},
	});

	ReducerRegistry.register(sliceName, labelsSlice.reducer);

	module.exports = { ...labelsSlice.actions };
});
