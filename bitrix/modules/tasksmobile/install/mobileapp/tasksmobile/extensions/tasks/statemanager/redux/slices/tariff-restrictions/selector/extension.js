/**
 * @module tasks/statemanager/redux/slices/tariff-restrictions/selector
 */
jn.define('tasks/statemanager/redux/slices/tariff-restrictions/selector', (require, exports, module) => {
	const { createDraftSafeSelector } = require('statemanager/redux/toolkit');
	const { sliceName } = require('tasks/statemanager/redux/slices/tariff-restrictions/meta');

	const selectIsLoaded = createDraftSafeSelector(
		(state) => state[sliceName],
		(slice) => Boolean(slice.isLoaded),
	);

	const selectIsFlowTaskCreationProhibited = createDraftSafeSelector(
		selectIsLoaded,
		(state) => state[sliceName].restrictions,
		(isLoaded, restrictions) => Boolean(isLoaded && restrictions?.isFlowTaskCreationProhibited),
	);

	module.exports = {
		selectIsLoaded,
		selectIsFlowTaskCreationProhibited,
	};
});
