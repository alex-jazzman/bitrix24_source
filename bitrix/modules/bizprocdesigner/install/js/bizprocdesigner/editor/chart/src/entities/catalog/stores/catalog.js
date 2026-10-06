import { defineStore } from 'ui.vue3.pinia';
import { editorAPI } from '../../../shared/api';
import type {
	CatalogMenuGroup,
	CatalogMenuItem,
	CatalogMenuItemId,
} from '../types';

type CatalogState = {
	groups: Array<CatalogMenuGroup>,
	searchText: string,
	currentGroup: CatalogMenuGroup | null,
	currentItem: CatalogMenuItem | null,
	highlightedItems: Set<CatalogMenuItemId>,
	isShowFoundedGroupItems: boolean,
	isShowSearch: boolean,
	isExpandedCatalog: boolean,
	isFixedCatalog: boolean,
	initPromise: ?Promise<void>,
};

export type SearchResults = {
	groups: Array<CatalogMenuGroup>,
	items: Array<CatalogMenuItem>,
}

export const useCatalogStore = defineStore('bizprocdesigner-editor-catalog', {
	state: (): CatalogState => ({
		groups: [],
		searchText: '',
		currentGroup: null,
		currentItem: null,
		highlightedItems: new Set(),
		isShowFoundedGroupItems: false,
		isShowSearch: false,
		isExpandedCatalog: true,
		isFixedCatalog: true,
		initPromise: null,
	}),
	getters: {
		contentBlockProducers: (state: CatalogState): Map<string, Object> => {
			const producers = new Map();
			for (const group of state.groups)
			{
				for (const item of group.items)
				{
					if (item.contentBlockProducer)
					{
						producers.set(item.id, item.contentBlockProducer);
					}
				}
			}

			return producers;
		},
		contentBlockConsumers: (state: CatalogState): Map<string, Object> => {
			const consumers = new Map();
			for (const group of state.groups)
			{
				for (const item of group.items)
				{
					if (item.contentBlockConsumer)
					{
						consumers.set(item.id, item.contentBlockConsumer);
					}
				}
			}

			return consumers;
		},
		canSearch: (state: CatalogState): boolean => {
			return state.searchText.length > 2;
		},
		isShowSearchResults: (state: CatalogState): boolean => {
			return state.canSearch && !state.isShowFoundedGroupItems;
		},
		searchResults: (state: CatalogState): SearchResults => {
			const preSearchText = state.searchText.toLowerCase();

			const foundedGroups = state.groups
				.filter((group) => {
					return group.title
						.toLowerCase()
						.includes(preSearchText);
				});

			const foundedItems = [
				...new Map(
					state.groups
						.flatMap((group) => group.items
							.filter((item) => item.title.toLowerCase().includes(preSearchText))
							.map((item) => {
								const key = item.presetId
									? `${item.id}_${item.presetId}`
									: item.id;

								return [
									key,
									{ ...item, parentGroup: group },
								];
							})),
				).values(),
			];

			return {
				groups: foundedGroups,
				items: foundedItems,
			};
		},
		searchResultsCount: (state: CatalogState): number => {
			const { groups, items } = state.searchResults;

			return groups.length + items.length;
		},
		// An activity kept out of the palette (deprecated, groupless) has no card here at all, so its
		// nodes get their title from the server instead - pass it as fallbackTitle.
		getDefaultTitle: (state: CatalogState) => (
			activity: ?{ Type: string, PresetId?: ?string },
			fallbackTitle: ?string = '',
		): string => {
			if (!activity?.Type)
			{
				return '';
			}

			const cardTitle = state.groups
				.flatMap((group) => group.items ?? [])
				.find((item) => item.id === activity.Type
					&& (item.presetId ?? null) === (activity.PresetId ?? null))
				?.title ?? '';

			return cardTitle || (fallbackTitle ?? '');
		},
	},
	actions: {
		init(): Promise<void>
		{
			if (!this.initPromise)
			{
				this.initPromise = this.fetchCatalogData();
			}

			return this.initPromise;
		},
		async fetchCatalogData(): Promise<void>
		{
			const { groups = [] } = await editorAPI.getCatalogData();

			this.groups = groups;
		},
		toggleFixedCatalog(): void
		{
			this.isFixedCatalog = !this.isFixedCatalog;
		},
		expandCatalog(): void
		{
			if (!this.isFixedCatalog)
			{
				this.isExpandedCatalog = true;
			}
		},
		collapseCatalog(): void
		{
			if (!this.isFixedCatalog)
			{
				this.isExpandedCatalog = false;
			}
		},
		clearSearchText(): void
		{
			this.searchText = '';
		},
		changeCurrentGroup(group): void
		{
			this.currentGroup = group;
		},
		resetCurrentGroup(): void
		{
			this.currentGroup = null;
		},
		changeCurrentItem(item): void
		{
			this.currentItem = item;
		},
		resetCurrentItem(): void
		{
			this.currentItem = null;
		},
		setHighlightedItem(ids: Array<CatalogMenuItemId> | CatalogMenuItemId): void
		{
			this.highlightedItems = new Set(
				Array.isArray(ids) ? ids : [ids],
			);
		},
		resetHighlightedItem(): void
		{
			this.highlightedItems = new Set();
		},
		showFoundedGroupItems(): void
		{
			this.isShowFoundedGroupItems = true;
		},
		hideFoundedGroupItems(): void
		{
			this.isShowFoundedGroupItems = false;
		},
		resetFoundedGroupView(): void
		{
			this.isShowFoundedGroupItems = false;
			this.currentGroup = null;
			this.highlightedItems = new Set();
		},
	},
});
