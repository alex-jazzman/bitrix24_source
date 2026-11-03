/**
 * @module mail/statemanager/redux/slices/labels/selector
 */
jn.define('mail/statemanager/redux/slices/labels/selector', (require, exports, module) => {
	const { sliceName, labelsListAdapter } = require('mail/statemanager/redux/slices/labels/meta');

	const {
		selectAll: selectAllLabels,
		selectById: selectLabelById,
	} = labelsListAdapter.getSelectors((state) => state[sliceName]);

	const selectCurrentLabelId = (state) => state[sliceName].currentLabelId;
	const selectLabelsLoaded = (state) => state[sliceName].loaded === true;

	/**
	 * @returns {LabelReduxModel|null}
	 */
	const selectCurrentLabel = (state) => {
		const labelId = selectCurrentLabelId(state);

		return labelId === null ? null : (selectLabelById(state, labelId) ?? null);
	};

	module.exports = {
		selectAllLabels,
		selectCurrentLabel,
		selectCurrentLabelId,
		selectLabelById,
		selectLabelsLoaded,
	};
});
