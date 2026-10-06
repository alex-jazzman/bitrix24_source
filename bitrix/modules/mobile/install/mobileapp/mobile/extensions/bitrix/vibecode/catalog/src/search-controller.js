/**
 * @module vibecode/catalog/src/search-controller
 */
jn.define('vibecode/catalog/src/search-controller', (require, exports, module) => {
	const { debounce } = require('utils/function');
	const { SEARCH_DEBOUNCE_DELAY } = require('vibecode/catalog/src/const');
	const { getSearchQueryFromEvent } = require('vibecode/catalog/src/utils');

	class VibeCodeCatalogSearchController
	{
		constructor(renderer)
		{
			this.renderer = renderer;
			this.searchBarIsInited = false;
			this.searchChangeToken = 0;
			this.applySearchQueryDebounced = debounce(
				this.applySearchQueryIfActual,
				SEARCH_DEBOUNCE_DELAY,
				this,
			);
		}

		getInitialSearchQuery(props = {})
		{
			return String(props.q ?? props.searchQuery ?? '').trim();
		}

		getSearchQuery()
		{
			return String(this.renderer.state.searchQuery ?? '').trim();
		}

		getSearchWidget()
		{
			return this.renderer.getHeaderWidget();
		}

		getSearchObject(initSearch = false)
		{
			const widget = this.getSearchWidget();
			const search = widget?.search ?? widget?.searchBar ?? null;

			if (initSearch && widget?.search)
			{
				widget.search.mode = 'bar';
			}

			return search;
		}

		bindSearchBar()
		{
			if (this.searchBarIsInited)
			{
				return;
			}

			const search = this.getSearchObject(true);
			if (!search)
			{
				return;
			}

			search.on?.('textChanged', this.handleSearchTextChanged);
			search.on?.('clickEnter', this.handleSearchSubmit);
			search.on?.('cancel', this.handleSearchCancel);
			search.setReturnKey?.('done');

			this.searchBarIsInited = true;
		}

		unbindSearchBar()
		{
			if (!this.searchBarIsInited)
			{
				return;
			}

			const search = this.getSearchObject(false);
			search?.removeEventListener?.('textChanged', this.handleSearchTextChanged);
			search?.removeEventListener?.('clickEnter', this.handleSearchSubmit);
			search?.removeEventListener?.('cancel', this.handleSearchCancel);

			this.searchBarIsInited = false;
		}

		handleSearchClick = () => {
			this.bindSearchBar();

			const search = this.getSearchObject(true);
			if (!search)
			{
				return;
			}

			search.text = this.getSearchQuery();
			search.show?.();
		};

		handleSearchTextChanged = (params = {}) => {
			const query = getSearchQueryFromEvent(params, this.getSearchObject(false));
			if (query === null)
			{
				return;
			}

			this.searchChangeToken += 1;
			this.applySearchQueryDebounced(query, this.searchChangeToken);
		};

		handleSearchSubmit = (params = {}) => {
			const query = getSearchQueryFromEvent(params, this.getSearchObject(false));
			if (query === null)
			{
				return;
			}

			this.searchChangeToken += 1;
			this.applySearchQuery(query);
		};

		handleSearchCancel = () => {
			this.searchChangeToken += 1;
			this.applySearchQuery('');
		};

		applySearchQueryIfActual(query = '', token = null)
		{
			if (token !== this.searchChangeToken)
			{
				return;
			}

			this.applySearchQuery(query);
		}

		applySearchQuery(query = '')
		{
			const normalizedQuery = String(query ?? '').trim();
			if (normalizedQuery === this.getSearchQuery())
			{
				return;
			}

			this.renderer.setState({
				searchQuery: normalizedQuery,
			}, () => {
				this.renderer.spendAutoSwitchOnSearch();
				this.renderer.syncProviderParams();
				this.renderer.reloadStatefulList();
			});
		}
	}

	module.exports = {
		VibeCodeCatalogSearchController,
	};
});
