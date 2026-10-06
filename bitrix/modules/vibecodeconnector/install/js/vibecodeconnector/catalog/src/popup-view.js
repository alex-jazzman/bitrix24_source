import { Tag } from 'main.core';

import { type TabConfig } from './catalog';
import { type TabController } from './tab-controller';
import { renderPopupFab } from './components/popup-fab';
import { CatalogPopupList } from './components/popup-list';
import { CatalogPopupSearch } from './components/popup-search';
import { type CatalogStateValue } from './components/popup-state-dropdown';
import { CatalogPopupTabsNav } from './components/popup-tabs-nav';
import { renderPopupTitleLink } from './components/popup-title-link';

type CatalogPopupViewOptions = {
	tabs: Array<TabConfig>,
	newAppsCount?: number,
	initialState?: CatalogStateValue,
	onTabSelect: (string) => void,
	onStateSelect?: (CatalogStateValue) => void,
	onReloadRequested?: () => void,
	onSearchInput: () => void,
	onSearchClear: () => void,
	onScroll: () => void,
	onChatOpen?: () => void,
	useSearch?: boolean,
	initialSkeletonTiles: number,
	paginationSkeletonTiles: number,
};

type CatalogPopupListOptions = {
	activeTabId: string,
	controllers: Map<string, TabController>,
};

export class CatalogPopupView
{
	#rootNode: HTMLElement | null = null;
	#tabsNav: CatalogPopupTabsNav;
	#search: CatalogPopupSearch;
	#list: CatalogPopupList;

	constructor(options: CatalogPopupViewOptions)
	{
		this.#tabsNav = new CatalogPopupTabsNav({
			tabs: options.tabs,
			newAppsCount: options.newAppsCount,
			initialState: options.initialState,
			onTabSelect: options.onTabSelect,
			onStateSelect: options.onStateSelect,
		});
		this.#search = new CatalogPopupSearch({
			onInput: options.onSearchInput,
			onClear: options.onSearchClear,
			useSearch: options.useSearch,
		});
		this.#list = new CatalogPopupList({
			onScroll: options.onScroll,
			onChatOpen: options.onChatOpen,
			onReloadRequested: options.onReloadRequested,
			initialSkeletonTiles: options.initialSkeletonTiles,
			paginationSkeletonTiles: options.paginationSkeletonTiles,
		});
	}

	render(): HTMLElement
	{
		if (this.#rootNode)
		{
			return this.#rootNode;
		}

		this.#rootNode = Tag.render`
			<div class="vibecode-catalog">
				<header class="vibecode-catalog__header">
					${renderPopupTitleLink()}
					<div class="vibecode-catalog__search">
						${this.#search.render()}
					</div>
					${this.#tabsNav.render()}
				</header>
				<div class="vibecode-catalog__content">
					${this.#list.render()}
					${renderPopupFab()}
				</div>
			</div>
		`;

		return this.#rootNode;
	}

	destroy(): void
	{
		this.#tabsNav.destroy();
		this.#search.destroy();
		this.#list.destroy();
		this.#rootNode = null;
	}

	focusSearch(): void
	{
		this.#search.focus();
	}

	getSearchQuery(): string
	{
		return this.#search.getQuery();
	}

	setActiveTab(tabId: string | null): void
	{
		this.#tabsNav.setActiveTab(tabId);
	}

	setNewAppsCount(value: number): void
	{
		this.#tabsNav.setNewAppsCount(value);
	}

	setState(state: CatalogStateValue): void
	{
		this.#tabsNav.setState(state);
	}

	isStateMenuOpen(): boolean
	{
		return this.#tabsNav.isStateMenuOpen();
	}

	closeStateMenu(): void
	{
		this.#tabsNav.closeStateMenu();
	}

	focusStateChip(): void
	{
		this.#tabsNav.focusStateChip();
	}

	isFocusInsideList(): boolean
	{
		return this.#list.containsFocus();
	}

	renderList(options: CatalogPopupListOptions): void
	{
		this.#list.renderItems(options);
	}

	isScrollThresholdReached(thresholdPx: number): boolean
	{
		return this.#list.isScrollThresholdReached(thresholdPx);
	}

	updateSubtitleClamps(): void
	{
		this.#list.updateSubtitleClamps();
	}
}
