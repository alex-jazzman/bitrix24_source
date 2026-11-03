/**
 * @module layout/ui/field-filter/filter/src/saved-filters/service
 */
jn.define('layout/ui/field-filter/filter/src/saved-filters/service', (require, exports, module) => {
	const { callFilterAction } = require('layout/ui/field-filter/filter/src/action');
	const { SavedFilterAction } = require('layout/ui/field-filter/filter/src/enums/saved-filter-action');
	const { PseudoPreset } = require('layout/ui/field-filter/filter/src/enums/pseudo-preset');
	const { SavedFilterError } = require('layout/ui/field-filter/filter/src/enums/saved-filter-error');
	const {
		parseResponse,
		parseSavedFiltersData,
	} = require('layout/ui/field-filter/filter/src/saved-filters/parser');

	/**
	 * Client of the saved filter actions (CONTRACT-API-02). The action namespace comes from
	 * the consumer, so the core component stays free of module specifics; every request
	 * carries the list context of that consumer, whatever it names it.
	 *
	 * The class only calls the server and hands the payload over: reading it is the job of
	 * saved-filters-parser, wording an error - of saved-filters-error.
	 *
	 * All mutating actions go over POST - the mobile BX.ajax.runAction always posts.
	 */
	class SavedFiltersService
	{
		/**
		 * @param {SavedFiltersServiceParams} params
		 */
		constructor(params)
		{
			this.actionPrefix = params.actionPrefix;
			this.context = params.context;
		}

		/**
		 * @public
		 * @return {Promise<SavedFiltersResult>}
		 */
		async load()
		{
			const result = await this.call(SavedFilterAction.GET.getValue());

			if (!result.success)
			{
				return result;
			}

			return { success: true, data: parseSavedFiltersData(result.data) };
		}

		/**
		 * Creates the preset when `presetId` is new and overwrites it otherwise; the saved
		 * preset becomes the current one on the server.
		 *
		 * @public
		 * @param {SaveFilterParams} params
		 * @return {Promise<SavedFiltersResult>}
		 */
		save(params)
		{
			return this.call(SavedFilterAction.SAVE.getValue(), {
				presetId: params.presetId,
				name: params.name,
				fields: params.fields,
				rows: params.rows,
			});
		}

		/**
		 * Keeps the order the user dragged the presets into. The whole order travels: the position of a
		 * preset is what the server writes, and it writes them all at once.
		 *
		 * @public
		 * @param {string[]} presetIds in the order the list is to show them
		 * @return {Promise<SavedFiltersResult>}
		 */
		reorder(presetIds)
		{
			return this.call(SavedFilterAction.REORDER.getValue(), { presetIds });
		}

		/**
		 * @public
		 * @param {string} presetId
		 * @return {Promise<SavedFiltersResult>}
		 */
		remove(presetId)
		{
			return this.call(SavedFilterAction.DELETE.getValue(), { presetId });
		}

		/**
		 * @public
		 * @param {string} presetId
		 * @return {Promise<SavedFiltersResult>}
		 */
		pin(presetId)
		{
			return this.call(SavedFilterAction.PIN.getValue(), { presetId });
		}

		/**
		 * Removing the pinning is `pinFilter` on the pseudo preset - exactly how the web does it.
		 *
		 * @public
		 * @return {Promise<SavedFiltersResult>}
		 */
		unpin()
		{
			return this.call(SavedFilterAction.PIN.getValue(), {
				presetId: PseudoPreset.DEFAULT.getValue(),
			});
		}

		/**
		 * @public
		 * @param {string} presetId
		 * @return {Promise<SavedFiltersResult>}
		 */
		setForAll(presetId)
		{
			return this.call(SavedFilterAction.SET_FOR_ALL.getValue(), { presetId });
		}

		/**
		 * @public
		 * @param {string} presetId
		 * @return {Promise<SavedFiltersResult>}
		 */
		unsetForAll(presetId)
		{
			return this.call(SavedFilterAction.UNSET_FOR_ALL.getValue(), { presetId });
		}

		/**
		 * @public
		 * @return {Promise<SavedFiltersResult>}
		 */
		restore()
		{
			return this.call(SavedFilterAction.RESTORE.getValue());
		}

		/**
		 * @private
		 * @param {string} method
		 * @param {SavedFiltersActionParams} [params]
		 * @return {Promise<SavedFiltersResult>}
		 */
		async call(method, params = {})
		{
			const response = await callFilterAction(this.actionPrefix, method, {
				context: this.context,
				...params,
			});

			return toResult(response);
		}
	}

	/**
	 * @param {unknown} response
	 * @return {SavedFiltersResult}
	 */
	const toResult = (response) => {
		const { success, data, code } = parseResponse(response);

		if (success)
		{
			return { success: true, data };
		}

		return { success: false, code, message: SavedFilterError.getMessageByCode(code) };
	};

	module.exports = { SavedFiltersService };
});
