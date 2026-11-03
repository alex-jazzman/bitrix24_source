/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
(function (exports, imopenlines_v2_const) {
	'use strict';

	const RestMethod = {
		imV2ChatDetachToParent: 'im.v2.Chat.detachFromParent',
		imV2ChatAttachToParent: 'im.v2.Chat.attachToParent',
		imV2ChatLoad: 'im.v2.Chat.load',
		imV2ChatGetDialogId: 'im.v2.Chat.getDialogId',
		imV2ChatShallowLoad: 'im.v2.Chat.shallowLoad',
		imV2ChatLoadInContext: 'im.v2.Chat.loadInContext',
		imV2ChatLoadContext: 'im.v2.Chat.loadInContext',
		imV2ChatAdd: 'im.v2.Chat.add',
		imV2ChatUpdate: 'im.v2.Chat.update',
		imV2ChatAddUsers: 'im.v2.Chat.addUsers',
		imV2ChatStructureLink: 'im.v2.Chat.Structure.link',
		imV2ChatDelete: 'im.v2.Chat.delete',
		imV2ChatUpdateAvatar: 'im.v2.Chat.updateAvatar',
		imV2ChatRead: 'im.v2.Chat.read',
		imV2ChatReadAll: 'im.v2.Chat.readAll',
		imV2ChatReadAllByType: 'im.v2.Chat.readByType',
		imV2ChatReadByRecentType: 'im.v2.Chat.readByRecentSection',
		imV2ChatUnread: 'im.v2.Chat.unread',
		imV2ChatJoin: 'im.v2.Chat.join',
		imV2ChatDeleteUser: 'im.v2.Chat.deleteUser',
		imV2ChatExtendPullWatch: 'im.v2.Chat.extendPullWatch',
		imV2RecentChannelExtendPullWatch: 'im.v2.Recent.Channel.extendPullWatch',
		imV2ChatMessageGetContext: 'im.v2.Chat.Message.getContext',
		imV2ChatMessageSend: 'im.v2.Chat.Message.send',
		imV2ChatMessageList: 'im.v2.Chat.Message.list',
		imV2ChatMessageTail: 'im.v2.Chat.Message.tail',
		imV2ChatMessageRead: 'im.v2.Chat.Message.read',
		imV2ChatMessageMark: 'im.v2.Chat.Message.mark',
		imV2ChatMessageDelete: 'im.v2.Chat.Message.delete',
		imV2ChatMessageUpdate: 'im.v2.Chat.Message.update',
		imV2ChatMessageReactionAdd: 'im.v2.Chat.Message.Reaction.add',
		imV2ChatMessageReactionDelete: 'im.v2.Chat.Message.Reaction.delete',
		imV2ChatMessageReactionTail: 'im.v2.Chat.Message.Reaction.tail',
		imV2ChatMessagePin: 'im.v2.Chat.Message.pin',
		imV2ChatMessageUnpin: 'im.v2.Chat.Message.unpin',
		imV2ChatMessageVoteSend: 'im.v2.Chat.Message.Vote.send',
		imV2ChatMessageBlockFormSubmit: 'im.v2.Chat.Message.Block.Form.submit',
		imV2ChatMessageTailViewers: 'im.v2.Chat.Message.tailViewers',
		imV2ChatMessageDeleteRichUrl: 'im.v2.Chat.Message.deleteRichUrl',
		imV2ChatMessageCommentInfoList: 'im.v2.Chat.Message.CommentInfo.list',
		imV2ChatMessageDateNavigationGetCalendar: 'im.v2.Chat.Message.DateNavigation.getCalendar',
		imV2ChatMessageDateNavigationResolveDate: 'im.v2.Chat.Message.DateNavigation.resolveDate',
		imV2ChatAnchorRead: 'im.v2.Chat.Anchor.read',
		imV2ChatPinTail: 'im.v2.Chat.Pin.tail',
		imV2ChatMentionList: 'im.v2.Chat.Mention.list',
		imV2ChatCommandList: 'im.v2.Chat.Command.list',
		imV2ChatListShared: 'im.v2.Chat.listShared',
		imV2ChatCommentSubscribe: 'im.v2.Chat.Comment.subscribe',
		imV2ChatCommentUnsubscribe: 'im.v2.Chat.Comment.unsubscribe',
		imV2ChatCommentReadAll: 'im.v2.Chat.Comment.readAll',
		imV2ChatAddManagers: 'im.v2.Chat.addManagers',
		imV2ChatDeleteManagers: 'im.v2.Chat.deleteManagers',
		imV2ChatMessageDisappear: 'im.v2.Chat.Message.disappear',
		imV2ChatSetMessagesAutoDeleteDelay: 'im.v2.Chat.setMessagesAutoDeleteDelay',
		imV2SettingsGeneralUpdate: 'im.v2.Settings.General.update',
		imV2SettingsGeneralList: 'im.v2.Settings.General.list',
		imV2SettingsNotifyUpdate: 'im.v2.Settings.Notify.update',
		imV2SettingsNotifySwitchScheme: 'im.v2.Settings.Notify.switchScheme',
		imV2DesktopLogout: 'im.v2.Desktop.logout',
		imV2UpdateState: 'im.v2.UpdateState.getStateData',
		imV2BetaEnable: 'im.v2.Beta.enable',
		imV2BetaDisable: 'im.v2.Beta.disable',
		imV2ChatTaskPrepare: 'im.v2.Chat.Task.prepare',
		imV2ChatTaskCreateByAi: 'im.v2.Chat.Task.createByAi',
		imV2ChatFlowPrepare: 'im.v2.Chat.Flow.prepare',
		imV2RecentChannelTail: 'im.v2.Recent.Channel.Tail',
		imV2RecentCollabTail: 'im.v2.Recent.Collab.Tail',
		imV2RecentExternalChatTail: 'im.v2.Recent.ExternalChat.Tail',
		imV2RecentTail: 'im.v2.Recent.tail',
		imV2RecentLoad: 'im.v2.Recent.load',
		imV2ChatCopilotUpdateRole: 'im.v2.Chat.Copilot.updateRole',
		imV2ChatCopilotUpdateAiModel: 'im.v2.Chat.Copilot.updateEngine',
		imV2CopilotMessageRegenerate: 'im.v2.Copilot.Message.regenerate',
		imV2CopilotDraftChatGet: 'im.v2.Copilot.DraftChat.get',
		imV2CopilotGenerationStop: 'im.v2.Copilot.Generation.stop',
		imV2AccessCheck: 'im.v2.Access.check',
		imV2ChatMemberEntitiesList: 'im.v2.Chat.MemberEntities.list',
		imV2ChatMemberCheckMembership: 'im.v2.Chat.Member.checkMembership',
		imV2ChatInputActionNotify: 'im.v2.Chat.InputAction.notify',
		imV2DiskFileSave: 'im.v2.Disk.File.save',
		imV2ChatBotSendContext: 'im.v2.Chat.Bot.sendContext',
		imV2ChatMemberTail: 'im.v2.Chat.Member.tail',
		imV2DiskFileTranscribe: 'im.v2.Disk.File.transcribe',
		imV2ChatSharedLinkGetIndividual: 'im.v2.Chat.SharingLink.getIndividual',
		imV2ChatJoinByCode: 'im.v2.Chat.joinByCode',
		imV2ChatSharedLinkRevoke: 'im.v2.Chat.SharingLink.revoke',
		imV2ChatSharedLinkRegenerateIndividual: 'im.v2.Chat.SharingLink.regenerateIndividual',
		imV2GuestLinkGenerate: 'im.v2.Guest.Link.generate',
		imV2GuestLinkRegenerate: 'im.v2.Guest.Link.regenerate',
		imV2GuestLinkRevoke: 'im.v2.Guest.Link.revoke',
		imV2GuestLinkInviteByEmail: 'im.v2.Guest.Link.inviteByEmail',
		imV2GuestLinkInviteByPhoneNumber: 'im.v2.Guest.Link.inviteByPhoneNumber',
		imV2ChatFilterUsersByParticipation: 'im.v2.Chat.Member.filterUsersByParticipation',
		imV2RecentPin: 'im.v2.Chat.pin',
		imV2RecentUnpin: 'im.v2.Chat.unpin',
		imV2GuestSetName: 'im.v2.Guest.setName',
		imV2FolderList: 'im.v2.Folder.list',
		imV2FolderRecentTail: 'im.v2.Folder.Recent.tail',
		imV2FolderAdd: 'im.v2.Folder.add',
		imV2FolderUpdate: 'im.v2.Folder.update',
		imV2FolderDelete: 'im.v2.Folder.delete',
		imV2FolderSort: 'im.v2.Folder.sort',
		imV2FolderAddChats: 'im.v2.Folder.addChats',
		imV2FolderGetSources: 'im.v2.Folder.getSources',
		imV2FolderUpdateSources: 'im.v2.Folder.updateSources',
		imV2StickerPackLoad: 'im.v2.Sticker.Pack.load',
		imV2StickerPackTail: 'im.v2.Sticker.Pack.tail',
		imV2StickerPackGet: 'im.v2.Sticker.Pack.get',
		imV2StickerPackAdd: 'im.v2.Sticker.Pack.add',
		imV2StickerPackDelete: 'im.v2.Sticker.Pack.delete',
		imV2StickerPackLink: 'im.v2.Sticker.Pack.link',
		imV2StickerPackUnlink: 'im.v2.Sticker.Pack.unlink',
		imV2StickerPackRename: 'im.v2.Sticker.Pack.rename',
		imV2StickerRecentDelete: 'im.v2.Sticker.Recent.delete',
		imV2StickerRecentDeleteAll: 'im.v2.Sticker.Recent.deleteAll',
		imV2StickerAdd: 'im.v2.Sticker.add',
		imV2StickerDelete: 'im.v2.Sticker.delete',
		imV2AnchorRead: 'im.v2.Anchor.read',
		imV2PromotionRead: 'im.v2.Promotion.read',
		imV2CallZoomCreate: 'im.v2.Call.Zoom.create',
		imCallBetaCreateRoom: 'im.call.beta.createRoom',
		imMessageAdd: 'im.message.add',
		imMessageCommand: 'im.message.command',
		imChatMute: 'im.chat.mute',
		imChatUpdateTitle: 'im.chat.updateTitle',
		imChatFileCollectionGet: 'im.chat.file.collection.get',
		imChatFileGet: 'im.chat.file.get',
		imChatUrlGet: 'im.chat.url.get',
		imChatUrlDelete: 'im.chat.url.delete',
		imChatTaskGet: 'im.chat.task.get',
		imChatTaskDelete: 'im.chat.task.delete',
		imChatCalendarGet: 'im.chat.calendar.get',
		imChatFavoriteAdd: 'im.chat.favorite.add',
		imChatFavoriteDelete: 'im.chat.favorite.delete',
		imChatFavoriteGet: 'im.chat.favorite.get',
		imChatFavoriteCounterGet: 'im.chat.favorite.counter.get',
		imChatUrlCounterGet: 'im.chat.url.counter.get',
		imChatPinGet: 'im.chat.pin.get',
		imChatPinAdd: 'im.chat.pin.add',
		imChatPinDelete: 'im.chat.pin.delete',
		imChatCalendarPrepare: 'im.chat.calendar.prepare',
		imChatCalendarAdd: 'im.chat.calendar.add',
		imChatCalendarDelete: 'im.chat.calendar.delete',
		imChatUserDelete: 'im.chat.user.delete',
		imChatUserAdd: 'im.chat.user.add',
		imDialogWriting: 'im.dialog.writing',
		imDialogUsersList: 'im.dialog.users.list',
		imDialogMessagesSearch: 'im.dialog.messages.search',
		imUserGet: 'im.user.get',
		imUserListGet: 'im.user.list.get',
		imUserStatusSet: 'im.user.status.set',
		imUserStatusIdleStart: 'im.user.status.idle.start',
		imUserStatusIdleEnd: 'im.user.status.idle.end',
		imDiskFolderGet: 'im.disk.folder.get',
		imDiskFolderListGet: 'im.disk.folder.list.get',
		imDiskFilePreviewUpload: 'disk.api.file.attachPreview',
		imDiskFileCommit: 'im.disk.file.commit',
		imDiskFileDelete: 'im.disk.file.delete',
		imDiskFileSave: 'im.disk.file.save',
		imRecentGet: 'im.recent.get',
		imRecentList: 'im.recent.list',
		imRecentPin: 'im.recent.pin',
		imRecentHide: 'im.recent.hide',
		imNotifyGet: 'im.notify.get',
		imNotifyRead: 'im.notify.read',
		imNotifyReadAll: 'im.notify.read.all',
		imV2NotifyRead: 'im.v2.Notify.read',
		imV2NotifyReadAll: 'im.v2.Notify.readAll',
		imNotifySchemaGet: 'im.notify.schema.get',
		imNotifyHistorySearch: 'im.notify.history.search',
		imNotifyAnswer: 'im.notify.answer',
		imCallBackgroundGet: 'call.Desktop.Background.get',
		imCallBackgroundCommit: 'call.Desktop.Background.commit',
		imCallBackgroundDelete: 'call.Desktop.Background.delete',
		imCallMaskGet: 'call.Desktop.Mask.get',
		imSmilesGet: 'smile.get',
		imPromotionRead: 'im.promotion.read',
		imBotGiphyListPopular: 'imbot.Giphy.listPopular',
		imBotGiphyList: 'imbot.Giphy.list',
		imBotDialogVote: 'imbot.dialog.vote',
		imBotNetworkChatCount: 'imbot.Network.Chat.count',
		imBotNetworkChatList: 'imbot.Network.Chat.list',
		imBotNetworkChatAdd: 'imbot.Network.Chat.add',
		linesDialogGet: 'imopenlines.dialog.get',
		socialnetworkCollabCreate: 'socialnetwork.collab.Collab.add',
		socialnetworkCollabUpdate: 'socialnetwork.collab.Collab.update',
		socialnetworkCollabDelete: 'socialnetwork.collab.Collab.delete',
		socialnetworkMemberAdd: 'socialnetwork.collab.Member.add',
		socialnetworkMemberDelete: 'socialnetwork.collab.Member.delete',
		socialnetworkMemberLeave: 'socialnetwork.collab.Member.leave',
		intranetInviteGetLinkByCollabId: 'intranet.invite.getLinkByCollabId',
		intranetInviteRegenerateLinkByCollabId: 'intranet.invite.regenerateLinkByCollabId',
		imV2McpSendSelectionHintOnce: 'aiassistant.api.McpHint.sendSelectionHintOnce',
		imV2McpSelectionSave: 'aiassistant.api.McpSelection.save',
		imV2McpSelectionClear: 'aiassistant.api.McpSelection.clear'
	};

	const EventType = {
		// internal
		dialog: {
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
			closeBulkActionsMode: 'IM:Dialog:closeBulkActionsMode'
		},
		textarea: {
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
			focusInput: 'IM:Textarea:focusInput'
		},
		sidebar: {
			open: 'IM:Sidebar:open',
			close: 'IM:Sidebar:close',
			/**
			 * Carries `{ dialogId, date }` to the message search panel of that chat. The listener answers
			 * by RETURNING `true` when the calendar of that day opened, so the sender learns whether the
			 * request was carried out at all; a panel of another chat answers nothing, and a panel with
			 * nothing to open the calendar on answers `false` and leaves the request with the sender.
			 */
			openDateNavigation: 'IM:Sidebar:openDateNavigation'
		},
		header: {
			openAddToChatPopup: 'IM:Header:openAddToChatPopup'
		},
		search: {
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
			returnFocusToSearch: 'IM:Search:returnFocusToSearch'
		},
		recent: {
			openSearch: 'IM.Recent:openSearch',
			openNestedList: 'IM.Recent:openNestedList',
			closeNestedList: 'IM.Recent:closeNestedList',
			dayChanged: 'IM.Recent:dayChanged'
		},
		mention: {
			selectItem: 'IM:Mention:selectItem',
			onAddUserToChat: 'IM:Mention:onAddUserToChat',
			onNestedMenuClosed: 'IM:Mention:onNestedMenuClosed'
		},
		reaction: {
			onReactionSelected: 'IM:Reaction:onReactionSelected'
		},
		request: {
			onAuthError: 'IM:request:onAuthError'
		},
		audioPlayer: {
			pause: 'IM:AudioPlayer:pause'
		},
		roundVideoPlayer: {
			onClickPlay: 'IM:RoundVideoPlayer:onClickPlay'
		},
		player: {
			playNext: 'IM:Player:playNext',
			rateChange: 'IM:Player:rateChange'
		},
		playback: {
			onServiceStart: 'IM:Playback:onServiceStart',
			onExternalPlayerStart: 'IM:Playback:onExternalPlayerStart',
			onTrackEnded: 'IM:Playback:onTrackEnded'
		},
		key: {
			onBeforeEscape: 'IM:Keys:onBeforeEscape'
		},
		notifier: {
			onBeforeShowMessage: 'IM:Notifier:onBeforeShowMessage'
		},
		notification: {
			onFilterAuthorPopupStateChange: 'IM:Notification:Filter:onAuthorPopupStateChange',
			onFilterAuthorTagAdd: 'IM:Notification:Filter:onAuthorTagAdd',
			onFilterAuthorTagRemove: 'IM:Notification:Filter:onAuthorTagRemove'
		},
		// external
		messenger: {
			onReady: 'IM:Messenger:onReady',
			// MessengerRoot is mounted
			onClose: 'IM:Messenger:onClose' // the surface is gone: unmount or slider close
		},
		layout: {
			onLayoutChange: 'IM.Layout:onLayoutChange',
			onOpenNotifications: 'IM.Layout:onOpenNotifications'
		},
		slider: {
			onClose: 'onChatSliderClose'
		},
		counter: {
			onNotificationCounterChange: 'onImUpdateCounterNotify',
			onChatCounterChange: 'onImUpdateCounterMessage',
			onImUpdateCounter: 'onImUpdateCounter',
			onUpdate: 'IM.Counters:onUpdate'
		},
		task: {
			onMembersCountChange: 'tasks:card:onMembersCountChange',
			openCardFromMessage: 'tasks:chat-action:before-execute'
		},
		collab: {
			onFirstOpen: 'IM:Collab:onFirstOpen'
		},
		call: {
			onFold: 'CallController::onFold',
			onJoinFromRecentItem: 'IM.Call:onJoinFromRecentItem'
		},
		lines: {
			onInit: 'onLinesInit',
			openChat: 'openLinesChat',
			onChatOpen: 'onLinesChatOpen'
		},
		desktop: {
			onInit: 'onDesktopInit',
			onReload: 'onDesktopReload',
			onSyncPause: 'onDesktopSyncPause',
			onUserAway: 'BXUserAway',
			onWakeUp: 'BXWakeAction',
			onBxLink: 'BXProtocolUrl',
			onExit: 'BXExitApplication',
			onIconClick: 'BXApplicationClick',
			onNewTabClick: 'BXNewTabClick'
		},
		sending: {
			onBeforeAddMessageToModel: 'IM:Textarea:onBeforeAddMessageToModel'
		},
		guest: {
			onAfterGuestNamePopupClose: 'IM:Guest:onAfterGuestNamePopupClose',
			/**
			 * Emitted when an already identified guest (the guest-name popup will NOT be shown)
			 * opens a chat. On the first visit — when the popup will be shown — this event is
			 * NOT emitted: identification is signalled by the popup via `onAfterGuestNamePopupClose`.
			 * Payload: { dialogId: string }.
			 */
			onInitialChatOpen: 'IM:Guest:onInitialChatOpen'
		}
	};

	/**
	 * How a jump by date ended, as reported by `EventType.dialog.dateNavigationJumpFinished`.
	 *
	 * `cancelled` is told apart from `failure` on purpose: the user leaving the chat, or the chat being
	 * closed, is not a failure to report - an error spoken out loud in the chat the user has just opened
	 * would be about a screen nobody is looking at any more.
	 */
	const DateNavigationJumpOutcome = Object.freeze({
		success: 'success',
		failure: 'failure',
		cancelled: 'cancelled'
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
	const DateNavigationJumpTimeout = Object.freeze({
		anchorWait: 9000,
		panelWait: 10000
	});

	const ChatType = Object.freeze({
		user: 'user',
		chat: 'chat',
		open: 'open',
		general: 'general',
		videoconf: 'videoconf',
		announcement: 'announcement',
		call: 'call',
		support24Notifier: 'support24Notifier',
		support24Question: 'support24Question',
		crm: 'crm',
		sonetGroup: 'sonetGroup',
		calendar: 'calendar',
		tasks: 'tasks',
		taskComments: 'tasksTask',
		thread: 'thread',
		mail: 'mail',
		lines: 'lines',
		copilot: 'copilot',
		channel: 'channel',
		openChannel: 'openChannel',
		generalChannel: 'generalChannel',
		comment: 'comment',
		collab: 'collab',
		vibecodeApp: 'vibecodeApp'
	});
	const DialogScrollThreshold = Object.freeze({
		none: 'none',
		nearTheBottom: 'nearTheBottom',
		halfScreenUp: 'halfScreenUp'
	});
	const DialogBlockType = Object.freeze({
		dateGroup: 'dateGroup',
		authorGroup: 'authorGroup',
		newMessages: 'newMessages',
		markedMessages: 'markedMessages'
	});
	const DialogAlignment = Object.freeze({
		left: 'left',
		center: 'center'
	});
	const DialogIdChatPrefix = 'chat';
	const TempAiAssistantPrefix = 'temp-ai-assistant';

	const CopilotRole = {
		universalCode: 'copilot_assistant'
	};
	const CopilotGenerationStatus = {
		generating: 'generating',
		stopped: 'stopped',
		completed: 'completed',
		error: 'error'
	};
	const CopilotMcpSelectionStatus = {
		restoring: 'restoring',
		ready: 'ready',
		error: 'error',
		unavailable: 'unavailable'
	};
	const AiAssistantSearchBlockName = 'aiAssistantSearch';

	// The server sends COPILOT_SIMPLE_REASONING_PLAN; the message model converts params keys to
	// camelCase before the field whitelist sees them, so this is both the incoming key and the field.
	const CopilotSimpleReasoningPlanField = 'copilotSimpleReasoningPlan';

	// Seconds from startedAt past which a plan is no longer played. Normative and shared with the server
	// (ReasoningPlanPosition::STALE_PLAN_LIMIT): the model refuses offsets beyond it, the show stops on it.
	const CopilotSimpleReasoningStalePlanLimit = 900;

	// Offsets are cumulative seconds from startedAt, rolled by the server once per turn. The first
	// position has offset zero, so the show starts as soon as the placeholder arrives.

	const FileStatus = Object.freeze({
		upload: 'upload',
		wait: 'wait',
		progress: 'progress',
		done: 'done',
		error: 'error',
		preparing: 'preparing'
	});
	const FileType = Object.freeze({
		image: 'image',
		video: 'video',
		audio: 'audio',
		file: 'file'
	});
	const FileIconType = Object.freeze({
		file: 'file',
		image: 'image',
		audio: 'audio',
		video: 'video',
		code: 'code',
		call: 'call',
		attach: 'attach',
		quote: 'quote',
		gallery: 'gallery'
	});
	const FileViewerContext = Object.freeze({
		dialog: 'dialog',
		sidebarMain: 'sidebarMain',
		sidebarTabBriefs: 'sidebarTabBriefs',
		sidebarTabFiles: 'sidebarTabFiles',
		sidebarTabMedia: 'sidebarTabMedia',
		sidebarTabFileUnsorted: 'sidebarTabFileUnsorted'
	});
	const AudioPlaybackRate = Object.freeze({
		1: 1,
		1.5: 1.5,
		2: 2
	});
	const AudioPlaybackState = Object.freeze({
		play: 'play',
		pause: 'pause',
		stop: 'stop',
		none: 'none'
	});
	const PlaylistScope = {
		chat: 'chat',
		sidebar: 'sidebar'
	};
	const PlaybackTrackState = {
		loading: 'loading',
		playing: 'playing',
		paused: 'paused',
		loadingError: 'loadingError',
		unsupportedFormat: 'unsupportedFormat',
		fileProcessing: 'fileProcessing',
		accessDenied: 'accessDenied',
		messageDeleted: 'messageDeleted',
		fileDeleted: 'fileDeleted'
	};

	const MessageType = Object.freeze({
		self: 'self',
		opponent: 'opponent',
		system: 'system'
	});
	const MessageComponent = Object.freeze({
		default: 'DefaultMessage',
		file: 'FileMessage',
		smile: 'SmileMessage',
		sticker: 'StickerMessage',
		unsupported: 'UnsupportedMessage',
		deleted: 'DeletedMessage',
		error: 'ErrorMessage',
		callInvite: 'CallInviteMessage',
		zoomInvite: 'ZoomInviteMessage',
		chatCreation: 'ChatCreationMessage',
		ownChatCreation: 'OwnChatCreationMessage',
		copilotCreation: 'ChatCopilotCreationMessage',
		copilotMessage: 'CopilotMessage',
		copilotAddedUsers: 'ChatCopilotAddedUsersMessage',
		conferenceCreation: 'ConferenceCreationMessage',
		supervisorUpdateFeature: 'SupervisorUpdateFeatureMessage',
		supervisorEnableFeature: 'SupervisorEnableFeatureMessage',
		sign: 'SignMessage',
		admin: 'AdminMessage',
		checkIn: 'CheckInMessage',
		supportVote: 'SupportVoteMessage',
		supportSessionNumber: 'SupportSessionNumberMessage',
		supportChatCreation: 'SupportChatCreationMessage',
		channelPost: 'ChannelPost',
		generalChatCreationMessage: 'GeneralChatCreationMessage',
		generalChannelCreationMessage: 'GeneralChannelCreationMessage',
		channelCreationMessage: 'ChannelCreationMessage',
		callMessage: 'CallMessage',
		voteMessage: 'VoteMessage',
		contactMessage: 'ContactMessage',
		taskChatCreationMessage: 'TaskChatCreationMessage',
		convertToCollabMessage: 'ConvertToCollabMessage',
		collabCreationMessage: 'CollabCreationMessage',
		aiAssistantMessage: 'AiAssistantMessage',
		aiBizprocMessage: 'AiBizprocMessage',
		...imopenlines_v2_const.OpenLinesMessageComponent
	});
	const MessageMentionType = Object.freeze({
		user: 'USER',
		chat: 'CHAT',
		lines: 'LINES',
		context: 'CONTEXT',
		call: 'CALL'
	});
	const MessageStatus = {
		received: 'received',
		delivered: 'delivered',
		error: 'error'
	};
	const OwnMessageStatus = Object.freeze({
		sending: 'sending',
		sent: 'sent',
		viewed: 'viewed',
		error: 'error'
	});
	const FakeMessagePrefix = 'temp';
	const FakeDraftMessagePrefix = 'temp-draft';
	const AutoDeleteDelay = Object.freeze({
		Off: 0,
		Hour: 1,
		Day: 24,
		Week: 168,
		Month: 720
	});

	const DeliveryTimeout = Object.freeze({
		Default: 300,
		WithFiles: 3600
	});

	const RecentCallStatus = {
		waiting: 'waiting',
		joined: 'joined'
	};
	const RecentType = {
		// `default` is the legacy Chats folder code, `chat` is the server chat section: not a duplicate.
		default: 'default',
		chat: 'chat',
		channel: 'channel',
		copilot: 'copilot',
		openChannel: 'openChannel',
		collab: 'collab',
		vibecodeApp: 'vibecodeApp',
		taskComments: 'tasksTask',
		openlines: 'lines',
		calendar: 'calendar',
		collabDefault: 'collabDefault',
		collabChat: 'collabChat'
	};

	const NotificationTypesCodes = Object.freeze({
		confirm: 1,
		simple: 3
	});
	const NotificationSettingsMode = {
		simple: 'simple',
		expert: 'expert'
	};

	const Layout = {
		chat: 'chat',
		createChat: 'createChat',
		updateChat: 'updateChat',
		createFolder: 'createFolder',
		updateFolder: 'updateFolder',
		copyCollab: 'copyCollab',
		channel: 'channel',
		notification: 'notification',
		openlines: 'openlines',
		openlinesV2: 'openlinesV2',
		conference: 'conference',
		settings: 'settings',
		copilot: 'copilot',
		collab: 'collab',
		vibecodeApp: 'vibecodeApp',
		market: 'market',
		taskComments: 'tasksTask',
		folder: 'folder',
		// Distinct from the `all` server folder code on purpose: this value travels to the restored
		// layout in local storage and to analytics, so it must not collide with a folder code.
		folderAll: 'folderAll',
		folderAllSettings: 'folderAllSettings'
	};

	const SearchEntityIdTypes = {
		user: 'user',
		imUser: 'im-user',
		bot: 'im-bot',
		chat: 'im-chat',
		chatUser: 'im-chat-user',
		department: 'department',
		network: 'imbot-network',
		openLines: 'LINES'
	};

	const UserStatus = {
		offline: 'offline',
		online: 'online',
		mobileOnline: 'mobile-online',
		away: 'away',
		idle: 'idle',
		dnd: 'dnd',
		break: 'break'
	};
	const UserType = {
		user: 'user',
		bot: 'bot',
		extranet: 'extranet',
		collaber: 'collaber',
		guest: 'guest'
	};
	const UserRole = {
		guest: 'guest',
		member: 'member',
		manager: 'manager',
		owner: 'owner',
		none: 'none'
	};
	const UserIdNetworkPrefix = 'network';

	const SidebarDetailBlock = Object.freeze({
		main: 'main',
		members: 'members',
		link: 'link',
		favorite: 'favorite',
		task: 'task',
		brief: 'brief',
		media: 'media',
		file: 'file',
		audio: 'audio',
		document: 'document',
		fileUnsorted: 'fileUnsorted',
		meeting: 'meeting',
		market: 'market',
		messageSearch: 'messageSearch',
		chatsWithUser: 'chatsWithUser',
		multidialog: 'multidialog',
		sharedLink: 'sharedLink',
		none: ''
	});
	const SidebarFileGroups = Object.freeze({
		media: 'media',
		audio: 'audio',
		file: 'file',
		brief: 'brief',
		fileUnsorted: 'fileUnsorted'
	});
	const SidebarFileTabGroups = Object.freeze({
		[SidebarFileGroups.media]: SidebarFileGroups.media,
		[SidebarFileGroups.file]: SidebarFileGroups.file,
		[SidebarFileGroups.audio]: SidebarFileGroups.audio,
		[SidebarFileGroups.brief]: SidebarFileGroups.brief
	});
	const SidebarMainPanelBlock = {
		support: 'support',
		chat: 'chat',
		selfChat: 'selfChat',
		user: 'user',
		copilot: 'copilot',
		copilotInfo: 'copilotInfo',
		info: 'info',
		post: 'post',
		fileList: 'fileList',
		fileUnsortedList: 'fileUnsortedList',
		task: 'task',
		taskList: 'taskList',
		taskCommentsHistory: 'taskCommentsHistory',
		meetingList: 'meetingList',
		marketAppList: 'marketAppList',
		multidialog: 'multidialog',
		tariffLimit: 'tariffLimit',
		collabHelpdesk: 'collabHelpdesk'
	};

	const Color = Object.freeze({
		base: '#17a3ea',
		transparent: 'transparent',
		white: '#fff',
		gray40: '#bdc1c6',
		gray90: '#525c69',
		collab70: '#00a94e',
		collab60: '#19cc45',
		collab50: '#6be860',
		collab10: '#f2fee2',
		orange50: '#ffa900',
		orangeExtra: '#e88c02',
		accentBlue: '#00ace3',
		accentExtraAqua: '#37C5D8',
		accentMainPrimaryAlt: '#1f86ff',
		accentSoftBorderBlue: '#88c8f8',
		accentMainSuccess: '#1bce7b',
		accentMainSuccessAlt: '#00a659',
		base4: '#a8adb4',
		blue60: '#11a9d9'
	});
	const ColorToken = Object.freeze({
		base: 'base',
		primary: 'primary',
		secondary: 'secondary',
		alert: 'alert',
		aiAssistant: 'ai-assistant'
	});

	const AttachType = Object.freeze({
		Delimiter: 'delimiter',
		File: 'file',
		Grid: 'grid',
		Html: 'html',
		Image: 'image',
		Link: 'link',
		Message: 'message',
		Rich: 'richLink',
		User: 'user'
	});
	const AttachDescription = Object.freeze({
		firstMessage: 'FIRST_MESSAGE',
		skipMessage: 'SKIP_MESSAGE'
	});

	// message

	// delimiter

	// file

	// grid

	// html

	// image

	// link

	// rich

	// user

	const KeyboardButtonType = {
		button: 'BUTTON',
		newLine: 'NEWLINE'
	};
	const KeyboardButtonContext = {
		all: 'ALL',
		mobile: 'MOBILE',
		desktop: 'DESKTOP'
	};
	const KeyboardButtonDisplay = {
		block: 'BLOCK',
		line: 'LINE'
	};
	const KeyboardButtonAction = {
		put: 'PUT',
		send: 'SEND',
		copy: 'COPY',
		call: 'CALL',
		dialog: 'DIALOG'
	};

	const HotkeyCombination = Object.freeze({
		textDecoration: {
			bold: 'Ctrl+B',
			italic: 'Ctrl+I',
			underline: 'Ctrl+U',
			strikethrough: 'Ctrl+S'
		},
		sendMessage: {
			byEnter: ['Enter', 'NumpadEnter'],
			byCtrlEnter: ['Ctrl+Enter', 'Ctrl+NumpadEnter']
		},
		newLine: {
			byShiftEnter: 'Shift+Enter',
			byEnter: 'Enter',
			byCtrlEnter: 'Ctrl+Enter'
		},
		editMessage: {
			lastOwn: 'ArrowUp'
		},
		messageMenu: {
			quote: 'Alt+Ctrl'
		},
		list: {
			contextMenu: ['Shift+F10', 'ContextMenu'],
			skipContextMenu: 'Alt+Shift'
		},
		desktop: {
			logFolder: 'Ctrl+Shift+L',
			devTools: 'Ctrl+Shift+D'
		}
	});

	const WINDOW_ACTIVATION_DELAY = 300;
	const DesktopBxLink = {
		chat: 'chat',
		lines: 'lines',
		call: 'call',
		phone: 'phone',
		conference: 'conference',
		callList: 'callList',
		notifications: 'notifications',
		recentSearch: 'recentSearch',
		timeManager: 'timemanpwt',
		copilot: 'copilot',
		collab: 'collab',
		channel: 'channel',
		taskComments: 'taskComments',
		settings: 'settings',
		openTab: 'openTab',
		openPage: 'openPage',
		chatCreation: 'chatCreation',
		chatUpdate: 'chatUpdate',
		botContext: 'botContext',
		openLayout: 'openLayout'
	};
	const LegacyDesktopBxLink = {
		messenger: 'messenger',
		chat: 'chat',
		videoconf: 'videoconf',
		notify: 'notify',
		callTo: 'callto',
		callList: 'calllist'
	};
	const DesktopBroadcastAction = {
		notification: 'notification',
		answerButtonClick: 'answerButtonClick',
		bxLink: 'bxLink'
	};

	const LocalStorageKey = Object.freeze({
		smileLastUpdateTime: 'smileLastUpdateTime',
		sidebarOpened: 'sidebarOpened',
		taskCommentsSidebarOpened: 'taskCommentsSidebarOpened',
		textareaMarketOpened: 'textareaMarketOpened',
		textareaHeight: 'textareaHeight',
		textareaHeightAiAssistantWidget: 'textareaHeightAiAssistantWidget',
		textareaHeightAiAssistantEmptyState: 'textareaHeightAiAssistantEmptyState',
		lastCallType: 'lastCallType',
		lastNotificationId: 'lastNotificationId',
		layoutConfig: 'layoutConfig',
		audioPlaybackRate: 'audioPlaybackRate',
		emotePopupTab: 'emotePopupTab',
		invitePopupTab: 'invitePopupTab',
		invitePopupGuestTabReset: 'invitePopupGuestTabReset',
		taskCommentsCardOpened: 'taskCommentsCardOpened',
		copilotWidgetLastDialogId: 'copilotWidgetLastDialogId',
		defaultReactionPending: 'defaultReactionPending'
	});

	const PlacementType = Object.freeze({
		contextMenu: 'IM_CONTEXT_MENU',
		navigation: 'IM_NAVIGATION',
		textarea: 'IM_TEXTAREA',
		sidebar: 'IM_SIDEBAR',
		smilesSelector: 'IM_SMILES_SELECTOR'
	});

	const PopupType = Object.freeze({
		userProfile: 'im-user-settings-popup',
		userStatus: 'im-user-status-popup',
		backgroundSelect: 'im-background-select-popup',
		recentContextMenu: 'im-recent-context-menu',
		recentHeaderMenu: 'im-recent-header-menu',
		createChatMenu: 'im-create-chat-menu',
		dialogMessageMenu: 'bx-im-message-context-menu',
		dialogAvatarMenu: 'bx-im-avatar-context-menu',
		dialogReactionUsers: 'bx-im-message-reaction-users',
		dialogReadUsers: 'bx-im-dialog-read-users',
		createChatManageUsersAddMenu: 'im-content-create-chat-manage-users-add',
		createChatManageUsersDeleteMenu: 'im-content-create-chat-manage-users-delete',
		createChatManageUiMenu: 'im-content-create-chat-manage-ui',
		createChatManageMessagesMenu: 'im-content-create-chat-can-post',
		createChatManageGuestInvitesMenu: 'im-content-create-chat-manage-guest-invites',
		messageBaseFileMenu: 'im-message-base-file-context-menu',
		desktopItemMenu: 'im-navigation-desktop-item-context-menu',
		messageHistoryLimit: 'im-message-history-limit-popup',
		emoteSelector: 'im-emote-selector-popup',
		stickerPack: 'im-sticker-pack-popup',
		stickerContextMenu: 'im-sticker-context-menu',
		stickerPackContextMenu: 'im-sticker-pack-context-menu',
		sharedLinkContextMenu: 'im-shared-link-context-menu',
		mentionAddToChatDropdown: 'im-mention-add-to-chat-dropdown',
		collabCardPromo: 'im-collab-card-promo-popup',
		collabCreateChatPromo: 'im-collab-create-chat-promo-popup',
		taskSideCardPromo: 'im-task-side-card-promo-popup'
	});

	const Settings = Object.freeze({
		appearance: {
			background: 'backgroundImageId',
			alignment: 'chatAlignment'
		},
		notification: {
			enableSound: 'enableSound',
			enableAutoRead: 'notifyAutoRead',
			mode: 'notifyScheme',
			enableWeb: 'notifySchemeSendSite',
			enableMail: 'notifySchemeSendEmail',
			enablePush: 'notifySchemeSendPush'
		},
		hotkey: {
			sendByEnter: 'sendByEnter'
		},
		message: {
			bigSmiles: 'enableBigSmile',
			defaultReaction: 'defaultReaction'
		},
		recent: {
			showBirthday: 'viewBirthday',
			showInvited: 'viewCommonUsers',
			showLastMessage: 'viewLastMessage'
		},
		desktop: {
			enableRedirect: 'openDesktopFromPanel'
		},
		user: {
			status: 'status'
		},
		notifications: 'notifications'
	});
	const SettingsSection = Object.freeze({
		appearance: 'appearance',
		notification: 'notification',
		hotkey: 'hotkey',
		message: 'message',
		recent: 'recent',
		desktop: 'desktop'
	});
	const NotificationSettingsType = {
		web: 'site',
		mail: 'mail',
		push: 'push'
	};

	const SoundType = {
		reminder: 'reminder',
		newMessage1: 'newMessage1',
		newMessage2: 'newMessage2',
		send: 'send',
		dialtone: 'dialtone',
		ringtone: 'ringtone',
		ringtoneModern: 'ringtoneModern',
		start: 'start',
		stop: 'stop',
		error: 'error'
	};

	const PromoId = Object.freeze({
		createGroupChat: 'im:group-chat-create:20062023:all',
		createConference: 'im:conference-create:24082023:all',
		createChannel: 'im:channel-create:04032024:all',
		addUsersToCopilotChat: 'im:add-users-to-copilot-chat:09042024:all',
		createCollabDescription: 'im:collab-create:12092024:all',
		changeRoleCopilot: 'im:change-role-copilot-chat:09042024:all',
		collabHelpdeskSidebar: 'im:collab-helpdesk-sidebar:30102024:all',
		downloadSeveralFiles: 'im:download-several-files:22112024:all',
		embeddedChatEmptyState: 'im:air-chat-empty-state:29042025:all',
		collabEntities: 'socialnetwork:CreatedTaskOrMeetingOrFileThreeDays-collab',
		membersNotInvitedOneDayToCollab: 'socialnetwork:MembersNotInvitedOneDay-collab',
		membersNotInvitedFourDayToCollab: 'socialnetwork:MembersNotInvitedFourDays-collab',
		collaberNotAcceptInvitationOneDay: 'socialnetwork:CollaberNotAcceptInvitationOneDay-collab',
		recentCreateChatInviteUsers: 'im:recent-create-chat-invite-users:22052025:all',
		desktopModeSelection: 'im:desktop-mode-selection:13082025:all',
		createCollabNestedChatDescription: 'im:create-collab-nested-chat-description:20032026:all',
		collabCardNavigation: 'im:collab-card-navigation:28042026:all',
		collabCreateChat: 'im:collab-create-chat:28042026:all',
		taskSideCard: 'im:task-chat-side-card:24062026:all',
		collabProjectAi: 'socialnetwork:collab-project-ai:28042026:all',
		collabAi: 'socialnetwork:collab-project-ai:28042026:all',
		bitrixGptAgent: 'im:bitrix-gpt-agent:20052026:all',
		folderAllOnboarding: 'im:folder-all-onboarding:12082026:all',
		mainReactionOnboarding: 'im:main-reaction-onboarding:20072026:all',
		voiceMessageRecording: 'im:voice-message-recording:26082026:old'
	});

	const ActionByRole = Object.freeze({
		avatar: 'avatar',
		call: 'call',
		extend: 'extend',
		leave: 'leave',
		leaveOwner: 'leaveOwner',
		kick: 'kick',
		mute: 'mute',
		rename: 'rename',
		send: 'send',
		deleteOwnMessage: 'deleteOwnMessage',
		deleteOthersMessage: 'deleteOthersMessage',
		deleteCompleteOwnMessage: 'deleteCompleteOwnMessage',
		userList: 'userList',
		changeOwner: 'changeOwner',
		changeManagers: 'changeManagers',
		update: 'update',
		delete: 'delete',
		readMessage: 'readMessage',
		openComments: 'openComments',
		subscribeToComments: 'subscribeToComments',
		openSidebar: 'openSidebar',
		pinMessage: 'pinMessage',
		setReaction: 'setReaction',
		createMeeting: 'createMeeting',
		createTask: 'createTask',
		createChildChat: 'createChildChat',
		openAvatarMenu: 'openAvatarMenu',
		openMessageMenu: 'openMessageMenu',
		openSidebarMenu: 'openSidebarMenu',
		updateInviteLink: 'updateInviteLink',
		manageGuestLink: 'manageGuestLink',
		createDocumentSign: 'createDocumentSign',
		createCalendarSlots: 'createCalendarSlots',
		changeMessagesAutoDeleteDelay: 'changeMessagesAutoDeleteDelay',
		attachToParent: 'attachToParent',
		linkStructureNode: 'linkStructureNode'
	});
	const ChatActionGroup = Object.freeze({
		manageSettings: 'manageSettings',
		manageUi: 'manageUi',
		manageUsersAdd: 'manageUsersAdd',
		manageUsersDelete: 'manageUsersDelete',
		manageMessages: 'manageMessages',
		manageGuestInvites: 'manageGuestInvites',
		manageDelete: 'manageDelete'
	});
	const ActionByUserType = Object.freeze({
		getChannels: 'getChannels',
		getMarket: 'getMarket',
		getOpenlines: 'getOpenlines',
		createCollab: 'createCollab',
		createCopilot: 'createCopilot',
		createChannel: 'createChannel',
		createChat: 'createChat',
		createConference: 'createConference',
		leaveCollab: 'leaveCollab',
		changeMessagesAutoDeleteDelay: 'changeMessagesAutoDeleteDelay',
		changeStickerPack: 'changeStickerPack',
		createStickerPack: 'createStickerPack',
		extend: 'extend',
		manageGuestLink: 'manageGuestLink',
		linkStructureNode: 'linkStructureNode'
	});

	const RawBotType = Object.freeze({
		bot: 'bot',
		network: 'network',
		support24: 'support24',
		human: 'human',
		openline: 'openline',
		supervisor: 'supervisor',
		personal: 'personal'
	});
	const BotType = Object.freeze({
		bot: 'bot',
		network: 'network',
		support24: 'support24'
	});
	const BotCode = Object.freeze({
		marta: 'marta',
		giphy: 'giphy',
		copilot: 'copilot',
		aiAssistant: 'AiAssistantBot'
	});
	const BotCommand = Object.freeze({
		activate: 'activate'
	});

	const Path = {
		online: '/online/',
		history: '/desktop_app/history.php'
	};

	const GetParameter = {
		openNotifications: 'IM_NOTIFY',
		openHistory: 'IM_HISTORY',
		openChat: 'IM_DIALOG',
		openMessage: 'IM_MESSAGE',
		openLines: 'IM_LINES',
		openSettings: 'IM_SETTINGS',
		openCopilotChat: 'IM_COPILOT',
		openChannel: 'IM_CHANNEL',
		openCollab: 'IM_COLLAB',
		openSharedLink: 'IM_CODE',
		openTaskComments: 'IM_TASK',
		botContext: 'BOT_CONTEXT',
		desktopChatTabMode: 'IM_TAB',
		backgroundType: 'IM_BACKGROUND',
		legacyMode: 'IM_LEGACY',
		recentType: 'IM_RECENT_TYPE'
	};

	const TextareaPanelType = {
		edit: 'edit',
		reply: 'reply',
		forward: 'forward',
		market: 'market',
		none: ''
	};

	// input field an insert event is addressed to; absence of the address means the main field
	const TextareaTarget = {
		main: 'main',
		uploadCaption: 'uploadCaption'
	};

	const ChatEntityLinkType = Object.freeze({
		tasks: 'TASKS',
		sonetGroup: 'SONET_GROUP',
		mail: 'MAIL',
		calendar: 'CALENDAR',
		contact: 'CONTACT',
		deal: 'DEAL',
		lead: 'LEAD',
		dynamic: 'DYNAMIC',
		vibecodeApp: 'VIBECODE_APP'
	});

	const MultidialogStatus = Object.freeze({
		new: 'new',
		open: 'open',
		close: 'close'
	});

	const SliderCode = {
		copilotDisabled: 'limit_copilot_off',
		historyLimited: 'limit_office_chating_history',
		autoDeleteDisabled: 'limit_auto_delete_messages_off',
		collabInviteOff: 'limit_v2_socialnetwork_collab_invite_off',
		collabDisabled: 'socialnetwork_collab_off',
		collabV2Disabled: 'socialnetwork_projects_groups',
		collabV2CopyDisabled: 'socialnetwork_copy_project',
		buyMarketPlus: 'limit_subscription_market_access_buy_marketplus'
	};

	const CollabEntityType = {
		tasks: 'tasks',
		files: 'files',
		calendar: 'calendar'
	};

	const ErrorCode = Object.freeze({
		collabV2: {
			tariffRestricted: 'COLLAB_TARIFF_RESTRICTED'
		},
		collab: {
			excludeFromStructure: 'EXCLUDE_DENIED_FROM_STRUCTURE',
			leaveFromStructure: 'LEAVE_DENIED_FROM_STRUCTURE'
		},
		chat: {
			accessDenied: 'ACCESS_DENIED',
			notFound: 'CHAT_NOT_FOUND'
		},
		structureLink: {
			chatTypeNotSupported: 'CHAT_TYPE_NOT_SUPPORTED',
			tooManyNodes: 'TOO_MANY_NODES',
			nodeNotAvailable: 'NODE_NOT_AVAILABLE',
			structureNotAvailable: 'STRUCTURE_NOT_AVAILABLE'
		},
		message: {
			accessDenied: 'MESSAGE_ACCESS_DENIED',
			accessDeniedByTariff: 'MESSAGE_ACCESS_DENIED_BY_TARIFF',
			notFound: 'MESSAGE_NOT_FOUND',
			// the stored composition is verified after the message is saved, so this refusal comes back on an
			// edit that went through
			filesMismatch: 'MESSAGE_FILES_MISMATCH'
		},
		user: {
			invitedFromStructure: 'USER_INVITED_FROM_STRUCTURE',
			notFound: 'USER_NOT_FOUND'
		},
		file: {
			maxFileSize: 'MAX_FILE_SIZE_EXCEEDED'
		},
		folder: {
			chatNotEligible: 'FOLDER_CHAT_NOT_ELIGIBLE'
		},
		sticker: {
			maxPacks: 'MAX_PACKS_ERROR',
			maxStickers: 'MAX_STICKERS_ERROR'
		},
		aiTask: {
			// the deduplication slot of the chat is still busy with this very selection
			creationInProgress: 'AI_TASK_CREATION_IN_PROGRESS',
			// no task can be made of such a source: a system message, a sticker, a deleted message,
			// an open line, a support chat, a network dialog
			sourceNotSupported: 'AI_TASK_SOURCE_NOT_SUPPORTED'
		}
	});

	const NavigationMenuItem = Object.freeze({
		messenger: 'messenger',
		[Layout.chat]: Layout.chat,
		[Layout.copilot]: Layout.copilot,
		[Layout.collab]: Layout.collab,
		[Layout.channel]: Layout.channel,
		[Layout.openlines]: Layout.openlines,
		[Layout.openlinesV2]: Layout.openlinesV2,
		[Layout.notification]: Layout.notification,
		[Layout.market]: Layout.market,
		[Layout.settings]: Layout.settings,
		[Layout.taskComments]: Layout.taskComments,
		[Layout.vibecodeApp]: Layout.vibecodeApp,
		call: 'call',
		timemanager: 'timemanager',
		homepage: 'homepage'
	});

	const AnchorType = Object.freeze({
		mention: 'mention',
		reaction: 'reaction'
	});

	const TranscriptionStatus = {
		SUCCESS: 'Success',
		ERROR: 'Error',
		PENDING: 'Pending'
	};

	const SpecialMentionDialogId = {
		allParticipants: 'all'
	};

	const DataAttribute = {
		useNativeContextMenu: 'data-use-native-context-menu'
	};

	const StickerPackType = {
		vendor: 'vendor',
		custom: 'custom'
	};
	const StickerType = {
		image: 'image'
	};

	const TabId = Object.freeze({
		guests: 'guests',
		employees: 'employees'
	});

	const SelectorEntity = {
		user: 'user',
		bot: 'im-bot',
		department: 'department',
		structureNode: 'structure-node',
		recent: 'im-recent-v2'
	};

	const MessageBuilderPlainColorToken = {
		base: 'base',
		primary: 'primary',
		secondary: 'secondary',
		alert: 'alert',
		success: 'success',
		tertiary: 'tertiary'
	};
	const MessageBuilderGradientColorToken = {
		'ai-assistant': 'ai-assistant'
	};
	const MessageBuilderBackgroundPlainToken = 'plain';

	// Mirrors SendContextualStatus::THINKING_SEARCH_BLOCK_ID. messages/builder/updateBlock silently
	// does nothing on a mismatched id, so the plan player must address the block by the server's id.
	const AiAssistantThinkingBlockId = 'aiassistant-thinking-search';
	const FormFieldType = Object.freeze({
		singleLineText: 'singleLineText',
		multilineText: 'multilineText',
		select: 'select',
		radio: 'radio',
		checkbox: 'checkbox'
	});

	const ParentChatScope = {
		all: null,
		topLevel: 0
	};

	const FolderType = {
		system: 'system',
		personal: 'personal'
	};
	// Mirror of the system folder rest codes (`BaseFolder::getRestCode()`) - exactly what the server puts
	// into the `code` field of a folder. Not the domain `CODE`: `OpenLineFolder` keeps `CODE = 'openlines'`
	// but overrides `REST_CODE = 'lines'`, and the client only ever sees the rest code.
	// Neither a subset nor a superset of recent sections: `all` has no section, `calendar` has no folder.
	const SystemFolderCode = {
		default: 'default',
		chat: 'chat',
		channel: 'channel',
		openChannel: 'openChannel',
		copilot: 'copilot',
		collab: 'collab',
		tasksTask: 'tasksTask',
		tasksTaskRoot: 'tasksTaskRoot',
		openlines: 'lines',
		all: 'all',
		vibecodeApp: 'vibecodeApp'
	};

	/**
	 * Statuses and content types of the "AI task from messages" flow. Single source of truth
	 * shared by im.v2.model (ai-task) and im.v2.provider.pull, so the client union cannot drift
	 * from the backend.
	 *
	 * Backend counterparts:
	 * - statuses: Bitrix\Im\V2\Integration\AI\TaskCreation\Status (enum Status: string)
	 * - content types: Bitrix\Im\V2\Pull\Event\AutoTaskStatus::getMessageType()
	 */
	const AiTaskStatus = Object.freeze({
		search: 'search',
		taskCreationStarted: 'taskCreationStarted',
		taskCreationCompleted: 'taskCreationCompleted',
		resultCreationStarted: 'resultCreationStarted',
		resultCreationCompleted: 'resultCreationCompleted',
		notFound: 'notFound'
	});
	const AiTaskContentType = Object.freeze({
		voiceNote: 'voiceNote',
		videoNote: 'videoNote',
		message: 'message'
	});

	exports.ActionByRole = ActionByRole;
	exports.ActionByUserType = ActionByUserType;
	exports.AiAssistantSearchBlockName = AiAssistantSearchBlockName;
	exports.AiAssistantThinkingBlockId = AiAssistantThinkingBlockId;
	exports.AiTaskContentType = AiTaskContentType;
	exports.AiTaskStatus = AiTaskStatus;
	exports.AnchorType = AnchorType;
	exports.AttachDescription = AttachDescription;
	exports.AttachType = AttachType;
	exports.AudioPlaybackRate = AudioPlaybackRate;
	exports.AudioPlaybackState = AudioPlaybackState;
	exports.AutoDeleteDelay = AutoDeleteDelay;
	exports.BotCode = BotCode;
	exports.BotCommand = BotCommand;
	exports.BotType = BotType;
	exports.ChatActionGroup = ChatActionGroup;
	exports.ChatEntityLinkType = ChatEntityLinkType;
	exports.ChatType = ChatType;
	exports.CollabEntityType = CollabEntityType;
	exports.Color = Color;
	exports.ColorToken = ColorToken;
	exports.CopilotGenerationStatus = CopilotGenerationStatus;
	exports.CopilotMcpSelectionStatus = CopilotMcpSelectionStatus;
	exports.CopilotRole = CopilotRole;
	exports.CopilotSimpleReasoningPlanField = CopilotSimpleReasoningPlanField;
	exports.CopilotSimpleReasoningStalePlanLimit = CopilotSimpleReasoningStalePlanLimit;
	exports.DataAttribute = DataAttribute;
	exports.DateNavigationJumpOutcome = DateNavigationJumpOutcome;
	exports.DateNavigationJumpTimeout = DateNavigationJumpTimeout;
	exports.DeliveryTimeout = DeliveryTimeout;
	exports.DesktopBroadcastAction = DesktopBroadcastAction;
	exports.DesktopBxLink = DesktopBxLink;
	exports.DialogAlignment = DialogAlignment;
	exports.DialogBlockType = DialogBlockType;
	exports.DialogIdChatPrefix = DialogIdChatPrefix;
	exports.DialogScrollThreshold = DialogScrollThreshold;
	exports.ErrorCode = ErrorCode;
	exports.EventType = EventType;
	exports.FakeDraftMessagePrefix = FakeDraftMessagePrefix;
	exports.FakeMessagePrefix = FakeMessagePrefix;
	exports.FileIconType = FileIconType;
	exports.FileStatus = FileStatus;
	exports.FileType = FileType;
	exports.FileViewerContext = FileViewerContext;
	exports.FolderType = FolderType;
	exports.FormFieldType = FormFieldType;
	exports.GetParameter = GetParameter;
	exports.HotkeyCombination = HotkeyCombination;
	exports.KeyboardButtonAction = KeyboardButtonAction;
	exports.KeyboardButtonContext = KeyboardButtonContext;
	exports.KeyboardButtonDisplay = KeyboardButtonDisplay;
	exports.KeyboardButtonType = KeyboardButtonType;
	exports.Layout = Layout;
	exports.LegacyDesktopBxLink = LegacyDesktopBxLink;
	exports.LocalStorageKey = LocalStorageKey;
	exports.MessageBuilderBackgroundPlainToken = MessageBuilderBackgroundPlainToken;
	exports.MessageBuilderGradientColorToken = MessageBuilderGradientColorToken;
	exports.MessageBuilderPlainColorToken = MessageBuilderPlainColorToken;
	exports.MessageComponent = MessageComponent;
	exports.MessageMentionType = MessageMentionType;
	exports.MessageStatus = MessageStatus;
	exports.MessageType = MessageType;
	exports.MultidialogStatus = MultidialogStatus;
	exports.NavigationMenuItem = NavigationMenuItem;
	exports.NotificationSettingsMode = NotificationSettingsMode;
	exports.NotificationSettingsType = NotificationSettingsType;
	exports.NotificationTypesCodes = NotificationTypesCodes;
	exports.OwnMessageStatus = OwnMessageStatus;
	exports.ParentChatScope = ParentChatScope;
	exports.Path = Path;
	exports.PlacementType = PlacementType;
	exports.PlaybackTrackState = PlaybackTrackState;
	exports.PlaylistScope = PlaylistScope;
	exports.PopupType = PopupType;
	exports.PromoId = PromoId;
	exports.RawBotType = RawBotType;
	exports.RecentCallStatus = RecentCallStatus;
	exports.RecentType = RecentType;
	exports.RestMethod = RestMethod;
	exports.SearchEntityIdTypes = SearchEntityIdTypes;
	exports.SelectorEntity = SelectorEntity;
	exports.Settings = Settings;
	exports.SettingsSection = SettingsSection;
	exports.SidebarDetailBlock = SidebarDetailBlock;
	exports.SidebarFileGroups = SidebarFileGroups;
	exports.SidebarFileTabGroups = SidebarFileTabGroups;
	exports.SidebarMainPanelBlock = SidebarMainPanelBlock;
	exports.SliderCode = SliderCode;
	exports.SoundType = SoundType;
	exports.SpecialMentionDialogId = SpecialMentionDialogId;
	exports.StickerPackType = StickerPackType;
	exports.StickerType = StickerType;
	exports.SystemFolderCode = SystemFolderCode;
	exports.TabId = TabId;
	exports.TempAiAssistantPrefix = TempAiAssistantPrefix;
	exports.TextareaPanelType = TextareaPanelType;
	exports.TextareaTarget = TextareaTarget;
	exports.TranscriptionStatus = TranscriptionStatus;
	exports.UserIdNetworkPrefix = UserIdNetworkPrefix;
	exports.UserRole = UserRole;
	exports.UserStatus = UserStatus;
	exports.UserType = UserType;
	exports.WINDOW_ACTIVATION_DELAY = WINDOW_ACTIVATION_DELAY;
})(this.BX.Messenger.v2.Const = this.BX.Messenger.v2.Const || {}, BX?.OpenLines?.v2?.Const??{});;
//# sourceMappingURL=registry.bundle.js.map
