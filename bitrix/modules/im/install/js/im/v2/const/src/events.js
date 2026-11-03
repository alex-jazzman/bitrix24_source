export const EventType = {
	// internal
	dialog:
	{
		onDialogInited: 'IM:Dialog:onDialogInited',
		onMessageDeleted: 'IM:Dialog:onMessageDeleted',
		onMessageIsVisible: 'IM:Dialog:onMessageIsVisible',
		onMessageIsNotVisible: 'IM:Dialog:onMessageIsNotVisible',
		onClickMessageContextMenu: 'IM:Dialog:onClickMessageContextMenu',
		onCloseChat: 'IM:Dialog:onCloseChat',

		scrollToBottom: 'IM:Dialog:scrollToBottom',
		pinQuestion: 'IM:Dialog:pinQuestion',
		/**
		 * Sends the chat to a message, carried as `{ dialogId, messageId }` plus three optional
		 * fields a jump by date fills in together. `date` marks the jump as date-driven for the
		 * message list, which then lights up the divider of that day; `withMessageHighlight: false`
		 * takes the ordinary highlight of the message off, so that the day and the message are not
		 * lit up at once - a picked day is answered by its divider, a picked message by the message
		 * itself; `jumpId` names this jump.
		 *
		 * The identifier is what tells two jumps apart, and the other fields cannot: the same day
		 * picked twice in a row resolves to the same message, so the chat, the message and the day
		 * of the two are identical. It is issued by the side that starts the jump, counted per page,
		 * and travels on into `dateNavigationContextApplied` and back in
		 * `dateNavigationJumpFinished`. A jump that is not date-driven carries none of the three.
		 *
		 * This is a REQUEST and not the jump itself: it asks whichever chat is on screen to go, and
		 * it is not the only way of asking - the components around the chat hold it by ref and call
		 * the same method directly. A side that has to see EVERY jump listens to
		 * `messageContextJumpStarted` instead, which the chat sends whatever the jump came from.
		 */
		goToMessageContext: 'IM:Dialog:goToMessageContext',
		/**
		 * The chat has started a jump to a message context, carried as
		 * `{ dialogId, messageId, date, jumpId }`. Sent by the chat itself, synchronously, from the
		 * single method every jump goes through - so it covers the jumps asked for by
		 * `goToMessageContext` and the ones started by a direct call alike: the comments button of a
		 * channel, a chat opened on a message context, a pinned message.
		 *
		 * It is what the sides waiting for a jump by date measure against, and both of them wait for
		 * something the NEXT jump invalidates: the panel of the sidebar is resolving the day the user
		 * picked, the message list is waiting for the divider of a day to arrive. A jump they never
		 * heard of would leave the first one applying an answer over the message the user went to
		 * instead, and the second one waiting out its own bound for an anchor that is not coming any
		 * more - and answering the panel with a failure over a screen the user asked for.
		 *
		 * `date` and `jumpId` are the fields of a jump by date and are empty for every other jump:
		 * the day tells the message list that this jump is answered by a divider, and the identifier
		 * names the jump for every report about it.
		 */
		messageContextJumpStarted: 'IM:Dialog:messageContextJumpStarted',
		/**
		 * The chat has TAKEN a jump by date on and is about to apply its context, carried as
		 * `{ dialogId, jumpId }`. Sent synchronously right after `messageContextJumpStarted` of the
		 * same jump and before the loading starts, for jumps by date alone - the same jumps
		 * `dateNavigationContextApplied` answers for. The two travel together and in that order, so
		 * a side told it may drop its bounds has by then been told which jump they belonged to.
		 *
		 * It is there because silence means two different things to the sides waiting for the jump:
		 * a context that is still loading, and a jump nobody took at all - the chat of it is not on
		 * screen, so no report is ever coming. Both sides bound their wait for the second case, and
		 * that bound then cuts the first one short: a load longer than the bound is answered with a
		 * failure and a retry while the chat is still on its way, and the chat then moves to the day
		 * a moment later - an error standing next to the jump it says did not happen. This event
		 * tells the two cases apart, and is the only thing that can: nothing else distinguishes work
		 * in progress from nobody working.
		 *
		 * Read by the message list and by the side that started the jump, and both do the same with
		 * it - take every bound off the jump it names. The list has two of them, a clock and a budget
		 * of attempts, and both go: a chat busy enough to change its collection twenty times while
		 * the context is loading would spend the budget on a jump that is still on its way, which is
		 * the same false failure the clock is taken off for. Nothing else changes: the wait itself
		 * goes on and ends where it ended before, on the outcome of the jump. Taking the bounds off is
		 * safe exactly because the report becomes certain once the jump is taken:
		 * `dateNavigationContextApplied` is sent on a settled promise, so it comes whether the
		 * context loaded, failed, or was superseded.
		 *
		 * `jumpId` is the identifier the jump arrived with, and each side compares it against the
		 * jump it is waiting for: a confirmation naming another jump, or naming none, takes nothing
		 * off anywhere.
		 *
		 * The residual case is deliberate: a jump confirmed here whose promise then never settles is
		 * waited for in silence - no error, no retry. It is the better half of the trade, a quiet
		 * wait in front of a screen that is working against a false failure over a jump that did
		 * happen; and the loading goes through a transport with a bound of its own, so a promise
		 * that never settles takes the transport itself giving up on answering.
		 */
		dateNavigationContextApplying: 'IM:Dialog:dateNavigationContextApplying',
		/**
		 * The chat has finished applying the context of a jump by date, carried as
		 * `{ dialogId, messageId, date, jumpId }` back to the message list. Sent for jumps by date
		 * alone - the ones `goToMessageContext` carries a `date` in - so that the other jumps keep
		 * the contract they have.
		 *
		 * "Finished" means settled and not succeeded: the page of the message arrived, or the loading
		 * of it failed, or the jump was superseded and its answer refused. All three end the same way
		 * for the list - the collection will not move for THIS jump any more - and that is what the
		 * list needs to tell an anchor still on its way from an anchor that is never coming.
		 *
		 * `jumpId` is REQUIRED here and is the field the list decides by: a superseded jump reports
		 * as well, and two jumps to the same day are alike in every other field. It is the identifier
		 * the jump arrived with in `goToMessageContext`, carried back unchanged. The rest is the
		 * context of the jump it names.
		 */
		dateNavigationContextApplied: 'IM:Dialog:dateNavigationContextApplied',
		/**
		 * The outcome of a jump by date, carried as `{ dialogId, date, jumpId, outcome }` from the
		 * message list to the side that started the jump - `outcome` being a value of
		 * `DateNavigationJumpOutcome`. A jump by date is finished only when the list has the day on
		 * screen: the message may still have to be brought in from the server, and the loading of it
		 * is not part of the event that starts the jump.
		 *
		 * Reported once per jump, and EVERY jump the list took on is reported - a jump superseded by
		 * whatever came after it included, which ends as `cancelled`. Superseding is not something
		 * the waiting side can see: told nothing about it, that side would sit out its own bound and
		 * answer with a failure a jump the user replaced by going somewhere else on purpose.
		 *
		 * `jumpId` is REQUIRED here and is the field the waiting side decides by, together with
		 * `dialogId`: it is the identifier the jump went out under in `goToMessageContext`, carried
		 * back unchanged. `date` names no jump - two jumps to the same day are alike in it - and is
		 * the context of the jump the identifier names, the day the outcome is spoken by. A report
		 * carrying no identifier belongs to no jump and is left to the bound of the waiting side.
		 */
		dateNavigationJumpFinished: 'IM:Dialog:dateNavigationJumpFinished',
		/**
		 * Requests answered by the message list. The listener answers by RETURNING a value, and the
		 * asking side collects the answers with `emitAsync`: several lists can be subscribed at once
		 * (a channel and the comments opened over it), so the answer is the first filled one instead
		 * of whatever the last subscriber left behind. Both requests carry `{ dialogId }` and are
		 * answered with a day as `Y-m-d`; a list of another chat answers with an empty string.
		 * `getTopVisibleDate` - the day of the group the user sees now; asked every time the calendar
		 * is built and changes nothing in the list.
		 * `getPendingDateNavigation` - the day of the divider that asked for the calendar; answered
		 * once, the list gives the request away and forgets it.
		 */
		getTopVisibleDate: 'IM:Dialog:getTopVisibleDate',
		getPendingDateNavigation: 'IM:Dialog:getPendingDateNavigation',
		showForwardPopup: 'IM:Dialog:showForwardPopup',
		openComments: 'IM:Dialog:openComments',
		closeComments: 'IM:Dialog:closeComments',
		showLoadingBar: 'IM:Dialog:showLoadingBar',
		hideLoadingBar: 'IM:Dialog:hideLoadingBar',
		showQuoteButton: 'IM:Dialog:showQuoteButton',
		openBulkActionsMode: 'IM:Dialog:openBulkActionsMode',
		closeBulkActionsMode: 'IM:Dialog:closeBulkActionsMode',
	},
	textarea:
	{
		onBeforeSendMessage: 'IM:Textarea:onBeforeSendMessage',
		onAfterSendMessage: 'IM:Textarea:onAfterSendMessage',

		editMessage: 'IM:Textarea:editMessage',
		replyMessage: 'IM:Textarea:replyMessage',
		insertText: 'IM:Textarea:insertText',
		insertMention: 'IM:Textarea:insertMention',
		selectSlashCommand: 'IM:Textarea:selectSlashCommand',
		closeSlashCommandPopup: 'IM:Textarea:closeSlashCommandPopup',
		insertForward: 'IM:Textarea:insertForward',
		sendMessage: 'IM:Textarea:sendMessage',
		openUploadPreview: 'IM:Textarea:openUploadPreview',
		getText: 'IM:Textarea:getText',
		closePanel: 'IM:Textarea:closePanel',
		/**
		 * Asks the input of one chat to take the keyboard focus.
		 * Payload: { dialogId: string }.
		 *
		 * Addressed by `dialogId` like the rest of this section: several textareas can be mounted at once,
		 * and only the one of that chat may answer. It is the chat that is ALREADY open that needs asking --
		 * a chat opened anew mounts its input, and the input focuses itself on mount.
		 */
		focusInput: 'IM:Textarea:focusInput',
	},
	sidebar:
	{
		open: 'IM:Sidebar:open',
		close: 'IM:Sidebar:close',
		/**
		 * Carries `{ dialogId, date }` to the message search panel of that chat. The listener answers
		 * by RETURNING `true` when the calendar of that day opened, so the sender learns whether the
		 * request was carried out at all; a panel of another chat answers nothing, and a panel with
		 * nothing to open the calendar on answers `false` and leaves the request with the sender.
		 */
		openDateNavigation: 'IM:Sidebar:openDateNavigation',
	},
	header:
	{
		openAddToChatPopup: 'IM:Header:openAddToChatPopup',
	},
	search:
	{
		keyPressed: 'IM:Search:keyPressed',
		/**
		 * The four events below are addressed with `searchAreaId`: several searches can be mounted at once,
		 * and each reacts only to its own area, ignoring an event whose id is empty or foreign.
		 *
		 * Keydown in the search input, for subscribers that intercept a key before the field acts on it
		 * (keyboard navigation over the results). Carries the keystroke that expands a collapsed search too:
		 * a click produces no keydown, so this is the only sign of an entry from the keyboard.
		 * Payload: { keyboardEvent: KeyboardEvent, searchAreaId: ?string }.
		 *
		 * MUST be emitted synchronously (`emit`, never `emitAsync`): `preventDefault()` of a subscriber only
		 * works while the original keydown is still being dispatched.
		 */
		keyDown: 'IM:Search:keyDown',
		/**
		 * The input of a search area has lost the keyboard focus, so the keys of the navigation can no longer
		 * reach the results through it: a subscriber holding a cursor learns that it is not movable any more.
		 * Payload: { searchAreaId: ?string }.
		 */
		inputBlur: 'IM:Search:inputBlur',
		/**
		 * Announces the option represented by the visible cursor of an addressed search area.
		 * Payload: { searchAreaId: string, activeDescendantId: string | null }.
		 */
		activeDescendantChanged: 'IM:Search:activeDescendantChanged',
		/**
		 * Asks a search area to take the keyboard focus back: the results know the moment (the chat opened
		 * from them was exited and nothing holds the focus), the search decides which element takes it and
		 * whether it may be taken at all.
		 * Payload: { searchAreaId: string }.
		 */
		returnFocusToSearch: 'IM:Search:returnFocusToSearch',
	},
	recent:
	{
		openSearch: 'IM.Recent:openSearch',
		openNestedList: 'IM.Recent:openNestedList',
		closeNestedList: 'IM.Recent:closeNestedList',
		dayChanged: 'IM.Recent:dayChanged',
	},
	mention:
	{
		selectItem: 'IM:Mention:selectItem',
		onAddUserToChat: 'IM:Mention:onAddUserToChat',
		onNestedMenuClosed: 'IM:Mention:onNestedMenuClosed',
	},
	reaction:
	{
		onReactionSelected: 'IM:Reaction:onReactionSelected',
	},
	request:
	{
		onAuthError: 'IM:request:onAuthError',
	},
	audioPlayer:
	{
		pause: 'IM:AudioPlayer:pause',
	},
	roundVideoPlayer:
	{
		onClickPlay: 'IM:RoundVideoPlayer:onClickPlay',
	},
	player:
	{
		playNext: 'IM:Player:playNext',
		rateChange: 'IM:Player:rateChange',
	},
	playback:
	{
		onServiceStart: 'IM:Playback:onServiceStart',
		onExternalPlayerStart: 'IM:Playback:onExternalPlayerStart',
		onTrackEnded: 'IM:Playback:onTrackEnded',
	},
	key:
	{
		onBeforeEscape: 'IM:Keys:onBeforeEscape',
	},
	notifier:
	{
		onBeforeShowMessage: 'IM:Notifier:onBeforeShowMessage',
	},
	notification:
	{
		onFilterAuthorPopupStateChange: 'IM:Notification:Filter:onAuthorPopupStateChange',
		onFilterAuthorTagAdd: 'IM:Notification:Filter:onAuthorTagAdd',
		onFilterAuthorTagRemove: 'IM:Notification:Filter:onAuthorTagRemove',
	},

	// external
	messenger:
	{
		onReady: 'IM:Messenger:onReady', // MessengerRoot is mounted
		onClose: 'IM:Messenger:onClose', // the surface is gone: unmount or slider close
	},
	layout:
	{
		onLayoutChange: 'IM.Layout:onLayoutChange',
		onOpenNotifications: 'IM.Layout:onOpenNotifications',
	},
	slider:
	{
		onClose: 'onChatSliderClose',
	},
	counter:
	{
		onNotificationCounterChange: 'onImUpdateCounterNotify',
		onChatCounterChange: 'onImUpdateCounterMessage',
		onImUpdateCounter: 'onImUpdateCounter',
		onUpdate: 'IM.Counters:onUpdate',
	},
	task:
	{
		onMembersCountChange: 'tasks:card:onMembersCountChange',
		openCardFromMessage: 'tasks:chat-action:before-execute',
	},
	collab:
	{
		onFirstOpen: 'IM:Collab:onFirstOpen',
	},
	call:
	{
		onFold: 'CallController::onFold',
		onJoinFromRecentItem: 'IM.Call:onJoinFromRecentItem',
	},
	lines:
	{
		onInit: 'onLinesInit',
		openChat: 'openLinesChat',
		onChatOpen: 'onLinesChatOpen',
	},
	desktop:
	{
		onInit: 'onDesktopInit',
		onReload: 'onDesktopReload',
		onSyncPause: 'onDesktopSyncPause',
		onUserAway: 'BXUserAway',
		onWakeUp: 'BXWakeAction',
		onBxLink: 'BXProtocolUrl',
		onExit: 'BXExitApplication',
		onIconClick: 'BXApplicationClick',
		onNewTabClick: 'BXNewTabClick',
	},
	sending:
	{
		onBeforeAddMessageToModel: 'IM:Textarea:onBeforeAddMessageToModel',
	},
	guest:
	{
		onAfterGuestNamePopupClose: 'IM:Guest:onAfterGuestNamePopupClose',
		/**
		 * Emitted when an already identified guest (the guest-name popup will NOT be shown)
		 * opens a chat. On the first visit — when the popup will be shown — this event is
		 * NOT emitted: identification is signalled by the popup via `onAfterGuestNamePopupClose`.
		 * Payload: { dialogId: string }.
		 */
		onInitialChatOpen: 'IM:Guest:onInitialChatOpen',
	},
};

/**
 * How a jump by date ended, as reported by `EventType.dialog.dateNavigationJumpFinished`.
 *
 * `cancelled` is told apart from `failure` on purpose: the user leaving the chat, or the chat being
 * closed, is not a failure to report - an error spoken out loud in the chat the user has just opened
 * would be about a screen nobody is looking at any more.
 */
export const DateNavigationJumpOutcome = Object.freeze({
	success: 'success',
	failure: 'failure',
	cancelled: 'cancelled',
});

/**
 * How long the two sides of a jump by date wait for it, in milliseconds.
 *
 * They are kept together because their order is the contract: the list gives up first and says so,
 * and the panel only ever falls back to its own bound when no outcome arrived at all. Were the panel
 * the first to give up, the user would be told the jump failed while the list is still waiting - and
 * the list would then light the day up under a message that has already been withdrawn.
 *
 * Both are bounds on ONE case alone - the jump nobody took. A chat that takes the jump says so
 * through `dateNavigationContextApplying`, and both sides drop their bound the moment it does:
 * from there the outcome is certain however long the loading runs, and a bound left standing would
 * only ever cut a working jump short. What is left for the bounds is the case where the chat of the
 * jump is not on screen at all: no confirmation, no report, and nothing but these to end the wait.
 *
 * `anchorWait` - the message list waiting for the page of the anchor to arrive.
 * `panelWait` - the side that started the jump waiting for the outcome of it.
 */
export const DateNavigationJumpTimeout = Object.freeze({
	anchorWait: 9000,
	panelWait: 10000,
});
