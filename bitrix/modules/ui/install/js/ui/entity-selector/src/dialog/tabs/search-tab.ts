import { Runtime, ajax as Ajax, Type, Loc } from 'main.core';

import { Tab } from './tab';
import { SearchEngine } from '../../search/search-engine';
import { MatchResult } from '../../search/match-result';
import { SearchQuery } from '../../search/search-query';
import { SearchLoader } from './search-loader';
import { SearchResultsAnnouncer } from './search-results-announcer';
import { SearchTabFooter } from '../footer/search-tab-footer';

import { type ItemOptions } from '../../item/item-options';
import { type TabOptions } from './tab-options';
import { type FooterOptions } from '../footer/footer-content';
import { type EntityErrorOptions } from '../../entity/entity-error-options';
import { type Item } from '../../item/item';
import { type Entity } from '../../entity/entity';
import { type Dialog } from '../dialog';
import { type SearchOptions } from '../search-options';

type SearchResponse = {
	dialog?: {
		items?: ItemOptions[];
		errors?: EntityErrorOptions[];
	};
	searchQuery?: {
		cacheable?: boolean;
	};
};

export class SearchTab extends Tab
{
	lastSearchQuery: SearchQuery | null = null;
	queryCache: Set<string> = new Set();
	queryXhr: XMLHttpRequest | null = null;
	searchLoader: SearchLoader = new SearchLoader(this);
	allowCreateItem: boolean = false;
	loadWithDebounce: () => void;
	resultsAnnouncer: SearchResultsAnnouncer = new SearchResultsAnnouncer();

	constructor(dialog: Dialog, tabOptions: TabOptions, searchOptions: SearchOptions)
	{
		const defaults = {
			title: Loc.getMessage('UI_SELECTOR_SEARCH_TAB_TITLE') ?? '',
			visible: false,
			stub: true,
			stubOptions: {
				autoShow: false,
				title: Loc.getMessage('UI_SELECTOR_SEARCH_STUB_TITLE'),
				subtitle: Loc.getMessage('UI_SELECTOR_SEARCH_STUB_SUBTITLE_MSGVER_1'),
			},
		};

		const options: TabOptions = { ...defaults, ...tabOptions };
		options.id = 'search';
		options.stubOptions!.autoShow = false;

		super(dialog, options);

		// eslint-disable-next-line no-param-reassign
		searchOptions = Type.isPlainObject(searchOptions) ? searchOptions : {};
		this.setAllowCreateItem(searchOptions.allowCreateItem, searchOptions.footerOptions);

		this.loadWithDebounce = Runtime.debounce(() => {
			this.load(this.getLastSearchQuery()!);
		}, 500) as () => void;

		// Drop any pending results announcement once the dialog is hidden or
		// destroyed — the count would be stale and the region gone.
		dialog.subscribe('onHide', () => this.getResultsAnnouncer().cancel());
		dialog.subscribe('onDestroy', () => this.getResultsAnnouncer().cancel());
	}

	search(query: string)
	{
		const searchQuery = new SearchQuery(query);
		const dynamicEntities = this.getDynamicEntities(searchQuery);
		searchQuery.setDynamicSearchEntities(dynamicEntities);

		if (searchQuery.isEmpty())
		{
			this.getSearchLoader().hide();

			return;
		}

		this.lastSearchQuery = searchQuery;

		const matchResults = SearchEngine.matchItems(this.getDialog().getItems(), searchQuery);
		this.clearResults();
		this.appendResults(matchResults);

		if (this.getDialog().shouldFocusOnFirst())
		{
			this.getDialog().focusOnFirstNode();
		}

		if (this.shouldLoad(searchQuery))
		{
			this.loadWithDebounce();
			if (!this.isEmptyResult())
			{
				this.getStub()!.hide();
			}
		}
		else if (!this.getSearchLoader().isShown())
		{
			this.toggleEmptyResult();
			this.#announceResultsCount();
		}
	}

	#announceResultsCount(): void
	{
		const count = this.getRootNode().getChildren().count();
		const message = Loc.getMessage('UI_SELECTOR_SEARCH_RESULTS_COUNT', { '#COUNT#': String(count) });
		if (Type.isStringFilled(message))
		{
			this.getResultsAnnouncer().announce(message);
		}
	}

	getResultsAnnouncer(): SearchResultsAnnouncer
	{
		return this.resultsAnnouncer;
	}

	getLastSearchQuery(): SearchQuery | null
	{
		return this.lastSearchQuery;
	}

	setAllowCreateItem(flag: boolean | null | undefined, options?: FooterOptions): void
	{
		if (Type.isBoolean(flag))
		{
			this.allowCreateItem = flag;

			if (flag)
			{
				this.setFooter(SearchTabFooter, options);
			}
			else
			{
				this.setFooter(null);
			}
		}
	}

	canCreateItem(): boolean
	{
		return this.allowCreateItem;
	}

	appendResults(matchResults: MatchResult[]): void
	{
		matchResults.sort((a: MatchResult, b: MatchResult) => {
			const matchSortA = a.getSort();
			const matchSortB = b.getSort();

			if (matchSortA !== null && matchSortB !== null && matchSortA !== matchSortB)
			{
				return matchSortA - matchSortB;
			}

			if (matchSortA !== null && matchSortB === null)
			{
				return -1;
			}

			if (matchSortA === null && matchSortB !== null)
			{
				return 1;
			}

			const contextSortA = a.getItem().getContextSort();
			const contextSortB = b.getItem().getContextSort();

			if (contextSortA !== null && contextSortB === null)
			{
				return -1;
			}

			if (contextSortA === null && contextSortB !== null)
			{
				return 1;
			}

			if (contextSortA !== null && contextSortB !== null)
			{
				return contextSortB - contextSortA;
			}

			const globalSortA = a.getItem().getGlobalSort();
			const globalSortB = b.getItem().getGlobalSort();

			if (globalSortA !== null && globalSortB === null)
			{
				return -1;
			}

			if (globalSortA === null && globalSortB !== null)
			{
				return 1;
			}

			if (globalSortA !== null && globalSortB !== null)
			{
				return globalSortB - globalSortA;
			}

			return 0;
		});

		this.getRootNode().disableRender();

		matchResults.forEach((matchResult: MatchResult) => {
			const item = matchResult.getItem();
			if (!this.getRootNode().hasItem(item!))
			{
				const node = this.getRootNode().addItem(item!);
				node.setHighlights([...matchResult.getMatchFields().values()]);
			}
		});

		this.getRootNode().enableRender();
		this.getRootNode().render(true);
	}

	getDynamicEntities(searchQuery: SearchQuery): string[]
	{
		const result: string[] = [];

		this.getDialog()
			.getEntities()
			.forEach((entity: Entity) => {
				if (entity.isSearchable())
				{
					const hasCacheLimit = entity.getSearchCacheLimits().some((pattern: RegExp) => {
						return pattern.test(searchQuery.getQuery());
					});

					if (hasCacheLimit)
					{
						result.push(entity.getId());
					}
				}
			});

		return result;
	}

	isQueryCacheable(searchQuery: SearchQuery): boolean
	{
		return searchQuery.isCacheable() && !searchQuery.hasDynamicSearch();
	}

	isQueryLoaded(searchQuery: SearchQuery): boolean
	{
		let found = false;
		this.queryCache.forEach((query) => {
			if (!found && searchQuery.getQuery().startsWith(query))
			{
				found = true;
			}
		});

		return found;
	}

	addCacheQuery(searchQuery: SearchQuery): void
	{
		if (this.isQueryCacheable(searchQuery))
		{
			this.queryCache.add(searchQuery.getQuery());
		}
	}

	removeCacheQuery(searchQuery: SearchQuery): void
	{
		this.queryCache.delete(searchQuery.getQuery());
	}

	shouldLoad(searchQuery: SearchQuery): boolean
	{
		if (!this.isQueryCacheable(searchQuery))
		{
			return true;
		}

		if (!this.getDialog().hasDynamicSearch())
		{
			return false;
		}

		return !this.isQueryLoaded(searchQuery);
	}

	load(searchQuery: SearchQuery): void
	{
		if (!this.shouldLoad(searchQuery))
		{
			return;
		}

		// if (this.queryXhr)
		// {
		// 	this.queryXhr.abort();
		// }

		this.addCacheQuery(searchQuery);

		this.getStub()?.hide();
		this.getSearchLoader().show();

		Ajax.runAction('ui.entityselector.doSearch', {
			json: {
				dialog: this.getDialog().getAjaxJson(),
				searchQuery: searchQuery.getAjaxJson(),
			},
			onrequeststart: (xhr: XMLHttpRequest) => {
				this.queryXhr = xhr;
			},
			getParameters: {
				context: this.getDialog().getContext(),
			},
		})
			.then((response: { data?: SearchResponse }) => {
				this.getSearchLoader().hide();

				if (!response || !response.data || !response.data.dialog || !response.data.dialog.items)
				{
					this.removeCacheQuery(searchQuery);
					this.toggleEmptyResult();
					this.#announceResultsCount();
					this.getDialog().emit('SearchTab:onLoad', { searchTab: this });

					return;
				}

				if (response.data.searchQuery && response.data.searchQuery.cacheable === false)
				{
					this.removeCacheQuery(searchQuery);
					if (this.getLastSearchQuery()?.getQuery() !== searchQuery.getQuery())
					{
						this.loadWithDebounce();
					}
				}

				if (Type.isArrayFilled(response.data.dialog.items))
				{
					const items = new Set<Item>();
					response.data.dialog.items.forEach((itemOptions: ItemOptions) => {
						delete itemOptions.tabs;
						delete itemOptions.children;

						const item = this.getDialog().addItem(itemOptions);
						items.add(item);
					});

					const isTabEmpty = this.isEmptyResult();

					const matchResults = SearchEngine.matchItems([...items.values()], this.getLastSearchQuery()!, {
						matchAll: true,
					});
					this.appendResults(matchResults);

					if (isTabEmpty && this.getDialog().shouldFocusOnFirst())
					{
						this.getDialog().focusOnFirstNode();
					}
				}

				if (Type.isArrayFilled(response.data.dialog.errors))
				{
					this.getDialog().emitEntityErrors(response.data.dialog.errors);
				}

				this.toggleEmptyResult();
				this.#announceResultsCount();

				this.getDialog().emit('SearchTab:onLoad', { searchTab: this });
			})
			.catch((error: unknown) => {
				this.removeCacheQuery(searchQuery);
				this.getSearchLoader().hide();
				this.toggleEmptyResult();
				this.#announceResultsCount();

				console.error(error);
			});
	}

	getSearchLoader(): SearchLoader
	{
		return this.searchLoader;
	}

	clearResults(): void
	{
		this.getRootNode().removeChildren();
	}

	isEmptyResult(): boolean
	{
		return !this.getRootNode().hasChildren();
	}

	toggleEmptyResult(): void
	{
		if (this.isEmptyResult())
		{
			this.getStub()?.show();
		}
		else
		{
			this.getStub()?.hide();
		}
	}
}
