/**
 * @module statemanager/redux/slices/field-filter/selector
 */
jn.define('statemanager/redux/slices/field-filter/selector', (require, exports, module) => {
	const { sliceName, fieldFilterAdapter, createEmptyEntity } = require('statemanager/redux/slices/field-filter/meta');

	const { selectById } = fieldFilterAdapter.getSelectors((state) => state[sliceName]);

	/**
	 * @param {object} state
	 * @param {string} gridId
	 * @return {FieldFilterEntity}
	 */
	const selectFilterByGridId = (state, gridId) => selectById(state, gridId) ?? createEmptyEntity(gridId);

	/**
	 * Words of the filter controls, as the web filter words them. Null until an answer of any list has
	 * brought them: the vocabulary belongs to no list, so whichever list was opened first fills it.
	 *
	 * @param {object} state
	 * @return {?FilterDictionary}
	 */
	const selectFilterDictionary = (state) => state[sliceName]?.dictionary ?? null;

	/**
	 * Values of one field of a list, read after its dictionary (DeferredItems). Null means nobody has
	 * asked for them yet - an empty list is an answer of its own and says the portal has none.
	 *
	 * @param {object} state
	 * @param {string} gridId
	 * @param {string} fieldId
	 * @return {?FieldItem[]}
	 */
	const selectFilterFieldItems = (state, gridId, fieldId) => (
		selectFilterByGridId(state, gridId).deferredItems?.[fieldId] ?? null
	);

	module.exports = { selectFilterByGridId, selectFilterDictionary, selectFilterFieldItems };
});
