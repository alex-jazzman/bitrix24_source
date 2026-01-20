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
	}),
	getters: {
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

			const foundedItems = [...new Map(
				state.groups.flatMap((group) => group.items
					.filter((item) => item.title.toLowerCase().includes(preSearchText))
					.map((item) => [item.id, { ...item, parentGroup: group }])),
			).values()];

			return {
				groups: foundedGroups,
				items: foundedItems,
			};
		},
		searchResultsCount: (state: CatalogState): number => {
			const { groups, items } = state.searchResults;

			return groups.length + items.length;
		},
	},
	actions: {
		async init(): Promise<void>
		{
			await this.fetchCatalogData();
		},
		async fetchCatalogData(): Promise<void>
		{
			const { groups = [] } = await editorAPI.getCatalogData();

			groups.forEach((group, groupIdx) => {
				group.items.forEach((item, itemIdx) => {
					item.defaultSettings.ports = Object.entries(item.defaultSettings.ports)
						.reduce((portsMap, [type, ports]) => {
							portsMap[type] = ports?.map((port) => ({ ...port, type })) ?? [];

							return portsMap;
						}, {});

					if (item.type === 'simple' || item.type === 'trigger')
					{
						groups[groupIdx].items[itemIdx].defaultSettings.width = 200;
						groups[groupIdx].items[itemIdx].defaultSettings.height = 48;
					}
					else if (item.type === 'complex')
					{
						groups[groupIdx].items[itemIdx].defaultSettings.width = 200;
						groups[groupIdx].items[itemIdx].defaultSettings.height = 176;
					}
				});
			});

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
		addDevGroup(): void
		{
			this.groups.push({
				id: 'dev',
				icon: '',
				title: 'В разработке',
				items: [
					this.getFrameNode(),
				],
			});
		},
		getFrameNode(): {...}
		{
			return {
				id: 'frame',
				type: 'frame',
				title: 'Подложка',
				subtitle: 'Нода подложка',
				iconPath: 'BOTTLENECK',
				colorIndex: 1,
				defaultSettings: {
					width: 200,
					height: 200,
					ports: {
						input: [],
						output: [],
					},
				},
			};
		},
	},
});
