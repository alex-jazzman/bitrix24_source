import { Runtime, Event, Dom } from 'main.core';
import { EventEmitter, type BaseEvent } from 'main.core.events';
import { PopupManager } from 'main.popup';

import { PullStatus } from 'pull.vue3.status';

import { Core } from 'im.v2.application.core';
import { GuestNamePopup } from 'im.v2.component.elements.guest-name-popup';
import { ForwardPopup } from 'im.v2.component.entity-selector';
import { MessageList } from 'im.v2.component.message-list';
import {
	DialogBlockType as BlockType,
	EventType,
	PopupType,
	DialogScrollThreshold,
	UserRole,
	ActionByRole,
	ErrorCode,
	AnchorType,
	type ScrollToBottomEvent,
} from 'im.v2.const';
import { GuestManager } from 'im.v2.lib.guest';
import { MessageAccessManager } from 'im.v2.lib.access';
import { Analytics } from 'im.v2.lib.analytics';
import { CallManager } from 'im.v2.lib.call';
import { TariffManager } from 'im.v2.lib.feature';
import { LayoutManager } from 'im.v2.lib.layout';
import { Logger } from 'im.v2.lib.logger';
import { PermissionManager } from 'im.v2.lib.permission';
import { type ImModelMessage, type ImModelChat, type ImModelLayout } from 'im.v2.model';
import { ChatService } from 'im.v2.provider.service.chat';
import { MessageService } from 'im.v2.provider.service.message';

import { AnchorService } from './classes/anchor-service';
import { PullWatchManager } from './classes/pull-watch-manager';
import { ScrollManager } from './classes/scroll-manager';
import { ScrollPinController, ScrollPinRegion, consumePendingAnchor } from './classes/scroll-pin-controller';
import { isScrollPinApplicable } from './classes/scroll-pin-policy';
import { VisibleMessagesManager } from './classes/visible-messages-manager';
import { FloatButtons } from './components/float-buttons';
import { PinnedMessages } from './components/pinned/pinned-messages';
import { QuoteButton } from './components/quote-button';
import { findUniqueNumbers } from './helpers/find-unique-numbers';
import { sequentialize } from './helpers/sequentialize';

import './css/chat-dialog.css';
import './css/float-button.css';

export { ScrollManager } from './classes/scroll-manager';
export { PinnedMessages } from './components/pinned/pinned-messages';
export { FloatButton, FloatButtonIcon, FloatButtonColor } from './components/float-button';

type GoToMessageContextParams = {
	position?: string,
	// off for a jump by date: there the message list lights the divider of the day up, and the day
	// and the message lit up at once read as two jumps instead of one
	withMessageHighlight?: boolean,
	// the two fields of a jump by date, filled in together: the day the jump is answered by and the
	// identifier every report about it is addressed with. An ordinary jump carries neither
	date?: string,
	jumpId?: number,
};

// @vue/component
export const ChatDialog = {
	name: 'ChatDialog',
	components: {
		MessageList,
		PinnedMessages,
		QuoteButton,
		FloatButtons,
		PullStatus,
		ForwardPopup,
		GuestNamePopup,
	},
	props: {
		dialogId: {
			type: String,
			default: '',
		},
		saveScrollOnExit: {
			type: Boolean,
			default: true,
		},
		reloadOnExit: {
			type: Boolean,
			default: true,
		},
		clearOnExit: {
			type: Boolean,
			default: false,
		},
		directForward: {
			type: Boolean,
			default: false,
		},
	},
	data(): Object
	{
		return {
			forwardPopup: {
				show: false,
				messagesIds: [],
			},
			contextMode: {
				active: false,
				messageIsLoaded: false,
			},
			isScrolledUp: false,
			windowFocused: false,
			showQuoteButton: false,
			isJumpingToAnchor: false,
			messagesToRead: new Set(),
			containerHeight: 0,
			quoteButtonPosition: {},
			shouldShowGuestNamePopup: false,
			scrollPinEnabled: false,
			scrollPinSpacerHeight: 0,
			scrollPinSpacerAnimated: false,
			scrollPinMessageStyles: {},
		};
	},
	computed:
	{
		layout(): ImModelLayout
		{
			return this.$store.getters['application/getLayout'];
		},
		dialog(): ImModelChat
		{
			return this.$store.getters['chats/get'](this.dialogId, true);
		},
		isChatOpenedInWidget(): boolean
		{
			return this.$store.getters['copilot/isChatOpenedInWidget'](this.dialogId);
		},
		shouldForwardDirectly(): boolean
		{
			return this.directForward || this.isChatOpenedInWidget;
		},
		dialogInited(): boolean
		{
			return this.dialog.inited;
		},
		messageCollection(): ImModelMessage[]
		{
			return this.$store.getters['messages/getByChatId'](this.dialog.chatId);
		},
		pinnedMessages(): ImModelMessage[]
		{
			return this.$store.getters['messages/pin/getPinned'](this.dialog.chatId);
		},
		chatCounter(): number
		{
			return this.$store.getters['counters/getCounterByChatId'](this.dialog.chatId);
		},
		isOpened(): boolean
		{
			const openedDialogId = this.$store.getters['application/getLayout'].entityId;

			return this.dialogId === openedDialogId;
		},
		isGuest(): boolean
		{
			return this.dialog.role === UserRole.guest;
		},
		isCurrentUserGuest(): boolean
		{
			return this.$store.getters['users/isGuest'](Core.getUserId());
		},
		debouncedScrollHandler(): Function
		{
			const SCROLLING_DEBOUNCE_DELAY = 100;

			return Runtime.debounce(this.getScrollManager().onScroll, SCROLLING_DEBOUNCE_DELAY, this.getScrollManager());
		},
		debouncedReadHandler(): Function
		{
			const READING_DEBOUNCE_DELAY = 50;

			return Runtime.debounce(this.readQueuedMessages, READING_DEBOUNCE_DELAY, this);
		},
		sequentiallyHighlightMessageHandler(): Function
		{
			return sequentialize(this.highlightMessage, 300, this);
		},
		showScrollButton(): boolean
		{
			return this.isScrolledUp || this.dialog.hasNextPage;
		},
		anchorMessages(): number[]
		{
			return this.$store.getters['messages/anchors/getChatMessageIdsWithAnchors'](this.dialog.chatId);
		},
		hasCommentsOnTop(): boolean
		{
			return this.$store.getters['messages/comments/areOpenedForChannel'](this.dialogId);
		},
	},
	watch:
	{
		anchorMessages(newValue: number[], oldValue: number[])
		{
			const newMessageIdsWithAnchor = findUniqueNumbers(newValue, oldValue);
			const visibleMessageIds = this.getVisibleMessagesManager().getVisibleMessages();

			newMessageIdsWithAnchor.forEach((messageId) => {
				if (visibleMessageIds.includes(messageId))
				{
					this.getAnchorService().debouncedReadMessageAnchors(messageId);
				}
			});
		},
		dialogInited(newValue: boolean, oldValue: boolean)
		{
			if (!newValue || oldValue)
			{
				return;
			}
			// first opening
			this.getPullWatchManager().subscribe();
			this.onChatInited();
		},
		hasCommentsOnTop: {
			handler(newValue: boolean)
			{
				const commentsWereClosed = newValue === false;
				if (!commentsWereClosed)
				{
					return;
				}

				this.readVisibleMessages();
			},
			flush: 'post',
		},
	},
	created()
	{
		Logger.warn('Dialog: Chat created', this.dialogId);
		// the jumps to a message context of this chat: the one asked for last wins, so they are
		// numbered and the number decides wherever a jump would touch the list - see
		// goToMessageContext()
		this.messageContextGeneration = 0;
		// how many of them are loading right now: the loading bar belongs to all of them at once
		this.messageContextLoads = 0;
		this.initContextMode();
	},
	async mounted()
	{
		await this.$nextTick();
		this.containerHeight = this.$refs.container.clientHeight;

		this.shouldShowGuestNamePopup = GuestManager.getInstance().getGuestNamePopupState();
		this.getScrollManager().setContainer(this.getContainer());
		this.getScrollManager().observeResize();
		if (isScrollPinApplicable(this.dialogId))
		{
			this.scrollPinEnabled = true;
			this.getScrollPinController().attach();
			this.getScrollManager().setScrollPinHooks({
				getSpacerHeight: () => this.scrollPinController?.getSpacerHeight() ?? 0,
				isPinActive: () => this.scrollPinController?.isActive() ?? false,
				onContainerHeightChange: () => this.scrollPinController?.onHeightChange(ScrollPinRegion.container),
			});
		}
		if (this.dialogInited)
		{
			// second+ opening
			this.getPullWatchManager().subscribe();
			this.onChatInited();
		}
		// there are P&P messages
		else if (!this.dialogInited && this.messageCollection.length > 0)
		{
			this.scrollOnStart();
		}

		this.windowFocused = document.hasFocus();

		this.subscribeToEvents();
	},
	beforeUnmount()
	{
		this.unsubscribeFromEvents();
		this.getScrollManager().destroy();
		if (this.dialogInited)
		{
			this.saveScrollPosition();
			void this.handleMessagesOnExit();
		}
		// destroy the pin controller after saving: saveScrollPosition() reads its active
		// state, and destroy() would reset it
		this.scrollPinController?.destroy();
		this.getPullWatchManager().unsubscribe();
		this.closeDialogPopups();
		this.forwardPopup.show = false;
		this.readAllAnchors();

		this.getEmitter().emit(EventType.dialog.onCloseChat, { dialogId: this.dialogId });
	},
	methods:
	{
		async scrollOnStart(): void
		{
			await this.$nextTick();

			const positionBeforeStartScroll = this.getContainer()?.scrollTop ?? 0;
			this.applyStartScroll();
			// the feed holds the position the start scroll chose until the user moves it away, so a
			// container shrinking in the same frame does not drag it off the New messages mark
			this.getScrollManager().markStartScrollPosition(positionBeforeStartScroll);
		},
		applyStartScroll(): void
		{
			// a question sent from the draft empty state before this feed mounted (AC-005/006):
			// it takes priority over the whole start-scroll chain and pins instantly
			if (this.scrollPinEnabled)
			{
				const pending = consumePendingAnchor(this.dialogId);
				if (pending)
				{
					this.getScrollPinController().pinFromStart(pending.messageId);

					return;
				}
			}

			// we loaded chat with context
			if (this.contextMode.active && this.contextMode.messageIsLoaded)
			{
				this.getScrollManager().scrollToMessage(this.layout.contextId);
				void this.$nextTick(() => {
					this.highlightMessage(this.layout.contextId);
				});

				return;
			}

			// chat was loaded before
			if (this.contextMode.active && !this.contextMode.messageIsLoaded)
			{
				this.goToMessageContext(this.layout.contextId);

				return;
			}

			// marked message
			if (this.dialog.markedId)
			{
				this.getScrollManager().scrollToMessage(BlockType.newMessages);

				return;
			}

			// saved position
			if (this.dialog.savedPositionMessageId && !this.isGuest)
			{
				Logger.warn('Dialog: saved scroll position, scrolling to', this.dialog.savedPositionMessageId);
				this.getScrollManager().scrollToMessage(this.dialog.savedPositionMessageId, { withDateOffset: false });

				return;
			}

			const lastReadId = this.$store.getters['chats/getLastReadId'](this.dialogId);
			const isLastMessageId = lastReadId === this.dialog.lastMessageId;
			// unread messages and read messages before them
			if (lastReadId > 0 && !isLastMessageId)
			{
				Logger.warn('Dialog: scroll to "New messages" mark, lastReadId -', lastReadId, 'lastMessageId', this.dialog.lastMessageId);
				this.getScrollManager().scrollToMessage(BlockType.newMessages);

				return;
			}

			// new chat, unread messages without read messages before them
			const hasUnread = this.$store.getters['messages/getFirstUnread'](this.dialog.chatId);
			if (lastReadId === 0 || hasUnread)
			{
				this.getScrollManager().setStartScrollNeeded(false);
				Logger.warn('Dialog: dont scroll, hasUnread -', hasUnread, 'lastReadId', lastReadId);

				return;
			}

			// no unread messages
			this.getScrollManager().scrollToBottom();
		},
		showLoadingBar(): void
		{
			this.getEmitter().emit(EventType.dialog.showLoadingBar, { dialogId: this.dialogId });
		},
		hideLoadingBar(): void
		{
			this.getEmitter().emit(EventType.dialog.hideLoadingBar, { dialogId: this.dialogId });
		},
		/**
		 * Loading a context replaces the whole message collection, and the request behind it cannot
		 * be called back: two jumps at once would leave the list on whichever answer came back last,
		 * which is not the message asked for last. So the jumps are numbered, and the number is asked
		 * at every point where a jump would touch the list - the collection included, through the
		 * `isActual` of the load.
		 *
		 * The number and not a queue: a jump made to wait out the request of the one before it makes
		 * the last thing the user did the slowest thing on screen, for as long as a request nobody
		 * wants any more takes to time out. They run side by side instead, and only the current one
		 * is allowed to move anything.
		 *
		 * Everything a jump is announced by is announced from HERE and not from the handler of the
		 * event that asks for one: the event is one way of asking among several - the comments button
		 * of a channel and a chat opened on a message context call this method by ref, the pinned bar
		 * and the context mode of the layout from inside the chat - and a side that heard only about
		 * the jumps asked for by event would keep waiting for something the user has already replaced.
		 */
		goToMessageContext(messageId: number, params: GoToMessageContextParams = {}): Promise
		{
			// an explicit navigation cancels the pin before its own scroll; the spacer stays
			// frozen so the content bottom holds until the next send (AC-008)
			this.scrollPinController?.freeze();

			this.messageContextGeneration += 1;
			// the generation alone stops the jump before this one only where it asks - and an animated
			// scroll asks nothing until it lands, so it would go on moving the list all the while this
			// jump loads its context. Cut short here, it leaves the list where the user replaced it
			this.getScrollManager().cancelAnimatedScroll();

			const { date = '', jumpId = 0 } = params;
			const jump = { dialogId: this.dialogId, messageId, date, jumpId };
			this.getEmitter().emit(EventType.dialog.messageContextJumpStarted, jump);
			if (date)
			{
				// after the jump itself and before the loading: the sides waiting for this jump learn
				// of it from the announcement above, and what they are told here is that its bounds
				// can come off - so the two are sent in this order and from the same place, instead
				// of depending on who subscribed to what first
				this.getEmitter().emit(EventType.dialog.dateNavigationContextApplying, {
					dialogId: this.dialogId,
					jumpId,
				});
			}

			const applying = this.applyMessageContext(messageId, params, this.messageContextGeneration);
			// most callers start a jump and walk away from the promise; a rejection with nobody
			// listening is an unhandled rejection in the console and nothing more useful than that
			applying.catch(() => {});

			if (date)
			{
				void this.reportDateNavigationContextApplied(applying, jump);
			}

			return applying;
		},
		async applyMessageContext(messageId: number, params: GoToMessageContextParams, generation: number): void
		{
			const {
				position = ScrollManager.scrollPosition.messageTop,
				withMessageHighlight = true,
			} = params;
			// asked back after every wait: a jump the user has replaced must move nothing, neither
			// the collection nor the scroll of a list that belongs to the jump after it now
			const isActual = () => generation === this.messageContextGeneration;
			const hasMessage = this.$store.getters['messages/hasMessage']({
				chatId: this.dialog.chatId,
				messageId,
			});
			if (hasMessage)
			{
				Logger.warn('Dialog: we have this message, scrolling to it', messageId);

				await this.getScrollManager().animatedScrollToMessage(messageId, { position });
				if (withMessageHighlight && isActual())
				{
					this.highlightMessage(messageId);
				}

				return;
			}

			const { hasAccess, errorCode } = await MessageAccessManager.checkMessageAccess(messageId);
			if (!isActual())
			{
				Logger.warn('Dialog: the jump to', messageId, 'is superseded by a later one');

				return;
			}

			if (!hasAccess && errorCode === ErrorCode.message.accessDeniedByTariff)
			{
				Analytics.getInstance().historyLimit.onGoToContextLimitExceeded({ dialogId: this.dialogId });
				TariffManager.chatHistory.openFeatureSlider();

				return;
			}

			this.showContextLoadingBar();
			try
			{
				await this.getMessageService().loadContext(messageId, { isActual });
				await this.$nextTick();
			}
			finally
			{
				this.hideContextLoadingBar();
			}

			if (!isActual())
			{
				Logger.warn('Dialog: the jump to', messageId, 'is superseded by a later one');

				return;
			}

			this.getScrollManager().scrollToMessage(messageId, { position });
			await this.$nextTick();
			if (withMessageHighlight)
			{
				this.highlightMessage(messageId);
			}
		},
		/**
		 * The bar of a context load, raised by the first jump loading one and lowered by the last:
		 * several of them run side by side, and a jump superseded on the way must not take down the
		 * bar of the jump that replaced it - nor leave one standing when it is the last to finish.
		 * Kept in balance by the caller pairing the two around a `finally`.
		 */
		showContextLoadingBar(): void
		{
			this.messageContextLoads += 1;
			if (this.messageContextLoads === 1)
			{
				this.showLoadingBar();
			}
		},
		hideContextLoadingBar(): void
		{
			this.messageContextLoads -= 1;
			if (this.messageContextLoads === 0)
			{
				this.hideLoadingBar();
			}
		},
		highlightMessage(messageId: number)
		{
			const HIGHLIGHT_CLASS = 'bx-im-dialog-chat__highlighted-message';
			const HIGHLIGHT_DURATION = 2000;

			const message = this.getScrollManager().getDomElementById(messageId);
			if (!message)
			{
				return;
			}

			Dom.addClass(message, HIGHLIGHT_CLASS);
			setTimeout(() => {
				Dom.removeClass(message, HIGHLIGHT_CLASS);
			}, HIGHLIGHT_DURATION);
		},
		saveScrollPosition()
		{
			if (!this.saveScrollOnExit)
			{
				return;
			}
			let savedPositionMessageId = this.getVisibleMessagesManager().getFirstMessageId();
			// an active pin sits at the content bottom; record "was at the bottom" so the chat
			// reopens by the usual rules, not glued to a stale pinned message (AC-016)
			if (this.getScrollManager().isAtBottomUnlessUserLeft() || this.isScrollPinActive())
			{
				savedPositionMessageId = 0;
			}
			this.$store.dispatch('chats/update', {
				dialogId: this.dialogId,
				fields: { savedPositionMessageId },
			});
		},
		async handleMessagesOnExit()
		{
			if (this.clearOnExit)
			{
				void this.getChatService().clearChat(this.dialogId);

				return;
			}

			await this.getChatService().readChatQueuedMessages(this.dialog.chatId);

			if (this.reloadOnExit)
			{
				const LOAD_MESSAGES_ON_EXIT_DELAY = 200;
				setTimeout(async () => {
					this.getMessageService().reloadMessageList();
				}, LOAD_MESSAGES_ON_EXIT_DELAY);
			}
		},
		/* region Reading */
		readQueuedMessages(): void
		{
			if (!this.messagesCanBeRead())
			{
				return;
			}

			[...this.messagesToRead].forEach((messageId) => {
				this.getChatService().readMessage(this.dialog.chatId, messageId);
				this.messagesToRead.delete(messageId);
			});
		},
		readVisibleMessages(): void
		{
			if (!this.messagesCanBeRead())
			{
				return;
			}

			const visibleMessages = this.getVisibleMessagesManager().getVisibleMessages();
			visibleMessages.forEach((messageId) => {
				const message: ImModelMessage = this.$store.getters['messages/getById'](messageId);
				if (!message || message.viewed)
				{
					return;
				}

				this.getChatService().readMessage(this.dialog.chatId, messageId);
			});
		},
		readAllAnchors(): void
		{
			if (this.$store.getters['messages/anchors/isChatHasAnchors'](this.dialog.chatId))
			{
				this.getAnchorService().readChatAnchors(this.dialog.chatId);
			}
		},
		messagesCanBeRead(): boolean
		{
			if (!this.dialogInited || !this.isChatVisible())
			{
				return false;
			}

			const permissionManager = PermissionManager.getInstance();

			return permissionManager.canPerformActionByRole(ActionByRole.readMessage, this.dialogId);
		},
		/* endregion Reading */
		/* region Event handlers */
		onChatInited()
		{
			this.scrollOnStart();
			this.readVisibleMessages();

			void this.$nextTick(() => {
				this.getChatService().clearDialogMark(this.dialogId);
			});

			this.sendInitEvents();
			this.sendGuestIdentifiedEvent();
		},
		async onScrollTriggerUp()
		{
			if (!this.dialogInited || !this.getContainer())
			{
				return;
			}

			Logger.warn('Dialog: scroll triggered UP');
			const container = this.getContainer();
			const oldHeight = container.scrollHeight - container.clientHeight;

			// Insert messages if there are some
			if (this.getMessageService().hasPreparedHistoryMessages())
			{
				await this.getMessageService().drawPreparedHistoryMessages();
				this.getScrollManager().adjustScrollOnHistoryAddition(oldHeight);

				return;
			}

			// check if already loading or no more history
			if (this.getMessageService().isLoading() || !this.dialog.hasPrevPage)
			{
				return;
			}

			// Load messages and save them
			this.showLoadingBar();
			await this.getMessageService().loadHistory();
			this.hideLoadingBar();
			// Messages loaded and we are at the top
			if (this.getScrollManager().isAtTheTop())
			{
				Logger.warn('Dialog: we are at the top after history request, inserting messages');
				await this.getMessageService().drawPreparedHistoryMessages();
				this.getScrollManager().adjustScrollOnHistoryAddition(oldHeight);
			}
		},
		async onScrollTriggerDown()
		{
			if (!this.dialogInited || !this.getContainer())
			{
				return;
			}

			Logger.warn('Dialog: scroll triggered DOWN');
			// Insert messages if there are some
			if (this.getMessageService().hasPreparedUnreadMessages())
			{
				await this.getMessageService().drawPreparedUnreadMessages();

				return;
			}

			// check if already loading or no more history
			if (this.getMessageService().isLoading() || !this.dialog.hasNextPage)
			{
				return;
			}

			// Load messages and save them
			this.showLoadingBar();
			await this.getMessageService().loadUnread();
			this.hideLoadingBar();
			// Messages loaded and we are at the bottom
			if (this.getScrollManager().isAtOrBelowContentBottom())
			{
				Logger.warn('Dialog: we are at the bottom after unread request, inserting messages');
				await this.getMessageService().drawPreparedUnreadMessages();
				this.getScrollManager().checkIfChatIsScrolledUp();
			}
		},
		async onScrollToBottom(event: BaseEvent<ScrollToBottomEvent>)
		{
			const { chatId, threshold = DialogScrollThreshold.halfScreenUp, animation = true } = event.getData();
			if (this.dialog.chatId !== chatId)
			{
				return;
			}

			// while a question is pinned every "to bottom" input is ignored (streaming,
			// pull, force scroll, textarea growth); only the pin event changes the position
			if (this.isScrollPinActive())
			{
				return;
			}

			if (!this.windowFocused || this.hasVisibleCall())
			{
				const firstUnreadId = this.$store.getters['messages/getFirstUnread'](this.dialog.chatId);
				if (firstUnreadId)
				{
					await this.$nextTick();
					this.getScrollManager().scrollToMessage(firstUnreadId);

					return;
				}
			}

			Logger.warn('Dialog: scroll to bottom', chatId, threshold);
			if (threshold === DialogScrollThreshold.halfScreenUp && this.isScrolledUp)
			{
				return;
			}

			if (threshold === DialogScrollThreshold.nearTheBottom && !this.getScrollManager().shouldFollowNewContent())
			{
				return;
			}

			await this.$nextTick();
			if (animation)
			{
				this.getScrollManager().animatedScrollToBottom();

				return;
			}

			this.getScrollManager().scrollToBottom();
		},
		onGoToMessageContext(event: BaseEvent)
		{
			const { dialogId, messageId, date, jumpId, withMessageHighlight } = event.getData();
			if (this.dialog.dialogId !== dialogId)
			{
				return;
			}

			// the fields of a jump by date travel on into the jump instead of being acted upon here:
			// what is said about a jump is said by the jump itself, so that a jump started by a
			// direct call is announced the same way as one asked for by this event
			this.goToMessageContext(messageId, { withMessageHighlight, date, jumpId });
		},
		/**
		 * Settled and not succeeded: a context that failed to load and a jump whose answer was refused
		 * as superseded both leave the list where it is, which is exactly what the message list has
		 * to tell from an anchor still on its way. The report is carried back under the identifier the
		 * jump arrived with and nothing of it is reinterpreted here - the side that started the jump
		 * is the one that names it, and the message list answers only for the jump it is waiting for.
		 */
		async reportDateNavigationContextApplied(applying: Promise, jump: Object): Promise<void>
		{
			await applying.catch(() => {});

			this.getEmitter().emit(EventType.dialog.dateNavigationContextApplied, jump);
		},
		onPinnedMessageClick(messageId: number)
		{
			this.goToMessageContext(messageId);
		},
		onPinnedMessageUnpin(messageId: number)
		{
			this.getMessageService().unpinMessage(this.dialog.chatId, messageId);
			Analytics.getInstance().messagePins.onUnpin({ dialogId: this.dialogId });
		},
		onScroll(event: Event)
		{
			this.closeDialogPopups();
			// the gesture is classified here, not in the debounced handler: 100ms later the
			// programmatic-scroll flag is already cleared and the pin's own moves read as manual
			this.getScrollManager().onRawScroll();
			this.debouncedScrollHandler(event);
		},
		async onScrollButtonClick()
		{
			// the down button is an explicit cancel: drop the spacer (with compensation) and
			// scroll to the content bottom
			if (this.scrollPinController && (this.scrollPinController.isActive() || this.scrollPinController.getSpacerHeight() > 0))
			{
				this.scrollPinController.release({ compensate: true });
				this.getScrollManager().scrollToBottom();

				return;
			}

			if (this.getScrollManager().scrollButtonClicked)
			{
				void this.handleSecondScrollButtonClick();

				return;
			}

			this.getScrollManager().scrollButtonClicked = true;
			if (this.chatCounter === 0)
			{
				this.showLoadingBar();
				await this.getMessageService().loadInitialMessages();
				this.hideLoadingBar();
				this.getScrollManager().scrollToBottom();

				return;
			}

			const firstUnreadId = this.$store.getters['messages/getFirstUnread'](this.dialog.chatId);
			if (!firstUnreadId)
			{
				this.showLoadingBar();
				await this.getMessageService().loadInitialMessages();
				this.hideLoadingBar();
				await this.getScrollManager().animatedScrollToMessage(firstUnreadId);
			}

			await this.getScrollManager().animatedScrollToMessage(firstUnreadId);
		},
		async onMentionsButtonClick(): void
		{
			if (this.isJumpingToAnchor)
			{
				return;
			}

			this.isJumpingToAnchor = true;
			await this.goToNearestMessageWithAnchor(AnchorType.mention);
			this.isJumpingToAnchor = false;
		},
		async onReactionsButtonClick(): void
		{
			if (this.isJumpingToAnchor)
			{
				return;
			}

			this.isJumpingToAnchor = true;
			await this.goToNearestMessageWithAnchor(AnchorType.reaction);
			this.isJumpingToAnchor = false;
		},
		async goToNearestMessageWithAnchor(anchorType: string)
		{
			const nextMessage: ?number = this.$store.getters['messages/anchors/getNextMessageIdWithAnchorType'](
				this.dialog.chatId,
				anchorType,
			);

			if (nextMessage)
			{
				await this.goToMessageContext(nextMessage, { position: ScrollManager.scrollPosition.messageTop });
			}
		},
		onWindowFocus()
		{
			this.windowFocused = true;
			this.readVisibleMessages();
		},
		onWindowBlur()
		{
			this.windowFocused = false;
		},
		onCallFold()
		{
			const callDialogId = CallManager.getInstance().getCurrentCallDialogId();
			if (callDialogId !== this.dialogId)
			{
				return;
			}
			this.readVisibleMessages();
		},
		async onShowQuoteButton(event: BaseEvent<{ message: ImModelMessage, event: MouseEvent }>)
		{
			const { message, event: $event } = event.getData();
			const permissionManager = PermissionManager.getInstance();
			if (!permissionManager.canPerformActionByRole(ActionByRole.send, this.dialogId))
			{
				return;
			}

			this.showQuoteButton = true;

			this.quoteButtonPosition = {
				left: $event.pageX,
				top: $event.pageY,
			};

			await this.$nextTick();

			this.$refs.quoteButton.onMessageMouseUp(message, $event);
		},
		async handleSecondScrollButtonClick()
		{
			this.scrollPinController?.freeze();
			this.getScrollManager().scrollButtonClicked = false;
			if (this.dialog.hasNextPage)
			{
				this.showLoadingBar();
				await this.getMessageService().loadContext(this.dialog.lastMessageId);
				this.hideLoadingBar();

				EventEmitter.emit(EventType.dialog.scrollToBottom, {
					chatId: this.dialog.chatId,
				});

				return;
			}

			void this.getScrollManager().animatedScrollToMessage(this.dialog.lastMessageId, { withDateOffset: false });
		},
		onShowForwardPopup(event: BaseEvent)
		{
			const { messagesIds } = event.getData();
			this.forwardPopup.messagesIds = messagesIds;
			this.forwardPopup.show = true;
		},
		onCloseForwardPopup()
		{
			this.forwardPopup.messagesIds = [];
			this.forwardPopup.show = false;
		},
		onMessageIsVisible(event: BaseEvent<{ messageId: number, dialogId: string }>)
		{
			const { messageId, dialogId } = event.getData();
			if (dialogId !== this.dialogId)
			{
				return;
			}

			this.getVisibleMessagesManager().setMessageAsVisible(messageId);

			if (this.isChatVisible() === false)
			{
				return;
			}

			if (this.$store.getters['messages/anchors/isMessageHasAnchors'](messageId))
			{
				this.readAnchorsIfMessageVisibleLongEnough(messageId);
			}

			const message: ImModelMessage = this.$store.getters['messages/getById'](messageId);
			if (!message.viewed)
			{
				this.messagesToRead.add(messageId);
				this.debouncedReadHandler();
			}
		},
		readAnchorsIfMessageVisibleLongEnough(messageId: number)
		{
			const messageVisibilityTimeThreshold = 200;

			if (this.getScrollManager().isScrolling)
			{
				this.readMessageAnchorsAfterVisibilityThreshold(messageId, messageVisibilityTimeThreshold);
			}
			else
			{
				this.getAnchorService().debouncedReadMessageAnchors(messageId);
			}
		},
		readMessageAnchorsAfterVisibilityThreshold(messageId: number, messageVisibilityTimeThreshold: number)
		{
			setTimeout(() => {
				if (this.getVisibleMessagesManager().getVisibleMessages().includes(messageId))
				{
					this.sequentiallyHighlightMessageHandler(messageId);
					this.getAnchorService().debouncedReadMessageAnchors(messageId);
				}
			}, messageVisibilityTimeThreshold);
		},
		onMessageIsNotVisible(event: BaseEvent<{ messageId: number, dialogId: string }>)
		{
			const { messageId, dialogId } = event.getData();
			if (dialogId !== this.dialogId)
			{
				return;
			}
			this.getVisibleMessagesManager().setMessageAsNotVisible(messageId);
		},
		/* endregion Event handlers */
		/* region Init methods */
		initContextMode()
		{
			const layoutManager = LayoutManager.getInstance();
			if (!layoutManager.isChatContextAvailable(this.dialogId))
			{
				return;
			}

			this.contextMode.active = true;
			// chat was loaded before, we didn't load context specifically
			// if chat wasn't loaded before - we load it with context
			this.contextMode.messageIsLoaded = !this.dialogInited;
		},
		getMessageService(): MessageService
		{
			if (!this.messageService)
			{
				this.messageService = new MessageService({ chatId: this.dialog.chatId });
			}

			return this.messageService;
		},
		getChatService(): ChatService
		{
			if (!this.chatService)
			{
				this.chatService = new ChatService();
			}

			return this.chatService;
		},
		getAnchorService(): AnchorService
		{
			if (!this.anchorService)
			{
				this.anchorService = new AnchorService();
			}

			return this.anchorService;
		},
		getScrollManager(): ScrollManager
		{
			if (!this.scrollManager)
			{
				this.scrollManager = new ScrollManager();
				this.scrollManager.subscribe(ScrollManager.events.onScrollTriggerUp, this.onScrollTriggerUp);
				this.scrollManager.subscribe(ScrollManager.events.onScrollTriggerDown, this.onScrollTriggerDown);
				this.scrollManager.subscribe(ScrollManager.events.onScrollThresholdPass, (event: BaseEvent<boolean>) => {
					this.isScrolledUp = event.getData();
				});
			}

			return this.scrollManager;
		},
		getScrollPinController(): ScrollPinController
		{
			if (!this.scrollPinController)
			{
				this.scrollPinController = new ScrollPinController({
					dialogId: this.dialogId,
					store: this.$store,
					getContainer: () => this.getContainer(),
					getScrollManager: () => this.getScrollManager(),
					onSpacerHeightChange: (height: number, animate: boolean = false) => {
						if (animate)
						{
							this.scrollPinSpacerAnimated = true;
						}

						this.scrollPinSpacerHeight = height;
					},
					onAnchorGapChange: (messageId: ?(number | string), height: number) => {
						this.onScrollPinAnchorGapChange(messageId, height);
					},
				});
			}

			return this.scrollPinController;
		},
		isScrollPinActive(): boolean
		{
			return this.scrollPinController?.isActive() === true;
		},
		onScrollPinSpacerRiseEnd(): void
		{
			this.scrollPinSpacerAnimated = false;
			this.scrollPinController?.onSpacerRiseEnd();
		},
		onScrollPinAnchorGapChange(messageId: ?(number | string), height: number): void
		{
			this.scrollPinMessageStyles = messageId === null
				? {}
				: { [messageId]: { marginTop: `${height}px` } };
		},
		getPullWatchManager(): PullWatchManager
		{
			if (!this.pullWatchManager)
			{
				this.pullWatchManager = new PullWatchManager(this.dialogId);
			}

			return this.pullWatchManager;
		},
		getVisibleMessagesManager(): VisibleMessagesManager
		{
			if (!this.visibleMessagesManager)
			{
				this.visibleMessagesManager = new VisibleMessagesManager();
			}

			return this.visibleMessagesManager;
		},
		/* endregion Init methods */
		isChatVisible(): boolean
		{
			return this.windowFocused && !this.hasVisibleCall() && !this.hasCommentsOnTop;
		},
		hasVisibleCall(): boolean
		{
			return CallManager.getInstance().hasVisibleCall();
		},
		closeDialogPopups()
		{
			this.showQuoteButton = false;
			PopupManager.getPopupById(PopupType.dialogAvatarMenu)?.close();
			PopupManager.getPopupById(PopupType.dialogMessageMenu)?.close();
			PopupManager.getPopupById(PopupType.dialogReactionUsers)?.close();
			PopupManager.getPopupById(PopupType.dialogReadUsers)?.close();
			PopupManager.getPopupById(PopupType.messageBaseFileMenu)?.close();
		},
		sendInitEvents()
		{
			const payload = { dialogId: this.dialogId, chat: this.dialog };

			EventEmitter.emit(EventType.dialog.onDialogInited, payload);
			this.getEmitter().emit(EventType.dialog.onDialogInited, payload);
		},
		sendGuestIdentifiedEvent()
		{
			// The first-visit case is signalled by the guest-name popup itself
			// via EventType.guest.onAfterGuestNamePopupClose; here we only handle
			// an already identified guest, for whom the popup will not be shown.
			if (!this.isCurrentUserGuest || GuestManager.getInstance().getGuestNamePopupState())
			{
				return;
			}

			EventEmitter.emit(EventType.guest.onInitialChatOpen, { dialogId: this.dialogId });
		},
		subscribeToEvents()
		{
			EventEmitter.subscribe(EventType.dialog.scrollToBottom, this.onScrollToBottom);
			EventEmitter.subscribe(EventType.call.onFold, this.onCallFold);

			this.getEmitter().subscribe(EventType.dialog.onMessageIsVisible, this.onMessageIsVisible);
			this.getEmitter().subscribe(EventType.dialog.onMessageIsNotVisible, this.onMessageIsNotVisible);
			this.getEmitter().subscribe(EventType.dialog.goToMessageContext, this.onGoToMessageContext);
			this.getEmitter().subscribe(EventType.dialog.showForwardPopup, this.onShowForwardPopup);
			this.getEmitter().subscribe(EventType.dialog.showQuoteButton, this.onShowQuoteButton);

			Event.bind(window, 'focus', this.onWindowFocus);
			Event.bind(window, 'blur', this.onWindowBlur);
		},
		unsubscribeFromEvents()
		{
			EventEmitter.unsubscribe(EventType.dialog.scrollToBottom, this.onScrollToBottom);
			EventEmitter.unsubscribe(EventType.call.onFold, this.onCallFold);

			this.getEmitter().unsubscribe(EventType.dialog.onMessageIsVisible, this.onMessageIsVisible);
			this.getEmitter().unsubscribe(EventType.dialog.onMessageIsNotVisible, this.onMessageIsNotVisible);
			this.getEmitter().unsubscribe(EventType.dialog.goToMessageContext, this.onGoToMessageContext);
			this.getEmitter().unsubscribe(EventType.dialog.showForwardPopup, this.onShowForwardPopup);
			this.getEmitter().unsubscribe(EventType.dialog.showQuoteButton, this.onShowQuoteButton);

			Event.unbind(window, 'focus', this.onWindowFocus);
			Event.unbind(window, 'blur', this.onWindowBlur);
		},
		getContainer(): ?HTMLElement
		{
			return this.$refs.container;
		},
		getEmitter(): EventEmitter
		{
			return this.$Bitrix.eventEmitter;
		},
		closeGuestNamePopup(): void
		{
			this.shouldShowGuestNamePopup = false;
			GuestManager.getInstance().setGuestNamePopupState(false);
		},
	},
	template: `
		<div class="bx-im-dialog-chat__block bx-im-dialog-chat__scope">
			<!-- Top -->
			<slot name="pinned-panel">
				<PinnedMessages
					v-if="pinnedMessages.length > 0"
					:dialogId="dialogId"
					:messages="pinnedMessages"
					@messageClick="onPinnedMessageClick"
					@messageUnpin="onPinnedMessageUnpin"
				/>
			</slot>
			<PullStatus/>
			<!-- Message list -->
			<div @scroll="onScroll" class="bx-im-dialog-chat__scroll-container" tabindex="-1" ref="container">
				<slot name="message-list">
					<MessageList
						:dialogId="dialogId"
						:containerHeight="containerHeight"
						:scrollPinEnabled="scrollPinEnabled"
						:spacerHeight="scrollPinSpacerHeight"
						:spacerAnimated="scrollPinSpacerAnimated"
						:messageStyles="scrollPinMessageStyles"
						@spacerRiseEnd="onScrollPinSpacerRiseEnd"
					/>
				</slot>
			</div>
			<FloatButtons
				:dialogId="dialogId"
				:isScrolledUp="isScrolledUp"
				@scrollButtonClick="onScrollButtonClick"
				@reactionsButtonClick="onReactionsButtonClick"
				@mentionsButtonClick="onMentionsButtonClick"
			>
				<template #additional-float-button><slot name="additional-float-button" /></template>
			</FloatButtons>
			<!-- Absolute elements -->
			<ForwardPopup
				v-if="forwardPopup.show"
				:messagesIds="forwardPopup.messagesIds"
				:dialogId="dialogId"
				:directForward="shouldForwardDirectly"
				@close="onCloseForwardPopup"
			/>
			<GuestNamePopup 
				v-if="dialogInited && shouldShowGuestNamePopup" 
				:dialogId="dialogId" 
				@close="closeGuestNamePopup" 
			/>
			<QuoteButton
				v-if="showQuoteButton"
				:targetPosition="quoteButtonPosition"
				:dialogId="dialogId"
				@close="showQuoteButton = false"
				ref="quoteButton"
			/>
		</div>
	`,
};
