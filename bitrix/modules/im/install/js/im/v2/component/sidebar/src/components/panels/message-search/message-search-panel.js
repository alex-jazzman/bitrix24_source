/* global $Values */
import { Dom, Runtime, Type } from 'main.core';
import { LiveAnnouncer } from 'ui.a11y';
import { type ActionOptions, type Balloon, Center as NotificationCenter } from 'ui.notification';

import { Logger } from 'im.v2.lib.logger';
import { DateNavigationJumpOutcome, DateNavigationJumpTimeout, EventType, SidebarDetailBlock } from 'im.v2.const';
import { Feature, FeatureManager } from 'im.v2.lib.feature';
import { Loader } from 'im.v2.component.elements.loader';
import { DateFormatter, DateTemplate } from 'im.v2.lib.date-formatter';
import { Analytics, DateNavigationEntryPoint } from 'im.v2.lib.analytics';
import {
	type CalendarDay,
	DateNavigationErrorCode,
	DateNavigationService,
	DateNavigationStatus,
	parseCalendarDay,
	type RequestErrorCode,
} from 'im.v2.provider.service.date-navigation';

import { MessageSearch } from '../../../classes/panels/search/message-search';
import { SearchItem } from './search-item';
import { SearchHeader } from './search-header';
import { DateGroup } from '../../elements/date-group/date-group';
import { TariffLimit } from '../../elements/tariff-limit/tariff-limit';
import { DetailEmptyState as StartState } from '../../elements/detail-empty-state/detail-empty-state';
import { DetailEmptySearchState } from '../../elements/detail-empty-search-state/detail-empty-search-state';
import { SidebarCollectionFormatter } from '../../../classes/sidebar-collection-formatter';

import './css/message-search-panel.css';

import type { JsonObject } from 'main.core';
import type { BaseEvent, EventEmitter } from 'main.core.events';
import type { ImModelChat } from 'im.v2.model';

// ui.date-picker is needed by the calendar alone, and the panel loads for everyone who opens the
// messenger: hence a separate extension, arriving with the first opening.
const DATE_CALENDAR_EXTENSION = 'im.v2.component.elements.date-calendar';

const DATE_NAVIGATION_NOTIFICATION_ID = 'im-date-navigation-error';
const DATE_NAVIGATION_ERROR_TEST_ID = 'im-sidebar-search-date-navigation-error';
const DATE_NAVIGATION_RETRY_TEST_ID = 'im-sidebar-search-date-navigation-retry-button';

// The bound is for a jump no message list reported on at all, so it sits behind the one the list gives
// itself up by. It comes off once a chat says it has taken the jump on.
const DATE_NAVIGATION_JUMP_TIMEOUT = DateNavigationJumpTimeout.panelWait;

/**
 * main.core answers loading with a promise that can stay pending forever: the request for the asset list
 * is retried outside any catch of its own (main/.../runtime/loadextension/internal/process-extensions.ts,
 * under a bare `void`). Bounded here is the wait, not the loading.
 */
const CALENDAR_LOAD_TIMEOUT = 15000;

// A calendar already there a moment later needs no announcement; a wait long enough to look like a
// dead button does.
const CALENDAR_LOAD_ANNOUNCE_DELAY = 400;

// The loading goes on untouched: its answer still counts for the opening after this one.
const waitAtMost = (promise: Promise<mixed>, timeout: number): Promise<mixed> => {
	let timer = null;
	const deadline = new Promise((resolve, reject) => {
		timer = setTimeout(() => {
			reject(new Error(`${DATE_CALENDAR_EXTENSION} did not answer in ${timeout}ms`));
		}, timeout);
	});

	return Promise.race([promise, deadline]).finally(() => clearTimeout(timer));
};

export type DateNavigationErrorText = { phraseCode: string, canRetry: boolean };

/**
 * Names one jump. The same day picked twice resolves to the same message, so chat, message and day
 * cannot tell two jumps apart - only the side starting them can, and the message list carries the
 * identifier through to the outcome. Counted per page: two panels of their own would name jumps alike.
 */
let lastDateNavigationJumpId = 0;

// The day the list is on its way to, and the day picked for it: a repeat asks about the picked one.
type PendingDateNavigationJump = { id: number, date: CalendarDay, pickedDate: CalendarDay };

// Names one showing: the sidebar keeps the panel alive between showings, so the waits outlive a showing
// the way they outlive the panel. Zero while none is on screen.
let lastPanelShowingId = 0;

// Decided by the request itself, so a repeat of the same request answers the same code.
const FINAL_ERROR_CODES: Set<string> = new Set([
	DateNavigationErrorCode.NotAvailable,
	DateNavigationErrorCode.WrongDateFormat,
	DateNavigationErrorCode.WrongRange,
	DateNavigationErrorCode.WrongTimezone,
]);

// More than one list can be subscribed at once (a channel and the comments opened over it).
const firstFilledAnswer = (answers: Array<mixed>): string => {
	return answers.find((answer) => Type.isStringFilled(answer)) ?? '';
};

// An empty tail of the history is a regular answer, not a failure: own wording, no retry.
export const getDateNavigationErrorText = (errorCode: RequestErrorCode): DateNavigationErrorText => {
	if (errorCode === DateNavigationErrorCode.MessageNotFound)
	{
		return { phraseCode: 'IM_SIDEBAR_SEARCH_MESSAGE_DATE_NAVIGATION_EMPTY_ERROR', canRetry: false };
	}

	return {
		phraseCode: 'IM_SIDEBAR_SEARCH_MESSAGE_DATE_NAVIGATION_REQUEST_ERROR',
		canRetry: !FINAL_ERROR_CODES.has(errorCode),
	};
};

// @vue/component
export const MessageSearchPanel = {
	name: 'MessageSearchPanel',
	components: {
		DateGroup,
		SearchItem,
		Loader,
		StartState,
		SearchHeader,
		DetailEmptySearchState,
		TariffLimit,
	},
	props: {
		dialogId: {
			type: String,
			required: true,
		},
		secondLevel: {
			type: Boolean,
			default: false,
		},
	},
	data(): JsonObject
	{
		return {
			searchQuery: '',
			isLoading: false,
			searchResult: [],
			currentServerQueries: 0,
			wasSearchStarted: false,
			isCalendarOpened: false,
			// the calendar is on its way and nothing is drawn yet: the button is busy, not expanded
			isCalendarLoading: false,
			// remembered for the whole life of the panel, so only the first opening waits
			calendarComponent: null,
			calendarTarget: null,
			calendarSelectedDate: '',
			calendarViewDate: '',
			calendarEntryPoint: DateNavigationEntryPoint.search,
		};
	},
	computed:
	{
		SidebarDetailBlock: () => SidebarDetailBlock,
		formattedCollection(): Array
		{
			const messages = this.searchResult.map((messageId) => {
				return this.$store.getters['messages/getById'](messageId);
			}).filter((item) => Boolean(item));

			return this.collectionFormatter.format(messages);
		},
		isEmptyState(): boolean
		{
			return this.preparedQuery.length > 0 && this.formattedCollection.length === 0;
		},
		preparedQuery(): string
		{
			return this.searchQuery.trim().toLowerCase();
		},
		dialog(): ImModelChat
		{
			return this.$store.getters['chats/get'](this.dialogId, true);
		},
		chatId(): number
		{
			return this.dialog.chatId;
		},
		hasHistoryLimit(): boolean
		{
			return this.$store.getters['sidebar/messageSearch/isHistoryLimitExceeded'](this.chatId);
		},
		isDateNavigationAvailable(): boolean
		{
			return FeatureManager.isFeatureAvailable(Feature.isMessageDateNavigationAvailable);
		},
	},
	watch:
	{
		preparedQuery(newQuery: string, previousQuery: string)
		{
			if (newQuery === previousQuery)
			{
				return;
			}

			this.service.resetSearchState();
			this.searchResult = [];
			this.startSearch(newQuery);
		},
	},
	created()
	{
		this.service = new MessageSearch({ dialogId: this.dialogId });
		// the only service of this dialog: the same instance goes to the calendar, which keeps its markup in it
		this.dateNavigationService = this.isDateNavigationAvailable
			? new DateNavigationService(this.dialogId)
			: null
		;
		this.collectionFormatter = new SidebarCollectionFormatter();
		this.searchOnServerDelayed = Runtime.debounce(this.searchOnServer, 500, this);
		// the jump started by the last picked day, and the bound of the wait for its outcome
		this.pendingDateNavigationJump = null;
		this.dateNavigationJumpTimer = null;
		// the loading of the calendar extension while it is in flight
		this.calendarComponentLoad = null;
		/**
		 * The panel is gone for good. A panel merely off screen keeps the calendar it loaded and still answers
		 * for the jump it started; a panel that is gone keeps nothing and answers for nothing, and the flag is
		 * never switched back.
		 */
		this.isPanelDestroyed = false;
		// the showing on screen now, zero while none is
		this.panelShowingId = 0;
		/**
		 * How many jumps this chat has been sent on, counted while the picked day is being resolved. The
		 * calendar closes on the pick, so the whole wait is open to anything else the user does - and an answer
		 * applied after one of those would undo a move made later and on purpose.
		 */
		this.dateResolveGeneration = 0;
	},
	mounted()
	{
		this.startPanelShowing();

		if (!this.isDateNavigationAvailable)
		{
			return;
		}

		this.getEmitter().subscribe(EventType.sidebar.openDateNavigation, this.onDateNavigationRequest);
		this.getEmitter().subscribe(EventType.dialog.dateNavigationJumpFinished, this.onDateNavigationJumpFinished);
		this.getEmitter().subscribe(
			EventType.dialog.messageContextJumpStarted,
			this.onMessageContextJumpStarted,
		);
		this.getEmitter().subscribe(
			EventType.dialog.dateNavigationContextApplying,
			this.onDateNavigationContextApplying,
		);
		void this.takePendingDateNavigation();
	},
	// KeepAlive in sidebar-panel.js: the first showing is a mount, every next one an activation.
	activated()
	{
		this.startPanelShowing();

		if (!this.isDateNavigationAvailable)
		{
			return;
		}

		void this.takePendingDateNavigation();
	},
	// Everything asked of this showing ends with it; what the panel loaded stays.
	deactivated()
	{
		this.endPanelShowing();
	},
	beforeUnmount()
	{
		// before anything else: the waits in flight are given up by the flag and the name of the showing
		this.isPanelDestroyed = true;
		this.endPanelShowing();

		// unconditionally, unlike the subscription: a flag switched off within the session would leave the
		// handlers of a destroyed panel in the emitter
		this.getEmitter().unsubscribe(EventType.sidebar.openDateNavigation, this.onDateNavigationRequest);
		this.getEmitter().unsubscribe(EventType.dialog.dateNavigationJumpFinished, this.onDateNavigationJumpFinished);
		this.getEmitter().unsubscribe(
			EventType.dialog.messageContextJumpStarted,
			this.onMessageContextJumpStarted,
		);
		this.getEmitter().unsubscribe(
			EventType.dialog.dateNavigationContextApplying,
			this.onDateNavigationContextApplying,
		);
		this.forgetDateNavigationJump();

		this.collectionFormatter.destroy();
	},
	methods:
	{
		searchOnServer(query: string)
		{
			this.currentServerQueries++;

			this.service.searchOnServer(query).then((messageIds: string[]) => {
				if (query !== this.preparedQuery)
				{
					this.isLoading = false;

					return;
				}

				this.searchResult = this.mergeResult(messageIds);
				Analytics.getInstance().messageSearch.onGetSearchResult(this.dialogId, this.searchResult);
			}).catch((error) => {
				console.error(error);
			}).finally(() => {
				this.currentServerQueries--;
				this.stopLoader();
			});
		},
		startSearch(query: string)
		{
			if (!this.wasSearchStarted)
			{
				Analytics.getInstance().messageSearch.onStartSearch(this.dialogId);
				this.wasSearchStarted = true;
			}

			if (query.length < 3)
			{
				return;
			}

			if (query.length >= 3)
			{
				this.isLoading = true;
				this.searchOnServerDelayed(query);
			}

			if (query.length === 0)
			{
				this.cleanSearchResult();
			}
		},
		stopLoader()
		{
			if (this.currentServerQueries > 0)
			{
				return;
			}

			this.isLoading = false;
		},
		cleanSearchResult()
		{
			this.searchResult = [];
		},
		needToLoadNextPage(event: Event): boolean
		{
			const target = event.target;

			return target.scrollTop + target.clientHeight >= target.scrollHeight - target.clientHeight;
		},
		onScroll(event: Event)
		{
			if (this.isLoading || this.preparedQuery.length === 0)
			{
				return;
			}

			if (!this.needToLoadNextPage(event) || !this.service.hasMoreItemsToLoad)
			{
				return;
			}

			this.isLoading = true;
			this.service.loadNextPage().then((messageIds) => {
				this.searchResult = this.mergeResult(messageIds);
				this.isLoading = false;
			}).catch((error) => {
				Logger.warn('Message Search: loadNextPage error', error);
			});
		},
		mergeResult(messageIds: string[]): string[]
		{
			return [...this.searchResult, ...messageIds].sort((a, z) => z - a);
		},
		onChangeQuery(query: string)
		{
			this.searchQuery = query;
		},
		// Vue calls both hooks on the first showing, and one showing keeps one name: renaming here would make
		// the request the mount is taking look like an answer of a showing already over.
		startPanelShowing()
		{
			this.panelShowingId ||= ++lastPanelShowingId;
		},
		// An opened calendar would otherwise come back with the next showing as the answer to a click abandoned
		// long before. The loading behind the busy button goes on, remembered for the next opening.
		endPanelShowing()
		{
			this.panelShowingId = 0;
			this.isCalendarLoading = false;
			this.onCalendarClose();
		},
		async onDateNavigationClick()
		{
			// the showing this click belongs to: the message list answers a microtask later at the earliest
			const showingId = this.panelShowingId;

			const viewDate = await this.getTopVisibleDate();
			if (this.panelShowingId !== showingId)
			{
				return;
			}

			this.openCalendarOnHeaderButton('', DateNavigationEntryPoint.search, viewDate);
		},
		// The month is the one of the messages the user sees, and that day belongs to the message list. An empty
		// answer is the current month - not an error.
		async getTopVisibleDate(): Promise<CalendarDay | ''>
		{
			const answers = await this.getEmitter().emitAsync(EventType.dialog.getTopVisibleDate, {
				dialogId: this.dialogId,
			});

			// a panel not on screen has no calendar to build, and every caller already handles the empty answer
			if (!this.panelShowingId)
			{
				return '';
			}

			return firstFilledAnswer(answers);
		},
		// The second entry is the day divider. The answer reports whether the calendar opened, so a panel that
		// found nothing to open it on does not cost the list the request it still keeps.
		onDateNavigationRequest(event: BaseEvent<{ dialogId: string, date: CalendarDay }>): boolean
		{
			const { dialogId, date } = event.getData();
			if (dialogId !== this.dialogId)
			{
				return false;
			}

			return this.openCalendarOnHeaderButton(date, DateNavigationEntryPoint.dateDivider);
		},
		// The list keeps the request until a panel takes it, so this entry does not depend on the flush the
		// panel appears in.
		async takePendingDateNavigation(): Promise<void>
		{
			const showingId = this.panelShowingId;

			const answers = await this.getEmitter().emitAsync(EventType.dialog.getPendingDateNavigation, {
				dialogId: this.dialogId,
			});

			// the list hands the request over once and forgets it, so a showing that ended drops it, and
			// one that came back asked the list for itself
			if (this.panelShowingId !== showingId)
			{
				return;
			}

			const date = firstFilledAnswer(answers);
			if (!date)
			{
				return;
			}

			this.openCalendarOnHeaderButton(date, DateNavigationEntryPoint.dateDivider);
		},
		// The header owns the element every entry binds the popup to; no button (feature off) means no opening.
		openCalendarOnHeaderButton(
			selectedDate: CalendarDay | '',
			entryPoint: $Values<typeof DateNavigationEntryPoint>,
			viewDate: CalendarDay | '' = '',
		): boolean
		{
			// The panel goes on listening off screen, and a calendar opened now would be drawn where nobody sees it.
			if (!this.panelShowingId)
			{
				return false;
			}

			const target = this.$refs.searchHeader?.getDateNavigationTarget();
			if (!target)
			{
				Logger.warn('MessageSearchPanel: nothing to bind the date navigation calendar to', this.dialogId);

				return false;
			}

			void this.openCalendar(target, selectedDate, entryPoint, viewDate);

			return true;
		},
		// The day is fixed when the picker is built, and the click that brought the request here already
		// asked that popup to close itself.
		async openCalendar(
			target: HTMLElement,
			selectedDate: CalendarDay | '',
			entryPoint: $Values<typeof DateNavigationEntryPoint>,
			viewDate: CalendarDay | '',
		)
		{
			// neither dropping the picker nor waiting for the extension is instant
			const showingId = this.panelShowingId;

			if (this.isCalendarOpened)
			{
				this.isCalendarOpened = false;
				await this.$nextTick();

				if (this.panelShowingId !== showingId)
				{
					return;
				}
			}

			this.calendarTarget = target;
			this.calendarSelectedDate = selectedDate;
			this.calendarViewDate = viewDate;
			this.calendarEntryPoint = entryPoint;

			// set after the wait: before it, aria-expanded said "expanded" over an empty screen
			const calendarComponent = await this.waitForCalendarComponent();

			// The showing ended while the extension was on its way. What it brought is kept regardless - it is
			// remembered by the loading, not by this opening.
			if (this.panelShowingId !== showingId)
			{
				return;
			}

			if (calendarComponent)
			{
				this.isCalendarOpened = true;

				return;
			}

			// Nothing was drawn, so the opening ends the way a failed jump does and without bringing the calendar
			// back - that is the very thing that has just failed. The focus goes where asking again starts from.
			this.onCalendarClose();
			this.showCalendarLoadError();
			this.focusDateNavigationButton();
		},
		// The button reports itself busy at once, and a wait that drags on is spoken as well: on a bad line
		// main.core retries the loading for about ten seconds before it gives up.
		async waitForCalendarComponent(): Promise<?Object>
		{
			if (this.calendarComponent)
			{
				return this.calendarComponent;
			}

			const showingId = this.panelShowingId;

			this.isCalendarLoading = true;
			const announceTimer = setTimeout(() => {
				// the live region belongs to the document, not to this panel
				if (this.panelShowingId !== showingId)
				{
					return;
				}

				LiveAnnouncer.announce(this.loc('IM_SIDEBAR_SEARCH_MESSAGE_DATE_NAVIGATION_LOADING'));
			}, CALENDAR_LOAD_ANNOUNCE_DELAY);

			try
			{
				return await this.loadCalendarComponent();
			}
			finally
			{
				clearTimeout(announceTimer);
				// the busy button belongs to the panel and not to one showing of it
				if (!this.isPanelDestroyed)
				{
					this.isCalendarLoading = false;
				}
			}
		},
		/**
		 * Remembered until the panel is gone; two openings in a row share the loading in flight.
		 * A refused loading is forgotten here, but main.core keeps the rejected promise under the same name, so
		 * the opening after a refusal gets that same refusal back without a request - hence the wording.
		 */
		async loadCalendarComponent(): Promise<?Object>
		{
			if (this.calendarComponent)
			{
				return this.calendarComponent;
			}

			this.calendarComponentLoad ??= Runtime.loadExtension(DATE_CALENDAR_EXTENSION);

			try
			{
				const { DateCalendar } = await waitAtMost(this.calendarComponentLoad, CALENDAR_LOAD_TIMEOUT);

				// the extension arrived for a panel that is gone: main.core keeps it for the next panel,
				// and a panel merely off screen does remember it
				if (this.isPanelDestroyed)
				{
					return null;
				}

				if (!DateCalendar)
				{
					throw new Error(`${DATE_CALENDAR_EXTENSION} brought no calendar component`);
				}

				this.calendarComponent = DateCalendar;
			}
			catch (error)
			{
				// not forgotten for a panel that is gone: it is a field of this panel alone
				if (this.isPanelDestroyed)
				{
					return null;
				}

				this.calendarComponentLoad = null;
				Logger.warn('MessageSearchPanel: date navigation calendar did not load', error);

				return null;
			}

			return this.calendarComponent;
		},
		// the panel is open in both entries whenever the feature is on, so the button is always there
		focusDateNavigationButton()
		{
			this.$refs.searchHeader?.focusDateNavigation();
		},
		// the entry point outlives the closed calendar: a retry reports the entry the user came from
		onCalendarClose()
		{
			this.isCalendarOpened = false;
			this.calendarTarget = null;
			this.calendarSelectedDate = '';
			this.calendarViewDate = '';
		},
		// The calendar closes itself on the pick, so the jump lives here and outlives both picker and request.
		async onCalendarDaySelect(payload: { date: CalendarDay })
		{
			Analytics.getInstance().messageSearch.onGoToDate({
				dialogId: this.dialogId,
				entryPoint: this.calendarEntryPoint,
				day: payload.date,
			});

			// taken before the request goes out and compared when it comes back
			const generation = this.dateResolveGeneration;

			const { status, errorCode, resolvedDate } = await this.dateNavigationService.resolveDate(payload.date);

			// Only being gone ends it: the jump was asked of the chat and the chat is still on screen, so a user who
			// left the panel for another one is taken to their day all the same.
			if (this.isPanelDestroyed)
			{
				return;
			}

			// Sending the chat to this day now would undo a move made later and on purpose: dropped, and
			// without a word.
			if (this.dateResolveGeneration !== generation)
			{
				return;
			}

			if (status === DateNavigationStatus.Cancelled)
			{
				// a later pick superseded this one, and only the latest one is applied
				return;
			}

			if (status !== DateNavigationStatus.Success || !resolvedDate)
			{
				// the failure answers the pick just made, so the calendar comes back on that day
				this.showDateNavigationError(errorCode, payload.date, { reopenCalendar: true });

				return;
			}

			// both halves travel on to a public event - the identifier into a selector of the message list, the day
			// into what the list reports the finished jump by
			const messageId = Number.parseInt(resolvedDate.messageId, 10);
			if (!Number.isInteger(messageId) || messageId <= 0 || !Type.isStringFilled(resolvedDate.date))
			{
				// no code of the contract fits an answer that broke it
				this.showDateNavigationError(null, payload.date, { reopenCalendar: true });

				return;
			}

			// the wait is started before the jump: an outcome arriving with nothing waiting for it is thrown away
			const jumpId = this.startDateNavigationJumpWait(payload.date, resolvedDate.date);

			this.getEmitter().emit(EventType.dialog.goToMessageContext, {
				messageId,
				dialogId: this.dialogId,
				// the day divider has no message id of its own: the date marks the jump as date-driven for the list
				date: resolvedDate.date,
				jumpId,
				// the divider is the whole answer: the ordinary highlight would light a second row up under it
				withMessageHighlight: false,
			});
		},
		// The list may still have to bring the page of the message in, and it says whether the day showed up.
		startDateNavigationJumpWait(pickedDate: CalendarDay, date: CalendarDay): number
		{
			this.forgetDateNavigationJump();

			lastDateNavigationJumpId += 1;
			this.pendingDateNavigationJump = { id: lastDateNavigationJumpId, date, pickedDate };
			this.dateNavigationJumpTimer = setTimeout(
				this.onDateNavigationJumpTimeout,
				DATE_NAVIGATION_JUMP_TIMEOUT,
			);

			return lastDateNavigationJumpId;
		},
		/**
		 * Every jump of this chat moves the generation, whoever started it - hence listening to the chat
		 * announcing a jump and not to the event asking for one. The panel's own pick cannot invalidate itself:
		 * the chat announces it within the emit, strictly after the comparison and with no await between.
		 */
		onMessageContextJumpStarted(event: BaseEvent<{ dialogId: string }>)
		{
			if (event.getData().dialogId !== this.dialogId)
			{
				return;
			}

			this.dateResolveGeneration += 1;
		},
		// From here the outcome is certain, and a timer left standing would answer a slow load with a failure.
		onDateNavigationContextApplying(event: BaseEvent<{ dialogId: string, jumpId: number }>)
		{
			const { dialogId, jumpId } = event.getData();
			const jump: ?PendingDateNavigationJump = this.pendingDateNavigationJump;
			if (dialogId !== this.dialogId || !jump || !jumpId || jump.id !== jumpId)
			{
				return;
			}

			clearTimeout(this.dateNavigationJumpTimer);
			this.dateNavigationJumpTimer = null;
		},
		// Matched by identifier and never by the day: two picks of the same day are alike in chat and in date.
		// An outcome naming no jump - a message list of an older bundle - is left to the timer of the panel.
		onDateNavigationJumpFinished(
			event: BaseEvent<{
				dialogId: string,
				date: CalendarDay,
				jumpId?: number,
				outcome: $Values<typeof DateNavigationJumpOutcome>,
			}>,
		)
		{
			const { dialogId, date, jumpId, outcome } = event.getData();
			const jump: ?PendingDateNavigationJump = this.pendingDateNavigationJump;
			if (dialogId !== this.dialogId || !jump || !jumpId || jump.id !== jumpId)
			{
				return;
			}

			this.forgetDateNavigationJump();

			if (outcome === DateNavigationJumpOutcome.cancelled)
			{
				// the user left the chat, or sent it somewhere else themselves, and that is the answer
				return;
			}

			if (outcome !== DateNavigationJumpOutcome.success)
			{
				// a jump that did not finish carries no code of the contract, and the repeat asks about the
			// day the user picked
				this.showDateNavigationError(null, jump.pickedDate);

				return;
			}

			// the failure of an earlier jump is answered by this one: its message would otherwise stay
			// on screen next to a chat that has already moved
			this.closeDateNavigationError();
			this.announceDateNavigationJump(date);
		},
		// Only a jump no chat confirmed reaches this: a confirmed one takes the timer off.
		onDateNavigationJumpTimeout()
		{
			const jump: ?PendingDateNavigationJump = this.pendingDateNavigationJump;
			if (!jump)
			{
				return;
			}

			this.forgetDateNavigationJump();
			this.showDateNavigationError(null, jump.pickedDate);
		},
		forgetDateNavigationJump()
		{
			clearTimeout(this.dateNavigationJumpTimer);
			this.dateNavigationJumpTimer = null;
			this.pendingDateNavigationJump = null;
		},
		// The jump shows itself by scrolling and lighting the divider - nothing a screen reader would report.
		announceDateNavigationJump(date: CalendarDay)
		{
			const dateText = DateFormatter.formatByTemplate(parseCalendarDay(date), DateTemplate.dateGroup);

			LiveAnnouncer.announce(
				this.loc('IM_SIDEBAR_SEARCH_MESSAGE_DATE_NAVIGATION_JUMP_ANNOUNCEMENT', { '#DATE#': dateText }),
			);
		},
		/**
		 * The balloon carries no live region of its own, so the failure is spoken here. `reopenCalendar` is
		 * asked for and never assumed: it moves the focus into a dialog, which is only right as the answer to
		 * something the user did just now.
		 */
		showDateNavigationError(
			errorCode: RequestErrorCode,
			date: CalendarDay,
			{ reopenCalendar = false }: { reopenCalendar?: boolean } = {},
		)
		{
			const { phraseCode, canRetry } = getDateNavigationErrorText(errorCode);
			const message = this.loc(phraseCode);

			LiveAnnouncer.announce(message, 'assertive');

			NotificationCenter.notify({
				id: DATE_NAVIGATION_NOTIFICATION_ID,
				content: message,
				blinkOnUpdate: false,
				actions: canRetry ? [this.getDateNavigationRetryAction(date)] : [],
			});

			this.setDateNavigationErrorTestIds();

			if (canRetry && reopenCalendar)
			{
				// the entry the user came from outlives the closed calendar, and the repeated jump belongs to it
				this.openCalendarOnHeaderButton(date, this.calendarEntryPoint);
			}
		},
		// Not a failure of the jump and not its wording: no date was picked. No repeat either - main.core keeps
		// the refused loading under the same name, so every later attempt gets the same refusal.
		showCalendarLoadError()
		{
			const message = this.loc('IM_SIDEBAR_SEARCH_MESSAGE_DATE_NAVIGATION_LOAD_ERROR');

			LiveAnnouncer.announce(message, 'assertive');

			NotificationCenter.notify({
				id: DATE_NAVIGATION_NOTIFICATION_ID,
				content: message,
				blinkOnUpdate: false,
				actions: [],
			});

			this.setDateNavigationErrorTestIds();
		},
		// the balloon lives outside the component and outlives the failure it was shown for
		closeDateNavigationError()
		{
			NotificationCenter.getBalloonById(DATE_NAVIGATION_NOTIFICATION_ID)?.close();
		},
		// Neither the id of the balloon nor the id of an action reaches the DOM, so the autotest anchors go on
		// the rendered nodes; a repeated failure rebuilds the actions, hence marking after every notify.
		setDateNavigationErrorTestIds()
		{
			const balloon: ?Balloon = NotificationCenter.getBalloonById(DATE_NAVIGATION_NOTIFICATION_ID);
			if (!balloon)
			{
				return;
			}

			Dom.attr(balloon.getContainer(), 'data-testid', DATE_NAVIGATION_ERROR_TEST_ID);
			balloon.getActions().forEach((action) => {
				Dom.attr(action.getContainer(), 'data-testid', DATE_NAVIGATION_RETRY_TEST_ID);
			});
		},
		// A picked day leaves no calendar behind: the grid closes itself, this one is closed here.
		getDateNavigationRetryAction(date: CalendarDay): ActionOptions
		{
			return {
				title: this.loc('IM_SIDEBAR_SEARCH_MESSAGE_DATE_NAVIGATION_RETRY'),
				events: {
					click: (event: Event, balloon: Balloon) => {
						balloon.close();
						this.onCalendarClose();
						void this.onCalendarDaySelect({ date });
					},
				},
			};
		},
		onClickBack()
		{
			this.getEmitter().emit(EventType.sidebar.close, { panel: SidebarDetailBlock.messageSearch });
		},
		getEmitter(): EventEmitter
		{
			return this.$Bitrix.eventEmitter;
		},
		loc(phraseCode: string, replacements: {[p: string]: string} = {}): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
		},
	},
	template: `
		<div class="bx-im-message-search-detail__scope" data-testid="im-sidebar-search-panel">
			<SearchHeader
				ref="searchHeader"
				:secondLevel="secondLevel"
				:isDateNavigationOpened="isCalendarOpened"
				:isDateNavigationLoading="isCalendarLoading"
				@changeQuery="onChangeQuery"
				@back="onClickBack"
				@dateNavigationClick="onDateNavigationClick"
			/>
			<div class="bx-im-message-search-detail__container bx-im-sidebar-detail__container" @scroll="onScroll">
				<StartState 
					v-if="!isLoading && preparedQuery.length === 0"
					:title="loc('IM_SIDEBAR_SEARCH_MESSAGE_START_TITLE')"
					:iconType="SidebarDetailBlock.messageSearch"
				/>
				<DetailEmptySearchState
					v-if="!isLoading && isEmptyState"
					:title="loc('IM_SIDEBAR_MESSAGE_SEARCH_NOT_FOUND')"
					:subTitle="loc('IM_SIDEBAR_MESSAGE_SEARCH_NOT_FOUND_DESCRIPTION')"
				/>
				<Loader v-if="isLoading && isEmptyState" class="bx-im-message-search-detail__loader" />
				<div v-for="dateGroup in formattedCollection" class="bx-im-message-search-detail__date-group_container">
					<DateGroup :dateText="dateGroup.dateGroupTitle" />
					<SearchItem
						v-for="item in dateGroup.items"
						:messageId="item.id"
						:dialogId="dialogId"
						:query="preparedQuery"
					/>
				</div>
				<TariffLimit
					v-if="hasHistoryLimit"
					:dialogId="dialogId"
					:panel="SidebarDetailBlock.messageSearch"
					class="bx-im-message-search-detail__tariff-limit-container"
				/>
			</div>
			<component
				:is="calendarComponent"
				v-if="isCalendarOpened && calendarComponent"
				:service="dateNavigationService"
				:bindElement="calendarTarget"
				:selectedDate="calendarSelectedDate"
				:viewDate="calendarViewDate"
				@daySelect="onCalendarDaySelect"
				@close="onCalendarClose"
			/>
		</div>
	`,
};
