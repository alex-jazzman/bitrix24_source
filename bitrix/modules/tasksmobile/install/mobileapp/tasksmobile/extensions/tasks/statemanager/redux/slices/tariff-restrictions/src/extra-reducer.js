/* eslint-disable no-param-reassign */
/**
 * @module tasks/statemanager/redux/slices/tariff-restrictions/extra-reducer
 */
jn.define('tasks/statemanager/redux/slices/tariff-restrictions/extra-reducer', (require, exports, module) => {
	const fetchFulfilled = (state, action) => {
		if (action.payload.data)
		{
			state.isLoaded = true;
			state.restrictions = action.payload.data;
		}
	};

	module.exports = { fetchFulfilled };
});
