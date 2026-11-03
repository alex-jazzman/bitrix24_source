/* global $Values */
import { type JsonObject } from 'main.core';
import { type BaseEvent, type EventEmitter } from 'main.core.events';

import { FadeAnimation } from 'im.v2.component.animation';
import {
	ChatType,
	DateNavigationJumpOutcome,
	DateNavigationJumpTimeout,
	EventType,
	HotkeyCombination,
	MessageComponent,
	ActionByRole,
	SidebarDetailBlock,
} from 'im.v2.const';
import { Feature, FeatureManager, TariffManager } from 'im.v2.lib.feature';
import { MessageMenuManager } from 'im.v2.lib.menu';
import { MessageComponentManager } from 'im.v2.lib.message-component';
import { PermissionManager } from 'im.v2.lib.permission';
import { Quote } from 'im.v2.lib.quote';
import { Utils } from 'im.v2.lib.utils';
import { type ImModelChat, type ImModelMessage, type ImModelUser } from 'im.v2.model';

import { AvatarMenu } from './classes/avatar-menu';
import { CollectionManager, type DateGroupItem } from './classes/collection-manager/collection-manager';
import { DateGroupHighlight } from './classes/date-group-highlight';
import { ObserverManager } from './classes/observer-manager';
import { AuthorGroup } from './components/block/author-group';
import { DateGroup } from './components/block/date-group';
import { MarkedMessagesBlock } from './components/block/marked-messages';
import { NewMessagesBlock } from './components/block/new-messages';
import { DialogLoader } from './components/dialog-loader';
import { DialogStatus } from './components/dialog-status/dialog-status';
import { EmptyState } from './components/empty-state';
import { HistoryLimitBanner } from './components/history-limit-banner';
import { MessageComponents } from './utils/message-components';
import { getTopVisibleDate } from './utils/top-visible-date';

import './css/message-list.css';

export { AvatarMenu } from './classes/avatar-menu';
export { AuthorGroup } from './components/block/author-group';
export { MessageComponents } from './utils/message-components';
export { CollectionManager } from './classes/collection-manager/collection-manager';

type ContextMenuEvent = BaseEvent<{
	message: ImModelMessage,
	dialogId: string,
	event: PointerEvent,
	bindElement?: HTMLElement
}>

// every jump of the chat, whatever it was started by; a jump that is not date-driven carries an
// empty day and no identifier
type MessageContextJumpStartedEvent = BaseEvent<{
	dialogId: string,
	messageId: number,
	date?: string,
	jumpId?: number
}>

// the identifier decides, the rest is the context of the jump it names
type DateNavigationContextAppliedEvent = BaseEvent<{
	dialogId: string,
	messageId: number,
	date: string,
	jumpId: number
}>

// both requests of the list are addressed by chat and answered with the return value (EventType)
type DateRequest = { dialogId: string };

/**
 * The anchor of a jump by date can arrive later than the jump itself, so the highlight waits for the
 * collection changes that follow: the page of the anchor normally comes with the first of them, and
 * a busy chat can change its collection while that page is still on its way.
 *
 * What ENDS the wait is the chat reporting the context of this very jump as applied
 * (`EventType.dialog.dateNavigationContextApplied`): by then the list has finished moving, so an
 * anchor still missing is an anchor that is never coming - a message deleted, a day with no history
 * behind it - and the failure is reported at once instead of being waited out. The wait ends when
 * the work ends, and the user is not kept in front of a finished screen for nine seconds.
 *
 * The two bounds below are what is left for a jump no report can be matched to: the wait is started
 * by the chat announcing the jump, and every report about it is addressed by the identifier the jump
 * carries, so a jump by date started without one is waited for by these two alone. Neither of them
 * can be dropped:
 * - the budget makes a busy chat stop searching the list on every change;
 * - the clock covers a chat that stopped changing and so stopped spending the budget, whose attempts
 *   left would otherwise be spent by whatever changes the collection next, lighting a day up long
 *   after the user was told the jump had failed.
 * Both are taken off the moment a chat says it has taken the jump on
 * (`EventType.dialog.dateNavigationContextApplying`): from there the report is certain however long
 * the loading runs, and either bound still standing would answer a jump in progress with a failure -
 * and be contradicted by the list moving to the day right after. The budget is no safer than the
 * clock here: it counts collection changes, and a chat busy enough to make twenty of them while the
 * context is loading spends it inside the loading it was never meant to interrupt. While they run,
 * they stay inside the window the side that started the jump gives them, so that the outcome still
 * reaches somebody waiting for it.
 */
const MAX_DATE_ANCHOR_ATTEMPTS = 20;

/**
 * A click on the divider asks the sidebar for the message search panel, and the panel may not be on
 * screen yet - so the request waits here until a panel takes it. The wait is bounded because an
 * unclaimed request must not survive the click that made it: a panel opened much later would jump to
 * the day of a click the user does not remember. The panel appears within the flush of the click in
 * practice, so the window covers a slow render and nothing more.
 */
const DATE_NAVIGATION_REQUEST_LIFETIME = 3000;

// @vue/component
export const MessageList = {
	name: 'MessageList',
	directives:
	{
		'message-observer': {
			mounted(element, binding)
			{
				binding.instance.observer.observeMessage(element);
			},
			beforeUnmount(element, binding)
			{
				binding.instance.observer.unobserveMessage(element);
			},
		},
	},
	components:
	{
		DateGroup,
		AuthorGroup,
		NewMessagesBlock,
		MarkedMessagesBlock,
		DialogStatus,
		DialogLoader,
		EmptyState,
		FadeAnimation,
		HistoryLimitBanner,
		...MessageComponents,
	},
	inject:
	{
		// the chat content reports which sidebar panel is in front; outside it the message list keeps
		// working and simply asks for the panel every time
		currentSidebarPanel: {
			default: '',
		},
	},
	props:
	{
		dialogId: {
			type: String,
			required: true,
		},
		containerHeight: {
			type: [Number, null],
			default: null,
		},
		scrollPinEnabled: {
			type: Boolean,
			default: false,
		},
		spacerHeight: {
			type: Number,
			default: 0,
		},
		spacerAnimated: {
			type: Boolean,
			default: false,
		},
		// external inline styles for individual messages, keyed by message id.
		// Keys are object keys and so always strings: a pending message addressed by its
		// send-time temporaryId (a uuid) and one addressed by a numeric server id match alike
		messageStyles: {
			/** @type {{ [messageId: string]: Object }} */
			type: Object,
			default: () => ({}),
		},
	},
	emits: ['spacerRiseEnd'],
	data(): JsonObject
	{
		return {
			windowFocused: false,
		};
	},
	computed:
	{
		dialog(): ImModelChat
		{
			return this.$store.getters['chats/get'](this.dialogId, true);
		},
		user(): ImModelUser
		{
			return this.$store.getters['users/get'](this.dialogId, true);
		},
		messageCollection(): ImModelMessage[]
		{
			return this.$store.getters['messages/getByChatId'](this.dialog.chatId);
		},
		isDateNavigationAvailable(): boolean
		{
			return FeatureManager.isFeatureAvailable(Feature.isMessageDateNavigationAvailable);
		},
		isUser(): boolean
		{
			return this.dialog.type === ChatType.user;
		},
		dialogInited(): boolean
		{
			return this.dialog.inited;
		},
		formattedCollection(): DateGroupItem[]
		{
			if (!this.dialogInited && this.messageCollection.length === 0)
			{
				return [];
			}

			return this.getCollectionManager().formatMessageCollection(this.messageCollection);
		},
		noMessages(): boolean
		{
			return this.formattedCollection.length === 0;
		},
		isHistoryLimitExceeded(): boolean
		{
			return !TariffManager.chatHistory.isAvailable() && this.dialog.tariffRestrictions.isHistoryLimitExceeded;
		},
		showDialogStatus(): boolean
		{
			// DialogStatus renders inside the scroll content below the spacer; its height and
			// late appearance disturb scroll-pin geometry (jerk the pinned question), so it is
			// hidden in pin chats (ERR-007).
			if (this.scrollPinEnabled)
			{
				return false;
			}

			return this.messageCollection.some((message) => {
				return message.id === this.dialog.lastMessageId;
			});
		},
		showEmptyState(): boolean
		{
			return this.dialogInited && this.noMessages && this.isUser && !this.isHistoryLimitExceeded;
		},
	},
	watch:
	{
		dialogId(): void
		{
			// nothing of the jump into the previous chat belongs to this one, and the side waiting
			// for that jump is told it will not finish. Cancelled and not failed: the user left of
			// their own accord, and an error about the chat they left is noise in the one they opened
			this.reportDateNavigationJump(DateNavigationJumpOutcome.cancelled);
			this.forgetDateNavigationRequest();
			this.dateGroupHighlight.clear();
		},
	},
	created()
	{
		this.initCollectionManager();
		this.initObserverManager();
		this.dateGroupHighlight = new DateGroupHighlight();
		// the jump by date the list is waiting for: the anchor to look for, the day to report back
		// and the chat the jump was started in - the list may leave that chat before the wait is over
		this.pendingDateAnchor = null;
		this.pendingDateNavigationDate = '';
		this.dateNavigationRequestTimer = null;
	},
	mounted()
	{
		this.subscribeToEvents();
	},
	beforeUnmount()
	{
		this.unsubscribeFromEvents();
		// the list is going away with the chat it belonged to - the same cancellation as leaving it
		this.reportDateNavigationJump(DateNavigationJumpOutcome.cancelled);
		this.forgetDateNavigationRequest();
		this.dateGroupHighlight.clear();
	},
	methods:
	{
		subscribeToEvents(): void
		{
			this.getEmitter().subscribe(EventType.dialog.onClickMessageContextMenu, this.onMessageContextMenuClick);
			this.getEmitter().subscribe(
				EventType.dialog.messageContextJumpStarted,
				this.onMessageContextJumpStarted,
			);
			// alongside the jump itself and not behind the feature gate: the wait is started by a jump
			// that carries a date, and the report that ends it has to reach the same waits
			this.getEmitter().subscribe(
				EventType.dialog.dateNavigationContextApplying,
				this.onDateNavigationContextApplying,
			);
			this.getEmitter().subscribe(
				EventType.dialog.dateNavigationContextApplied,
				this.onDateNavigationContextApplied,
			);

			if (this.isDateNavigationAvailable)
			{
				this.getEmitter().subscribe(EventType.dialog.getTopVisibleDate, this.onGetTopVisibleDate);
				this.getEmitter().subscribe(EventType.dialog.getPendingDateNavigation, this.onGetPendingDateNavigation);
			}
		},
		unsubscribeFromEvents(): void
		{
			this.getEmitter().unsubscribe(EventType.dialog.onClickMessageContextMenu, this.onMessageContextMenuClick);
			this.getEmitter().unsubscribe(
				EventType.dialog.messageContextJumpStarted,
				this.onMessageContextJumpStarted,
			);
			this.getEmitter().unsubscribe(
				EventType.dialog.dateNavigationContextApplying,
				this.onDateNavigationContextApplying,
			);
			this.getEmitter().unsubscribe(
				EventType.dialog.dateNavigationContextApplied,
				this.onDateNavigationContextApplied,
			);

			// unconditionally, unlike the subscription: the flag is read from the feature manager
			// anew here, so a flag switched off within the session would leave the handlers of a
			// destroyed component in the emitter. Unsubscribing what was never subscribed is a no-op
			this.getEmitter().unsubscribe(EventType.dialog.getTopVisibleDate, this.onGetTopVisibleDate);
			this.getEmitter().unsubscribe(EventType.dialog.getPendingDateNavigation, this.onGetPendingDateNavigation);
		},
		/**
		 * The calendar of the message search panel opens on the month of the messages the user sees
		 * now, and only the list knows which day that is. The panel asks for the day while
		 * it builds the calendar, and the day is read from the layout that is already on screen - it
		 * needs neither a frame nor a copy of itself in the store.
		 */
		onGetTopVisibleDate(event: BaseEvent<DateRequest>): string
		{
			const { dialogId } = event.getData();
			if (dialogId !== this.dialogId || !this.$refs.container)
			{
				return '';
			}

			return getTopVisibleDate(this.$refs.container);
		},
		/**
		 * The chat has started a jump - and the chat is asked and not the side that requested one:
		 * the request is one way of starting a jump among several, and a wait left standing through
		 * the jumps started by the others is a wait for an anchor that is not coming any more.
		 */
		onMessageContextJumpStarted(event: MessageContextJumpStartedEvent): void
		{
			const { dialogId, messageId, date, jumpId } = event.getData();
			if (dialogId !== this.dialogId)
			{
				return;
			}

			// a new jump supersedes the anchor the previous one may still be waiting for, and the
			// superseded jump is reported as cancelled instead of being dropped in silence: the side
			// waiting for it cannot see that it was superseded, and told nothing it would sit out its
			// own bound and answer with a failure the jump the user themselves replaced. Cancelled
			// and not failed - nothing failed, the user went somewhere else
			//
			// Reporting it whatever superseded it is safe because the report names the jump it
			// belongs to: another jump by date has already made the waiting side forget the
			// identifier of the old one, so that report meets nothing and is thrown away, while an
			// ordinary jump leaves the identifier in place and the wait ends the way it should
			this.reportDateNavigationJump(DateNavigationJumpOutcome.cancelled);

			// only a jump by date asks for the divider of the day; the other jumps highlight the
			// message alone and carry no date at all
			if (!date)
			{
				return;
			}

			const jump = {
				dialogId,
				messageId,
				date,
				jumpId,
				attempts: 0,
				takenByChat: false,
				stopWatching: null,
				timeoutId: null,
			};
			this.pendingDateAnchor = jump;
			// the collection is watched for the length of the wait alone: outside a jump by date
			// there is no anchor to look for, and every change would pay a search for nothing
			jump.stopWatching = this.$watch('formattedCollection', () => {
				void this.highlightPendingDateGroup();
			});
			jump.timeoutId = setTimeout(
				() => this.onDateAnchorWaitTimeout(jump),
				DateNavigationJumpTimeout.anchorWait,
			);
			void this.highlightPendingDateGroup();
		},
		/**
		 * The chat has taken the jump on and is loading the context. From here the outcome is
		 * certain: the chat reports the context as applied on a settled promise, so the report comes
		 * whether the loading succeeded, failed or was superseded. So BOTH bounds of the wait come
		 * off - they are there for a jump no chat ever took, and the wait itself is unchanged and
		 * still ends on the outcome. Left on, either of them would answer a load longer than its
		 * window with a failure, and the chat would then move to the day anyway, next to the error
		 * saying it had not.
		 *
		 * The clock is taken off by hand, the budget by the flag set here: a chat busy enough to
		 * change its collection twenty times while the context is loading would otherwise spend the
		 * budget on a jump that is still on its way - the very case the clock was taken off for.
		 *
		 * The identifier decides here for the same reason it decides below, and the confirmation
		 * cannot outrun the wait it belongs to: the chat announces the jump first and says this
		 * second, from the same method and with nothing between the two, so the wait is standing by
		 * the time the confirmation of it arrives.
		 */
		onDateNavigationContextApplying(event: BaseEvent<{ dialogId: string, jumpId: number }>): void
		{
			const { jumpId } = event.getData();
			const jump = this.pendingDateAnchor;
			if (!jumpId || !jump || jump.jumpId !== jumpId)
			{
				return;
			}

			jump.takenByChat = true;
			clearTimeout(jump.timeoutId);
			jump.timeoutId = null;
		},
		/**
		 * The chat has finished applying the context of the jump: the page of the message arrived,
		 * or it failed to, or the jump was superseded and its answer refused. Whichever of the three,
		 * the collection will not move for this jump any more, so one last look for the anchor
		 * decides it - found is the day lit up, missing is a message that is not there at all. Told
		 * now and not waited out: a jump that cannot land is the very case the clock used to spend
		 * its nine seconds on.
		 *
		 * Only the jump the list is waiting for is answered - a superseded jump reports as well, and
		 * its report belongs to a jump the list has already left.
		 *
		 * The identifier of the jump is what decides that, and nothing else can: the same day picked
		 * twice in a row resolves to the same message, so the chat, the message and the day of the
		 * superseded jump are every bit the same as those of the jump that replaced it. A report
		 * carrying no identifier at all names no jump and is left to the backstop above.
		 */
		async onDateNavigationContextApplied(event: DateNavigationContextAppliedEvent): Promise<void>
		{
			const { jumpId } = event.getData();
			const jump = this.pendingDateAnchor;
			if (!jumpId || !jump || jump.jumpId !== jumpId)
			{
				return;
			}

			await this.highlightPendingDateGroup();

			// still waiting means the attempt found nothing and reported nothing: the jump is over
			// either way, and this is the only side that knows it
			if (this.pendingDateAnchor === jump)
			{
				this.reportDateNavigationJump(DateNavigationJumpOutcome.failure);
			}
		},
		/**
		 * The wait ran out with the anchor still missing, and no chat ever said it had taken this
		 * jump on - a confirmation takes the clock off. So there is nothing left to wait for, and
		 * the jump is over exactly the way a spent budget ends it - the watcher goes back and the
		 * failure is reported - so that the day of a jump nobody waits for any more is never lit up
		 * by a change of the collection much later.
		 */
		onDateAnchorWaitTimeout(jump: Object): void
		{
			if (this.pendingDateAnchor !== jump)
			{
				return;
			}

			this.reportDateNavigationJump(DateNavigationJumpOutcome.failure);
		},
		/**
		 * The highlight goes on strictly after the jump: the dialog scrolls to the message and, if
		 * the message was not loaded yet, brings its page in first. Until the anchor is in the DOM
		 * there is nothing to address, so the request waits for the next collection change.
		 */
		async highlightPendingDateGroup(): Promise<void>
		{
			const jump = this.pendingDateAnchor;
			if (!jump)
			{
				return;
			}

			jump.attempts += 1;

			await this.$nextTick();

			// the wait can be over by the time the turn comes back: the anchor found by an attempt
			// started before this one, the jump superseded, the chat left
			if (this.pendingDateAnchor !== jump)
			{
				return;
			}

			try
			{
				const container = this.$refs.container;
				if (container && this.dateGroupHighlight.showByAnchor(container, jump.messageId))
				{
					this.reportDateNavigationJump(DateNavigationJumpOutcome.success);
				}
			}
			finally
			{
				// the budget is what makes the wait finite while no chat has taken the jump on, so it
				// is reached even when the attempt threw: otherwise the request would stay pending
				// and the collection watcher would throw again on every change of the list. Once a
				// chat has taken the jump on, the report of it is what ends the wait, and the budget
				// steps aside - see onDateNavigationContextApplying()
				const budgetSpent = !jump.takenByChat && jump.attempts >= MAX_DATE_ANCHOR_ATTEMPTS;
				if (this.pendingDateAnchor === jump && budgetSpent)
				{
					this.reportDateNavigationJump(DateNavigationJumpOutcome.failure);
				}
			}
		},
		/**
		 * The jump is over for the side that started it only when the divider is lit up or the wait
		 * is given up - until then the list is still where it was, and an answer given earlier would
		 * be an answer about a screen the user is not looking at.
		 *
		 * The report is addressed by the identifier of the jump and not by its day: two jumps to the
		 * same day carry the same chat, the same message and the same date, so only the identifier
		 * says which of them this outcome belongs to. It is taken from the jump the list stored, so
		 * every way out of the wait - the divider found, the budget spent, the clock, the chat left,
		 * the list going away, a jump superseding this one - names the same jump it started with.
		 */
		reportDateNavigationJump(outcome: $Values<typeof DateNavigationJumpOutcome>): void
		{
			const jump = this.pendingDateAnchor;
			if (!jump)
			{
				return;
			}

			this.forgetPendingDateGroup();

			this.getEmitter().emit(EventType.dialog.dateNavigationJumpFinished, {
				dialogId: jump.dialogId,
				date: jump.date,
				jumpId: jump.jumpId,
				outcome,
			});
		},
		forgetPendingDateGroup(): void
		{
			this.pendingDateAnchor?.stopWatching?.();
			clearTimeout(this.pendingDateAnchor?.timeoutId);
			this.pendingDateAnchor = null;
		},
		/**
		 * The divider of the day is the second entry into the calendar, and the calendar
		 * itself lives in the message search panel of the sidebar. The click therefore asks the
		 * sidebar for that panel and leaves the day here, where a panel takes it from - the one that
		 * appears asks for the day itself, the one already on screen is told below. Delivery this way
		 * depends neither on the flush the panel mounts in nor on which sidebar of the screen answered
		 * the request to open. An already opened panel is not asked to open again - the request would
		 * toggle it closed.
		 */
		async onDateNavigationClick(payload: { date: string }): Promise<void>
		{
			this.rememberDateNavigationRequest(payload.date);

			if (this.currentSidebarPanel !== SidebarDetailBlock.messageSearch)
			{
				this.getEmitter().emit(EventType.sidebar.open, {
					panel: SidebarDetailBlock.messageSearch,
					dialogId: this.dialogId,
				});

				// the tick lets the panel of this flush take the request and lets a panel that was
				// already living be re-addressed to this chat before it is told anything
				await this.$nextTick();
			}

			await this.announceDateNavigationRequest();
		},
		rememberDateNavigationRequest(date: string): void
		{
			this.forgetDateNavigationRequest();

			this.pendingDateNavigationDate = date;
			this.dateNavigationRequestTimer = setTimeout(
				this.forgetDateNavigationRequest,
				DATE_NAVIGATION_REQUEST_LIFETIME,
			);
		},
		forgetDateNavigationRequest(): void
		{
			clearTimeout(this.dateNavigationRequestTimer);
			this.dateNavigationRequestTimer = null;
			this.pendingDateNavigationDate = '';
		},
		/**
		 * A panel that is already on screen neither mounts nor activates, so nothing makes it ask -
		 * it is told instead, and it answers whether it took the request. A panel that took the
		 * request while the sidebar was opening leaves nothing to tell.
		 */
		async announceDateNavigationRequest(): Promise<void>
		{
			if (!this.pendingDateNavigationDate)
			{
				return;
			}

			const answers = await this.getEmitter().emitAsync(EventType.sidebar.openDateNavigation, {
				dialogId: this.dialogId,
				date: this.pendingDateNavigationDate,
			});

			if (answers.includes(true))
			{
				this.forgetDateNavigationRequest();
			}
		},
		// the request is given away once: whoever asks first opens the calendar, and a second asker
		// - the same panel mounted and activated in one flush - gets nothing to open twice
		onGetPendingDateNavigation(event: BaseEvent<DateRequest>): string
		{
			const { dialogId } = event.getData();
			if (dialogId !== this.dialogId || !this.pendingDateNavigationDate)
			{
				return '';
			}

			const date = this.pendingDateNavigationDate;
			this.forgetDateNavigationRequest();

			return date;
		},
		insertTextQuote(message: ImModelMessage): void
		{
			this.getEmitter().emit(EventType.textarea.insertText, {
				text: Quote.prepareInlineMessageQuote(message),
				withNewLine: true,
				replace: false,
				dialogId: this.dialogId,
			});
		},
		insertMention(user: ImModelUser): void
		{
			this.getEmitter().emit(EventType.textarea.insertMention, {
				mentionText: user.name,
				mentionReplacement: Utils.text.getMentionBbCode(user.id, user.name),
				mentionedUserId: user.id,
				dialogId: this.dialogId,
				isMentionSymbol: false,
			});
		},
		openReplyPanel(messageId: number): void
		{
			this.getEmitter().emit(EventType.textarea.replyMessage, {
				messageId,
				dialogId: this.dialogId,
			});
		},
		onAvatarClick(params: { dialogId: string, $event: PointerEvent })
		{
			const { dialogId, $event: event } = params;
			const user: ImModelUser = this.$store.getters['users/get'](dialogId);
			if (Utils.key.isAltOrOption(event))
			{
				this.insertMention(user);

				return;
			}

			const avatarMenu = new AvatarMenu({ emitter: this.getEmitter() });
			avatarMenu.openMenu({ user, dialog: this.dialog }, event.currentTarget);
		},
		onMessageContextMenuClick(eventData: ContextMenuEvent)
		{
			const { message, event, dialogId, bindElement } = eventData.getData();
			if (dialogId !== this.dialogId)
			{
				return;
			}

			const permissionManager = PermissionManager.getInstance();
			if (!permissionManager.canPerformActionByRole(ActionByRole.openMessageMenu, this.dialogId))
			{
				return;
			}

			if (Utils.key.isCombination(event, HotkeyCombination.messageMenu.quote))
			{
				this.insertTextQuote(message);

				return;
			}

			if (Utils.key.isCmdOrCtrl(event))
			{
				this.openReplyPanel(message.id);

				return;
			}

			const context = { dialogId: this.dialogId, ...message };

			const messageMenuManager = MessageMenuManager.getInstance();

			let target = {
				left: event.pageX,
				top: event.pageY,
			};

			if (bindElement)
			{
				target = bindElement;
			}

			messageMenuManager.openMenu({
				messageContext: context,
				applicationContext: { emitter: this.getEmitter() },
				target,
			});
		},
		initObserverManager()
		{
			this.observer = new ObserverManager({
				dialogId: this.dialogId,
				context: { emitter: this.getEmitter() },
			});
		},
		getMessageComponentName(message: ImModelMessage): $Values<typeof MessageComponent>
		{
			return (new MessageComponentManager(message)).getName();
		},
		initCollectionManager()
		{
			this.collectionManager = new CollectionManager(this.dialogId);
		},
		getCollectionManager(): CollectionManager
		{
			return this.collectionManager;
		},
		getEmitter(): EventEmitter
		{
			return this.$Bitrix.eventEmitter;
		},
		getMessageStyle(message: ImModelMessage): ?Object
		{
			return this.messageStyles[message.id] ?? null;
		},
		onSpacerTransitionEnd(event: TransitionEvent): void
		{
			if (event.propertyName === 'height')
			{
				this.$emit('spacerRiseEnd');
			}
		},
	},
	template: `
		<slot v-if="!dialogInited" name="loader">
			<DialogLoader />
		</slot>
		<FadeAnimation :duration="200">
			<div
				v-if="dialogInited"
				ref="container"
				class="bx-im-message-list__container"
				data-testid="im-message-list"
			>
				<EmptyState v-if="showEmptyState" :dialogId="dialogId" />
				<slot name="before-messages" :getMessageComponentName="getMessageComponentName"></slot>
				<HistoryLimitBanner v-if="isHistoryLimitExceeded" :dialogId="dialogId" :noMessages="noMessages" />
				<DateGroup
					v-for="dateGroup in formattedCollection"
					:key="dateGroup.dateTitle"
					:item="dateGroup"
					@dateNavigationClick="onDateNavigationClick"
				>
					<!-- Slot for every date group item -->
					<template #dateGroupItem="{ dateGroupItem, isMarkedBlock, isNewMessagesBlock, isAuthorBlock }">
						<MarkedMessagesBlock v-if="isMarkedBlock" data-id="newMessages" />
						<NewMessagesBlock v-else-if="isNewMessagesBlock" data-id="newMessages" />
						<AuthorGroup 
							v-else-if="isAuthorBlock" 
							:item="dateGroupItem"
							:contextDialogId="dialogId"
							@avatarClick="onAvatarClick"
						>
							<!-- Slot for every message -->
							<template #message="{ message, index }">
								<component
									v-message-observer
									:is="getMessageComponentName(message)"
									:withTitle="index === 0"
									:item="message"
									:dialogId="dialogId"
									:key="message.id"
									:data-viewed="message.viewed"
									:containerHeight="containerHeight"
									:style="getMessageStyle(message)"
								>
								</component>
							</template>
						</AuthorGroup>
					</template>
				</DateGroup>
				<div
					v-if="scrollPinEnabled"
					class="bx-im-dialog-chat__scroll-pin-spacer"
					:class="{ '--rising': spacerAnimated }"
					:style="{ height: spacerHeight + 'px' }"
					data-testid="im-dialog-scroll-pin-spacer"
					aria-hidden="true"
					@transitionend="onSpacerTransitionEnd"
				></div>
				<DialogStatus v-if="showDialogStatus" :dialogId="dialogId" />
			</div>
		</FadeAnimation>
	`,
};
