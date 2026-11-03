/**
 * @module crm/entity-tab/filter-mode/preset
 */
jn.define('crm/entity-tab/filter-mode/preset', (require, exports, module) => {
	const { Type } = require('type');

	/**
	 * Mode of saved presets. The filter itself is the `Filter` of the tab, which the tab keeps handing
	 * to its views and rebuilds when it is cleared, so it is read from there instead of being held.
	 *
	 * @implements {EntityTabFilterMode}
	 */
	class EntityTabPresetFilterMode
	{
		/**
		 * @param {EntityTabPresetFilterModeParams} params
		 */
		constructor(params)
		{
			const { getFilter, getTabPresetId, onCounterSearch, onPresetSearch } = params;

			// read and not held: the tab builds a new filter when it is cleared or the funnel changes
			this.getFilter = getFilter;
			this.params = params;
			this.getTabPresetId = getTabPresetId;
			this.onCounterSearch = onCounterSearch;
			this.onPresetSearch = onPresetSearch;
		}

		applySearch({ isCancel, counter, params })
		{
			if (isCancel)
			{
				this.getFilter().unsetWasShown();
			}

			if (counter?.code)
			{
				this.onCounterSearch(params);

				return;
			}

			this.onPresetSearch(params);
		}

		showSearchBar()
		{
			const filter = this.getFilter();

			let presetId = filter.getPresetId();
			if (!presetId && !filter.isActive())
			{
				presetId = this.getTabPresetId();
			}

			const counterId = filter.getCounterId();
			if (counterId)
			{
				presetId = null;
			}

			filter.set({
				presetId,
				counterId,
				search: filter.getSearchString(),
			}).setWasShown();

			BX.postComponentEvent('UI.SearchBar::show', [
				{
					presetId,
					counterId,
					search: filter.getSearchString(),
					searchBarId: this.params.searchBarId,
				},
			]);
		}

		isActive()
		{
			const filter = this.getFilter();

			return Boolean(
				filter.isActive()
				|| filter.hasSearchText()
				|| filter.hasSelectedNotDefaultPreset(this.params.searchRef),
			);
		}

		getMenuButtons()
		{
			return [];
		}

		hasCounterMenu()
		{
			return false;
		}

		/**
		 * The counters of this mode are shortcuts of the search bar and carry their own state, so there
		 * is nothing to read before one of them applies.
		 *
		 * @return {Promise<void>}
		 */
		prepareCounter()
		{
			// the conditions of this mode are the preset the tab opened under: nothing to read, and
			// the reading never fails
			return Promise.resolve(true);
		}

		applyActionParams(actionParams)
		{
			const filter = this.getFilter();
			const { extra } = actionParams.loadItems;

			if (filter.hasSearchText())
			{
				extra.search = filter.getSearchString();
			}

			if (filter.getPresetId())
			{
				extra.filterParams.FILTER_PRESET_ID = filter.getPresetId();
				extra.filter = filter.getData();
			}
			else if (filter.isActive())
			{
				extra.filterParams.FILTER_PRESET_ID = filter.getEmptyFilterPresetId();
			}
			else
			{
				extra.filterParams.FILTER_PRESET_ID = (
					this.getTabPresetId() || filter.getEmptyFilterPresetId()
				);
			}

			return actionParams;
		}

		/**
		 * The filter hands its state to the list by its own path, so a reload needs no fresh params.
		 */
		needsFreshActionParams()
		{
			return false;
		}

		setContext()
		{
			// the filter of this mode is rebuilt by the tab together with the category
		}

		getConditions()
		{
			return null;
		}

		/**
		 * The view writes the preset of this filter over the conditions of the request, so it is handed
		 * the filter itself.
		 */
		getViewFilter()
		{
			return this.getFilter();
		}

		hasDrawerSorting()
		{
			return false;
		}

		canUseCache()
		{
			const filter = this.getFilter();

			return !filter.hasSelectedNotDefaultPreset() && !Type.isStringFilled(filter.getSearchString());
		}
	}

	module.exports = { EntityTabPresetFilterMode };
});
