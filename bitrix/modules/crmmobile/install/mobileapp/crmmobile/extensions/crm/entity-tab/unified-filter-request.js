/**
 * @module crm/entity-tab/unified-filter-request
 */
jn.define('crm/entity-tab/unified-filter-request', (require, exports, module) => {
	const { NO_PRESET_ID } = require('layout/ui/field-filter/values');

	/**
	 * The preset the request of the list names.
	 *
	 * A preset applies as it is stored, so a request that carries conditions of its own must not name
	 * one: the server writes what the request carries under the temporary filter and applies that,
	 * while a named preset would be applied instead and the conditions dropped. Writing them under the
	 * preset is no answer either - that would overwrite a preset the user never edited.
	 *
	 * The filter itself already answers this for the fields of its form; a selected counter is a
	 * condition of the tab and stands outside the form, hence the second flag.
	 *
	 * @param {{presetId: string, hasSelectedCounter: boolean}} params
	 * @return {string}
	 */
	const resolveUnifiedFilterPresetId = ({ presetId, hasSelectedCounter }) => (
		hasSelectedCounter ? NO_PRESET_ID : presetId
	);

	/**
	 * Conditions of the filter as every action of the tab reads them (CONTRACT-API-01): the values of
	 * the temporary filter, the search string and the preset the request names. The list and the
	 * counters of the stages are asked with the same conditions, or the sums would not add up to the
	 * list they stand over.
	 *
	 * @param {{tmpFields: Object, search: string, presetId: string}} params
	 * @return {Object}
	 */
	const buildUnifiedFilterConditions = ({ tmpFields, search, presetId }) => ({
		presetId: (presetId || null),
		counterId: null,
		tmpFields,
		search,
		currentFilterId: presetId,
	});

	/**
	 * Payload of the list request (CONTRACT-API-01): the conditions of the unified filter travel the
	 * same way the legacy ones do - as the values of the temporary filter - so the list action needs
	 * no second reading of the request.
	 *
	 * Returns a new object and leaves the given one as it is: the list keeps the payload it was built
	 * with, and a reload is given a fresh one.
	 *
	 * @param {{actionParams: Object, tmpFields: Object, search: string, presetId: string}} params
	 * @return {Object}
	 */
	const buildUnifiedFilterActionParams = ({ actionParams, tmpFields, search, presetId }) => {
		const loadItems = actionParams?.loadItems ?? {};
		const extra = loadItems.extra ?? {};

		return {
			...actionParams,
			loadItems: {
				...loadItems,
				extra: {
					...extra,
					// an empty search is not a search: the key stands for a request the user typed
					...(search === '' ? {} : { search }),
					filterParams: {
						...extra.filterParams,
						FILTER_PRESET_ID: presetId,
					},
					filter: buildUnifiedFilterConditions({ tmpFields, search, presetId }),
				},
			},
		};
	};

	module.exports = {
		resolveUnifiedFilterPresetId,
		buildUnifiedFilterConditions,
		buildUnifiedFilterActionParams,
	};
});
