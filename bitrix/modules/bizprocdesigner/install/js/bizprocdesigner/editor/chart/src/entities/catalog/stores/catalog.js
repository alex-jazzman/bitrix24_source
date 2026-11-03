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

function normalizeSearchText(text: string): string
{
	return text.toLowerCase().replaceAll('ё', 'е');
}

/**
 * Identity of a palette card: its activity type together with the preset of it, since one activity
 * shows up as many cards - one per preset - and a node names the very card it came from by both.
 * A card without a preset keeps the bare type, so an absent preset is never taken for an empty one.
 */
function catalogCardKey(type: string, presetId: ?string): string
{
	return presetId === null || presetId === undefined ? type : `${type}@${presetId}`;
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
			const preSearchText = normalizeSearchText(state.searchText);

			const foundedGroups = state.groups
				.filter((group) => {
					return normalizeSearchText(group.title).includes(preSearchText);
				});

			const foundedItems = [
				...new Map(
					state.groups
						.flatMap((group) => group.items
							.filter((item) => normalizeSearchText(item.title).includes(preSearchText))
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
		/**
		 * The palette indexed by card identity, built once per catalog and read by everyone who has to
		 * name the card a node came from. The readers sit on the render path of the panel, where walking
		 * all the cards of the palette - 227 of them on a portal with a few smart processes - once per
		 * row is the whole cost of the answer.
		 *
		 * The first card of a key wins, which is the card the linear search these readers used to do
		 * returned.
		 */
		cardByKey: (state: CatalogState): Map<string, CatalogMenuItem> => {
			const cards = new Map();
			for (const group of state.groups)
			{
				for (const item of group.items ?? [])
				{
					const key = catalogCardKey(item.id, item.presetId);
					if (!cards.has(key))
					{
						cards.set(key, item);
					}
				}
			}

			return cards;
		},
		/**
		 * Properties a node carries out of the palette: those of the card it was dropped from, a preset
		 * of it included (NodeCatalogItemDtoFactory). They say which node this is - which trigger, which
		 * entity, which tool - and not what anyone has set up in it, so a reader of the settings of a
		 * node has to tell them from the values the user filled in.
		 *
		 * Empty for a node whose card is not in the palette (deprecated, groupless) and while the
		 * catalog is still loading: then nothing is told apart, which is the answer this getter gave
		 * before the palette arrived anyway.
		 */
		getCatalogProperties(): (activity: ?{ Type: string, PresetId?: ?string }) => Object {
			return (activity: ?{ Type: string, PresetId?: ?string }): Object => {
				if (!activity?.Type)
				{
					return {};
				}

				const card = this.cardByKey.get(catalogCardKey(activity.Type, activity.PresetId));

				return card?.properties ?? {};
			};
		},
		// An activity kept out of the palette (deprecated, groupless) has no card here at all, so its
		// nodes get their title from the server instead - pass it as fallbackTitle.
		getDefaultTitle(): (activity: ?{ Type: string, PresetId?: ?string }, fallbackTitle: ?string) => string {
			return (
				activity: ?{ Type: string, PresetId?: ?string },
				fallbackTitle: ?string = '',
			): string => {
				if (!activity?.Type)
				{
					return '';
				}

				const cardTitle = this.cardByKey
					.get(catalogCardKey(activity.Type, activity.PresetId))
					?.title ?? ''
				;

				return cardTitle || (fallbackTitle ?? '');
			};
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
		// Unconditional, unlike the two above: they answer the pointer, and there a pinned catalog
		// must not follow it. Pinning says what the panel looks like outright, by either path.
		setExpandedCatalog(value: boolean): void
		{
			this.isExpandedCatalog = value;
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
