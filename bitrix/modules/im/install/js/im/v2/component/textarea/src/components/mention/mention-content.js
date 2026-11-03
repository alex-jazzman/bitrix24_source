import { Extension, Loc, Type, type JsonObject } from 'main.core';
import { type BaseEvent, type EventEmitter } from 'main.core.events';
import { type SettingsCollection } from 'main.core.collections';
// registers the <visually-hidden> custom element the announcement of the state is written into
import 'ui.a11y';

import { Core } from 'im.v2.application.core';
import { ChannelManager } from 'im.v2.lib.channel';
import { CopilotManager } from 'im.v2.lib.copilot';
import { FeatureManager, Feature } from 'im.v2.lib.feature';
import { EntitySearch, getUsersFromRecentItems } from 'im.v2.lib.search';
import { type ImModelChat } from 'im.v2.model';
import { ChatType, SpecialMentionDialogId, DialogIdChatPrefix, EventType, TextareaTarget } from 'im.v2.const';

import { MentionItemFormatter } from './classes/item-formatter';
import { MentionSearchService, SearchOutcome } from './classes/search-service';
import { ParticipantsService } from './classes/participants-service';
import { ContentFooter } from './components/content-footer';
import { MentionItemsContainer } from './components/mention-items-container';
import { SearchEmptyState } from './components/search-empty-state';
import { SearchStatusLine } from './components/search-status-line';

import './css/mention-popup-content.css';

// the pause before a request and the minimal interval between two of them: both values come from
// measurements and are confirmed on a production portal after the rollout
const SERVER_SEARCH_DELAY = 200;
const MIN_SERVER_SEARCH_INTERVAL = 300;

export const MentionListState = {
	items: 'items',
	loadingFirstPortion: 'loadingFirstPortion',
	nothingFound: 'nothingFound',
	searchUnavailable: 'searchUnavailable',
	partialList: 'partialList',
	degradedSearch: 'degradedSearch',
};

export type MentionItemType = {
	id: string,
	title: string,
	subtitle: string,
}

// @vue/component
export const MentionPopupContent = {
	name: 'MentionPopupContent',
	components: {
		ContentFooter,
		SearchEmptyState,
		SearchStatusLine,
		MentionItemsContainer,
	},
	// <visually-hidden> comes from ui.a11y as a custom element, so it is not looked up among components
	compilerOptions: {
		isCustomElement: (tag: string): boolean => tag === 'visually-hidden',
	},
	props:
	{
		dialogId: {
			type: String,
			required: true,
		},
		query: {
			type: String,
			default: '',
		},
		searchChats: {
			type: Boolean,
			default: true,
		},
		withCopilot: {
			type: Boolean,
			default: true,
		},
		target: {
			type: String,
			default: TextareaTarget.main,
		},
	},
	emits: ['close', 'adjustPosition', 'focusTextarea'],
	data(): JsonObject
	{
		return {
			lastSearchOutcome: null,
			searchResult: [],
			chatParticipants: [],
			chatParticipantsOutcome: null,
			pendingRequests: 0,
			needTopShadow: false,
			needBottomShadow: true,
			confirmedParticipantsIds: new Set(),
		};
	},
	computed:
	{
		MentionListState: () => MentionListState,
		// A person is a participant of the chat while the composition holds them or while a source that
		// outlives a refresh of the composition confirms it. The composition is replaced as a whole, so
		// whoever has left the chat stops being a participant with the answer that no longer brings them:
		// a stale mark would raise them among the results and hide the action of adding them to the chat.
		participantsIds(): Set<string>
		{
			return new Set([...this.confirmedParticipantsIds, ...this.chatParticipants]);
		},
		dialog(): ImModelChat
		{
			return Core.getStore().getters['chats/get'](this.dialogId, true);
		},
		items(): MentionItemType[]
		{
			if (!this.isEmptyQuery)
			{
				return this.dynamicItemsToShow;
			}

			return [...this.fixedItemsToShow, ...this.dynamicItemsToShow];
		},
		fixedItemsToShow(): MentionItemType[]
		{
			const items = [
				{
					id: this.copilotBotDialogId,
					title: (new MentionItemFormatter(this.copilotBotDialogId).getTitle()),
					subtitle: this.loc('IM_TEXTAREA_MENTION_COPILOT_SUBTITLE'),
					showCondition: this.needToShowFixedCopilot,
				},
				{
					id: SpecialMentionDialogId.allParticipants,
					title: this.loc('IM_TEXTAREA_MENTION_ALL_PARTICIPANTS_TITLE'),
					subtitle: this.loc('IM_TEXTAREA_MENTION_ALL_PARTICIPANTS_SUBTITLE'),
					showCondition: this.needToShowAllParticipants,
				},
			];

			return items
				.filter((item) => item.showCondition)
				.map(({ id, title, subtitle }) => ({ id, title, subtitle }));
		},
		dynamicItemsToShow(): MentionItemType[]
		{
			return this.formattedDynamicItems(this.dynamicItems);
		},
		// the start screen and the result of a query are separate branches: with an empty query the list
		// shows the composition of the chat (or the recent people) as a whole, there is nothing to search
		dynamicItems(): string[]
		{
			if (!this.isEmptyQuery)
			{
				return this.searchResult;
			}

			if (this.needToShowRecentUsersOnStartScreen)
			{
				return this.usersFromRecent;
			}

			return this.chatParticipants;
		},
		// a request still in flight is no reason to fall back to the recent users, a failed one is
		needToShowRecentUsersOnStartScreen(): boolean
		{
			return this.chatParticipantsOutcome !== null && this.chatParticipants.length <= 1;
		},
		usersFromRecent(): string[]
		{
			return getUsersFromRecentItems({ withFakeUsers: false }).map(({ dialogId }) => dialogId);
		},
		preparedQuery(): string
		{
			return this.query.trim().toLowerCase();
		},
		isEmptyQuery(): boolean
		{
			return this.preparedQuery.length === 0;
		},
		// the sign of loading is a derivation of the counted requests and not a flag of its own: a request
		// is counted from the moment it is queued, and the sign goes off with the last one that raised it
		isLoading(): boolean
		{
			return this.pendingRequests > 0;
		},
		// fixed items are not counted: they are shown by their own rules and never mean 'something found'
		hasFoundItems(): boolean
		{
			return this.dynamicItems.length > 0;
		},
		// the order of the checks matters: a missing chat composition outranks the search outcome,
		// and a failed outcome outranks a request in flight, so the notice does not blink while typing goes on
		listState(): $Values<typeof MentionListState>
		{
			// on the start screen the failure of the composition is itself what there is to report: with
			// the recent people empty too, the popup would otherwise stay blank without a word of why
			if ((this.hasFoundItems || this.isEmptyQuery) && this.chatParticipantsOutcome === SearchOutcome.failure)
			{
				return MentionListState.partialList;
			}

			if (this.lastSearchOutcome === SearchOutcome.failure)
			{
				return this.hasFoundItems ? MentionListState.degradedSearch : MentionListState.searchUnavailable;
			}

			if (this.hasFoundItems)
			{
				return MentionListState.items;
			}

			if (this.isLoading)
			{
				return MentionListState.loadingFirstPortion;
			}

			return this.isEmptyQuery ? MentionListState.items : MentionListState.nothingFound;
		},
		// searchUnavailable and degradedSearch report the same failure, so they share one notice
		statusLineText(): string
		{
			const phraseCodes = {
				[MentionListState.searchUnavailable]: 'IM_TEXTAREA_MENTION_SEARCH_ERROR',
				[MentionListState.degradedSearch]: 'IM_TEXTAREA_MENTION_SEARCH_ERROR',
				[MentionListState.partialList]: 'IM_TEXTAREA_MENTION_PARTICIPANTS_ERROR',
			};
			const phraseCode = phraseCodes[this.listState];

			return phraseCode ? this.loc(phraseCode) : '';
		},
		// A message about what has just happened, not a label of the current state: the number of matches
		// makes the text differ from result to result, so every new result is announced. States with a
		// visible notice of their own are announced by its text, and the start screen shows the
		// composition of the chat, where no search has happened at all: neither adds a message here.
		stateAnnouncement(): string
		{
			const hasVisibleNotice = Boolean(this.statusLineText) || this.listState === MentionListState.nothingFound;
			if (this.isEmptyQuery || hasVisibleNotice)
			{
				return '';
			}

			// the request is reported by the sign of loading and not by a state of the map: a list already
			// on the screen keeps the state at items, and the search going on behind it would stay
			// unreported otherwise - the very case the feature makes the usual one
			if (this.isLoading)
			{
				return this.loc('IM_TEXTAREA_MENTION_SEARCH_IN_PROGRESS');
			}

			return this.locPlural('IM_TEXTAREA_MENTION_SEARCH_RESULTS_COUNT', this.dynamicItems.length);
		},
		searchConfig(): { exclude: $Values<typeof EntitySearch>[], contextChatId: string, mentionSearch: boolean }
		{
			const exclude = [];

			if (!this.searchChats)
			{
				exclude.push(EntitySearch.chats);
			}

			// the mark of a request from the mention list: the server lowers the threshold of the query
			// length for it alone, the other consumers of the provider keep theirs
			return { exclude, contextChatId: this.dialog.chatId, mentionSearch: true };
		},
		copilotBotDialogId(): ?string
		{
			return this.$store.getters['users/bots/getCopilotBotDialogId'];
		},
		needToShowFixedCopilot(): boolean
		{
			if (!this.withCopilot)
			{
				return false;
			}

			const isChannel = ChannelManager.isChannel(this.dialogId);
			const isCopilotChat = (new CopilotManager()).isCopilotChat(this.dialogId);

			if (isChannel || isCopilotChat)
			{
				return false;
			}

			return FeatureManager.isFeatureAvailable(Feature.isCopilotMentionAvailable);
		},
		needToShowAllParticipants(): boolean
		{
			if (this.dialog.type === ChatType.user)
			{
				return false;
			}

			if (this.dialog.type === ChatType.copilot)
			{
				return (new CopilotManager()).isGroupCopilotChat(this.dialogId);
			}

			return true;
		},
	},
	watch:
	{
		async listState()
		{
			await this.adjustPosition();
		},
		async searchResult()
		{
			await this.adjustPosition();
		},
		preparedQuery(newQuery: string, previousQuery: string)
		{
			if (newQuery === previousQuery)
			{
				return;
			}

			void this.startSearch(newQuery);
		},
	},
	async created()
	{
		this.initSettings();
		this.isUnmounted = false;
		this.searchService = new MentionSearchService(this.searchConfig);
		// the timer of the request scheduled last - see scheduleServerSearch
		this.serverSearchTimerId = null;
		// no request has left yet, so the first one is held by the pause alone
		this.nextServerSearchAllowedAt = 0;
		// the end of the wait of the request queued last - see queueServerSearch
		this.finishQueuedSearch = null;

		this.getEmitter().subscribe(EventType.mention.onAddUserToChat, this.onAddUserToChat);

		void this.initSearchState();
	},
	beforeUnmount()
	{
		this.isUnmounted = true;
		this.cancelScheduledSearch();
		this.getEmitter().unsubscribe(EventType.mention.onAddUserToChat, this.onAddUserToChat);
	},
	methods:
	{
		async initSearchState()
		{
			const requests = [this.initChatParticipants()];

			// the popup can be opened with a query already typed in another input: preparedQuery never
			// changes, so its watcher never fires and the first search is started by hand. It goes beside
			// the composition of the chat and not after it, so neither wait holds the other back.
			if (!this.isEmptyQuery)
			{
				requests.push(this.startSearch(this.preparedQuery));
			}

			await Promise.all(requests);
		},
		// Both requests are started before the first await, and each one applies its own result: the list is
		// drawn from the chat participants without waiting for the recent ones. Neither half rejects - each
		// one keeps its own failure, one as a list state and the other as an empty answer - so a failure of
		// one of them cannot take the other down with it.
		async initChatParticipants()
		{
			const storedParticipants = this.searchService.restoreChatParticipants(this.dialogId);
			const loadParticipants = () => {
				return Promise.all([this.loadChatParticipants(), this.loadRecentParticipants()]);
			};

			if (Type.isArrayFilled(storedParticipants))
			{
				// the composition of a previous open is shown at once, and the request that follows only
				// refreshes it: with a list on the screen the indicator of the first request is not raised
				this.applyChatParticipants(storedParticipants);

				await loadParticipants();

				return;
			}

			await this.trackRequest(loadParticipants);
		},
		async loadRecentParticipants()
		{
			const participantsIdsFromRecent = await (new ParticipantsService()).getRecentIds(this.dialogId);

			this.addParticipants(participantsIdsFromRecent);
		},
		onAddUserToChat(event: BaseEvent<{ userId: string }>)
		{
			const { userId } = event.getData();

			this.addParticipants([userId]);
		},
		// the threshold comes from the server as a ready number: the mention list searches from a shorter
		// query than the rest of the messenger, and the server counts how much shorter. The common
		// threshold is the fallback, so a client of the new build on an older server asks no earlier than
		// that server is ready to answer.
		initSettings()
		{
			const settings: SettingsCollection = Extension.getSettings('im.v2.component.textarea');
			const defaultMinTokenSize = 3;
			const commonMinTokenSize = settings.get('minSearchTokenSize', defaultMinTokenSize);
			this.minTokenSize = settings.get('mentionSearchMinTokenSize', commonMinTokenSize);
		},
		// the outcome is kept here instead of being thrown: a missing composition is a list state,
		// not a reason to leave the popup on the loading indicator forever
		async loadChatParticipants()
		{
			try
			{
				this.applyChatParticipants(await this.searchService.loadChatParticipants(this.dialogId));
				this.chatParticipantsOutcome = SearchOutcome.success;
			}
			catch
			{
				this.chatParticipantsOutcome = SearchOutcome.failure;
			}
		},
		// The composition is replaced as a whole, so the answer of the refresh leaves nothing stale on the
		// screen: those who left the chat go from the list, those who were added appear in it. For a query
		// that is not empty this means rebuilding its local layers on the new composition - the pool knew
		// nothing about these people while the query was being typed, and below the threshold of the server
		// no request would bring them - while whoever the server has already answered keeps their place.
		applyChatParticipants(participants: string[])
		{
			const previousParticipants = this.chatParticipants;
			const shownItems = this.searchResult;

			this.chatParticipants = participants;

			if (this.isEmptyQuery)
			{
				this.searchResult = participants;

				return;
			}

			const stillInChat = new Set(participants);
			const leftTheChat = new Set(previousParticipants.filter((dialogId) => !stillInChat.has(dialogId)));
			const shownTail = shownItems.filter((dialogId) => !leftTheChat.has(dialogId));

			// the rebuilt layers are the base the tail of what is already shown is appended to
			this.searchResult = this.rebuildResult(this.preparedQuery);
			this.searchResult = this.appendServerResult(shownTail);
		},
		// the query is read here instead of being passed in: a request held back by the minimal interval
		// leaves with the latest query, not with the one that started the wait
		async searchOnServer()
		{
			const query = this.preparedQuery;

			// the pause and the minimal interval outlive the query the request was scheduled on, and the
			// line goes on changing meanwhile: a query shortened below the threshold since then leaves
			// nothing to ask the server about
			if (query.length < this.minTokenSize)
			{
				this.releaseQueuedSearch();

				return;
			}

			await this.trackRequest(async () => {
				// the wait is over: from here on the request itself is what the sign of loading stands on
				this.releaseQueuedSearch();
				// the moment the next wait is counted from, so two requests never come closer than the interval
				this.nextServerSearchAllowedAt = Date.now() + MIN_SERVER_SEARCH_INTERVAL;

				const { dialogIds, participantDialogIds, outcome } = await this.searchService.search(query);
				if (this.isUnmounted || query !== this.preparedQuery)
				{
					return;
				}

				this.lastSearchOutcome = outcome;
				this.addParticipants(participantDialogIds);

				this.searchResult = this.appendServerResult(dialogIds);
			});
		},
		// a changed query rebuilds the whole result; the start screen is a branch of its own
		async startSearch(query: string)
		{
			if (query.length === 0)
			{
				this.cleanSearchResult();

				return;
			}

			this.searchResult = this.rebuildResult(query);

			await this.requestServerSearch(query);
		},
		async requestServerSearch(query: string)
		{
			// a query too short to reach the server keeps no outcome of a previous one: the notice of a
			// failure would stay above a list built on local matches alone, with a retry that does nothing
			if (query.length < this.minTokenSize)
			{
				this.lastSearchOutcome = null;
				// a request queued by a longer query will not leave anymore, so it stops being counted
				this.releaseQueuedSearch();

				return;
			}

			// the sign of loading belongs to the whole wait and not to the request alone: the request is
			// held back for up to the minimal interval between two of them, and the list would report
			// nothing found for all that time
			await this.trackRequest(() => this.queueServerSearch());
		},
		// The wait of the queued request ends in one of three ways: the request left and answered, the
		// query got too short for it, or the next keystroke restarted the pause - and then the call queued
		// before it never leaves, so it is released here instead of being counted forever.
		queueServerSearch(): Promise<void>
		{
			this.releaseQueuedSearch();

			return new Promise((resolve) => {
				this.finishQueuedSearch = resolve;

				this.scheduleServerSearch();
			});
		},
		// One timer holds both rules of the schedule: its wait is the pause after the last change of the
		// line, stretched until the minimal interval since the last request has passed. A pause with a
		// limiter of the rate behind it would not do - the limiter keeps a tail of its own that the pause
		// does not cancel, and a request leaves in the middle of the typing, the same line going twice.
		scheduleServerSearch()
		{
			this.cancelScheduledSearch();

			const wait = Math.max(SERVER_SEARCH_DELAY, this.nextServerSearchAllowedAt - Date.now());

			this.serverSearchTimerId = setTimeout(() => {
				this.serverSearchTimerId = null;
				void this.searchOnServer();
			}, wait);
		},
		cancelScheduledSearch()
		{
			clearTimeout(this.serverSearchTimerId);
			this.serverSearchTimerId = null;
		},
		// a call already released leaves nothing to release: the counter is let go once per queued request
		releaseQueuedSearch()
		{
			this.finishQueuedSearch?.();
			this.finishQueuedSearch = null;
		},
		// partialList is caused by the request of the open, so its retry repeats that request, not the search
		async handleRetry()
		{
			// a request already in flight is the very one the retry would repeat: a second one would race
			// it past the minimal interval, and the answer that came last would decide the state
			if (this.isLoading)
			{
				return;
			}

			if (this.listState !== MentionListState.partialList)
			{
				this.retrySearch();

				return;
			}

			await this.trackRequest(() => this.loadChatParticipants());
		},
		// The step that failed is the request, and the query has not changed since: the shown rows keep
		// their positions, so nothing is rebuilt. A retry is an explicit action and not a stream of typing,
		// so it goes to the server at once - held back by the pause, the click would leave no sign of being
		// taken at all, and the next one would replace it instead of asking again.
		retrySearch()
		{
			void this.searchOnServer();
		},
		// every request that raises the sign of loading is counted here, so the one that answers first no
		// longer lowers it for the others: the composition of the chat and a search are counted alike
		async trackRequest(request: () => Promise<mixed>)
		{
			this.pendingRequests++;
			try
			{
				await request();
			}
			finally
			{
				this.pendingRequests--;
			}
		},
		cleanSearchResult()
		{
			this.searchResult = this.chatParticipants;
			this.lastSearchOutcome = null;
		},
		async adjustPosition()
		{
			await this.$nextTick();
			this.$emit('adjustPosition');
		},
		// the layers of the result in a fixed order: the chat participants that matched the query, then
		// the rest of the local matches by the date of the last message. The people found by the server
		// join the tail through appendServerResult and never take a place among the first two layers.
		rebuildResult(query: string): string[]
		{
			const localMatches = this.searchService.searchLocal(query);
			const participantMatches = this.chatParticipantMatches(localMatches);
			const shownIds = new Set(participantMatches);

			return [...participantMatches, ...localMatches.filter((dialogId) => !shownIds.has(dialogId))];
		},
		// the loaded composition keeps the order the server gave it - by the last message in this chat;
		// participants known only from a search answer follow it
		chatParticipantMatches(localMatches: string[]): string[]
		{
			const matchedIds = new Set(localMatches);
			const fromComposition = this.chatParticipants.filter((dialogId) => matchedIds.has(dialogId));
			const compositionIds = new Set(fromComposition);

			const restOfParticipants = localMatches.filter((dialogId) => {
				return this.participantsIds.has(dialogId) && !compositionIds.has(dialogId);
			});

			return [...fromComposition, ...restOfParticipants];
		},
		// an answer to an unchanged query only appends: no shown row changes its position
		appendServerResult(newItems: string[]): string[]
		{
			return [...new Set([...this.searchResult, ...newItems])];
		},
		isChat(dialogId: string): boolean
		{
			return dialogId.startsWith(DialogIdChatPrefix);
		},
		formattedDynamicItems(items: string[]): MentionItemType[]
		{
			return items.map((dialogId) => {
				return (new MentionItemFormatter(dialogId)).format();
			});
		},
		// the confirmations that outlive a refresh of the composition: the recent conversations, an answer
		// of the search and a person added to the chat in front of the employee
		addParticipants(items: string[])
		{
			items.forEach((userId) => this.confirmedParticipantsIds.add(userId));
		},
		getEmitter(): EventEmitter
		{
			return this.$Bitrix.eventEmitter;
		},
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
		locPlural(phraseCode: string, count: number): string
		{
			return Loc.getMessagePlural(phraseCode, count, { '#COUNT#': count });
		},
	},
	template: `
		<div
			class="bx-im-mention-popup-content__container"
			:aria-busy="isLoading ? 'true' : 'false'"
			:data-testid="'im-mention-popup-' + target"
		>
			<MentionItemsContainer
				:dialogId="dialogId"
				:query="query"
				:items="items"
				:participantsIds="participantsIds"
				:target="target"
				@close="$emit('close')"
			/>
			<div role="status">
				<SearchEmptyState v-if="listState === MentionListState.nothingFound" />
				<SearchStatusLine
					v-else-if="statusLineText"
					:text="statusLineText"
					@retry="handleRetry"
					@focusTextarea="$emit('focusTextarea')"
				/>
				<visually-hidden>{{ stateAnnouncement }}</visually-hidden>
			</div>
			<ContentFooter :isLoading="isLoading" />
		</div>
	`,
};
