import { Dom, Tag, Type } from 'main.core';
import { Dialog } from 'ui.system.dialog';
import 'main.sidepanel';

import { CatalogEmptyState } from './empty-state';
import { CatalogNoAccessState } from './no-access-state';
import { CatalogPopupPositioner } from './popup-positioner';
import { CatalogPopupSliderGuard } from './popup-slider-guard';
import { CatalogPopupView } from './popup-view';
import { CatalogSkeleton } from './skeleton';
import { TabController } from './tab-controller';
import { CatalogState, type CatalogStateValue } from './components/popup-state-dropdown';
import { sendCatalogAnalytics } from './utils/analytics';
import { MY_TAB_ID } from './constants';
import { type TabConfig } from './catalog';

const SEARCH_DEBOUNCE_MS = 300;
const SKELETON_TILES = 5;
const EMPTY_TILES_ON_PAGINATION = 3;
const SCROLL_THRESHOLD_PX = 60;
const DISABLE_SCROLLING_CLASS = 'ui-system-dialog__disable-scrolling';

export type CatalogStateModeValue = 'normal' | 'empty' | 'no-access';

export const CatalogStateMode = Object.freeze({
	Normal: 'normal',
	Empty: 'empty',
	NoAccess: 'no-access',
});

// analytics reports the modes in its own spelling
const STATE_MODE_ANALYTICS = Object.freeze({
	[CatalogStateMode.Normal]: 'normal',
	[CatalogStateMode.Empty]: 'empty',
	[CatalogStateMode.NoAccess]: 'no_access',
});

function resolveStateMode(options: {
	stateMode?: CatalogStateModeValue,
	forceEmpty?: boolean,
}): CatalogStateModeValue
{
	if (Object.values(CatalogStateMode).includes(options.stateMode))
	{
		return options.stateMode;
	}

	return options.forceEmpty === true ? CatalogStateMode.Empty : CatalogStateMode.Normal;
}

export class CatalogPopup
{
	#tabs: Array<TabConfig>;
	#pageSize: number;
	#stateMode: CatalogStateModeValue;
	#newAppsCount: number;
	#controllers: Map<string, TabController> = new Map();
	#emptyState: CatalogEmptyState;
	#noAccessState: CatalogNoAccessState;
	#skeleton: CatalogSkeleton;
	#positioner: CatalogPopupPositioner;
	#sliderGuard: CatalogPopupSliderGuard;
	#activeTabId: string | null = null;
	#onCloseHandlers: Array<() => void> = [];
	#stateSelectedByUser: boolean = false;
	#responseStateApplied: boolean = false;

	#dialog: Dialog | null = null;
	#isShown: boolean = false;
	#bindNode: HTMLElement | null = null;
	#rootNode: HTMLElement | null = null;
	#view: CatalogPopupView | null = null;
	#searchTimer: number | null = null;
	#onNewAppsCount: ((value: number) => void) | null = null;
	#ownsScrollLock: boolean = false;

	constructor(options: {
		tabs: Array<TabConfig>,
		pageSize: number,
		stateMode?: CatalogStateModeValue,
		// legacy alias of stateMode: 'empty'
		forceEmpty?: boolean,
		newAppsCount?: number,
		onNewAppsCount?: (value: number) => void,
	})
	{
		this.#tabs = options.tabs;
		this.#pageSize = options.pageSize;
		this.#stateMode = resolveStateMode(options);
		this.#onNewAppsCount = options.onNewAppsCount ?? null;
		this.#newAppsCount = Type.isNumber(options.newAppsCount) && options.newAppsCount > 0
			? Math.trunc(options.newAppsCount)
			: 0;

		for (const tab of this.#tabs)
		{
			this.#controllers.set(tab.id, new TabController(tab, this.#pageSize));
		}

		this.#skeleton = new CatalogSkeleton();
		this.#emptyState = new CatalogEmptyState();
		this.#noAccessState = new CatalogNoAccessState();
		this.#positioner = new CatalogPopupPositioner({
			getRootNode: () => this.#rootNode,
			getBindNode: () => this.#bindNode,
			onReposition: () => this.#view?.updateSubtitleClamps(),
		});
		this.#sliderGuard = new CatalogPopupSliderGuard({
			getRootNode: () => this.#rootNode,
		});
	}

	subscribeOnClose(handler: () => void): void
	{
		this.#onCloseHandlers.push(handler);
	}

	isShown(): boolean
	{
		return this.#isShown;
	}

	setNewAppsCount(value: number): void
	{
		// opening an app spends the counter at once, and the owner of the badge recounts it
		// right after; the New slice the user is in the middle of must not go with it
		if (this.#isShown && this.#newAppsCount > 0 && !(Type.isNumber(value) && value > 0))
		{
			return;
		}

		this.#applyNewAppsCount(value);
	}

	adoptLoadingPopup(loadingPopup: any): boolean
	{
		const popup = loadingPopup?.takeOver(() => this.#fireCloseHandlers());
		if (popup === null || popup === undefined)
		{
			return false;
		}

		this.#dialog = popup.dialog;
		this.#rootNode = popup.rootNode;
		this.#bindNode = popup.bindNode;
		this.#isShown = true;
		this.#positioner.bind();
		this.#sliderGuard.bind();
		sendCatalogAnalytics({
			event: 'open_popup',
			p1: STATE_MODE_ANALYTICS[this.#stateMode],
		});

		if (this.#hasStateCard())
		{
			Dom.removeClass(this.#rootNode, 'vibecode-catalog-loading__dialog-root');
			this.#setRootContent(this.#renderStateCard());
			this.#enableScrollLock();
		}
		else
		{
			Dom.removeClass(this.#rootNode, 'vibecode-catalog-loading__dialog-root');
			Dom.addClass(this.#rootNode, 'vibecode-catalog__dialog-root');
			this.#initializePopup();
		}

		this.#syncLayout();
		this.#view?.focusSearch();

		return true;
	}

	#applyNewAppsCount(value: number): void
	{
		this.#newAppsCount = Type.isNumber(value) && value > 0 ? Math.trunc(value) : 0;
		this.#view?.setNewAppsCount(this.#newAppsCount);
	}

	show(bindNode: HTMLElement | null): void
	{
		if (bindNode)
		{
			this.#bindNode = bindNode;
		}

		if (this.#dialog === null)
		{
			const hasStateCard = this.#hasStateCard();
			this.#rootNode = hasStateCard
				? Tag.render`<div></div>`
				: Tag.render`<div class="vibecode-catalog__dialog-root"></div>`;
			this.#resetViewState();
			this.#setRootContent(
				hasStateCard
					? this.#renderStateCard()
					: this.#skeleton.renderPopup(SKELETON_TILES),
			);
			this.#dialog = new Dialog({
				hasHorizontalPadding: false,
				hasVerticalPadding: false,
				content: this.#rootNode,
				hasCloseButton: true,
				hasOverlay: true,
				disableScrolling: hasStateCard,
				closeByEsc: true,
				closeByClickOutside: true,
				events: {
					onShow: () => {
						this.#isShown = true;
						this.#positioner.bind();
						this.#sliderGuard.bind();
						this.#syncLayout();
						sendCatalogAnalytics({
							event: 'open_popup',
							p1: STATE_MODE_ANALYTICS[this.#stateMode],
						});
					},
					onAfterShow: () => {
						this.#syncLayout();
						this.#view?.focusSearch();
					},
					onHide: () => this.#fireCloseHandlers(),
				},
			});
			if (!hasStateCard)
			{
				this.#initializePopup();
			}
		}
		else if (this.#isShown)
		{
			this.#syncLayout();
			this.#view?.focusSearch();

			return;
		}

		this.#dialog.show();
	}

	// a state card is the whole content of the popup: no tabs, no list, no requests
	#hasStateCard(): boolean
	{
		return this.#stateMode !== CatalogStateMode.Normal;
	}

	#renderStateCard(): HTMLElement
	{
		return this.#stateMode === CatalogStateMode.NoAccess
			? this.#noAccessState.render()
			: this.#emptyState.render();
	}

	#initializePopup(): void
	{
		if (!this.#rootNode || this.#dialog === null)
		{
			return;
		}

		this.#stateSelectedByUser = false;
		this.#responseStateApplied = false;

		const initialState = this.#resolveInitialState();
		this.#applyStateToController(initialState);

		this.#resetViewState();
		this.#view = new CatalogPopupView({
			tabs: this.#tabs,
			newAppsCount: this.#newAppsCount,
			initialState,
			onTabSelect: (tabId: string) => this.#switchTo(tabId),
			onStateSelect: (state: string) => {
				this.#stateSelectedByUser = true;
				this.#selectState(state);
			},
			onReloadRequested: () => this.#reloadActiveState(),
			onSearchInput: () => this.#scheduleSearch(),
			onSearchClear: () => {
				this.#clearSearchTimer();
				this.#applySearch();
			},
			onScroll: () => this.#onMaybeLoadMore(),
			onChatOpen: () => this.close(),
			useSearch: true,
			initialSkeletonTiles: SKELETON_TILES,
			paginationSkeletonTiles: EMPTY_TILES_ON_PAGINATION,
		});
		this.#setRootContent(this.#view.render());
		this.#setInitialTab();

		this.#syncLayout();
		this.#view?.focusSearch();
	}

	close(): void
	{
		this.#dialog?.hide();
	}

	#fireCloseHandlers(): void
	{
		this.#releaseScrollLock();
		this.#positioner.reset();
		this.#sliderGuard.reset();

		if (this.#searchTimer)
		{
			clearTimeout(this.#searchTimer);
			this.#searchTimer = null;
		}

		for (const ctrl of this.#controllers.values())
		{
			ctrl.endViewSession();
		}

		this.#isShown = false;
		this.#activeTabId = null;
		this.#view?.destroy();
		this.#dialog = null;
		this.#bindNode = null;
		this.#rootNode = null;
		this.#view = null;

		for (const handler of this.#onCloseHandlers)
		{
			handler();
		}
	}

	#enableScrollLock(): void
	{
		if (this.#ownsScrollLock)
		{
			return;
		}

		Dom.addClass(document.body, DISABLE_SCROLLING_CLASS);
		this.#ownsScrollLock = true;
	}

	#releaseScrollLock(): void
	{
		if (!this.#ownsScrollLock)
		{
			return;
		}

		Dom.removeClass(document.body, DISABLE_SCROLLING_CLASS);
		this.#ownsScrollLock = false;
	}

	#setRootContent(content: HTMLElement): void
	{
		if (!this.#rootNode)
		{
			return;
		}

		Dom.clean(this.#rootNode);
		Dom.append(content, this.#rootNode);
	}

	#resetViewState(): void
	{
		this.#view?.destroy();
		this.#view = null;
	}

	#resolveInitialState(): CatalogStateValue
	{
		return this.#newAppsCount > 0 ? CatalogState.New : CatalogState.Active;
	}

	#setInitialTab(): void
	{
		const firstTab = this.#tabs[0];

		if (!firstTab)
		{
			return;
		}

		this.#activeTabId = firstTab.id;
		this.#view?.setActiveTab(firstTab.id);
		void this.#loadInitial(firstTab.id);
	}

	// the slice to open on is guessed from a counter that may be stale, so the first response
	// is rendered only once it is clear the guess holds: otherwise the listing of the wrong
	// slice would flash before the switch
	async #loadInitial(tabId: string): Promise<void>
	{
		const ctrl = this.#controllers.get(tabId);

		if (ctrl?.shouldLoadMore())
		{
			const loadPromise = ctrl.loadNext();
			// the skeleton belongs to the loading state, not to a slice: it holds the frame
			// while the slice is still in question
			this.#renderList();

			try
			{
				await loadPromise;
			}
			catch (error)
			{
				console.error('[vibecodeconnector.catalog] failed to load tab', tabId, error);
			}
		}
		else
		{
			this.#renderList();
		}

		if (this.#activeTabId !== tabId)
		{
			return;
		}

		if (!this.#applyStateFromResponse())
		{
			this.#renderList();
		}
	}

	#applyStateFromResponse(): boolean
	{
		if (this.#responseStateApplied || this.#stateSelectedByUser || this.#activeTabId !== MY_TAB_ID)
		{
			return false;
		}

		const ctrl = this.#controllers.get(MY_TAB_ID);
		const newAppsCount = ctrl?.getNewAppsCount() ?? null;

		if (!ctrl || newAppsCount === null || ctrl.hasQuery())
		{
			return false;
		}

		this.#responseStateApplied = true;
		// the server is the one source allowed to lower the count: it answers for the very
		// session being opened
		this.#applyNewAppsCount(newAppsCount);
		// the value came from the server, so the owner of the badge learns it too instead of
		// waiting for its own recount to land
		this.#onNewAppsCount?.(this.#newAppsCount);

		const state = ctrl.getState();

		if (state === CatalogState.Active && newAppsCount > 0)
		{
			// the response that served the Active slice already carries the new apps and had
			// them marked as viewed, so when all of them are in hand the switch costs nothing.
			// The count and the listing are two separate reads: only a listing with nothing
			// left beyond it proves there is no new app hiding past the page.
			if (!ctrl.hasMorePages() && ctrl.countNewItems() >= newAppsCount)
			{
				this.#view?.setState(CatalogState.New);
				ctrl.switchToLoadedNewSlice();
				this.#renderList();

				return true;
			}

			return this.#applyState(CatalogState.New);
		}

		// An empty slice is enough on its own: the counter and the listing are two different
		// reads, and waiting for both to agree would leave the catalog sitting on a slice
		// that has nothing to show.
		if (state === CatalogState.New && ctrl.getItems().length === 0)
		{
			return this.#applyState(CatalogState.Active);
		}

		return false;
	}

	#applyState(state: CatalogStateValue): boolean
	{
		// the list is re-rendered from scratch below, so a focused item would be dropped; the
		// slice menu closed right after takes the focus with it just the same
		const shouldMoveFocus = this.#view?.isFocusInsideList() === true
			|| this.#view?.isStateMenuOpen() === true;

		this.#view?.closeStateMenu();
		this.#view?.setState(state);
		const switched = this.#selectState(state);

		if (shouldMoveFocus)
		{
			this.#view?.focusStateChip();
		}

		return switched;
	}

	#applyStateToController(state: CatalogStateValue): boolean
	{
		const ctrl = this.#controllers.get(MY_TAB_ID);

		if (!ctrl || ctrl.getState() === state)
		{
			return false;
		}

		ctrl.setState(state);
		ctrl.reset();

		return true;
	}

	#switchTo(tabId: string): void
	{
		sendCatalogAnalytics({ event: 'click_tab', p1: tabId });

		const tab = this.#tabs.find((t) => t.id === tabId);
		if (Type.isStringFilled(tab?.navigateUrl))
		{
			BX.SidePanel.Instance.open(tab.navigateUrl);

			return;
		}

		this.#activeTabId = tabId;
		this.#view?.setActiveTab(tabId);

		// no #renderList() here: the load below paints the frame synchronously, either the
		// listing in hand or the skeleton over the request it has just started
		void this.#loadIfNeeded(tabId);
	}

	#selectState(state: string): boolean
	{
		if (!this.#applyStateToController(state))
		{
			return false;
		}

		this.#activeTabId = MY_TAB_ID;
		this.#view?.setActiveTab(MY_TAB_ID);
		// no #renderList() here: the slice was just reset, so the frame would hold neither a
		// listing nor a skeleton - the load below paints both
		void this.#loadIfNeeded(MY_TAB_ID);

		return true;
	}

	#reloadActiveState(): void
	{
		if (this.#activeTabId === null)
		{
			return;
		}

		const ctrl = this.#controllers.get(this.#activeTabId);
		// a failed listing is worth retrying in any slice, the All one included
		if (!ctrl || (ctrl.getState() === CatalogState.All && !ctrl.hasFailed()))
		{
			return;
		}

		const reloadPromise = ctrl.refresh();
		// the wait is shown right away: the skeleton replaces whatever the retry was started from
		this.#renderList();

		void reloadPromise.then(() => {
			// the slice was guessed from a counter that may be stale, and a first load that
			// failed left the guess unchecked: the retry answer is the first word the server
			// says, so it decides the slice instead of leaving an empty New under the user
			if (ctrl.hasFailed() || !this.#applyStateFromResponse())
			{
				this.#renderList();
			}
		});
	}

	async #loadIfNeeded(tabId: string): Promise<void>
	{
		const ctrl = this.#controllers.get(tabId);

		if (!ctrl || !ctrl.shouldLoadMore())
		{
			// nothing to wait for, so what is in hand is what the screen gets
			this.#renderList();

			return;
		}

		const loadPromise = ctrl.loadNext();
		this.#renderList();

		try
		{
			await loadPromise;
		}
		catch (error)
		{
			console.error('[vibecodeconnector.catalog] failed to load tab', tabId, error);
		}

		if (this.#activeTabId !== null)
		{
			this.#renderList();
		}
	}

	#renderList(): void
	{
		if (!this.#view || !this.#activeTabId)
		{
			return;
		}

		this.#view.renderList({
			activeTabId: this.#activeTabId,
			controllers: this.#controllers,
		});
		this.#syncLayout();
	}

	#onMaybeLoadMore(): void
	{
		if (!this.#view || !this.#activeTabId)
		{
			return;
		}

		const ctrl = this.#controllers.get(this.#activeTabId);

		if (!ctrl || !ctrl.shouldLoadMore())
		{
			return;
		}

		if (this.#view.isScrollThresholdReached(SCROLL_THRESHOLD_PX))
		{
			void this.#loadIfNeeded(this.#activeTabId);
		}
	}

	#applySearch(): void
	{
		const query = this.#view?.getSearchQuery() ?? '';

		for (const ctrl of this.#controllers.values())
		{
			ctrl.setQuery(query);
		}

		if (this.#activeTabId)
		{
			void this.#loadIfNeeded(this.#activeTabId);
		}
	}

	#scheduleSearch(): void
	{
		this.#clearSearchTimer();
		this.#searchTimer = setTimeout(() => {
			this.#searchTimer = null;
			this.#applySearch();
		}, SEARCH_DEBOUNCE_MS);
	}

	#clearSearchTimer(): void
	{
		if (this.#searchTimer)
		{
			clearTimeout(this.#searchTimer);
			this.#searchTimer = null;
		}
	}

	#syncLayout(): void
	{
		this.#view?.updateSubtitleClamps();
		this.#positioner.position();
	}
}
