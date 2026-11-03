import { Type, type JsonObject } from 'main.core';
import { type BaseEvent, type EventEmitter } from 'main.core.events';
import 'ui.design-tokens';
import 'ui.fonts.opensans';

import { Loader } from 'im.v2.component.elements.loader';
import { ScrollWithGradient } from 'im.v2.component.elements.scroll-with-gradient';
import { EventType, type LayoutType } from 'im.v2.const';
import {
	armKeyboardFocusHandoff,
	clearKeyboardFocusHandoff,
	getKeyboardFocusHandoff,
	isKeyboardFocusHandoffOfAreaHeldByNestedList,
} from 'im.v2.lib.a11y';
import { Analytics } from 'im.v2.lib.analytics';
import { type SearchResultItem } from 'im.v2.lib.search';
import { Utils } from 'im.v2.lib.utils';
import { type ImModelLayout } from 'im.v2.model';

import {
	buildOrder,
	NavigationSection,
	SearchNavigationController,
	type NavigationDescriptor,
} from '../../classes/search-navigation';
import { getCarouselItems } from '../../helpers/get-carousel-items';
import { getFirstItemFromSearchResults } from '../../helpers/get-first-search-item';
import { isOwnSearchArea } from '../../helpers/is-own-search-area';
import {
	getSearchGroupId,
	getSearchGroupTitleId,
	getSearchListboxId,
	getSearchOptionId,
} from '../../helpers/search-navigation-aria';
import { scrollToActiveItem } from '../../helpers/scroll-to-active-item';
import { SearchEmptyState } from '../elements/empty-state/search';
import { RecentEmptyState } from '../elements/empty-state/recent';
import { RecentUsersCarousel } from '../elements/recent-users-carousel';
import { SearchItem } from '../elements/search-item';

import '../css/chat-search.css';

type CursorMove = (cursor: SearchNavigationController) => void;

// Key code -> cursor intent: the controller knows nothing about keys, and this is the whole mapping.
// Split by what the move is counted from: a relative one steps away from the item the cursor stands on,
// an absolute one lands on the same item wherever it stood. Only the first kind needs the user to have
// been shown that item -- see isCursorShownByKey.
const RelativeCursorMoveByKey: { [string]: CursorMove } = Object.freeze({
	ArrowDown: (cursor: SearchNavigationController) => cursor.moveDown(),
	ArrowUp: (cursor: SearchNavigationController) => cursor.moveUp(),
});

const AbsoluteCursorMoveByKey: { [string]: CursorMove } = Object.freeze({
	Home: (cursor: SearchNavigationController) => cursor.moveToStart(),
	End: (cursor: SearchNavigationController) => cursor.moveToEnd(),
});

const CursorMoveByKey: { [string]: CursorMove } = Object.freeze({
	...RelativeCursorMoveByKey,
	...AbsoluteCursorMoveByKey,
});

// Horizontal moves belong to the carousel row alone: in the lists the arrows keep moving the caret
// through the query text. Relative as well: the step is counted from the tile the cursor stands on.
const CarouselCursorMoveByKey: { [string]: CursorMove } = Object.freeze({
	ArrowLeft: (cursor: SearchNavigationController) => cursor.moveLeft(),
	ArrowRight: (cursor: SearchNavigationController) => cursor.moveRight(),
});

// @vue/component
export const RecentSearchView = {
	name: 'ChatSearch',
	components: { ScrollWithGradient, SearchItem, SearchEmptyState, RecentEmptyState, RecentUsersCarousel, Loader },
	props: {
		searchResult: {
			type: Array,
			default: () => [],
		},
		recentItems: {
			type: Array,
			default: () => [],
		},
		isRecentLoading: {
			type: Boolean,
			default: false,
		},
		query: {
			type: String,
			default: '',
		},
		searchMode: {
			type: Boolean,
			required: true,
		},
		showUsersCarousel: {
			type: Boolean,
			default: true,
		},
		withKeyboardNavigation: {
			type: Boolean,
			default: false,
		},
		// Identifies the search area these results belong to. A keystroke is only taken from the input of
		// the same area: several search results can be mounted at once (the collab drawer over the root
		// list, a cached container under KeepAlive), and one keystroke must move exactly one cursor.
		searchAreaId: {
			type: String,
			default: null,
		},
		parentChatId: {
			type: Number,
			default: 0,
		},
	},
	emits: ['openItem', 'closeSearch', 'clickItem', 'openContextMenu', 'closeContextMenu'],
	data(): JsonObject
	{
		return {
			// Mirror of the cursor position: the controller itself must stay out of the reactive state, so
			// the template reads the active traversal index from here.
			activeNavIndex: null,
			// Kept apart from the position on purpose: the cursor stands on an item from the very first
			// moment, but its mark is only shown once the user is known to be on the keyboard -- the same
			// rule the browsers apply to :focus-visible.
			isCursorVisible: false,
		};
	},
	computed: {
		layout(): ImModelLayout
		{
			return this.$store.getters['application/getLayout'];
		},
		layoutName(): LayoutType
		{
			return this.layout.name;
		},
		chatEntityId(): string
		{
			return this.layout.entityId;
		},
		cleanQuery(): string
		{
			return this.query.trim().toLowerCase();
		},
		showLatestSearchResult(): boolean
		{
			return this.cleanQuery.length === 0;
		},
		carouselItems(): string[]
		{
			return getCarouselItems();
		},
		isCarouselVisible(): boolean
		{
			return this.showLatestSearchResult && this.showUsersCarousel;
		},
		isEmptyState(): boolean
		{
			return this.searchResult.length === 0;
		},
		isEmptyRecentState(): boolean
		{
			return this.recentItems.length === 0;
		},
		hasRecentSearchSection(): boolean
		{
			return this.recentItems.length > 0 || this.isRecentLoading;
		},
		navigationOrder(): NavigationDescriptor[]
		{
			// A watcher is subscribed to this computed, so it is rebuilt on every change of its dependencies
			// instead of lazily on read: while nothing walks the results it must not reach the store at all.
			// Entering the search resets the cursor, so the order of a closed one is never read.
			if (!this.withKeyboardNavigation || !this.searchMode)
			{
				return [];
			}

			return buildOrder({
				showLatestSearchResult: this.showLatestSearchResult,
				// The composition the tiles are rendered from, and the only thing the order is told about the
				// carousel: a hidden carousel is an empty composition, so the order cannot disagree with the
				// markup. Reading it only where the tiles are rendered also keeps a query branch from paying
				// for a carousel nobody sees.
				carouselItems: this.isCarouselVisible ? this.carouselItems : [],
				recentItems: this.recentItems,
				searchResult: this.searchResult,
			});
		},
		carouselNavIndexBase(): ?number
		{
			// The carousel heads the traversal order, so its first tile is the very first index.
			return this.withKeyboardNavigation ? 0 : null;
		},
		listNavIndexBase(): number
		{
			return this.isCarouselVisible ? this.carouselItems.length : 0;
		},
		// The head of a section is the node the section starts with: scrolling to it is what brings the
		// section title back into view together with the item under the cursor. Marked with the indexes of
		// the items standing in the first row of the section, because only for those does the title sit
		// right above the item. The carousel is a single row, so its title heads every tile at once, and
		// its own container is the node that starts with that title.
		carouselSectionHeadNavIndexes(): ?string
		{
			if (!this.withKeyboardNavigation)
			{
				return null;
			}

			return this.carouselItems
				.map((dialogId: string, tileIndex: number) => this.carouselNavIndexBase + tileIndex)
				.join(' ');
		},
		listSectionHeadNavIndex(): ?number
		{
			return this.withKeyboardNavigation ? this.listNavIndexBase : null;
		},
		highlightedNavIndex(): ?number
		{
			// The single lever of the keyboard mode: the traversal order, the cursor and the anchors do not
			// depend on it, only the mark that goes into the items of the results does.
			return this.isCursorVisible ? this.activeNavIndex : null;
		},
		withAriaNavigation(): boolean
		{
			return this.withKeyboardNavigation && Type.isStringFilled(this.searchAreaId);
		},
		listboxId(): ?string
		{
			return this.withAriaNavigation ? getSearchListboxId(this.searchAreaId) : null;
		},
		recentGroupId(): ?string
		{
			return this.withAriaNavigation ? getSearchGroupId(this.searchAreaId, 'recent') : null;
		},
		recentGroupTitleId(): ?string
		{
			return this.withAriaNavigation ? getSearchGroupTitleId(this.searchAreaId, 'recent') : null;
		},
		activeDescendantId(): ?string
		{
			if (
				!this.withAriaNavigation
				|| !this.searchMode
				|| !this.isCursorVisible
				|| this.activeNavIndex === null
			)
			{
				return null;
			}

			const activeDescriptor = this.navigationOrder[this.activeNavIndex];
			if (!activeDescriptor)
			{
				return null;
			}

			return getSearchOptionId(this.searchAreaId, this.activeNavIndex, activeDescriptor.dialogId);
		},
	},
	watch: {
		cleanQuery()
		{
			this.resetNavigationCursor();
		},
		searchMode(newValue: boolean)
		{
			// The cursor is not carried over a visit: a closed search has no order, and the next entry
			// starts it over regardless. The mark is dropped exactly here and nowhere else: the next
			// entry may well be a mouse one, and it must not find the mark left on from this visit.
			if (!newValue)
			{
				this.isCursorVisible = false;
				this.publishActiveDescendant(null);

				return;
			}

			this.resetNavigationCursor();
		},
		navigationOrder()
		{
			// Same query, new data (server results merged in, recent list or carousel reloaded): the cursor
			// holds on to its own item instead of jumping back to the top.
			this.updateNavigationOrder();
		},
		activeDescendantId(activeDescendantId: ?string)
		{
			this.publishActiveDescendant(activeDescendantId);
		},
		chatEntityId(newEntityId: string, oldEntityId: string)
		{
			this.settleFocusHandoff(newEntityId, oldEntityId);
		},
	},
	created()
	{
		// Not a data() field on purpose: Vue would wrap the instance in a Proxy and break its private fields.
		this.navigationCursor = null;
		this.lastPublishedActiveDescendantId = null;

		this.getEmitter().subscribe(EventType.search.keyPressed, this.onKeyPressed);

		if (!this.withKeyboardNavigation)
		{
			return;
		}

		this.navigationCursor = new SearchNavigationController();
		this.getEmitter().subscribe(EventType.search.keyDown, this.onSearchKeyDown);
		this.getEmitter().subscribe(EventType.search.inputBlur, this.onSearchInputBlur);
		this.resetNavigationCursor();
	},
	beforeUnmount()
	{
		this.getEmitter().unsubscribe(EventType.search.keyPressed, this.onKeyPressed);

		if (this.withKeyboardNavigation)
		{
			this.getEmitter().unsubscribe(EventType.search.keyDown, this.onSearchKeyDown);
			this.getEmitter().unsubscribe(EventType.search.inputBlur, this.onSearchInputBlur);
		}

		this.publishActiveDescendant(null);

		// Nobody is left to watch the layout for this area, so a handoff of ours would never be settled.
		clearKeyboardFocusHandoff(this.searchAreaId);
	},
	methods: {
		onOpenContextMenu(event)
		{
			const { dialogId, nativeEvent } = event;
			if (Utils.key.isAltOrOption(nativeEvent))
			{
				return;
			}

			this.$emit('openContextMenu', { dialogId, target: nativeEvent.currentTarget });
		},
		onScroll()
		{
			this.$emit('closeContextMenu');
		},
		// The three handlers of the sections report the pick of their own section and hand the item over to
		// the opening itself. They answer the mouse and the keyboard alike, so each passes the answer of
		// `onClickItem()` on: the keyboard path acts on it, and there is no second way to learn it.
		onClickRecentChatItem(event: { dialogId: string, nativeEvent: KeyboardEvent }): boolean
		{
			Analytics.getInstance().recentSearch.onSelectFromRecentChats(
				this.layoutName,
				event.dialogId,
				this.parentChatId,
			);

			return this.onClickItem(event);
		},
		onClickRecentSearchItem(event: { dialogId: string, nativeEvent: KeyboardEvent }): boolean
		{
			Analytics.getInstance().recentSearch.onSelectFromRecentSearch(
				this.layoutName,
				event.dialogId,
				this.parentChatId,
			);

			return this.onClickItem(event);
		},
		onClickSearchResultItem(event: { dialogId: string, nativeEvent: KeyboardEvent }, itemIndex: number): boolean
		{
			Analytics.getInstance().recentSearch.onSelectFromSearchResult(
				this.layoutName,
				itemIndex + 1,
				this.parentChatId,
			);

			return this.onClickItem(event);
		},
		// Tells whether the search was closed behind the item: Alt/Option is the existing "open it and keep
		// the results on the screen", and a caller whose work only makes sense on a closed search has no
		// other way to tell the two apart.
		onClickItem(event: { dialogId: string, nativeEvent: KeyboardEvent }): boolean
		{
			const { dialogId, nativeEvent } = event;

			this.$emit('clickItem', { dialogId });
			this.$emit('openItem', { dialogId });

			if (Utils.key.isAltOrOption(nativeEvent))
			{
				return false;
			}

			this.$emit('closeSearch');

			return true;
		},
		onKeyPressed(event: BaseEvent)
		{
			// With the navigation on, Enter is handled on keydown: running this keyup branch as well would
			// open the active item and the first one on a single keystroke.
			if (this.withKeyboardNavigation)
			{
				return;
			}

			if (!this.searchMode)
			{
				return;
			}

			const { keyboardEvent, context } = event.getData();

			// EVENT-01: the list owns no id space, so it acts on unaddressed keystrokes only. It stays
			// subscribed while hidden and shares the emitter with the forward window, whose keystrokes
			// belong to that window alone.
			if ((context ?? null) !== null)
			{
				return;
			}

			if (Utils.key.isCombination(keyboardEvent, 'Enter'))
			{
				this.onPressEnterKey(event);
			}
		},
		onPressEnterKey(keyboardEvent: KeyboardEvent)
		{
			const firstItem: ?SearchResultItem = getFirstItemFromSearchResults({
				searchResult: this.searchResult,
				recentItems: this.recentItems,
			});
			if (!firstItem)
			{
				return;
			}

			this.onClickItem({
				dialogId: firstItem.dialogId,
				nativeEvent: keyboardEvent,
			});
		},
		onSearchKeyDown(event: BaseEvent)
		{
			if (!this.withKeyboardNavigation)
			{
				return;
			}

			const { keyboardEvent, searchAreaId } = event.getData();

			if (!isOwnSearchArea(searchAreaId, this.searchAreaId))
			{
				return;
			}

			// A keystroke of this area that arrives before the search is open can only be the one that is
			// opening it: while collapsed the field is a button, and a mouse click on it produces no keydown.
			// Nothing is navigated here -- entering from the keyboard is only what shows the cursor.
			if (!this.searchMode)
			{
				this.isCursorVisible = true;

				return;
			}

			// Empty results: there is nothing to navigate, so the keystroke stays with the input.
			if (this.navigationOrder.length === 0)
			{
				return;
			}

			const isCursorShown = this.isCursorShownByKey(keyboardEvent);
			const isCursorMoved = !isCursorShown && this.moveCursorByKey(keyboardEvent);
			const isItemOpened = this.openActiveItemByKey(keyboardEvent);

			// The keystroke spent on showing the mark is taken from the caret all the same: it was answered
			// here, and left to the input it would walk the caret through the query nobody asked it to walk.
			if (isCursorShown || isCursorMoved || isItemOpened)
			{
				keyboardEvent.preventDefault();
			}

			// Scrolling follows movement and not interception: Enter hides the results, and the keys left to
			// the caret never move the cursor. A handled navigation key is also the second way into the
			// keyboard mode: whoever started walking the results must see where the cursor stands, no matter
			// what opened the search. The key that only shows the mark scrolls too: the results may have been
			// scrolled away with the mouse, and the item the mark lights up has to be on the screen.
			if (isCursorShown || isCursorMoved)
			{
				this.isCursorVisible = true;
				// A keystroke leaves the markup as it was -- only the mark moves between two nodes that are
				// already there -- so the geometry of the item is read right away.
				this.scrollActiveItemIntoView();
			}
		},
		// The keys of the walk reach the results through the input, so a cursor whose input no longer holds the
		// focus cannot be moved by any of them: its mark would point at an item nobody can operate, next to the
		// ring of whatever took the focus. The hidden position goes with the mark, so returning focus cannot
		// leave Enter targeting an item the user can no longer see as active.
		onSearchInputBlur(event: BaseEvent)
		{
			if (!isOwnSearchArea(event.getData().searchAreaId, this.searchAreaId))
			{
				return;
			}

			this.isCursorVisible = false;
			this.publishActiveDescendant(null);
			this.resetNavigationCursor();
		},
		publishActiveDescendant(activeDescendantId: ?string)
		{
			if (!this.withAriaNavigation || this.lastPublishedActiveDescendantId === activeDescendantId)
			{
				return;
			}

			this.lastPublishedActiveDescendantId = activeDescendantId;
			this.getEmitter().emit(EventType.search.activeDescendantChanged, {
				searchAreaId: this.searchAreaId,
				activeDescendantId,
			});
		},
		// The key a hidden mark is shown by instead of walked with. A relative move steps away from the item
		// the cursor stands on, and while the mark is hidden the user has never been shown that item: counted
		// from it right away, the first arrow of a search entered with the mouse lit the mark on the item next
		// to the one it was pressed for. So that key shows the mark where the cursor already stands, and the
		// walk starts with the next one. The absolute jumps land on the same item wherever the cursor stood,
		// so they are walked with at once; the arrows the caret keeps are no move here either.
		isCursorShownByKey(keyboardEvent: KeyboardEvent): boolean
		{
			if (this.isCursorVisible || !this.findCursorMove(keyboardEvent))
			{
				return false;
			}

			return !Object.keys(AbsoluteCursorMoveByKey).some((code: string) => {
				return Utils.key.isExactCombination(keyboardEvent, code);
			});
		},
		moveCursorByKey(keyboardEvent: KeyboardEvent): boolean
		{
			const moveCursor = this.findCursorMove(keyboardEvent);
			if (!moveCursor)
			{
				return false;
			}

			moveCursor(this.navigationCursor);
			this.syncActiveNavIndex();

			return true;
		},
		findCursorMove(keyboardEvent: KeyboardEvent): ?CursorMove
		{
			const availableMoves = this.isCursorInCarousel()
				? { ...CursorMoveByKey, ...CarouselCursorMoveByKey }
				: CursorMoveByKey;

			// Only the pure form of a key navigates: Shift+Arrow selects text and Ctrl/Cmd+Home jumps
			// through the document, so combinations with modifiers must reach the input untouched.
			const keyCode = Object.keys(availableMoves).find((code: string) => {
				return Utils.key.isExactCombination(keyboardEvent, code);
			});

			return keyCode === undefined ? null : availableMoves[keyCode];
		},
		openActiveItemByKey(keyboardEvent: KeyboardEvent): boolean
		{
			// Enter is matched loosely on purpose: Alt+Enter is the existing "open the item, keep the search
			// open", and an exact match would lose it.
			if (!Utils.key.isCombination(keyboardEvent, 'Enter'))
			{
				return false;
			}

			// The item under the cursor and nothing else: the mark of the results is drawn on this very item, so
			// what is highlighted and what Enter opens can never be two different chats. An untouched cursor
			// stands on the anchor of the order - the first row of the results, the row Enter has always opened.
			const itemToOpen: ?NavigationDescriptor = this.navigationCursor.getActive();

			if (!itemToOpen)
			{
				return false;
			}

			// Read before the chat is opened: it lands in the layout synchronously, and from then on the chat
			// that was already there is indistinguishable from the one this keystroke has just opened.
			const wasItemChatOpened = this.chatEntityId === itemToOpen.dialogId;

			const isSearchClosed = this.openItemBySection(itemToOpen, keyboardEvent);

			// A promise of the focus is only worth making by the branch that closes the search: the focus goes
			// back onto the collapsed pill, and Alt+Enter leaves no collapsed pill to put it on.
			if (isSearchClosed)
			{
				// The chat is already in the layout by now (its store commit is synchronous), so the layout read
				// here is the one the chat was opened in. From this moment on the focus is owed back to the
				// search: the walk was a keyboard one, and the mouse path never comes here.
				armKeyboardFocusHandoff({
					searchAreaId: this.searchAreaId,
					layoutName: this.layoutName,
					dialogId: itemToOpen.dialogId,
				});

				// The chat of the item was the one already on the screen: it is not re-mounted, so no input of
				// its own autofocuses, and the closing search would land the focus on its collapsed pill --
				// away from the chat the user has just asked for. The input is asked and no more than asked:
				// one that cannot take the focus (a guest, a chat nobody may write in) leaves it to the pill.
				if (wasItemChatOpened)
				{
					this.getEmitter().emit(EventType.textarea.focusInput, { dialogId: itemToOpen.dialogId });
				}
			}

			return true;
		},
		// The keyboard opens the item through the handler of the section it stands in -- the very one its
		// mouse path goes through. Each of them reports the pick of its own section, and opening the item
		// past them would leave the whole keyboard walk unreported.
		openItemBySection(itemToOpen: NavigationDescriptor, keyboardEvent: KeyboardEvent): boolean
		{
			const clickEvent = { dialogId: itemToOpen.dialogId, nativeEvent: keyboardEvent };

			if (itemToOpen.section === NavigationSection.carousel)
			{
				return this.onClickRecentChatItem(clickEvent);
			}

			// One section of the order, two sections of the results: the rows below the carousel are the recent
			// search, and the rows of a query are the search output. The branch is the one the template renders
			// by, so the handler is always the one the mouse of those very rows would reach.
			if (this.showLatestSearchResult)
			{
				return this.onClickRecentSearchItem(clickEvent);
			}

			// The position inside the output, counted the way the rows are numbered: the traversal index runs
			// over the whole results, and the rows of the output start at `listNavIndexBase`.
			const itemIndex = this.navigationCursor.getActiveIndex() - this.listNavIndexBase;

			return this.onClickSearchResultItem(clickEvent, itemIndex);
		},
		isCursorInCarousel(): boolean
		{
			return this.navigationCursor.getActive()?.section === NavigationSection.carousel;
		},
		// The layout moved, and with it the fate of the focus owed to the search. The promise lives exactly as
		// long as the surfaces the same keystroke opened: the exit of its chat hands the focus over, while any
		// move away from the walk (another chat opened, another section entered) makes the promise stale.
		settleFocusHandoff(newEntityId: string, oldEntityId: string)
		{
			const handoff = getKeyboardFocusHandoff(this.searchAreaId);
			if (!handoff)
			{
				return;
			}

			// Another section renders this very container, and the collapsed pill left behind in the one the
			// walk started in is owed nothing.
			if (handoff.layoutName !== this.layoutName)
			{
				clearKeyboardFocusHandoff(this.searchAreaId);

				return;
			}

			// The nested list opened together with that chat holds the promise: it is the last surface of the
			// walk, so what happens to the chats above it settles nothing.
			if (isKeyboardFocusHandoffOfAreaHeldByNestedList(this.searchAreaId))
			{
				return;
			}

			if (newEntityId)
			{
				// The chat of the promise is simply on screen; anything else took its place and the promise
				// went with it.
				if (newEntityId !== handoff.dialogId)
				{
					clearKeyboardFocusHandoff(this.searchAreaId);
				}

				return;
			}

			// The layout is only being cleared to make room for the chat of the promise: a collab opens its
			// nested list first and its own chat after. The walk is not over - it has not started.
			if (oldEntityId !== handoff.dialogId)
			{
				return;
			}

			clearKeyboardFocusHandoff(this.searchAreaId);
			// The search owns the element that takes the focus; all it needs from here is the moment.
			this.getEmitter().emit(EventType.search.returnFocusToSearch, { searchAreaId: this.searchAreaId });
		},
		updateNavigationOrder()
		{
			this.changeCursorPosition(() => this.navigationCursor.setOrder(this.navigationOrder));
		},
		resetNavigationCursor()
		{
			this.changeCursorPosition(() => {
				// reset() takes no arguments and works over the current order, so the order is rebuilt first.
				this.navigationCursor.setOrder(this.navigationOrder);
				this.navigationCursor.reset();
			});
		},
		// Every move of the cursor that no keystroke asked for: the results were rebuilt under it, or the walk
		// started over on a new query. The scroll position of the visit outlives both, so the item the cursor
		// lands on has to be brought back into view -- otherwise the mark, and with it the target of Enter,
		// stands where the user cannot see it. A position that did not change asks for nothing.
		changeCursorPosition(moveCursor: () => void)
		{
			if (!this.navigationCursor)
			{
				return;
			}

			const previousNavIndex = this.activeNavIndex;

			moveCursor();
			this.syncActiveNavIndex();

			if (this.isCursorVisible && this.activeNavIndex !== previousNavIndex)
			{
				// This runs in a pre-flush watcher, i.e. on the markup the new order is about to replace: the
				// item and the head of its section are only there to be measured once that order is rendered.
				this.$nextTick(() => this.scrollActiveItemIntoView());
			}
		},
		syncActiveNavIndex()
		{
			this.activeNavIndex = this.navigationCursor?.getActiveIndex() ?? null;
		},
		scrollActiveItemIntoView()
		{
			scrollToActiveItem(this.$refs['scroll-gradient']?.getContainer(), this.activeNavIndex);
		},
		getListNavIndex(itemIndex: number): ?number
		{
			return this.withKeyboardNavigation ? this.listNavIndexBase + itemIndex : null;
		},
		isListItemActive(itemIndex: number): boolean
		{
			const navIndex = this.getListNavIndex(itemIndex);

			// Highlight follows the traversal index and never the dialogId: the same interlocutor is present
			// both in the carousel and in the recent list, so a dialogId match would light up two items.
			return navIndex !== null && navIndex === this.highlightedNavIndex;
		},
		getListOptionId(dialogId: string, itemIndex: number): ?string
		{
			const navIndex = this.getListNavIndex(itemIndex);
			if (!this.withAriaNavigation || navIndex === null)
			{
				return null;
			}

			return getSearchOptionId(this.searchAreaId, navIndex, dialogId);
		},
		getEmitter(): EventEmitter
		{
			return this.$Bitrix.eventEmitter;
		},
		loc(key: string): string
		{
			return this.$Bitrix.Loc.getMessage(key);
		},
	},
	template: `
		<ScrollWithGradient v-if="searchMode" ref="scroll-gradient" @scroll="onScroll">
			<div
				:id="listboxId"
				:role="withAriaNavigation ? 'listbox' : null"
				:aria-label="withAriaNavigation ? loc('IM_SEARCH_RESULTS_ARIA') : null"
				class="bx-im-chat-search__container"
				data-testid="im-search-results"
			>
				<template v-if="showLatestSearchResult">
					<RecentUsersCarousel
						v-if="showUsersCarousel"
						:itemsWithNotesFirst="carouselItems"
						:activeNavIndex="highlightedNavIndex"
						:navIndexBase="carouselNavIndexBase"
						:searchAreaId="withAriaNavigation ? searchAreaId : null"
						:data-nav-section-head="carouselSectionHeadNavIndexes"
						@clickItem="onClickRecentChatItem"
						@openContextMenu="onOpenContextMenu"
					/>
					<div
						v-if="hasRecentSearchSection"
						:id="recentGroupId"
						:role="withAriaNavigation ? 'group' : null"
						:aria-labelledby="recentGroupTitleId"
					>
						<div
							:id="recentGroupTitleId"
							class="bx-im-chat-search__title"
							data-testid="im-search-recent-title"
							:data-nav-section-head="listSectionHeadNavIndex"
						>
							{{ loc('IM_SEARCH_SECTION_RECENT') }}
						</div>
						<SearchItem
							v-for="(item, index) in recentItems"
							:key="item.dialogId"
							:dialogId="item.dialogId"
							:titleTwoLine="true"
							:active="isListItemActive(index)"
							:navIndex="getListNavIndex(index)"
							:id="getListOptionId(item.dialogId, index)"
							:role="withAriaNavigation ? 'option' : null"
							:aria-selected="withAriaNavigation ? isListItemActive(index) : null"
							@clickItem="onClickRecentSearchItem"
							@openContextMenu="onOpenContextMenu"
						/>
						<Loader v-if="isRecentLoading" class="bx-im-chat-search__loader" />
					</div>
					<RecentEmptyState v-else-if="isEmptyRecentState" />
				</template>
				<template v-else>
					<SearchItem
						v-for="(item, index) in searchResult"
						:key="item.dialogId"
						:dialogId="item.dialogId"
						:dateMessage="item.dateMessage"
						:withDate="true"
						:query="cleanQuery"
						:titleTwoLine="true"
						:active="isListItemActive(index)"
						:navIndex="getListNavIndex(index)"
						:id="getListOptionId(item.dialogId, index)"
						:role="withAriaNavigation ? 'option' : null"
						:aria-selected="withAriaNavigation ? isListItemActive(index) : null"
						@clickItem="onClickSearchResultItem($event, index)"
						@openContextMenu="onOpenContextMenu"
					/>
					<SearchEmptyState v-if="isEmptyState" />
				</template>
			</div>
		</ScrollWithGradient>
	`,
};
