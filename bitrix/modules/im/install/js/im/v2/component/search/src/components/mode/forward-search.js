import { type JsonObject, Loc, Runtime } from 'main.core';
import { type BaseEvent, type EventEmitter } from 'main.core.events';
import 'ui.design-tokens';
import 'ui.fonts.opensans';

import { Core } from 'im.v2.application.core';
import { Loader } from 'im.v2.component.elements.loader';
import { ScrollWithGradient } from 'im.v2.component.elements.scroll-with-gradient';
import { ChatType, EventType, ParentChatScope, RecentType } from 'im.v2.const';
import { createListFocusZone } from 'im.v2.lib.a11y';
import { Analytics } from 'im.v2.lib.analytics';
import { type EntitySearchConfigType, type SearchResultItem, sortByDate } from 'im.v2.lib.search';
import { Utils } from 'im.v2.lib.utils';
import { SearchService } from 'im.v2.provider.service.search';

import { EntitySearchConfig, EntitySearchType, ForwardAllSection, type ForwardSectionId } from '../../const/const';
import { getMinTokenSize } from '../../helpers/get-min-token-size';
import { mergeSearchItems } from '../../helpers/merge-search-items';
import { RecentEmptyState } from '../elements/empty-state/recent';
import { SearchEmptyState } from '../elements/empty-state/search';
import { SearchItem } from '../elements/search-item';

import '../css/chat-search.css';

const SectionsWithNotes: Set<ForwardSectionId> = new Set([ForwardAllSection, RecentType.default]);
const SectionsWithNestedChats: Set<ForwardSectionId> = new Set([ForwardAllSection, RecentType.taskComments]);

// The role every row of the result list carries. FocusZone has no public focus move, so the row to
// enter is looked up in the DOM by it.
const RESULT_OPTION_SELECTOR = '[role="option"]';

// The numeric keypad carries its own code for Enter, and the helper compares event.code.
const ENTER_KEYS = ['Enter', 'NumpadEnter'];

// Every key that confirms the focused recipient. Exact, so Ctrl+Enter and Shift+Space stay native.
const SELECT_OPTION_KEYS = [...ENTER_KEYS, 'Space'];

// An id may not carry every character a dialogId may (ALG-01).
const UNSAFE_ID_CHARS = /[^\w-]/g;

// @vue/component
export const ForwardSearch = {
	name: 'ForwardSearch',
	components: { ScrollWithGradient, SearchItem, RecentEmptyState, SearchEmptyState, Loader },
	inject: {
		// Provided by ForwardPopup, unwrapped by Vue into a plain boolean. The default keeps the list
		// working when it is mounted without the window around it.
		isForwardContentVisible: {
			default: true,
		},
	},
	props: {
		query: {
			type: String,
			default: '',
		},
		dialogId: {
			type: String,
			required: true,
		},
		recentSection: {
			type: String,
			default: null,
		},
		// EVENT-01: the id space of the window this list belongs to. A keystroke from the shared
		// channel acts here only when it was typed in the same window.
		searchContext: {
			type: String,
			default: null,
		},
		// The name of the active section, ready to be spoken. Only the window owns the tab set and the
		// phrase of every tab, so the list is handed the name instead of deriving it: without one the
		// announcement of a section switch carries the size of the list alone.
		sectionName: {
			type: String,
			default: null,
		},
		multiple: {
			type: Boolean,
			default: false,
		},
		selectedDialogIds: {
			type: Array,
			default: () => [],
		},
		selectionLimitReached: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['clickItem', 'toggleItem', 'loading', 'returnFocusToSearch'],
	data(): JsonObject
	{
		return {
			isLoading: false,
			isRecentLoading: false,

			currentServerQueries: 0,
			recentItemsBySection: {},
			searchResult: [],
			// The option of the listbox the tab stop of the zone is on. The focusin of the container puts it
			// on the row the zone moved the focus to, and a list whose rows were replaced under it follows
			// the zone as well, so this and aria-selected never name a row the Tab key does not lead to.
			activeDialogId: null,

			// The one line the status region of the window carries. Empty while the list is loading: the
			// channel reports the settled result, never the loading itself.
			statusText: '',
			// True while the list on screen is the one a section switch has just brought in. The name of
			// the section belongs to that announcement only, and a query starts a story of its own.
			afterSectionSwitch: false,
		};
	},
	computed: {
		showLatestSearchResult(): boolean
		{
			return this.query.length === 0;
		},
		currentSection(): ForwardSectionId
		{
			return this.recentSection ?? RecentType.default;
		},
		needShowNotes(): boolean
		{
			return SectionsWithNotes.has(this.currentSection);
		},
		recentItems(): SearchResultItem[]
		{
			return this.recentItemsBySection[this.currentSection] ?? [];
		},
		recentSearchItems(): SearchResultItem[]
		{
			const selfChatId = Core.getUserId().toString();
			const filteredRecent = this.filterAvailableRecipients(this.recentItems)
				.filter(({ dialogId }) => dialogId !== selfChatId);

			if (this.needShowNotes)
			{
				filteredRecent.unshift({ dialogId: selfChatId, dateMessage: '' });
			}

			return filteredRecent;
		},
		isEmptyState(): boolean
		{
			return this.searchResult.length === 0;
		},
		showRecentEmptyState(): boolean
		{
			return this.showLatestSearchResult && !this.isRecentLoading && this.recentSearchItems.length === 0;
		},
		showSearchEmptyState(): boolean
		{
			return !this.showLatestSearchResult && this.isEmptyState;
		},
		// The rows the user sees, whichever of the two lists is on screen.
		shownItems(): SearchResultItem[]
		{
			return this.showLatestSearchResult ? this.recentSearchItems : this.searchResult;
		},
		// Both requests fill the same list, so either of them makes it busy.
		isBusy(): boolean
		{
			return this.isLoading || this.isRecentLoading;
		},
		// A loading list counts as nothing to enter: the rows are about to be replaced.
		canEnterResults(): boolean
		{
			if (this.isBusy)
			{
				return false;
			}

			return this.shownItems.length > 0;
		},
		// The active option, as long as the list still offers its row - the last guard against a row that
		// left the screen between a keystroke and the update of the active option. The row is the one
		// aria-selected and the tab stop of the zone are on, so it is the recipient the reader has named -
		// and the one an Enter typed back in the search field has to confirm.
		activeOptionDialogId(): ?string
		{
			const isShown = this.shownItems.some((item: SearchResultItem) => item.dialogId === this.activeDialogId);

			return isShown ? this.activeDialogId : null;
		},
		// The heading over the list on screen. A named section is what the announcement of a switch calls
		// that list, and two names for one list is one name too many, so the heading says the same. Without
		// a name of its own - the window of a guest renders no tabs, and a search result belongs to no
		// section - the phrase of the recent chats stays.
		listTitle(): string
		{
			if (this.showLatestSearchResult && this.sectionName)
			{
				return this.sectionName;
			}

			return this.loc('IM_SEARCH_SECTION_RECENT_CHATS');
		},
		// A blank aria-label would wipe the name of the list instead of leaving it computable, so a
		// missing phrase yields no attribute at all.
		recipientsLabel(): ?string
		{
			return this.loc('IM_SEARCH_FORWARD_RECIPIENTS_ARIA') || null;
		},
		// ALG-01: the ids of the window come from the namespace ForwardContent owns and hands over as the
		// search context. The search field of the same window already points its aria-controls here.
		listboxId(): ?string
		{
			if (!this.searchContext)
			{
				return null;
			}

			return `${this.searchContext}-listbox`;
		},
		// ALG-01 as well: the aria-describedby of the search field is already pointing at this id.
		statusId(): ?string
		{
			if (!this.searchContext)
			{
				return null;
			}

			return `${this.searchContext}-status`;
		},
		// Everything one published line is built from, in a single value: the watcher over it runs once
		// per update no matter how many of the three moved together, so the region never says it twice.
		statusSource(): JsonObject
		{
			return {
				isBusy: this.isBusy,
				total: this.shownItems.length,
				showsRecent: this.showLatestSearchResult,
			};
		},
	},
	watch: {
		query(newQuery: string)
		{
			// Whatever the list shows from here on is the answer to a query, not to a section switch.
			this.afterSectionSwitch = false;
			// The active option belongs to the result it was picked in. An Enter in the field that arrives
			// before the answer to this query does must not confirm a recipient of the previous one, so the
			// option goes away together with the query it was named for.
			this.activeDialogId = null;

			if (newQuery.length === 0)
			{
				this.cleanSearchResult();
			}

			this.startSearch(newQuery);
		},
		recentSection()
		{
			this.afterSectionSwitch = true;
			this.switchSearchService();
			void this.loadRecentItems();
		},
		isLoading(newValue: boolean)
		{
			this.$emit('loading', newValue);
		},
		statusSource({ isBusy }: JsonObject)
		{
			// A loading list has nothing final to say, and narrating the loading itself is exactly the
			// speech noise a single status channel exists to avoid.
			this.statusText = isBusy ? '' : this.buildStatusText();
		},
		shownItems()
		{
			// Read before Vue patches the rows: by the time the new rows are in place the browser has
			// already dropped the focus of a removed row to body, and there would be no telling that
			// from a focus the user had moved to the search field or the tabs himself.
			const focusWasInList = this.isFocusInsideList();

			void this.$nextTick(() => {
				this.syncActiveOption(focusWasInList);
			});
		},
		isForwardContentVisible(isVisible: boolean)
		{
			// The window holds its content at zero opacity until it has finished opening, so every row
			// counted as invisible while mounted() ran and the zone collected nothing. The opacity of an
			// ancestor is not something its MutationObserver sees, hence the explicit second enable.
			if (isVisible)
			{
				this.enableFocusZone();
			}
		},
	},
	created()
	{
		this.searchServices = {};
		this.searchService = this.getSearchService(this.currentSection);
		this.searchOnServerDelayed = Runtime.debounce(this.searchOnServer, 400, this);
		// The zone over the listbox container. Non-reactive on purpose: a class instance behind a Vue
		// proxy breaks its own private fields.
		this.focusZone = null;

		this.getEmitter().subscribe(EventType.search.keyPressed, this.onKeyPressed);

		void this.loadRecentItems();
	},
	mounted()
	{
		this.enableFocusZone();
	},
	beforeUnmount()
	{
		this.getEmitter().unsubscribe(EventType.search.keyPressed, this.onKeyPressed);

		this.focusZone?.deactivate();
		this.focusZone = null;
	},
	methods: {
		getSearchService(section: ForwardSectionId): SearchService
		{
			this.searchServices[section] ??= new SearchService(this.getSectionSearchConfig(section));

			return this.searchServices[section];
		},
		getSectionSearchConfig(section: ForwardSectionId): EntitySearchConfigType
		{
			const withNestedChats = SectionsWithNestedChats.has(section);
			const searchConfig = {
				...EntitySearchConfig[EntitySearchType.messageForward],
				parentId: withNestedChats ? ParentChatScope.all : ParentChatScope.topLevel,
			};

			if (section === ForwardAllSection)
			{
				return { ...searchConfig, searchAllChats: true };
			}

			return { ...searchConfig, searchRecentSection: section };
		},
		async loadRecentItems(): Promise<void>
		{
			const requestedSection = this.currentSection;
			if (this.recentItemsBySection[requestedSection])
			{
				this.isRecentLoading = false;

				return;
			}

			this.isRecentLoading = true;

			this.recentItemsBySection[requestedSection] = await this.getSearchService(requestedSection).loadLatestResults();

			if (requestedSection === this.currentSection)
			{
				this.isRecentLoading = false;
			}
		},
		switchSearchService()
		{
			this.searchService = this.getSearchService(this.currentSection);
			this.cleanSearchResult();

			if (this.query.length > 0)
			{
				this.startSearch(this.query);
			}
		},
		filterAvailableRecipients(items: SearchResultItem[]): SearchResultItem[]
		{
			return items.filter(({ dialogId }) => {
				const chat = this.$store.getters['chats/get'](dialogId);

				return chat?.type !== ChatType.videoconf && chat?.entityType !== 'VIDEOCONF';
			});
		},
		startSearch(query: string)
		{
			if (query.length > 0)
			{
				const result = this.searchService.searchLocal(query);
				if (query !== this.query)
				{
					return;
				}

				this.searchResult = sortByDate(this.filterAvailableRecipients(result));
			}

			if (query.length >= getMinTokenSize())
			{
				this.isLoading = true;
				this.searchOnServerDelayed(query);
			}
		},
		cleanSearchResult()
		{
			this.searchResult = [];
			this.searchService.clearSessionResult();
		},
		async searchOnServer(query: string)
		{
			this.currentServerQueries++;

			// The section is captured with the query: the pending promise holds the SearchService of the
			// section that started it, so with the query kept across a tab switch the old answer would
			// otherwise be merged into the list of the new one.
			const requestedSection = this.currentSection;
			const searchResult = await this.searchService.search(query);
			if (query !== this.query || requestedSection !== this.currentSection)
			{
				this.stopLoader();

				return;
			}
			const mergedItems = mergeSearchItems(this.searchResult, searchResult);
			this.searchResult = sortByDate(this.filterAvailableRecipients(mergedItems));
			this.stopLoader();
		},
		stopLoader()
		{
			this.currentServerQueries--;
			if (this.currentServerQueries > 0)
			{
				return;
			}

			this.isLoading = false;
		},
		onClickItem(event: {dialogId: string, nativeEvent: KeyboardEvent}, itemIndex: number)
		{
			if (this.isOptionDisabled(event.dialogId))
			{
				return;
			}

			if (!this.isRemovingSelection(event.dialogId))
			{
				Analytics.getInstance().messageForward.onSelectRecipientFromSearchResult({
					dialogId: this.dialogId,
					position: itemIndex + 1,
				});
			}
			this.emitSelectItem(event);
		},
		onClickRecentItem(event: {dialogId: string, nativeEvent: KeyboardEvent}, itemIndex: number)
		{
			if (this.isOptionDisabled(event.dialogId))
			{
				return;
			}

			if (!this.isRemovingSelection(event.dialogId))
			{
				Analytics.getInstance().messageForward.onSelectRecipientFromRecent({
					dialogId: this.dialogId,
					position: itemIndex + 1,
					section: this.currentSection,
				});
			}
			this.emitSelectItem(event);
		},
		isRemovingSelection(dialogId: string): boolean
		{
			return this.multiple && this.selectedDialogIds.includes(dialogId);
		},
		emitSelectItem(event: {dialogId: string, nativeEvent: KeyboardEvent})
		{
			this.$emit(this.multiple ? 'toggleItem' : 'clickItem', event);
		},
		enableFocusZone()
		{
			const container = this.$refs.listbox;
			if (!container)
			{
				return;
			}

			this.focusZone ??= createListFocusZone(container);

			// Idempotent: both mounted() and the visibility signal enable the same zone.
			if (this.focusZone.isActive())
			{
				this.focusZone.refreshElements();

				return;
			}

			this.focusZone.activate();
		},
		// The whole content of the status region for the list as it stands now.
		buildStatusText(): string
		{
			if (this.shownItems.length === 0)
			{
				// Every phrase the visible empty state carries, so what is heard matches what is seen: the
				// empty search shows a hint under its title, the empty section has none to show.
				if (this.showLatestSearchResult)
				{
					return this.loc('IM_SEARCH_RESULT_NO_RECENT');
				}

				return [
					this.loc('IM_SEARCH_RESULT_NOT_FOUND'),
					this.loc('IM_SEARCH_RESULT_NOT_FOUND_DESCRIPTION'),
				].join('. ');
			}

			// Plural forms live on the Loc of main.core: $Bitrix.Loc has no getMessagePlural at all, and
			// its second argument is a default value rather than a set of replacements.
			const result = Loc.getMessagePlural('IM_SEARCH_FORWARD_RESULT_COUNT_ARIA', this.shownItems.length, {
				'#COUNT#': this.shownItems.length,
			});

			if (!this.afterSectionSwitch || !this.showLatestSearchResult || !this.sectionName)
			{
				return result;
			}

			// A section is named together with the size of its list, and only once the list has arrived:
			// said any earlier this would land on top of the announcement of the tab itself.
			return Loc.getMessage('IM_SEARCH_FORWARD_SECTION_RESULT_ARIA_TEMPLATE', {
				'#SECTION#': this.sectionName,
				'#RESULT#': result,
			});
		},
		// The rows are patched by now: the active option ends up on the row the tab stop of the zone ends up
		// on, and a focus the patch dropped goes back to whatever is active after it.
		syncActiveOption(focusWasInList: boolean)
		{
			const previousActive: ?string = this.activeDialogId;

			if (!focusWasInList)
			{
				// Nobody is in the list, so where the tab stop lands is the zone's call alone: it keeps it on
				// its row while the patch spares that row and hands it to the first row of the new set
				// otherwise - which is what crossing between the recent list and a search result does, they
				// are two branches of the template. The active option follows it or goes away with it, back
				// to the state of a list nobody has entered.
				const isTabStopRowKept = this.focusZone?.getCurrentFocusedElement()?.isConnected === true;
				this.activeDialogId = isTabStopRowKept ? previousActive : null;

				// With no option of its own, the list is one nobody has entered, and the row it is entered at
				// is its first one. The zone alone would leave the stop wherever it survived: on the row of an
				// option a changed query has just dropped, or on the row that was first before the answer
				// re-sorted them.
				if (this.activeDialogId === null)
				{
					this.resetTabStopToFirstOption();
				}

				return;
			}

			// The set of the zone is needed right here, and before the focus is restored. Everywhere else the
			// observer of the zone re-collects the rows in this very frame on its own, so an unconditional
			// refresh would walk the whole list twice per update.
			this.focusZone?.refreshElements();

			const isActiveKept = previousActive !== null
				&& this.shownItems.some((item: SearchResultItem) => item.dialogId === previousActive);

			// A list nobody has entered yet keeps its "no active option" state; an option whose row is
			// gone moves to the first row of the new list, or to nothing at all when it came back empty.
			if (previousActive !== null && !isActiveKept)
			{
				this.activeDialogId = this.shownItems[0]?.dialogId ?? null;
			}

			if (!this.isFocusInsideList())
			{
				this.restoreListFocus();

				return;
			}

			if (isActiveKept)
			{
				// The focus has not moved, so nothing but this brings the kept row back into view.
				this.findOption(previousActive)?.scrollIntoView({ block: 'nearest' });
			}
		},
		// The tab stop of the zone sits on a node, not on a position: FocusZone keeps it on its row for as long
		// as the patch spares that row, and offers no move of its own. Re-activating the zone over the same
		// container is that move - activate() puts the stop on the first element of the set it collects - and
		// it writes tabindex alone, so a user standing on a row is never pulled off it.
		resetTabStopToFirstOption()
		{
			const firstOption = this.$refs.listbox?.querySelector(RESULT_OPTION_SELECTOR);
			const tabStopRow = this.focusZone?.getCurrentFocusedElement();

			// A stop that is nowhere yet, and one left on a row the patch removed, are both handed to the first
			// row by the zone itself: collecting the set again for either of them would buy nothing.
			if (!firstOption || !tabStopRow?.isConnected || tabStopRow === firstOption)
			{
				return;
			}

			this.focusZone.deactivate();
			this.enableFocusZone();
		},
		// FocusZone only hands the tab stop over when the focused row disappears - it never calls focus()
		// itself, and the browser has dropped the focus to body by now. isFocusOwnedByPopup() is
		// deliberately not consulted: the forward window is a popup, so the guard would always refuse.
		restoreListFocus()
		{
			const activeOption = this.findOption(this.activeDialogId);
			if (activeOption)
			{
				activeOption.focus();

				return;
			}

			// Nothing left to hold the focus: it goes back where the window put it on opening. The field
			// belongs to the window, so the window is asked to take the focus back instead of the list
			// reaching for a node of its neighbour.
			this.$emit('returnFocusToSearch');
		},
		isFocusInsideList(): boolean
		{
			const container = this.$refs.listbox;

			return Boolean(container) && container.contains(document.activeElement);
		},
		findOption(dialogId: ?string): ?HTMLElement
		{
			if (!dialogId)
			{
				return null;
			}

			// Attribute form instead of an id selector: a dialogId needs no escaping this way.
			return this.$refs.listbox?.querySelector(`[data-id="${dialogId}"]`);
		},
		optionId(dialogId: string): ?string
		{
			if (!this.searchContext)
			{
				return null;
			}

			return `${this.searchContext}-option-${dialogId.replaceAll(UNSAFE_ID_CHARS, '_')}`;
		},
		// The per-row half of what makes a row an option of the listbox: only the attributes that depend on
		// the row itself. The constant ones are static in the template, so walking the list with the arrows
		// rebuilds three attributes per row instead of five. Like them, these fall through SearchItem to the
		// root of SearchItemLayout, which carries none of them itself, so no other consumer of the row is
		// affected.
		optionAttrs(dialogId: string): JsonObject
		{
			return {
				id: this.optionId(dialogId),
				'aria-selected': this.multiple
					? this.selectedDialogIds.includes(dialogId)
					: dialogId === this.activeDialogId,
				'aria-disabled': this.isOptionDisabled(dialogId) || null,
				// The dialogId of the row as it is: the delegated handlers below read it back from the
				// focused node instead of reversing the escaped option id, which is not one to one.
				'data-id': dialogId,
			};
		},
		isOptionDisabled(dialogId: string): boolean
		{
			return this.multiple
				&& this.selectionLimitReached
				&& !this.selectedDialogIds.includes(dialogId)
			;
		},
		onOptionFocusIn(event: FocusEvent)
		{
			// The row the arrows bring the focus to becomes the active option, so the active dialogId, the
			// DOM focus, the tab stop of the zone and aria-selected stay on one and the same row.
			const dialogId = this.getOptionDialogId(event.target);
			if (dialogId)
			{
				this.activeDialogId = dialogId;
			}
		},
		onOptionKeydown(event: KeyboardEvent)
		{
			if (!Utils.key.isExactCombination(event, SELECT_OPTION_KEYS))
			{
				return;
			}

			const dialogId = this.getOptionDialogId(event.target);
			if (!dialogId)
			{
				return;
			}

			// Space would otherwise scroll the page behind the window; Enter is cancelled with it, so
			// neither key reaches anything above the list.
			event.preventDefault();
			this.selectOption(dialogId, event);
		},
		getOptionDialogId(target: ?EventTarget): ?string
		{
			return target?.closest?.(RESULT_OPTION_SELECTOR)?.dataset.id ?? null;
		},
		selectOption(dialogId: string, keyboardEvent: KeyboardEvent)
		{
			// The path of a click on the very same row, analytics included: the position of a recipient is
			// its place in the list the user sees.
			const itemIndex = this.shownItems.findIndex((item: SearchResultItem) => item.dialogId === dialogId);
			if (itemIndex === -1)
			{
				return;
			}

			const event = { dialogId, nativeEvent: keyboardEvent };
			if (this.showLatestSearchResult)
			{
				void this.onClickRecentItem(event, itemIndex);

				return;
			}

			void this.onClickItem(event, itemIndex);
		},
		// Public: ForwardContent calls this on ArrowDown in the search zone. The last response may have
		// replaced the rows, so the zone re-collects them before the first one takes the focus.
		focusFirstResult()
		{
			if (!this.canEnterResults || !this.focusZone)
			{
				return;
			}

			this.focusZone.refreshElements();
			this.$refs.listbox?.querySelector(RESULT_OPTION_SELECTOR)?.focus();
		},
		onKeyPressed(event: BaseEvent)
		{
			const { keyboardEvent, context } = event.getData();

			// A publisher rolled back to the previous contract carries no context field at all, which
			// has to read the same as an explicit null on both sides of the comparison.
			if ((context ?? null) !== (this.searchContext ?? null))
			{
				return;
			}

			if (Utils.key.isCombination(keyboardEvent, ENTER_KEYS))
			{
				this.onPressEnterKey(event);
			}
		},
		onPressEnterKey(keyboardEvent: KeyboardEvent)
		{
			// The active option wins over the first row: it is the one the reader announced as selected and
			// the one the tab stop stayed on when the focus went back to the field. With no active option
			// the key keeps its previous action and takes the first row of the list on screen - the rows the
			// user cannot see are none of its business.
			const dialogId: ?string = this.activeOptionDialogId ?? this.shownItems[0]?.dialogId;
			if (!dialogId)
			{
				return;
			}

			// The very path a click on that row takes, so the recipient is reported with its place in the
			// list and from the list it was actually picked in.
			this.selectOption(dialogId, keyboardEvent);
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
		<ScrollWithGradient>
			<div class="bx-im-chat-search__container">
				<div v-if="!showRecentEmptyState" class="bx-im-chat-search__title">
					{{ listTitle }}
				</div>
				<div
					ref="listbox"
					:id="listboxId"
					data-testid="im-forward-recipient-list"
					class="bx-im-chat-search__result-list"
					role="listbox"
					:aria-label="recipientsLabel"
					:aria-busy="isBusy"
					:aria-multiselectable="multiple || null"
					@focusin="onOptionFocusIn"
					@keydown="onOptionKeydown"
				>
					<!-- role and tabindex are the same for every row and never change: the roving tab stop is
					     the zone's to write, and a row with no tabindex of its own would not even be
					     collected as focusable. Static here, so the arrows do not rebuild them per row. -->
					<template v-if="showLatestSearchResult">
						<SearchItem
							v-for="(item, index) in recentSearchItems"
							:key="item.dialogId"
							:dialogId="item.dialogId"
							:selected="multiple && selectedDialogIds.includes(item.dialogId)"
							role="option"
							tabindex="-1"
							v-bind="optionAttrs(item.dialogId)"
							@clickItem="onClickRecentItem($event, index)"
						/>
					</template>
					<template v-else>
						<SearchItem
							v-for="(item, index) in searchResult"
							:key="item.dialogId"
							:dialogId="item.dialogId"
							:selected="multiple && selectedDialogIds.includes(item.dialogId)"
							:dateMessage="item.dateMessage"
							:withDate="true"
							:query="query"
							role="option"
							tabindex="-1"
							v-bind="optionAttrs(item.dialogId)"
							@clickItem="onClickItem($event, index)"
						/>
					</template>
				</div>
				<!-- Decoration only: the loading is carried by aria-busy above, and the text of both empty
				     states - the hint of the empty search included - is what the status region below says. -->
				<Loader v-if="showLatestSearchResult && isRecentLoading" class="bx-im-chat-search__loader" aria-hidden="true" />
				<RecentEmptyState v-if="showRecentEmptyState" aria-hidden="true" />
				<SearchEmptyState v-if="showSearchEmptyState" aria-hidden="true" />
				<!-- The single status channel of the window. Rendered from mount on, only its text changes:
				     a region that appears together with its text is announced by nothing, and the
				     aria-describedby of the search field would hang on a missing node until then. The
				     style is inline because the region has no visual design of its own to name a class for. -->
				<div
					:id="statusId"
					role="status"
					aria-live="polite"
					aria-atomic="true"
					style="position: absolute; width: 1px; height: 1px; margin: -1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap;"
				>{{ statusText }}</div>
			</div>
		</ScrollWithGradient>
	`,
};
