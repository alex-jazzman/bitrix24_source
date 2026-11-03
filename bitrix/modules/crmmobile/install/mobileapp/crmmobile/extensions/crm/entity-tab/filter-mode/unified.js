/**
 * @module crm/entity-tab/filter-mode/unified
 */
jn.define('crm/entity-tab/filter-mode/unified', (require, exports, module) => {
	const { ListFilterEntry } = require('layout/ui/field-filter/entry');
	const { getUnifiedFilterConfig } = require('crm/entity-tab/unified-filter');
	const {
		resolveUnifiedFilterPresetId,
		buildUnifiedFilterConditions,
		buildUnifiedFilterActionParams,
	} = require('crm/entity-tab/unified-filter-request');

	/**
	 * Mode of the unified drawer, see EntityTabFilterMode. Starts with the stand-in of the filter, so
	 * the graph of the drawer is loaded when the user first opens it.
	 *
	 * @implements {EntityTabFilterMode}
	 */
	class EntityTabUnifiedFilterMode
	{
		/**
		 * @param {EntityTabUnifiedFilterModeParams} params
		 */
		constructor(params)
		{
			this.params = params;
			/** The entity type of the list right now: a funnel switch may name another one. */
			this.entityTypeName = params.entityTypeName;
			/** @type {ListFilterInstance} */
			this.filter = new ListFilterEntry(getUnifiedFilterConfig({
				entityTypeName: params.entityTypeName,
				categoryId: params.categoryId,
				getEntityTypeName: () => this.entityTypeName,
				getView: () => params.getView(),
				getCrmMode: () => params.getCrmMode(),
				onApply: () => params.onApply(),
				onResolve: (filter) => {
					this.filter = filter;
				},
			}));
		}

		/**
		 * In this mode the search bar carries nothing but the string: presets live in the drawer and
		 * counters in the "---" menu.
		 */
		applySearch({ text, isCancel, params })
		{
			this.filter.setSearch(isCancel ? '' : (text ?? ''));
			this.params.onSearchApplied(params);
		}

		showSearchBar()
		{
			BX.postComponentEvent('UI.SearchBar::show', [
				{
					search: this.filter.getSearch(),
					searchBarId: this.params.searchBarId,
				},
			]);
		}

		isActive()
		{
			return this.filter.isActive() || this.params.hasSelectedCounter();
		}

		getMenuButtons()
		{
			return [this.filter.getMenuButton(() => this.open())];
		}

		/**
		 * First opening also loads the drawer: until then the tab holds the stand-in of the filter.
		 */
		open()
		{
			// the sorting section is offered only where the list is ordered - deals, for now
			this.filter.setSorting(this.params.getSortManager());

			void this.filter.open(this.params.getLayout());
		}

		/**
		 * The counters of the "---" menu: in the mode of presets they are shortcuts of the search bar,
		 * and the drawer knows nothing about them.
		 */
		hasCounterMenu()
		{
			return true;
		}

		/**
		 * A counter travels as a value of the temporary filter - the very preset the conditions of the
		 * user are kept in, shared with the web. A filter that has read no state of the list answers
		 * with no values, so the counter would be written there alone: the conditions of the user are
		 * replaced by it, and after the counter is cleared the request says "show what the server
		 * holds" - and the server holds the counter. The state is read first, and the request then
		 * carries both, exactly as it does once the drawer has been opened.
		 *
		 * @return {Promise<void>}
		 */
		prepareCounter()
		{
			return this.filter.readState();
		}

		/**
		 * Conditions of the unified filter travel the same way the legacy ones do - as the values of
		 * the temporary filter - so the list action needs no second reading of the request.
		 */
		applyActionParams(actionParams)
		{
			return buildUnifiedFilterActionParams({ actionParams, ...this.getPayload() });
		}

		/**
		 * The conditions of this filter travel in the payload of the request, and the list keeps the
		 * payload it was built with (`StatefulList.getInitialState`): without a fresh one a reload asks
		 * the server with the conditions of the previous state.
		 */
		needsFreshActionParams()
		{
			return true;
		}

		setContext({ entityTypeName, categoryId })
		{
			this.entityTypeName = entityTypeName;
			this.filter.setContext({ entityTypeName, categoryId });
		}

		/**
		 * Conditions of the filter for the actions of the tab that are not the list - the counters of
		 * the stages, above all: their sums stand over the list and are counted under the same
		 * conditions.
		 */
		getConditions()
		{
			return buildUnifiedFilterConditions(this.getPayload());
		}

		/**
		 * The filter of the screen is the one in the params of the request, so the view has nothing of
		 * its own to write over them.
		 */
		getViewFilter()
		{
			return null;
		}

		hasDrawerSorting()
		{
			return true;
		}

		/**
		 * Whether the rows of the previous answer may be drawn while this one is on its way
		 * (`StatefulList` draws the cache first and replaces it with the answer of the server).
		 *
		 * They may: the conditions of this mode travel in the payload of the request, so the cached
		 * answer belongs to the payload that asked for it. A reload carrying conditions of its own is
		 * not asked this question at all - the tab reloads with fresh `actionParams` then, and the
		 * caller leaves the cache out (`EntityTabList::reload`).
		 *
		 * The mode of presets answers otherwise, and for a reason of its own: the conditions there stay
		 * on the server behind the pointer of the preset, so two presets ask with one and the same
		 * payload and the cache cannot tell their answers apart.
		 */
		canUseCache()
		{
			return true;
		}

		/**
		 * What the filter of the screen holds right now. Every action of the tab asks the same question
		 * - the list, the counters of the stages, the sums over them - and they have to be answered by
		 * one set of conditions: a list filtered by one thing under a sum counted by another is worse
		 * than either.
		 *
		 * @private
		 * @return {{tmpFields: Object, search: string, presetId: string}}
		 */
		getPayload()
		{
			const { tmpFields: formFields, search, presetId } = this.filter.getRequestFields();

			return {
				tmpFields: { ...formFields, ...this.params.getCounterFields() },
				search,
				presetId: resolveUnifiedFilterPresetId({
					presetId,
					hasSelectedCounter: this.params.hasSelectedCounter(),
				}),
			};
		}
	}

	module.exports = { EntityTabUnifiedFilterMode };
});
