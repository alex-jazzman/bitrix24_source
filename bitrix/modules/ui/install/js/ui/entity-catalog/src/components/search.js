import { BaseEvent } from 'main.core.events';
import { Loc, debounce, Type } from 'main.core';

export const Search = {
	emits: ['onSearch'],
	name: 'ui-entity-catalog-titlebar-search',
	data(): Object
	{
		return {
			opened: false,
			debounceSearchHandler: null,
			queryString: '',
			showClearSearch: false,
			searchOpenLabel: Loc.getMessage('UI_JS_ENTITY_CATALOG_SEARCH_OPEN_ARIA'),
			searchClearLabel: Loc.getMessage('UI_JS_ENTITY_CATALOG_SEARCH_CLEAR_ARIA'),
			searchInputLabel: Loc.getMessage('UI_JS_ENTITY_CATALOG_SEARCH_INPUT_ARIA'),
			searchPlaceholder: Loc.getMessage('UI_JS_ENTITY_CATALOG_GROUP_LIST_SEARCH_PLACEHOLDER'),
		};
	},
	watch:{
		queryString(newString)
		{
			this.showClearSearch = this.opened && this.$refs['search-input'] && Type.isStringFilled(newString);
		},
	},
	created()
	{
		this.debounceSearchHandler = debounce((event) => {
			this.onSearch(event.target.value);
		}, 255);
	},
	methods: {
		openSearch()
		{
			this.opened = true;
			this.$nextTick(() => {
				this.$refs['search-input'].focus();
			});
		},
		onSearch(queryString)
		{
			this.queryString = queryString;
			this.$emit(
				'onSearch',
				new BaseEvent({data: {queryString: queryString ? queryString.toString() : ''}})
			);
		},
		clearSearch()
		{
			if (this.showClearSearch)
			{
				this.$refs['search-input'].value = '';
				this.onSearch('');
				this.$refs['search-input'].focus();
			}
		}
	},
	template: `
		<div class="ui-ctl ui-ctl-after-icon ui-ctl-w100 ui-ctl-round">
			<button
				v-if="!opened"
				type="button"
				class="ui-ctl-after ui-ctl-icon-search"
				data-testid="entity-catalog-search-open"
				:aria-label="searchOpenLabel"
				@click="openSearch"
			></button>
			<button
				v-if="showClearSearch"
				type="button"
				class="ui-ctl-after ui-ctl-icon-clear"
				data-testid="entity-catalog-search-clear"
				:aria-label="searchClearLabel"
				@click="clearSearch"
			></button>
			<input
				type="text"
				class="ui-ctl-element ui-ctl-textbox"
				data-testid="entity-catalog-search-input"
				:placeholder="searchPlaceholder"
				:aria-label="searchInputLabel"
				ref="search-input"
				v-if="opened"
				@input="debounceSearchHandler"
			/>
		</div>
	`,
};
