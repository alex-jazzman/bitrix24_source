/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
this.BX.Messenger.v2.Provider = this.BX.Messenger.v2.Provider || {};
(function (exports, im_v2_application_core, im_v2_lib_user, im_v2_lib_logger, main_core, main_core_events, im_v2_const, im_v2_lib_copilot, im_v2_lib_copilotSimpleStatus, im_v2_lib_deliveryWatchdog, im_v2_lib_inputAction, im_v2_provider_service_message, im_v2_lib_analytics, im_v2_lib_notifier, im_v2_lib_playback, ui_a11y, im_v2_lib_channel, im_public, im_v2_lib_call, im_v2_lib_roleManager, im_v2_provider_service_command, im_v2_lib_utils, im_v2_lib_desktop, im_v2_lib_counter, main_sidepanel, im_v2_lib_slider, im_v2_lib_layout, im_v2_lib_unreadMode, im_v2_lib_chat, im_v2_lib_folder, im_v2_lib_messageNotifier, im_v2_lib_localStorage, im_v2_lib_uuid, im_v2_lib_promo) {
	'use strict';

	class BotPullHandler {
		#store;
		constructor() {
			this.#store = im_v2_application_core.Core.getStore();
		}
		handleBotAdd(params) {
			im_v2_lib_logger.Logger.warn('BotPullHandler: handleBotAdd', params);
			const {
				user
			} = params;
			void new im_v2_lib_user.UserManager().addUsersToModel(user);
		}
		handleBotUpdate(params) {
			const {
				user
			} = params;
			this.#store.dispatch('users/update', {
				id: user.id,
				fields: user
			});
		}
	}

	class MessageDeleteManager {
		#store;
		constructor() {
			this.#store = im_v2_application_core.Core.getStore();
		}
		deleteMessage(params) {
			this.#stopWriting(params.dialogId, params.senderId);
			void this.#store.dispatch('messages/update', {
				id: params.id,
				fields: {
					text: '',
					isDeleted: true,
					files: [],
					attach: [],
					replyId: 0
				}
			});
			this.#stopPlayback(params.id);
		}
		deleteMessageComplete(params) {
			this.#stopWriting(params.dialogId, params.senderId);
			const areChannelCommentsOpened = this.#store.getters['messages/comments/areOpenedForChannelPost'](params.id);
			if (areChannelCommentsOpened) {
				this.#closeChannelComments(params);
			}
			void this.#store.dispatch('messages/delete', {
				id: params.id
			});
			const dialogUpdateFields = this.#prepareDialogUpdateFields(params);
			void this.#store.dispatch('chats/update', {
				dialogId: params.dialogId,
				fields: dialogUpdateFields
			});
			this.#stopPlayback(params.id);
		}
		#stopWriting(dialogId, userId) {
			im_v2_lib_inputAction.InputActionListener.getInstance().stopAction({
				dialogId,
				userId
			});
		}
		#stopPlayback(messageId) {
			im_v2_lib_playback.PlaybackService.getInstanceIfCreated()?.handleMessageDeleted(messageId);
		}
		#closeChannelComments(params) {
			main_core_events.EventEmitter.emit(im_v2_const.EventType.dialog.closeComments);
			im_v2_lib_analytics.Analytics.getInstance().messageDelete.onDeletedPostNotification({
				dialogId: params.dialogId
			});
			im_v2_lib_notifier.Notifier.message.onNotFoundError();
		}
		#prepareDialogUpdateFields(params) {
			const dialogUpdateFields = {};
			const lastMessageWasDeleted = Boolean(params.newLastMessage);
			if (lastMessageWasDeleted) {
				dialogUpdateFields.lastMessageId = params.newLastMessage.id;
				dialogUpdateFields.lastMessageViews = params.lastMessageViews;
				void this.#store.dispatch('messages/store', params.newLastMessage);
			}
			return dialogUpdateFields;
		}
	}

	const STALE_THRESHOLD_SECONDS = 90;
	const WATCHDOG_TIMEOUT = 90_000;
	// How long a terminal caption stays FULLY drawn on the source message before the indication is
	// taken down. The same window for both outcomes, which is why it is spelled once: a caption that is
	// still materializing cannot be read, and counting the take-down from the arrival of the status
	// took that head start out of the failure alone.
	const TERMINAL_CAPTION_WINDOW = 3_000;
	// Mirrors of `--im-message-ai-task__duration_terminal` and `--im-message-ai-task__duration_extinguish`
	// (`im.v2.component.message.elements/ai-task-indication.css`): a terminal caption materializes, and
	// the caption of a failure only begins to do so once the rim has gone out - the one frame that runs
	// its change in reverse. A change of either duration has to be repeated here, and the unit of the
	// component pins the CSS side to these very numbers, so a change of one side alone turns red.
	const CAPTION_MATERIALIZE_DELAY = 220;
	const RIM_EXTINGUISH_DELAY = 400;

	// The terminal frame of a success ("task created" / partial result). The task card usually arrives
	// earlier and takes the indication down itself, so this is the ceiling, not the usual lifetime.
	const TERMINAL_FRAME_DELAY = TERMINAL_CAPTION_WINDOW + CAPTION_MATERIALIZE_DELAY;
	const NOT_FOUND_CLEAR_DELAY = TERMINAL_FRAME_DELAY + RIM_EXTINGUISH_DELAY;
	const TerminalStatus = {
		completed: im_v2_const.AiTaskStatus.taskCreationCompleted,
		// The verdict "these messages are not a new assignment": the AI read them as a result of a task
		// that already exists, so no task is created and the result is appended to that one. The name
		// reads like a stage of a longer run - which is how it came to be counted as progress here - but
		// the server sends nothing by the operation afterwards (`TranscribedResultHandler::handle()`),
		// and a frame left running would hang on the message until the watchdog took it down unanswered.
		resultAdded: im_v2_const.AiTaskStatus.resultCreationCompleted,
		notFound: im_v2_const.AiTaskStatus.notFound
	};

	// The two ends an operation can reach successfully. They are told apart only by the caption they
	// draw: the same window, no balloon and no notification of any kind, since a success leaves a trace
	// in the chat of its own.
	const SUCCESS_STATUSES = new Set([TerminalStatus.completed, TerminalStatus.resultAdded]);

	// A timer is kept per chat, but it belongs to ONE operation of that chat: a chat outlives its
	// operations, and the next one can start while a timer of the previous is still pending. So the anchor
	// it was armed for rides along and is checked at its firing.

	// The take-down carries the outcome that armed it as well: its own delay depends on the outcome, and
	// noticing "this outcome has already been reported" means telling WHICH one that was.

	// Shared across all handler instances: `AiPullHandler` is constructed twice and independently -
	// `BasePullHandler` builds one for the status events, `MessagePullHandler` builds another for the
	// task card - while both paths drive the same indication of the same chat. Kept in instance fields,
	// each of them would see its own, always empty registry: the deferred take-down of the terminal frame
	// would be unknown to the card path, and the watchdog of a finished operation would never be cancelled.
	const watchdogTimers = new Map();
	const clearTimers = new Map();
	class AiPullHandler {
		#store;
		constructor() {
			this.#store = im_v2_application_core.Core.getStore();
		}
		handleChangeEngine(params) {
			im_v2_lib_logger.Logger.warn('AiPullHandler: handleChangeEngine', params);
			const {
				chatId,
				engineCode
			} = params;
			const dialog = this.#store.getters['chats/getByChatId'](chatId);
			if (!dialog) {
				return;
			}
			this.#store.dispatch('copilot/chats/updateModel', {
				dialogId: dialog.dialogId,
				aiModel: engineCode
			});
		}
		handleFileTranscription(params) {
			im_v2_lib_logger.Logger.warn('AiPullHandler: handleFileTranscription', params);
			this.#store.dispatch('files/setTranscription', params);
		}
		handleSetCopilotTitle(params) {
			im_v2_lib_logger.Logger.warn('AiPullHandler: handleSetCopilotTitle', params);
			const {
				dialogId
			} = params;
			if (!dialogId) {
				return;
			}
			void this.#store.dispatch('copilot/chats/setTitleIsCustom', {
				dialogId,
				titleIsCustom: true
			});
		}
		handleCopilotGenerationState(params) {
			im_v2_lib_logger.Logger.warn('AiPullHandler: handleCopilotGenerationState', params);
			const {
				dialogId,
				status,
				initiatorId
			} = params;
			if (!dialogId) {
				return;
			}

			// the model keeps only the active generation: any terminal status clears the state
			void this.#store.dispatch('copilot/chats/setGenerationState', {
				dialogId,
				generationState: {
					status,
					initiatorId
				}
			});
			if (status !== im_v2_const.CopilotGenerationStatus.generating) {
				new im_v2_lib_copilot.CopilotManager().stopCopilotTyping(dialogId);
			}
		}
		handleChatCopilotRoleUpdate(params) {
			if (!params.copilotRole) {
				return;
			}
			const copilotManager = new im_v2_lib_copilot.CopilotManager();
			void copilotManager.handleRoleUpdate(params.copilotRole);
		}
		handleAutoTaskStatus(params, extra = {}) {
			im_v2_lib_logger.Logger.warn('AiPullHandler: handleAutoTaskStatus', params);
			if (this.#isStale(extra)) {
				return;
			}
			const {
				chatId: eventChatId,
				messageId,
				status,
				isPartial
			} = params;
			const tracked = this.#resolveOperation(eventChatId, messageId);
			if (!tracked) {
				this.#rememberEarlyStatus(messageId, status);
				return;
			}
			const {
				chatId,
				operation
			} = tracked;
			if (SUCCESS_STATUSES.has(status)) {
				this.#cancelWatchdog(chatId);
				// The partial-result flag rides on `taskCreationCompleted` alone (the payload of
				// `AutoTaskStatus` carries it under that status only), and its absence means a plain
				// success - which an appended result always is.
				void this.#store.dispatch('aiTask/applyStatus', {
					chatId,
					messageId,
					status,
					isPartial
				});
				this.#scheduleClear(chatId, operation.anchorMessageId, status, TERMINAL_FRAME_DELAY);
				return;
			}
			if (status === TerminalStatus.notFound) {
				this.#cancelWatchdog(chatId);
				// A take-down pending for THIS outcome of THIS operation is the mark of an outcome that has
				// been through here once: `#scheduleClear()` arms it once per outcome, `#armWatchdog()` drops
				// it the moment a new operation runs in the chat, and past its firing the operation is gone
				// from the store, so a repeated event stops resolving at all (`#resolveOperation()`). Its
				// lifetime is therefore exactly the window a redelivered terminal can still arrive in, which
				// is why noticing one needs no state of its own. A take-down of the operation started after
				// this one does not count, nor does the one of its own terminal SUCCESS: the first belongs to
				// another operation, the second to another outcome, and this failure has still not been told.
				// The card path reads the same mark for the same reason (`handleAiTaskTriggerMessage()`).
				const outcomeAlreadyReported = this.#isOutcomeAlreadyReported(tracked, status);

				// Visibility is read from the operation taken BEFORE `applyStatus`: the action keeps the
				// field but replaces the operation object, so a re-read after it would cost a getter call
				// for the same value.
				if (operation.anchorVisible) {
					void this.#store.dispatch('aiTask/applyStatus', {
						chatId,
						messageId,
						status
					});
					this.#scheduleClear(chatId, operation.anchorMessageId, status, NOT_FOUND_CLEAR_DELAY);
				} else {
					// Out of the visible area there is nothing to draw the frame on, so the indication goes down
					// at once - and before the balloon below, which is then raised over an operation that has
					// already left the screen.
					this.#clearIndication(chatId);
					// The balloon of the notifier is not a live region, so it reaches a sighted user only. The
					// same text goes to the announcer, and assertively: with no frame left on the screen this is
					// the whole outcome of the operation. Only from here, though: with the frame up, the
					// indication announces the terminal caption it draws itself, and a second announcement would
					// be the same failure heard twice. A repeat that finds the anchor gone is silent for exactly
					// that reason: the frame that was up when it first arrived has already spoken for it.
					// The phrase is declared by this extension and repeats the one the balloon shows on purpose:
					// read out of the private lang of the notifier, it would turn into an empty announcement the
					// day its owner renames the key - silently, because `LiveAnnouncer` says whatever it is given.
					if (!outcomeAlreadyReported) {
						ui_a11y.LiveAnnouncer.announce(main_core.Loc.getMessage('IM_PULL_AI_TASK_CREATE_ERROR'), 'assertive');
					}
				}

				// Raised whichever way the branch went, because the frame is not a trace: it leaves the screen
				// on a timer that cannot be stopped, extended or switched off, while the balloon keeps its own
				// time and waits to be closed. A failure has nothing else to leave behind - the task card comes
				// only with a success (a partial one included), which is why progress is never notified at all.
				// Raised once, too: a redelivered terminal event is not a second failure to report, and the
				// notification centre stacks whatever it is given - it has no idea the two are the same one.
				if (!outcomeAlreadyReported) {
					im_v2_lib_notifier.Notifier.message.onAiTaskCreateError();
				}
				return;
			}

			// Non-terminal statuses (search / taskCreationStarted / resultCreationStarted) and any status
			// this client does not know: keep the indication up and (re)arm the watchdog, since the
			// terminal event is fire-once and may be lost.
			void this.#store.dispatch('aiTask/applyStatus', {
				chatId,
				messageId,
				status
			});
			this.#armWatchdog(chatId, operation.anchorMessageId);
		}
		handleAiTaskTriggerMessage(chatId, message) {
			// No system-flag guard: auto-task cards are regular (non-system) messages,
			// and the AI_TASK_TRIGGER_MESSAGE_ID param exists only on such cards.
			const triggerMessageId = Number(message?.params?.AI_TASK_TRIGGER_MESSAGE_ID);
			if (!main_core.Type.isNumber(triggerMessageId) || Number.isNaN(triggerMessageId)) {
				return;
			}
			const operation = this.#store.getters['aiTask/getForChat'](chatId);
			if (!operation || operation.anchorMessageId !== triggerMessageId) {
				return;
			}

			// Reserve terminal only: the card normally arrives while the terminal frame is still up, and
			// cutting that frame short would take the outcome off the screen before it is read. The take-down
			// is already scheduled there, so this branch is left for the operation that never got a terminal
			// pull event at all (a lost event, a reconnect). A take-down pending for another operation of the
			// chat says nothing about this one and must not stand in for its terminal.
			if (clearTimers.get(chatId)?.anchorMessageId === triggerMessageId) {
				return;
			}
			this.#clearIndication(chatId);
		}

		/**
		 * Resolves the tracked operation the event belongs to, together with the chat it runs in.
		 *
		 * Correlation runs by anchor, never by the chat of the event: `chatId` of the payload is
		 * `int|null` and arrives empty exactly with the terminal `notFound` - the anchor message is gone
		 * and no message of the selection survived to lend its chat
		 * (`MultipleMessagesCreator::resolveAnchorMessage()`). The chat of the operation is the one it was
		 * started with (`aiTask/start`), so it is taken locally and the existence of the chat is checked
		 * only where the chat is drawn.
		 *
		 * One tracked operation per chat, so a foreign anchor means a foreign event: an overwritten
		 * previous start, or a backend operation the web does not track.
		 */
		#resolveOperation(chatId, messageId) {
			if (main_core.Type.isNumber(chatId) && chatId > 0) {
				const operation = this.#store.getters['aiTask/getForChat'](chatId);
				return operation?.anchorMessageId === messageId ? {
					chatId,
					operation
				} : null;
			}
			const collection = this.#store.state?.aiTask?.collection ?? {};
			const trackedChatId = Object.keys(collection).find(key => collection[key].anchorMessageId === messageId);
			return main_core.Type.isUndefined(trackedChatId) ? null : {
				chatId: Number(trackedChatId),
				operation: collection[trackedChatId]
			};
		}

		/**
		 * A status that no tracked operation owns YET. The first status of an operation is sent by the
		 * very request that answers its start, and that request keeps working afterwards
		 * (`MultipleMessagesCreator::sendAiQuery()`), so the status can arrive here while the answer - and
		 * with it `aiTask/start` - is still on its way. Dropped, it would leave the operation with no
		 * status at all: the start watchdog would take the frame of a running operation down, and the
		 * terminal event of that operation would then find nothing in the store to report on. So the model
		 * keeps it by anchor and the start applies it.
		 *
		 * Only a non-terminal status waits. A terminal one carries an outcome that has to be drawn for a
		 * measured window, announced and given a balloon of its own, and none of that can be arranged for
		 * an operation that is not in the store: it would take this handler being woken by the start, and
		 * nothing here can see one.
		 */
		#rememberEarlyStatus(messageId, status) {
			if (SUCCESS_STATUSES.has(status) || status === TerminalStatus.notFound) {
				return;
			}
			void this.#store.dispatch('aiTask/rememberEarlyStatus', {
				messageId,
				status
			});
		}

		/**
		 * A take-down pending for the same outcome of the same operation: the mark of a terminal event
		 * that has already been reported.
		 */
		#isOutcomeAlreadyReported(tracked, status) {
			const pending = clearTimers.get(tracked.chatId);
			return pending?.anchorMessageId === tracked.operation.anchorMessageId && pending?.status === status;
		}

		/**
		 * Defers the take-down so the terminal frame stays readable. Idempotent per outcome of an operation:
		 * a repeated terminal of the same one neither starts a second timer nor extends the frame. A pending
		 * take-down of ANOTHER operation, or of another outcome of this one, is dropped in favour of this
		 * one: it was measured for a frame the chat no longer draws, and the frame drawn now has its own
		 * window (a failure needs the longer one).
		 */
		#scheduleClear(chatId, anchorMessageId, status, delay) {
			const pending = clearTimers.get(chatId);
			if (pending) {
				if (pending.anchorMessageId === anchorMessageId && pending.status === status) {
					return;
				}
				clearTimeout(pending.timerId);
			}
			const timerId = setTimeout(() => {
				clearTimers.delete(chatId);
				this.#clearIndicationOf(chatId, anchorMessageId, status);
			}, delay);
			clearTimers.set(chatId, {
				timerId,
				anchorMessageId,
				status
			});
		}
		#cancelScheduledClear(chatId) {
			const pending = clearTimers.get(chatId);
			if (pending) {
				clearTimeout(pending.timerId);
				clearTimers.delete(chatId);
			}
		}

		/**
		 * The exit of a timer: the indication goes down only while the chat still draws the operation the
		 * timer was armed for. A chat outlives its operations, so a take-down or a watchdog left from a
		 * previous one would otherwise put out the operation started after it - and take the whole outcome
		 * of that one with it, since its statuses stop resolving the moment it leaves the store.
		 *
		 * A take-down names the outcome it was measured for as well, because the anchor alone does not
		 * tell the operations apart here: a start made over the very source of the one that just ended
		 * carries the same anchor, and a fresh start carries no terminal status.
		 */
		#clearIndicationOf(chatId, anchorMessageId, status = null) {
			const operation = this.#store.getters['aiTask/getForChat'](chatId);
			if (operation?.anchorMessageId !== anchorMessageId) {
				return;
			}
			if (status !== null && operation.status !== status) {
				return;
			}
			this.#clearIndication(chatId);
		}

		/** The single exit of the indication: no timer of the chat outlives it. */
		#clearIndication(chatId) {
			this.#cancelWatchdog(chatId);
			this.#cancelScheduledClear(chatId);
			void this.#store.dispatch('aiTask/clear', {
				chatId
			});
		}
		#armWatchdog(chatId, anchorMessageId) {
			this.#cancelWatchdog(chatId);
			// A non-terminal status means an operation is running in this chat again, so a take-down still
			// pending from the terminal frame of the previous one must not fire on top of it.
			this.#cancelScheduledClear(chatId);
			const timerId = setTimeout(() => {
				watchdogTimers.delete(chatId);
				this.#clearIndicationOf(chatId, anchorMessageId);
			}, WATCHDOG_TIMEOUT);
			watchdogTimers.set(chatId, {
				timerId,
				anchorMessageId
			});
		}
		#cancelWatchdog(chatId) {
			const pending = watchdogTimers.get(chatId);
			if (pending) {
				clearTimeout(pending.timerId);
				watchdogTimers.delete(chatId);
			}
		}
		#isStale(extra) {
			return main_core.Type.isNumber(extra?.server_time_ago) && extra.server_time_ago > STALE_THRESHOLD_SECONDS;
		}
	}

	class NewMessageManager {
		#params;
		#extra;
		constructor(params, extra = {}) {
			this.#params = params;
			this.#extra = extra;
		}
		getChatId() {
			return this.#params.chatId;
		}
		getParentChatId() {
			const chat = this.getChat();
			if (!chat) {
				return 0;
			}
			return chat.parent_chat_id;
		}
		getChat() {
			const chatId = this.getChatId();
			return this.#params.chat?.[chatId];
		}
		getChatType() {
			const chat = this.getChat();
			return chat?.type ?? '';
		}
		isUserChat() {
			return Boolean(this.getChat()) === false;
		}
		isCommentChat() {
			return this.getChatType() === im_v2_const.ChatType.comment;
		}
		isChannelChat() {
			return im_v2_lib_channel.ChannelManager.channelTypes.has(this.getChatType());
		}
		isUserInChat() {
			const chatUsers = this.#params.userInChat[this.getChatId()];
			if (!chatUsers || this.isChannelListEvent()) {
				return true;
			}
			return chatUsers.includes(im_v2_application_core.Core.getUserId());
		}
		isChannelListEvent() {
			return this.isChannelChat() && this.#extra.is_shared_event;
		}
	}

	class MessagePullHandler {
		#store;
		#messageViews = {};
		#messageDeleteManager;
		#aiPullHandler;
		#copilotSimpleStatus;
		constructor() {
			this.#store = im_v2_application_core.Core.getStore();
			this.#messageDeleteManager = new MessageDeleteManager();
			this.#aiPullHandler = new AiPullHandler();
			// Taken here, at messenger boot: the player also picks up placeholders that come back with a
			// history load, and such a turn has no pull event of its own to wake it up.
			this.#copilotSimpleStatus = im_v2_lib_copilotSimpleStatus.CopilotSimpleStatus.getInstance();
		}
		handleMessageAdd(params) {
			im_v2_lib_logger.Logger.warn('MessagePullHandler: handleMessageAdd', params);
			this.#setMessageChat(params);
			this.#setUsers(params.users);
			this.#setFiles(params);
			this.#setAdditionalEntities(params);
			this.#setCommentInfo(params);
			this.#setCopilotData(params);
			this.#setMessagesAutoDeleteConfig(params);
			this.#setStickers(params);
			this.#setBuilder(params.message);
			this.#aiPullHandler.handleAiTaskTriggerMessage(params.chatId, params.message);
			const messageWithTemplateId = this.#store.getters['messages/isInChatCollection']({
				messageId: params.message.templateId
			});
			const messageWithRealId = this.#store.getters['messages/isInChatCollection']({
				messageId: params.message.id
			});

			// update message with parsed link info
			if (messageWithRealId) {
				im_v2_lib_logger.Logger.warn('New message pull handler: we already have this message', params.message);
				void this.#store.dispatch('messages/update', {
					id: params.message.id,
					fields: {
						...this.#withKnownForwardTitle(params.message.id, params.message),
						error: false
					}
				});
				this.#sendScrollEvent(params.chatId);
			} else if (!messageWithRealId && messageWithTemplateId) {
				im_v2_lib_logger.Logger.warn('New message pull handler: we already have the TEMPORARY message', params.message);
				void this.#store.dispatch('messages/updateWithId', {
					id: params.message.templateId,
					fields: {
						...this.#withKnownForwardTitle(params.message.templateId, params.message),
						error: false
					}
				});
			}
			// it's an opponent message or our own message from somewhere else
			else if (!messageWithRealId && !messageWithTemplateId) {
				im_v2_lib_logger.Logger.warn('New message pull handler: we dont have this message', params.message);
				this.#handleAddingMessageToModel({
					...params,
					message: this.#withLocalParentChatName(params.message)
				});
			}

			// the loading message has to be dropped no matter which branch handled the message
			const hasLoadingMessage = this.#store.getters['messages/hasLoadingMessageByMessageId'](params.message.templateId);
			if (hasLoadingMessage) {
				void this.#store.dispatch('messages/delete', {
					id: params.message.templateId
				});
			}
			im_v2_lib_inputAction.InputActionListener.getInstance().stopAction({
				userId: params.message.senderId,
				dialogId: params.dialogId
			});
			im_v2_lib_deliveryWatchdog.DeliveryWatchdog.getInstance().schedule(params.message);
			this.#updateDialog(params);
			this.#syncCopilotSimpleReasoning(params.message.id);
		}
		handleMessageUpdate(params) {
			im_v2_lib_logger.Logger.warn('MessagePullHandler: handleMessageUpdate', params);
			im_v2_lib_inputAction.InputActionListener.getInstance().stopAction({
				userId: params.senderId,
				dialogId: params.dialogId
			});
			// Before the composition: it comes as file ids in params, and the files getter has nothing
			// to return for an id whose entity is not in the model yet.
			this.#setFiles(params);
			this.#store.dispatch('messages/update', {
				id: params.id,
				fields: {
					text: params.text,
					params: params.params
				}
			});
			this.#setBuilder(params);
			this.#sendScrollEvent(params.chatId);
			this.#syncCopilotSimpleReasoning(params.id);
		}
		handleMessageDeleteV2(params) {
			im_v2_lib_logger.Logger.warn('MessageDeletePullHandler: handleMultipleMessageDelete', params);
			const messages = params.messages;
			messages.forEach(message => {
				this.#copilotSimpleStatus.stop(message.id);
				im_v2_lib_deliveryWatchdog.DeliveryWatchdog.getInstance().cancel(message.id);
				if (message.completelyDeleted) {
					const preparedParams = this.#prepareDeleteMessageParams(params, true, message);
					this.#messageDeleteManager.deleteMessageComplete(preparedParams);
					return;
				}
				const preparedParams = this.#prepareDeleteMessageParams(params, false, message);
				this.#messageDeleteManager.deleteMessage(preparedParams);
			});
		}
		handleMessageDelete(params) {
			im_v2_lib_logger.Logger.warn('MessageDeletePullHandler: handleMessageDelete', params);
			this.#copilotSimpleStatus.stop(params.id);
			im_v2_lib_deliveryWatchdog.DeliveryWatchdog.getInstance().cancel(params.id);
			const preparedParams = this.#prepareDeleteMessageParams(params);
			this.#messageDeleteManager.deleteMessage(preparedParams);
		}
		handleMessageDeleteComplete(params) {
			im_v2_lib_logger.Logger.warn('MessageDeletePullHandler: handleMessageDeleteComplete', params);
			this.#copilotSimpleStatus.stop(params.id);
			im_v2_lib_deliveryWatchdog.DeliveryWatchdog.getInstance().cancel(params.id);
			const preparedParams = this.#prepareDeleteMessageParams(params, true);
			this.#messageDeleteManager.deleteMessageComplete(preparedParams);
		}
		handleAddReaction(params) {
			im_v2_lib_logger.Logger.warn('MessagePullHandler: handleAddReaction', params);
			const {
				actualReactions: {
					reaction: actualReactionsState,
					usersShort
				},
				userId,
				reaction
			} = params;
			if (im_v2_application_core.Core.getUserId() === userId) {
				actualReactionsState.ownReactions = [reaction];
			}
			const userManager = new im_v2_lib_user.UserManager();
			void userManager.addUsersToModel(usersShort);
			void this.#store.dispatch('messages/reactions/set', [actualReactionsState]);
		}
		handleDeleteReaction(params) {
			im_v2_lib_logger.Logger.warn('MessagePullHandler: handleDeleteReaction', params);
			const {
				actualReactions: {
					reaction: rawReaction
				},
				reaction: reactionType,
				userId
			} = params;
			const newReactionItem = {
				...rawReaction
			};
			if (im_v2_application_core.Core.getUserId() === userId) {
				newReactionItem.ownReactionsToRemove = [reactionType];
			}
			void this.#store.dispatch('messages/reactions/set', [newReactionItem]);
		}
		handleMessageParamsUpdate(params) {
			im_v2_lib_logger.Logger.warn('MessagePullHandler: handleMessageParamsUpdate', params);
			this.#store.dispatch('messages/update', {
				id: params.id,
				chatId: params.chatId,
				fields: {
					params: params.params
				}
			});
			this.#syncCopilotSimpleReasoning(params.id);
			const rawSending = params.params?.SENDING;
			if (rawSending === 'Y') {
				im_v2_lib_deliveryWatchdog.DeliveryWatchdog.getInstance().schedule({
					id: params.id,
					params: params.params
				});
			} else if (!main_core.Type.isUndefined(rawSending)) {
				im_v2_lib_deliveryWatchdog.DeliveryWatchdog.getInstance().cancel(params.id);
			}
		}
		handleReadMessage(params) {
			im_v2_lib_logger.Logger.warn('MessagePullHandler: handleReadMessage', params);
			const {
				chatId,
				dialogId,
				viewedMessages,
				lastId,
				exact
			} = params;
			void this.#store.dispatch('messages/readMessages', {
				chatId,
				messageIds: viewedMessages,
				exact
			});

			// Exact read: the server cursor didn't move, lastId here is the old value.
			// Don't update lastReadId so the cursor isn't rolled back. Normal read (no flag) —
			// prior behavior.
			if (!exact) {
				void this.#store.dispatch('chats/update', {
					dialogId,
					fields: {
						lastId
					}
				});
			}
		}
		handleReadMessageOpponent(params) {
			if (params.userId === im_v2_application_core.Core.getUserId()) {
				return;
			}
			im_v2_lib_logger.Logger.warn('MessagePullHandler: handleReadMessageOpponent', params);
			this.#updateMessageViewedByOthers(params);
			this.#updateChatLastMessageViews(params);
		}
		handlePinAdd(params) {
			im_v2_lib_logger.Logger.warn('MessagePullHandler: handlePinAdd', params);
			this.#setFiles(params);
			this.#setUsers(params.users);
			this.#store.dispatch('messages/store', params.additionalMessages);
			this.#store.dispatch('messages/pin/add', {
				chatId: params.pin.chatId,
				messageId: params.pin.messageId
			});
			if (im_v2_application_core.Core.getUserId() !== params.pin.authorId) ;
		}
		handlePinDelete(params) {
			im_v2_lib_logger.Logger.warn('MessagePullHandler: handlePinDelete', params);
			this.#store.dispatch('messages/pin/delete', {
				chatId: params.chatId,
				messageId: params.messageId
			});
		}
		handleMessageBlockElementAppend(params) {
			im_v2_lib_logger.Logger.warn('MessagePullHandler: handleMessageBlockElementAppend', params);
			const {
				element,
				messageId,
				text,
				chatId,
				files
			} = params;
			void this.#store.dispatch('messages/builder/appendBlock', {
				messageId,
				block: element
			});
			this.#updateMessageText(messageId, text);
			void this.#store.dispatch('files/set', files);
			// incoming content, not a user action: follow it only while the user stays at the bottom,
			// otherwise the appended block (the BitrixGPT "Thinking" status) steals the reading position
			this.#sendScrollEvent(chatId);
		}
		handleMessageBlockElementUpdate(params) {
			im_v2_lib_logger.Logger.warn('MessagePullHandler: handleMessageBlockElementUpdate', params);
			const {
				element,
				elementId,
				messageId,
				text,
				files
			} = params;
			void this.#store.dispatch('messages/builder/updateBlock', {
				messageId,
				blockId: elementId,
				block: element
			});
			this.#updateMessageText(messageId, text);
			void this.#store.dispatch('files/set', files);
		}
		handleMessageBlockElementDelete(params) {
			im_v2_lib_logger.Logger.warn('MessagePullHandler: handleMessageBlockElementDelete', params);
			const {
				elementId,
				messageId,
				text
			} = params;
			void this.#store.dispatch('messages/builder/deleteBlock', {
				messageId,
				blockId: elementId
			});
			this.#updateMessageText(messageId, text);
		}

		// helpers
		#setMessageChat(params) {
			const manager = new NewMessageManager(params);
			const chat = manager.getChat();
			if (!chat) {
				return;
			}
			const chatToAdd = {
				...chat,
				dialogId: params.dialogId
			};
			const dialogExists = Boolean(this.#getDialog(params.dialogId));
			const messageWithoutNotification = !params.notify || params.message?.params?.NOTIFY === 'N';
			if (!dialogExists && !messageWithoutNotification && !chatToAdd.role) {
				chatToAdd.role = im_v2_const.UserRole.member;
			}
			void this.#store.dispatch('chats/set', chatToAdd);
		}
		#setUsers(users) {
			if (!users) {
				return;
			}
			const userManager = new im_v2_lib_user.UserManager();
			userManager.setUsersToModel(Object.values(users));
		}
		#setFiles(params) {
			if (!params.files) {
				return;
			}
			void this.#store.dispatch('files/set', Object.values(params.files));
		}
		#setAdditionalEntities(params) {
			if (!params.message.additionalEntities) {
				return;
			}
			const {
				additionalMessages,
				messages,
				files,
				users,
				stickers
			} = params.message.additionalEntities;
			const newMessages = [...messages, ...additionalMessages];
			void this.#store.dispatch('messages/store', newMessages);
			void this.#store.dispatch('files/set', files);
			void this.#store.dispatch('users/set', users);
			void this.#store.dispatch('stickers/set', stickers);
			this.#setBuilder(newMessages);
		}
		#setCommentInfo(params) {
			const manager = new NewMessageManager(params);
			const chat = manager.getChat();
			if (!chat || !manager.isCommentChat()) {
				return;
			}
			this.#store.dispatch('messages/comments/set', {
				messageId: chat.parent_message_id,
				chatId: params.chatId,
				messageCount: chat.message_count
			});
			this.#store.dispatch('messages/comments/setLastUser', {
				messageId: chat.parent_message_id,
				newUserId: params.message.senderId
			});
		}

		/**
		 * An event never carries the name of the discussion a fragment was forwarded from: the name is
		 * personal to the reader, so the server resolves it per request. Blanking it belongs to a request
		 * that resolved it, so an event arriving without it keeps the name the client already has.
		 */
		#withKnownForwardTitle(storedMessageId, message) {
			if (!main_core.Type.isPlainObject(message.forward) || main_core.Type.isStringFilled(message.forward.chatTitle)) {
				return message;
			}
			const storedMessage = this.#store.getters['messages/getById'](storedMessageId);
			const knownTitle = storedMessage?.forward?.chatTitle;
			if (!main_core.Type.isStringFilled(knownTitle)) {
				return this.#withLocalParentChatName(message);
			}
			return {
				...message,
				forward: {
					...message.forward,
					chatTitle: knownTitle
				}
			};
		}

		/**
		 * The reader side of the caption: an event brought somebody else's message, there is no stored name
		 * to keep and nothing re-reads the message afterwards. The name is resolved only while the reader
		 * holds the parent chat loaded - records that arrive within recent carry no inited flag - so for the
		 * rest of the chats the caption stays nameless until the next read of the feed, which is the
		 * expected state and not a gap to be filled from somewhere else.
		 *
		 * The author of a forward names the source through a path of its own and needs no confirmed state
		 * there: see #describeForwardSource of im.v2.provider.service.sending.
		 */
		#withLocalParentChatName(message) {
			if (!main_core.Type.isPlainObject(message.forward) || !(message.forward.parentChatId > 0)) {
				return message;
			}
			const parentChat = this.#store.getters['chats/getByChatId'](message.forward.parentChatId);
			// inited is best-effort, not an access check: a record outlives the access to it. Leaving a chat
			// merely drops the flag, a hidden relation drops nothing at all, and an event that never arrives
			// leaves it set until the page is reloaded. The access is checked by the server on every read.
			if (parentChat?.inited !== true || !main_core.Type.isStringFilled(parentChat.name)) {
				return message;
			}
			return {
				...message,
				forward: {
					...message.forward,
					chatTitle: parentChat.name
				}
			};
		}
		#handleAddingMessageToModel(params) {
			const dialog = this.#getDialog(params.dialogId, true);
			if (dialog.hasNextPage) {
				this.#store.dispatch('messages/store', params.message);
				return;
			}
			const chatIsOpened = this.#store.getters['application/isChatOpen'](params.dialogId);
			const unreadMessages = this.#store.getters['messages/getChatUnreadMessages'](params.chatId);
			const RELOAD_LIMIT = im_v2_provider_service_message.MessageService.getMessageRequestLimit() * 5;
			if (dialog.inited && !chatIsOpened && unreadMessages.length > RELOAD_LIMIT) {
				void this.#store.dispatch('messages/store', params.message);
				const messageService = new im_v2_provider_service_message.MessageService({
					chatId: params.chatId
				});
				messageService.reloadMessageList();
				return;
			}
			this.#addMessageToModel(params.message);
			this.#sendScrollEvent(params.chatId);
		}
		#addMessageToModel(message) {
			const newMessage = {
				...message
			};
			if (message.senderId === im_v2_application_core.Core.getUserId()) {
				newMessage.unread = false;
			} else {
				newMessage.unread = true;
				newMessage.viewed = false;
			}
			this.#store.dispatch('messages/setChatCollection', {
				messages: [newMessage]
			});
		}
		#updateDialog(params) {
			const manager = new NewMessageManager(params);
			const {
				dialogId,
				chatId,
				message
			} = params;
			const dialog = this.#getDialog(dialogId, true);
			const dialogFieldsToUpdate = {};
			if (message.id > dialog.lastMessageId) {
				dialogFieldsToUpdate.lastMessageId = message.id;
			}
			if (message.senderId === im_v2_application_core.Core.getUserId() && message.id > dialog.lastReadId) {
				dialogFieldsToUpdate.lastId = message.id;
			}
			if (manager.isUserChat() && !dialog.chatId) {
				dialogFieldsToUpdate.chatId = chatId;
			}
			void this.#store.dispatch('chats/update', {
				dialogId,
				fields: dialogFieldsToUpdate
			});
			void this.#store.dispatch('chats/clearLastMessageViews', {
				dialogId
			});
		}
		#updateMessageViewedByOthers(params) {
			this.#store.dispatch('messages/setViewedByOthers', {
				ids: params.viewedMessages
			});
		}
		#updateChatLastMessageViews(params) {
			const dialog = this.#getDialog(params.dialogId);
			if (!dialog) {
				return;
			}
			const isLastMessage = params.viewedMessages.includes(dialog.lastMessageId);
			if (!isLastMessage) {
				return;
			}
			if (this.#checkMessageViewsRegistry(params.userId, dialog.lastMessageId)) {
				return;
			}
			const hasFirstViewer = Boolean(dialog.lastMessageViews.firstViewer);
			if (hasFirstViewer) {
				this.#store.dispatch('chats/incrementLastMessageViews', {
					dialogId: params.dialogId
				});
				this.#updateMessageViewsRegistry(params.userId, dialog.lastMessageId);
				return;
			}
			this.#store.dispatch('chats/setLastMessageViews', {
				dialogId: params.dialogId,
				fields: {
					userId: params.userId,
					userName: params.userName,
					date: params.date,
					messageId: dialog.lastMessageId
				}
			});
			this.#updateMessageViewsRegistry(params.userId, dialog.lastMessageId);
		}
		#checkMessageViewsRegistry(userId, messageId) {
			return Boolean(this.#messageViews[messageId]?.has(userId));
		}
		#updateMessageViewsRegistry(userId, messageId) {
			if (!this.#messageViews[messageId]) {
				this.#messageViews[messageId] = new Set();
			}
			this.#messageViews[messageId].add(userId);
		}

		// Block events carry the whole payload text, which stays the same for edits that don't
		// change it (a progress tick, for one). Updating the message anyway replaces its object
		// in the collection and makes the whole loaded chat list re-render for nothing.
		#updateMessageText(messageId, text) {
			const message = this.#store.getters['messages/getById'](messageId);
			if (message && message.text === text) {
				return;
			}
			void this.#store.dispatch('messages/update', {
				id: messageId,
				fields: {
					text
				}
			});
		}
		#sendScrollEvent(chatId, threshold = im_v2_const.DialogScrollThreshold.nearTheBottom) {
			main_core_events.EventEmitter.emit(im_v2_const.EventType.dialog.scrollToBottom, {
				chatId,
				threshold
			});
		}
		#getDialog(dialogId, temporary = false) {
			return this.#store.getters['chats/get'](dialogId, temporary);
		}
		#setCopilotData(params) {
			if (!params.copilot) {
				return;
			}
			const copilotManager = new im_v2_lib_copilot.CopilotManager();
			void copilotManager.handleMessageAdd(params.copilot);
		}

		/**
		 * A reasoning plan on a message is the only sign of a BitrixGPT placeholder in simple mode.
		 * Deletion is a terminal signal handled where it happens, not here: a soft delete leaves the plan
		 * on the message, and reconciling with the model would restart the show on a deleted bubble.
		 */
		#syncCopilotSimpleReasoning(messageId) {
			const message = this.#store.getters['messages/getById'](messageId);
			const plan = message?.[im_v2_const.CopilotSimpleReasoningPlanField];
			if (plan) {
				this.#copilotSimpleStatus.start(messageId, plan);
				return;
			}
			this.#copilotSimpleStatus.stop(messageId);
		}
		#setMessagesAutoDeleteConfig(params) {
			const {
				messagesAutoDeleteConfigs
			} = params;
			void this.#store.dispatch('chats/autoDelete/set', messagesAutoDeleteConfigs);
		}
		#setStickers(params) {
			const hasMessageSticker = main_core.Type.isPlainObject(params.message.params.STICKER_PARAMS);
			if (hasMessageSticker) {
				void this.#store.dispatch('stickers/messages/set', [{
					messageId: params.message.id,
					...params.message.params.STICKER_PARAMS
				}]);
				void this.#store.dispatch('stickers/set', params.stickers);
			}
		}
		#setBuilder(payload) {
			const messages = main_core.Type.isArray(payload) ? payload : [payload];
			void this.#store.dispatch('messages/builder/set', messages);
		}
		#prepareDeleteMessageParams(params, isComplete = false, message = null) {
			const baseParams = {
				id: message ? message.id : params.id,
				senderId: message ? message.senderId : params.senderId,
				dialogId: params.dialogId
			};
			if (isComplete) {
				return {
					...baseParams,
					newLastMessage: params.newLastMessage,
					lastMessageViews: params.lastMessageViews
				};
			}
			return baseParams;
		}
	}

	class ChatPullHandler {
		#store;
		#commandService;
		constructor() {
			this.#store = im_v2_application_core.Core.getStore();
			this.#commandService = new im_v2_provider_service_command.CommandService();
		}
		handleChatOwner(params) {
			im_v2_lib_logger.Logger.warn('ChatPullHandler: handleChatOwner', params);
			this.#store.dispatch('chats/update', {
				dialogId: params.dialogId,
				fields: {
					ownerId: params.userId
				}
			});
		}
		handleChatManagers(params) {
			im_v2_lib_logger.Logger.warn('ChatPullHandler: handleChatManagers', params);
			this.#store.dispatch('chats/update', {
				dialogId: params.dialogId,
				fields: {
					managerList: params.list
				}
			});
			const chat = this.#store.getters['chats/get'](params.dialogId);
			if (!chat) {
				return;
			}
			const userInManagerList = params.list.includes(im_v2_application_core.Core.getUserId());
			if (chat.role === im_v2_const.UserRole.member && userInManagerList) {
				this.#store.dispatch('chats/update', {
					dialogId: params.dialogId,
					fields: {
						role: im_v2_const.UserRole.manager
					}
				});
			}
			if (chat.role === im_v2_const.UserRole.manager && !userInManagerList) {
				this.#store.dispatch('chats/update', {
					dialogId: params.dialogId,
					fields: {
						role: im_v2_const.UserRole.member
					}
				});
			}
		}
		handleChatUserAdd(params) {
			im_v2_lib_logger.Logger.warn('ChatPullHandler: handleChatUserAdd', params);
			this.#updateChatUsers(params);
			this.onChatMembershipChanged(params.dialogId, params.newUsers, userId => params.users?.[userId]?.bot === true);
			const {
				newUsers,
				dialogId,
				relations
			} = params;
			const currentUserId = im_v2_application_core.Core.getUserId();
			if (newUsers.includes(currentUserId)) {
				const currentUserRelation = relations.find(relation => relation.userId === im_v2_application_core.Core.getUserId());
				void this.#store.dispatch('chats/update', {
					dialogId,
					fields: {
						role: currentUserRelation.role
					}
				});
			}
		}
		handleChatUserLeave(params) {
			im_v2_lib_logger.Logger.warn('ChatPullHandler: handleChatUserLeave', params);
			this.#updateChatUsers(params);
			this.onChatMembershipChanged(params.dialogId, [params.userId],
			// The leave payload carries no users, so the flag is read from the store. The bots
			// sub-model only holds records that arrived with bot data, while the user type is
			// filled for every hydrated participant - so ask the users model.
			userId => this.#store.getters['users/isBot'](userId));

			// chatUserLeave is single user event, so we can safely use first (and only) relation from array
			const {
				userId,
				dialogId,
				chatId,
				relations: [relation]
			} = params;
			const currentUserIsKicked = userId === im_v2_application_core.Core.getUserId();
			if (relation?.isHidden || !currentUserIsKicked) {
				return;
			}

			// open channel and its comments stay readable after unsubscribe: keep them open and show the join CTA again
			if (this.#staysReadableAfterLeave(dialogId)) {
				void this.#store.dispatch('chats/update', {
					dialogId,
					fields: {
						role: im_v2_const.UserRole.guest
					}
				});
				return;
			}
			void this.#store.dispatch('chats/update', {
				dialogId,
				fields: {
					inited: false
				}
			});
			void this.#store.dispatch('messages/clearChatCollection', {
				chatId
			});
			void this.#store.dispatch('counters/clearByParentId', {
				parentChatId: chatId
			});
			this.#onChatAccessLost(dialogId);
		}
		handleInputActionNotify(params) {
			im_v2_lib_logger.Logger.warn('ChatPullHandler: handleInputActionNotify', params);
			im_v2_lib_inputAction.InputActionListener.getInstance().startAction(params);
			this.#store.dispatch('users/update', {
				id: params.userId,
				fields: {
					lastActivityDate: new Date()
				}
			});
		}
		handleChatUnread(params) {
			im_v2_lib_logger.Logger.warn('ChatPullHandler: handleChatUnread', params);
			let markedId = 0;
			if (params.active === true) {
				markedId = params.markedId;
			}
			this.#store.dispatch('chats/update', {
				dialogId: params.dialogId,
				fields: {
					markedId
				}
			});
		}
		handleChatMuteNotify(params) {
			if (params.muted) {
				this.#store.dispatch('chats/mute', {
					dialogId: params.dialogId
				});
				return;
			}
			this.#store.dispatch('chats/unmute', {
				dialogId: params.dialogId
			});
		}
		handleChatRename(params) {
			const dialog = this.#store.getters['chats/getByChatId'](params.chatId);
			if (!dialog) {
				return;
			}
			this.#store.dispatch('chats/update', {
				dialogId: dialog.dialogId,
				fields: {
					name: params.name
				}
			});
		}
		handleChatAvatar(params) {
			const dialog = this.#store.getters['chats/getByChatId'](params.chatId);
			if (!dialog) {
				return;
			}
			this.#store.dispatch('chats/update', {
				dialogId: dialog.dialogId,
				fields: {
					avatar: params.avatar
				}
			});
		}
		handleChatConvert(params) {
			im_v2_lib_logger.Logger.warn('ChatPullHandler: handleChatConvert', params);
			const {
				dialogId,
				oldType,
				newType,
				newPermissions,
				newTypeParams
			} = params;
			const fields = {
				type: newType,
				permissions: newPermissions
			};
			if ([newType, oldType].includes(im_v2_const.ChatType.collab)) {
				fields.diskFolderId = 0;
			}
			this.#store.dispatch('chats/update', {
				dialogId,
				fields
			});
			const dialog = this.#store.getters['chats/get'](dialogId);
			if (newType === im_v2_const.ChatType.collab && dialog?.chatId > 0) {
				this.#store.dispatch('chats/collabs/set', {
					chatId: dialog.chatId,
					collabInfo: newTypeParams.collabInfo
				});
			}
		}
		handleChatUpdate(params) {
			const {
				dialogId,
				parent_chat_id: newParentChatId
			} = params.chat;
			const {
				parentChatId: lastParentChatId
			} = this.#store.getters['chats/get'](dialogId);
			void this.#store.dispatch('chats/update', {
				dialogId,
				fields: {
					role: im_v2_lib_roleManager.getChatRoleForUser(params.chat),
					...params.chat
				}
			});
			if (lastParentChatId !== newParentChatId) {
				void this.#store.dispatch('recent/hide', {
					dialogId
				});
			}
		}
		handleChatFieldsUpdate(params) {
			void this.#store.dispatch('chats/update', {
				dialogId: params.dialogId,
				fields: {
					...params
				}
			});
		}
		handleChatDelete(params) {
			im_v2_lib_logger.Logger.warn('ChatPullHandler: handleChatDelete', params);
			const {
				userId,
				chatId,
				dialogId
			} = params;
			const currentUserId = im_v2_application_core.Core.getUserId();
			if (userId === currentUserId) {
				return;
			}
			void this.#store.dispatch('chats/update', {
				dialogId,
				fields: {
					inited: false
				}
			});
			void this.#store.dispatch('recent/delete', {
				dialogId
			});
			void this.#store.dispatch('messages/clearChatCollection', {
				chatId
			});
			if (this.#isChatOpen(dialogId)) {
				im_v2_lib_analytics.Analytics.getInstance().chatDelete.onChatDeletedNotification(dialogId);
				im_v2_lib_notifier.Notifier.chat.onNotFoundError();
			}
			this.#onChatAccessLost(dialogId);
		}
		handleMessagesAutoDeleteDelayChanged(params) {
			im_v2_lib_logger.Logger.warn('ChatPullHandler: handleMessagesAutoDeleteDelayChanged', params);
			const {
				chatId,
				delay
			} = params;
			void this.#store.dispatch('chats/autoDelete/set', {
				chatId,
				delay
			});
		}

		// Command list depends only on the chat's bots, so rebuild the cached list (and close the open popup) only when a bot joins or leaves
		onChatMembershipChanged(dialogId, changedUserIds, isBot) {
			if (!this.#store.getters['commands/isCached'](dialogId)) {
				return;
			}
			if (!changedUserIds.some(isBot)) {
				return;
			}
			main_core_events.EventEmitter.emit(im_v2_const.EventType.textarea.closeSlashCommandPopup, {
				dialogId
			});
			void this.#commandService.loadCommands(dialogId, {
				silent: true
			});
		}
		#isChatOpen(dialogId) {
			return this.#store.getters['application/isChatOpen'](dialogId);
		}
		#staysReadableAfterLeave(dialogId) {
			const {
				type
			} = this.#store.getters['chats/get'](dialogId, true);
			if (type === im_v2_const.ChatType.openChannel) {
				return true;
			}
			if (type === im_v2_const.ChatType.comment) {
				const parentChat = this.#store.getters['chats/getParent'](dialogId);
				return parentChat?.type === im_v2_const.ChatType.openChannel;
			}
			return false;
		}
		#onChatAccessLost(dialogId) {
			if (this.#isChatOpen(dialogId)) {
				void im_public.Messenger.openChat();
			}
			main_core_events.EventEmitter.emit(im_v2_const.EventType.recent.closeNestedList, {
				dialogId
			});
			im_v2_lib_call.CallManager.getInstance().deleteRecentCall(dialogId);
			const chatHasCall = im_v2_lib_call.CallManager.getInstance().getCurrentCallDialogId() === dialogId;
			if (chatHasCall) {
				im_v2_lib_call.CallManager.getInstance().leaveCurrentCall();
			}
			im_v2_lib_playback.PlaybackService.getInstanceIfCreated()?.handleChatAccessLost(dialogId);
		}
		#updateChatUsers(params) {
			if (params.users) {
				const userManager = new im_v2_lib_user.UserManager();
				void userManager.setUsersToModel(Object.values(params.users));
			}
			void this.#store.dispatch('chats/update', {
				dialogId: params.dialogId,
				fields: {
					userCounter: params.userCount,
					guestCount: params.guestCount,
					extranet: params.chatExtranet,
					containsCollaber: params.containsCollaber
				}
			});
		}
	}

	class TariffPullHandler {
		handleChangeTariff(params) {
			im_v2_lib_logger.Logger.warn('TariffPullHandler: handleChangeTariff', params);
			const {
				tariffRestrictions
			} = params;
			if (!tariffRestrictions) {
				return;
			}
			void im_v2_application_core.Core.getStore().dispatch('application/tariffRestrictions/set', tariffRestrictions);
		}
	}

	class UserPullHandler {
		#store;
		constructor() {
			this.#store = im_v2_application_core.Core.getStore();
		}
		handleUserInvite(params) {
			if (params.invited) {
				const userManager = new im_v2_lib_user.UserManager();
				userManager.setUsersToModel([params.user]);
				return;
			}
			this.#store.dispatch('users/update', {
				id: params.userId,
				fields: params.user
			});
		}
		handleUserShowInRecent(params) {
			const usersToStore = params.items.map(item => item.user);
			const userManager = new im_v2_lib_user.UserManager();
			userManager.setUsersToModel(usersToStore);
		}
		handleUserLogout() {
			// Server targets UserLogout only at guests that must fully log out; per-chat loss
			// arrives as the member-removed pull. Redirect unconditionally.
			im_v2_lib_utils.Utils.browser.redirectTo('/');
		}
	}

	class DesktopPullHandler {
		handleDesktopOnline(params) {
			im_v2_lib_logger.Logger.warn('DesktopPullHandler: handleDesktopOnline', params);
			const desktopManager = im_v2_lib_desktop.DesktopManager.getInstance();
			desktopManager.setDesktopActive(true);
			desktopManager.setDesktopVersion(params.version);
			im_v2_lib_counter.CounterManager.getInstance().removeBrowserTitleCounter();
		}
		handleDesktopOffline() {
			im_v2_lib_logger.Logger.warn('DesktopPullHandler: handleDesktopOffline');
			im_v2_lib_desktop.DesktopManager.getInstance().setDesktopActive(false);
			im_v2_lib_desktop.DesktopManager.getInstance().setDesktopVersion(0);
		}
	}

	class SettingsPullHandler {
		handleSettingsUpdate(params) {
			im_v2_lib_logger.Logger.warn('SettingsPullHandler: handleSettingsUpdate', params);
			const settingsToUpdate = {
				...params
			};
			void im_v2_application_core.Core.getStore().dispatch('application/settings/set', settingsToUpdate);
		}
	}

	class CommentsPullHandler {
		handleCommentSubscribe(params) {
			const {
				messageId,
				subscribe
			} = params;
			im_v2_lib_logger.Logger.warn('CommentsPullHandler: handleCommentSubscribe', params);
			if (subscribe) {
				im_v2_application_core.Core.getStore().dispatch('messages/comments/subscribe', messageId);
				return;
			}
			im_v2_application_core.Core.getStore().dispatch('messages/comments/unsubscribe', messageId);
		}
	}

	class ApplicationPullHandler {
		handleApplicationOpenChat(params) {
			im_v2_lib_logger.Logger.warn('ApplicationPullHandler: handleOpenChat', params);
			if (!this.#isChatFocused()) {
				return;
			}
			if (im_v2_lib_desktop.DesktopManager.isDesktop()) {
				if (!im_v2_lib_desktop.DesktopManager.isChatWindow()) {
					return;
				}
				void im_public.Messenger.openChat(params.dialogId);
				return;
			}
			void im_public.Messenger.openChat(params.dialogId);
		}
		#isChatFocused() {
			if (!document.hasFocus()) {
				return false;
			}
			const sidePanelManager = main_sidepanel.SidePanel.Instance;
			const hasOpenSliders = sidePanelManager.getOpenSlidersCount() > 0;
			const isEmbeddedMode = im_v2_lib_layout.LayoutManager.getInstance().isEmbeddedMode();
			if (isEmbeddedMode && hasOpenSliders) {
				return false;
			}
			const isChatSliderFocused = im_v2_lib_slider.MessengerSlider.getInstance().isFocused();
			if (!isEmbeddedMode && !isChatSliderFocused) {
				return false;
			}
			return true;
		}
	}

	class CollabPullHandler {
		handleUpdateCollabEntityCounter(params) {
			im_v2_lib_logger.Logger.warn('CollabPullHandler: handleUpdateCollabEntityCounter', params);
			const {
				chatId,
				counter,
				entity
			} = params;
			void im_v2_application_core.Core.getStore().dispatch('chats/collabs/setCounter', {
				chatId,
				entity,
				counter
			});
		}
		handleUpdateCollabGuestCount(params) {
			im_v2_lib_logger.Logger.warn('CollabPullHandler: handleUpdateCollabGuestCount', params);
			const {
				chatId,
				guestCount
			} = params;
			void im_v2_application_core.Core.getStore().dispatch('chats/collabs/setGuestCount', {
				chatId,
				guestCount
			});
		}
	}

	class BasePullHandler {
		#messageHandler;
		#chatHandler;
		#userHandler;
		#desktopHandler;
		#settingsHandler;
		#commentsHandler;
		#tariffPullHandler;
		#applicationPullHandler;
		#collabPullHandler;
		#botPullHandler;
		#aiPullHandler;
		constructor() {
			this.#messageHandler = new MessagePullHandler();
			this.#chatHandler = new ChatPullHandler();
			this.#userHandler = new UserPullHandler();
			this.#desktopHandler = new DesktopPullHandler();
			this.#settingsHandler = new SettingsPullHandler();
			this.#commentsHandler = new CommentsPullHandler();
			this.#tariffPullHandler = new TariffPullHandler();
			this.#applicationPullHandler = new ApplicationPullHandler();
			this.#collabPullHandler = new CollabPullHandler();
			this.#botPullHandler = new BotPullHandler();
			this.#aiPullHandler = new AiPullHandler();
		}
		getModuleId() {
			return 'im';
		}

		// region 'message'
		handleMessage(params) {
			this.#messageHandler.handleMessageAdd(params);
		}
		handleMessageChat(params) {
			this.#messageHandler.handleMessageAdd(params);
		}
		handleMessageUpdate(params) {
			this.#messageHandler.handleMessageUpdate(params);
		}
		handleMessageDeleteV2(params) {
			this.#messageHandler.handleMessageDeleteV2(params);
		}
		handleMessageDelete(params) {
			this.#messageHandler.handleMessageDelete(params);
		}
		handleMessageDeleteComplete(params) {
			this.#messageHandler.handleMessageDeleteComplete(params);
		}
		handleAddReaction(params) {
			this.#messageHandler.handleAddReaction(params);
		}
		handleDeleteReaction(params) {
			this.#messageHandler.handleDeleteReaction(params);
		}
		handleMessageParamsUpdate(params) {
			this.#messageHandler.handleMessageParamsUpdate(params);
		}
		handleReadMessage(params, extra) {
			this.#messageHandler.handleReadMessage(params, extra);
		}
		handleReadMessageChat(params, extra) {
			this.#messageHandler.handleReadMessage(params, extra);
		}
		handleReadMessageOpponent(params) {
			this.#messageHandler.handleReadMessageOpponent(params);
		}
		handleReadMessageChatOpponent(params) {
			this.#messageHandler.handleReadMessageOpponent(params);
		}
		handlePinAdd(params) {
			this.#messageHandler.handlePinAdd(params);
		}
		handlePinDelete(params) {
			this.#messageHandler.handlePinDelete(params);
		}
		handleMessageBlockElementAppend(params) {
			this.#messageHandler.handleMessageBlockElementAppend(params);
		}
		handleMessageBlockElementUpdate(params) {
			this.#messageHandler.handleMessageBlockElementUpdate(params);
		}
		handleMessageBlockElementDelete(params) {
			this.#messageHandler.handleMessageBlockElementDelete(params);
		}
		// endregion 'message'

		// region 'chat'
		handleChatOwner(params) {
			this.#chatHandler.handleChatOwner(params);
		}
		handleChatManagers(params) {
			this.#chatHandler.handleChatManagers(params);
		}
		handleChatUserAdd(params) {
			this.#chatHandler.handleChatUserAdd(params);
		}
		handleChatUserLeave(params) {
			this.#chatHandler.handleChatUserLeave(params);
		}
		handleInputActionNotify(params) {
			this.#chatHandler.handleInputActionNotify(params);
		}
		handleChatUnread(params) {
			this.#chatHandler.handleChatUnread(params);
		}
		handleChatMuteNotify(params) {
			this.#chatHandler.handleChatMuteNotify(params);
		}
		handleChatRename(params) {
			this.#chatHandler.handleChatRename(params);
		}
		handleChatAvatar(params) {
			this.#chatHandler.handleChatAvatar(params);
		}
		handleChatUpdate(params) {
			this.#chatHandler.handleChatUpdate(params);
		}
		handleChatFieldsUpdate(params) {
			this.#chatHandler.handleChatFieldsUpdate(params);
		}
		handleChatDelete(params) {
			this.#chatHandler.handleChatDelete(params);
		}
		handleChatConvert(params) {
			this.#chatHandler.handleChatConvert(params);
		}
		handleMessagesAutoDeleteDelayChanged(params) {
			this.#chatHandler.handleMessagesAutoDeleteDelayChanged(params);
		}
		// endregion 'chat'

		// region 'user'
		handleUserInvite(params) {
			this.#userHandler.handleUserInvite(params);
		}
		handleUserShowInRecent(params) {
			this.#userHandler.handleUserShowInRecent(params);
		}
		handleUserLogout(params) {
			this.#userHandler.handleUserLogout(params);
		}
		// endregion 'user'

		// region 'desktop'
		handleDesktopOnline(params) {
			this.#desktopHandler.handleDesktopOnline(params);
		}
		handleDesktopOffline() {
			this.#desktopHandler.handleDesktopOffline();
		}
		// endregion 'desktop'

		// region 'settings'
		handleSettingsUpdate(params) {
			this.#settingsHandler.handleSettingsUpdate(params);
		}
		// endregion 'settings'

		// region 'comments'
		handleCommentSubscribe(params) {
			this.#commentsHandler.handleCommentSubscribe(params);
		}
		// endregion 'comments'

		// region 'tariff'
		handleChangeTariff(params) {
			this.#tariffPullHandler.handleChangeTariff(params);
		}
		// endregion 'tariff'

		// region 'collab'
		handleUpdateCollabEntityCounter(params) {
			this.#collabPullHandler.handleUpdateCollabEntityCounter(params);
		}
		handleUpdateCollabGuestCount(params) {
			this.#collabPullHandler.handleUpdateCollabGuestCount(params);
		}
		// endregion 'collab'

		// region 'application'
		handleApplicationOpenChat(params) {
			this.#applicationPullHandler.handleApplicationOpenChat(params);
		}
		// endregion 'application'

		// region 'bot'
		handleBotAdd(params) {
			this.#botPullHandler.handleBotAdd(params);
		}
		handleBotUpdate(params) {
			this.#botPullHandler.handleBotUpdate(params);
		}
		// endregion 'bot'

		// region 'ai'
		handleChangeEngine(params) {
			this.#aiPullHandler.handleChangeEngine(params);
		}
		handleFileTranscription(params) {
			this.#aiPullHandler.handleFileTranscription(params);
		}
		handleChatCopilotRoleUpdate(params) {
			this.#aiPullHandler.handleChatCopilotRoleUpdate(params);
		}
		handleSetCopilotTitle(params) {
			this.#aiPullHandler.handleSetCopilotTitle(params);
		}
		handleCopilotGenerationState(params) {
			this.#aiPullHandler.handleCopilotGenerationState(params);
		}
		handleAutoTaskStatus(params, extra) {
			this.#aiPullHandler.handleAutoTaskStatus(params, extra);
		}
		// endregion 'ai'
	}

	class RecentUpdateManager {
		#params;
		#tempMessageId = null;
		constructor(params) {
			this.#params = params;
		}
		addToRecentCollection() {
			this.#setLastMessageInfo();
			const newRecentItem = {
				id: this.#getDialogId(),
				messageId: this.#getLastMessageId(),
				lastActivityDate: this.#params.lastActivityDate
			};
			const sections = this.#params.recentConfig?.sections || [im_v2_const.RecentType.default];
			this.addItemToCollection(sections, newRecentItem, this.#getParentChatId());
		}

		// Metadata-only variant for RecentUpdateMeta (lastActivityDate=null): hydrates the payload and
		// re-targets the preview messageId of an already existing recent item. Never adds the item to
		// sections or touches its lastActivityDate, so a hidden row is not surfaced and sort order keeps.
		updateExistingItem() {
			if (!this.#params.message?.id) {
				return;
			}
			this.#setLastMessageInfo();
			void im_v2_application_core.Core.getStore().dispatch('recent/update', {
				dialogId: this.#getDialogId(),
				fields: {
					messageId: this.#params.message.id
				}
			});
		}
		addItemToCollection(sections, recentItem, parentChatId) {
			sections.forEach(recentSection => {
				void im_v2_application_core.Core.getStore().dispatch('recent/setCollection', {
					type: recentSection,
					items: [recentItem],
					parentChatId
				});
			});
		}
		#getParentChatId() {
			return this.#params.chat.parent_chat_id;
		}
		#setLastMessageInfo() {
			this.#setMessageChat();
			this.#setSourceChats();
			this.#setUsers();
			this.#setFiles();
			this.#setMessage();
		}
		#getDialogId() {
			return this.#params.chat.dialogId;
		}
		#getChatId() {
			return this.#params.chat.id;
		}
		#getLastMessageId() {
			if (this.#params.message?.id) {
				return this.#params.message.id;
			}
			const chat = im_v2_application_core.Core.getStore().getters['chats/get'](this.#getDialogId());
			const lastMessageId = im_v2_application_core.Core.getStore().getters['messages/getLastId'](chat.chatId);
			return lastMessageId || this.#tempMessageId;
		}
		#setUsers() {
			const userManager = new im_v2_lib_user.UserManager();
			void userManager.setUsersToModel(this.#params.users);
		}
		#setFiles() {
			void im_v2_application_core.Core.getStore().dispatch('files/set', this.#params.files);
		}
		#setMessageChat() {
			const chat = {
				...this.#params.chat,
				dialogId: this.#getDialogId()
			};
			void im_v2_application_core.Core.getStore().dispatch('chats/set', chat);
		}
		#setSourceChats() {
			if (!this.#params.chats) {
				return;
			}

			// Source chats already carry their own dialogId, so no normalization is needed (unlike #setMessageChat).
			Object.values(this.#params.chats).forEach(sourceChat => {
				void im_v2_application_core.Core.getStore().dispatch('chats/set', sourceChat);
			});
		}
		#setMessage() {
			if (this.#params.message) {
				if (this.#isNestedPreview()) {
					// Nested collab preview is a message of a child chat: keep it in the collection only,
					// without chatCollection membership, so the following messageAdd sets its read state.
					void im_v2_application_core.Core.getStore().dispatch('messages/store', this.#params.message);
					return;
				}
				void im_v2_application_core.Core.getStore().dispatch('messages/setChatCollection', {
					messages: this.#params.message
				});
				return;
			}
			this.#tempMessageId = im_v2_lib_utils.Utils.text.getUuidV4();
			void im_v2_application_core.Core.getStore().dispatch('messages/setChatCollection', {
				messages: {
					id: this.#tempMessageId,
					date: new Date(),
					chatId: this.#getChatId()
				}
			});
		}
		#isNestedPreview() {
			return Number(this.#params.message.chatId) !== Number(this.#getChatId());
		}
	}

	function buildRecentItem(params) {
		const newRecentItem = {
			id: params.dialogId,
			chatId: params.chatId,
			messageId: params.message.id
		};
		if (params.message.chatId === params.chatId) {
			newRecentItem.ownMessageId = params.message.id;
		}
		const recentItem = im_v2_application_core.Core.getStore().getters['recent/get'](params.dialogId);
		if (recentItem) {
			newRecentItem.isFakeElement = false;
			newRecentItem.isBirthdayPlaceholder = false;
			newRecentItem.liked = false;
		}
		return newRecentItem;
	}

	// noinspection JSUnusedGlobalSymbols
	class RecentPullHandler {
		getModuleId() {
			return 'im';
		}
		handleMessage(params, extra) {
			this.handleMessageAdd(params, extra);
		}
		handleMessageChat(params, extra) {
			this.handleMessageAdd(params, extra);
		}
		handleMessageAdd(params, extra) {
			const {
				recentConfig
			} = params;
			const manager = new NewMessageManager(params, extra);
			if (!manager.isUserInChat()) {
				return;
			}
			im_v2_lib_logger.Logger.warn('RecentPullHandler: handleMessageAdd', params);
			const newRecentItem = buildRecentItem(params);
			recentConfig.sections.forEach(section => {
				void im_v2_application_core.Core.getStore().dispatch('recent/setCollection', {
					type: section,
					items: [newRecentItem],
					parentChatId: manager.getParentChatId()
				});
			});
		}
		handleMessageDeleteV2(params) {
			this.#deleteLastMessage(params.dialogId, params.newLastMessage);
		}
		handleMessageDeleteComplete(params) {
			this.#deleteLastMessage(params.dialogId, params.newLastMessage);
		}
		handleAddReaction(params) {
			const {
				dialogId,
				userId,
				actualReactions
			} = params;
			im_v2_lib_logger.Logger.warn('RecentPullHandler: handleAddReaction', params);
			const recentItem = im_v2_application_core.Core.getStore().getters['recent/get'](dialogId);
			if (!recentItem) {
				return;
			}
			const chatIsOpened = im_v2_application_core.Core.getStore().getters['application/isChatOpen'](dialogId);
			if (chatIsOpened) {
				return;
			}
			const message = im_v2_application_core.Core.getStore().getters['recent/getMessage'](dialogId);
			const isOwnLike = im_v2_application_core.Core.getUserId() === userId;
			const isOwnLastMessage = im_v2_application_core.Core.getUserId() === message.authorId;
			if (isOwnLike || !isOwnLastMessage) {
				return;
			}
			im_v2_application_core.Core.getStore().dispatch('recent/like', {
				dialogId,
				messageId: actualReactions.reaction.messageId,
				liked: true
			});
		}
		handleChatPin(params) {
			const {
				dialogId,
				active
			} = params;
			im_v2_lib_logger.Logger.warn('RecentPullHandler: handleChatPin', params);
			const manager = new RecentUpdateManager(params);
			manager.addToRecentCollection();
			im_v2_application_core.Core.getStore().dispatch('recent/pin', {
				dialogId,
				action: active
			});
		}
		handleChatHide(params) {
			const {
				dialogId
			} = params;
			im_v2_lib_logger.Logger.warn('RecentPullHandler: handleChatHide', params);
			const recentItem = im_v2_application_core.Core.getStore().getters['recent/get'](dialogId);
			if (recentItem) {
				void im_v2_application_core.Core.getStore().dispatch('recent/hide', {
					dialogId
				});
				main_core_events.EventEmitter.emit(im_v2_const.EventType.recent.closeNestedList, {
					dialogId
				});
			}
			im_v2_lib_layout.LayoutManager.getInstance().clearCurrentChat(dialogId);
		}
		handleChatUserLeave(params) {
			const {
				dialogId,
				userId
			} = params;
			im_v2_lib_logger.Logger.warn('RecentPullHandler: handleChatUserLeave', params);
			const recentItem = im_v2_application_core.Core.getStore().getters['recent/get'](dialogId);
			if (!recentItem || userId !== im_v2_application_core.Core.getUserId()) {
				return;
			}
			void im_v2_application_core.Core.getStore().dispatch('recent/hide', {
				dialogId
			});
		}
		handleUserInvite(params) {
			im_v2_lib_logger.Logger.warn('RecentPullHandler: handleUserInvite', params);
			const messageId = im_v2_lib_utils.Utils.text.getUuidV4();
			void im_v2_application_core.Core.getStore().dispatch('messages/store', {
				id: messageId,
				date: params.date
			});
			const recentItem = {
				id: params.user.id,
				invited: params.invited ?? false,
				isFakeElement: true,
				messageId
			};
			void im_v2_application_core.Core.getStore().dispatch('recent/setCollection', {
				type: im_v2_const.RecentType.default,
				items: [recentItem]
			});
		}
		handleUserShowInRecent(params) {
			im_v2_lib_logger.Logger.warn('RecentPullHandler: handleUserShowInRecent', params);
			const {
				items
			} = params;
			items.forEach(item => {
				const messageId = im_v2_lib_utils.Utils.text.getUuidV4();
				void im_v2_application_core.Core.getStore().dispatch('messages/store', {
					id: messageId,
					date: item.date
				});
				const recentItem = {
					id: item.user.id,
					messageId
				};
				void im_v2_application_core.Core.getStore().dispatch('recent/setCollection', {
					type: im_v2_const.RecentType.default,
					items: [recentItem]
				});
			});
		}
		handleRecentUpdate(params) {
			im_v2_lib_logger.Logger.warn('RecentPullHandler: handleRecentUpdate', params);
			const manager = new RecentUpdateManager(params);

			// lastActivityDate=null marks an info-only RecentUpdateMeta: refresh the preview of an already
			// listed item (e.g. a collab pointer recomputed after a source message delete or a muted child
			// message) without adding the item to sections or moving it.
			const isMetadataOnly = params.lastActivityDate === null;
			if (isMetadataOnly) {
				manager.updateExistingItem();
				return;
			}
			manager.addToRecentCollection();
		}
		#deleteLastMessage(dialogId, newLastMessage) {
			const lastMessageWasDeleted = Boolean(newLastMessage);
			if (lastMessageWasDeleted) {
				this.#updateRecentForMessageDelete(dialogId, newLastMessage);
			}
		}
		#updateRecentForMessageDelete(dialogId, newLastMessage) {
			const newLastMessageId = newLastMessage.id;
			if (!newLastMessageId) {
				void im_v2_application_core.Core.getStore().dispatch('recent/hide', {
					dialogId
				});
				return;
			}
			const fields = {
				messageId: newLastMessageId
			};
			if (this.#newLastMessageIsOwn(dialogId, newLastMessage)) {
				fields.ownMessageId = newLastMessageId;
			}
			void im_v2_application_core.Core.getStore().dispatch('recent/update', {
				dialogId,
				fields
			});
		}
		#newLastMessageIsOwn(dialogId, newLastMessage) {
			const dialog = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId);
			return Boolean(dialog?.chatId) && newLastMessage.chatId === dialog.chatId;
		}
	}

	class RecentUnreadUpdateManager extends RecentUpdateManager {
		addItemToCollection(sections, recentItem, parentChatId) {
			sections.forEach(recentSection => {
				void im_v2_application_core.Core.getStore().dispatch('recent/setUnreadCollection', {
					type: recentSection,
					items: [recentItem],
					parentChatId
				});
			});
		}
	}

	class RecentUnreadPullHandler {
		getModuleId() {
			return 'im';
		}
		handleMessage(params, extra) {
			this.handleMessageAdd(params, extra);
		}
		handleMessageChat(params, extra) {
			this.handleMessageAdd(params, extra);
		}
		handleReadAllChats() {
			im_v2_lib_unreadMode.UnreadModeManager.removeAllClosedChats();
		}
		handleReadAllChatsByRecentSection(params) {
			const {
				recentSection,
				parentChatId
			} = params;
			const preparedParentChatId = im_v2_lib_chat.ChatManager.prepareParentChatId(parentChatId);
			im_v2_lib_unreadMode.UnreadModeManager.removeClosedChats(recentSection, preparedParentChatId);
		}
		handleReadMessageChat(params) {
			const {
				dialogId,
				chatId,
				unread,
				counter,
				recentConfig,
				parentChatId
			} = params;
			const shouldRemoveParentChat = !this.#isParentChatOpen(parentChatId) && !this.#hasParentChatCounters(parentChatId);
			if (shouldRemoveParentChat) {
				this.#removeParentChat(parentChatId);
			}
			const shouldRemoveChat = !this.#isChatOpen(dialogId) && !this.#hasChatCounters(chatId, counter, unread);
			if (shouldRemoveChat) {
				this.#removeChat(recentConfig.sections, dialogId, parentChatId);
			}
		}
		handleChatUnread(params) {
			im_v2_lib_logger.Logger.warn('RecentUnreadPullHandler: handleChatUnread', params);
			const {
				muted,
				active,
				dialogId,
				recentConfig,
				parentChatId
			} = params;
			const shouldRemoveParentChat = !this.#hasParentChatCounters(parentChatId) && !this.#isParentChatOpen(parentChatId);
			if (shouldRemoveParentChat) {
				this.#removeParentChat(parentChatId);
			}
			const shouldAddChat = active && !muted;
			if (shouldAddChat) {
				const manager = new RecentUnreadUpdateManager(params);
				manager.addToRecentCollection();
				this.#addParentToRecentCollection(parentChatId, params);
				return;
			}
			const shouldRemoveChat = !this.#isChatOpen(dialogId);
			if (shouldRemoveChat) {
				this.#removeChat(recentConfig.sections, dialogId, parentChatId);
			}
		}
		handleChatMuteNotify(params) {
			const {
				muted,
				unread,
				recentConfig,
				dialogId,
				counter,
				chatId,
				parentChatId
			} = params;
			const shouldRemoveParentChat = muted && !this.#isParentChatOpen(parentChatId);
			if (shouldRemoveParentChat) {
				this.#removeParentChat(parentChatId);
			}
			const shouldAddChat = !muted && this.#hasChatCounters(chatId, counter, unread);
			if (shouldAddChat) {
				const manager = new RecentUnreadUpdateManager(params);
				manager.addToRecentCollection();
				this.#addParentToRecentCollection(parentChatId, params);
				return;
			}
			const shouldRemoveChat = muted && !this.#isChatOpen(dialogId);
			if (shouldRemoveChat) {
				this.#removeChat(recentConfig.sections, dialogId, parentChatId);
			}
		}
		handleMessageAdd(params, extra) {
			const {
				recentConfig,
				counter,
				chatId,
				userBlockChat
			} = params;
			const chatMuteMap = userBlockChat[chatId];
			const isMuted = chatMuteMap[im_v2_application_core.Core.getUserId()] === true;
			im_v2_lib_logger.Logger.warn('UnreadRecentPullHandler: handleMessageAdd', params);
			const manager = new NewMessageManager(params, extra);
			const parentChatId = manager.getParentChatId();
			const recentManager = new RecentUnreadUpdateManager(params);
			const hasCounter = counter > 0 && !main_core.Type.isUndefined(counter);
			const shouldAddChat = hasCounter && !isMuted && manager.isUserInChat();
			if (shouldAddChat) {
				const newRecentItem = buildRecentItem(params);
				recentManager.addItemToCollection(recentConfig.sections, newRecentItem, parentChatId);
			}
			const shouldAddParentChat = parentChatId > 0 && shouldAddChat;
			if (shouldAddParentChat) {
				this.#addParentToRecentCollection(parentChatId, params);
			}
		}
		#getParentRecentItem(parentChatId) {
			const parentDialogId = this.#getParentDialogId(parentChatId);
			return im_v2_application_core.Core.getStore().getters['recent/get'](parentDialogId);
		}
		#isChatOpen(dialogId) {
			return im_v2_application_core.Core.getStore().getters['application/isChatOpen'](dialogId);
		}
		#isParentChatOpen(parentChatId) {
			const parentDialogId = this.#getParentDialogId(parentChatId);
			return this.#isChatOpen(parentDialogId);
		}
		#hasChatCounters(chatId, counter, unread) {
			const childrenCounter = im_v2_application_core.Core.getStore().getters['counters/getChildrenTotalCounter'](chatId);
			const totalCounter = counter + childrenCounter;
			return totalCounter > 0 || unread;
		}
		#hasParentChatCounters(parentChatId) {
			const parentChildrenCounter = im_v2_application_core.Core.getStore().getters['counters/getChildrenTotalCounter'](parentChatId);
			const parentCounter = im_v2_application_core.Core.getStore().getters['counters/getTotalCounterByIds']([parentChatId]);
			const parentTotalCounter = parentChildrenCounter + parentCounter;
			return parentTotalCounter > 0;
		}
		#addParentToRecentCollection(chatId, params) {
			const parentRecentSections = this.#getParentSections(chatId);
			const parentRecentItem = this.#getParentRecentItem(chatId);
			const parentChatId = this.#getParentChatId(chatId);
			const manager = new RecentUnreadUpdateManager(params);
			manager.addItemToCollection(parentRecentSections, parentRecentItem, parentChatId);
		}
		#removeParentChat(parentChatId) {
			const parentRecentSections = this.#getParentSections(parentChatId);
			const parentDialogId = this.#getParentDialogId(parentChatId);
			im_v2_lib_unreadMode.UnreadModeManager.removeDialogIdBySections({
				recentSections: parentRecentSections,
				dialogId: parentDialogId
			});
		}
		#removeChat(recentSections, dialogId, parentChatId) {
			im_v2_lib_unreadMode.UnreadModeManager.removeDialogIdBySections({
				recentSections,
				dialogId,
				parentChatId
			});
		}
		#getParentDialogId(parentChatId) {
			const {
				dialogId
			} = im_v2_application_core.Core.getStore().getters['chats/getByChatId'](parentChatId, true);
			return dialogId;
		}
		#getParentSections(parentChatId) {
			return im_v2_application_core.Core.getStore().getters['counters/getRecentSectionsByChatId'](parentChatId);
		}
		#getParentChatId(chatId) {
			const {
				parentChatId
			} = im_v2_application_core.Core.getStore().getters['chats/getByChatId'](chatId);
			return parentChatId;
		}
	}

	class FolderPullHandler {
		getModuleId() {
			return 'im';
		}
		handleFolderCreate(params) {
			im_v2_lib_logger.Logger.warn('FolderPullHandler: handleFolderCreate', params);
			void im_v2_application_core.Core.getStore().dispatch('recent/folders/add', params.folder);
		}
		handleFolderUpdate(params) {
			im_v2_lib_logger.Logger.warn('FolderPullHandler: handleFolderUpdate', params);
			void im_v2_application_core.Core.getStore().dispatch('recent/folders/update', params.folder);
		}
		handleFolderDelete(params) {
			im_v2_lib_logger.Logger.warn('FolderPullHandler: handleFolderDelete', params);
			im_v2_lib_folder.FolderManager.handleOpenedFolder(params.folderId);
			void im_v2_application_core.Core.getStore().dispatch('recent/folders/delete', {
				id: params.folderId
			});
		}
		handleFolderSort(params) {
			im_v2_lib_logger.Logger.warn('FolderPullHandler: handleFolderSort', params);
			void im_v2_application_core.Core.getStore().dispatch('recent/folders/sort', params.folderIds);
		}
		handleFolderChatAdd(params) {
			im_v2_lib_logger.Logger.warn('FolderPullHandler: handleFolderChatAdd', params);
			void im_v2_application_core.Core.getStore().dispatch('recent/folders/update', params.folder);
		}
		handleFolderChatDelete(params) {
			im_v2_lib_logger.Logger.warn('FolderPullHandler: handleFolderChatDelete', params);
			void im_v2_application_core.Core.getStore().dispatch('recent/folders/update', params.folder);
		}
	}

	class NotificationPullHandler {
		constructor() {
			this.store = im_v2_application_core.Core.getStore();
			this.userManager = new im_v2_lib_user.UserManager();
			this.updateCounterDebounced = main_core.Runtime.debounce(this.updateCounter, 1500, this);
		}
		getModuleId() {
			return 'im';
		}
		getSubscriptionType() {
			return 'server';
		}
		handleNotifyAdd(params) {
			if (params.onlyFlash === true) {
				return;
			}
			this.userManager.setUsersToModel(params.users);
			this.store.dispatch('notifications/set', params);
			this.updateCounterDebounced(params.counter);
		}
		handleNotifyConfirm(params) {
			this.store.dispatch('notifications/delete', {
				id: params.id
			});
			this.updateCounterDebounced(params.counter);
		}
		handleNotifyRead(params) {
			params.list.forEach(id => {
				this.store.dispatch('notifications/read', {
					ids: [id],
					read: true
				});
			});
			if (params.counter < this.store.getters['notifications/getCounter']) {
				this.updateCounterDebounced(params.counter);
			}
		}
		handleNotifyUnread(params) {
			params.list.forEach(id => {
				this.store.dispatch('notifications/read', {
					ids: [id],
					read: false
				});
			});
			if (params.counter > this.store.getters['notifications/getCounter']) {
				this.updateCounterDebounced(params.counter);
			}
		}
		handleNotifyReadAll(params) {
			const excludeIds = params.excludeIds || [];
			void this.store.dispatch('notifications/readAllSimple', {
				excludeIds
			});
			this.updateCounterDebounced(params.newCounter);
		}
		handleNotifyDelete(params) {
			const idsToDelete = Object.keys(params.id).map(id => Number.parseInt(id, 10));
			idsToDelete.forEach(id => {
				this.store.dispatch('notifications/delete', {
					id
				});
			});
			this.updateCounterDebounced(params.counter);
		}
		updateCounter(counter) {
			this.store.dispatch('notifications/setCounter', counter);
		}
	}

	class SidebarPullHandler {
		constructor() {
			this.store = im_v2_application_core.Core.getStore();
			this.userManager = new im_v2_lib_user.UserManager();
		}
		getModuleId() {
			return 'im';
		}

		// region members
		handleChatUserAdd(params) {
			if (this.getMembersCountFromStore(params.chatId) === 0) {
				return;
			}

			// For a collab chat the member order is grouped on the server (owner -> moderators ->
			// guests -> rest). We cannot recompute the group position on the client, so instead of
			// appending the new member to the end of the Set we drop the loaded members and let the
			// panel re-request the grouped first page, placing the member into the right group.
			if (this.isCollab(params.dialogId)) {
				void this.store.dispatch('sidebar/members/reset', {
					chatId: params.chatId
				});
				return;
			}
			const {
				chatId,
				users,
				newUsers,
				relations
			} = params;
			void this.userManager.setUsersToModel(Object.values(users));
			const usersToAdd = newUsers.filter(userId => {
				const {
					isHidden
				} = relations.find(relation => relation.userId === userId);
				return !isHidden;
			});
			void this.store.dispatch('sidebar/members/set', {
				chatId,
				users: usersToAdd
			});
		}
		handleChatUserLeave(params) {
			if (this.getMembersCountFromStore(params.chatId) === 0) {
				return;
			}

			// See handleChatUserAdd: for collab we reset the loaded members and re-request the grouped
			// first page instead of just removing one id, so the remaining order stays server-grouped.
			if (this.isCollab(params.dialogId)) {
				void this.store.dispatch('sidebar/members/reset', {
					chatId: params.chatId
				});
				return;
			}
			void this.store.dispatch('sidebar/members/delete', {
				chatId: params.chatId,
				userId: params.userId
			});
		}
		isCollab(dialogId) {
			const chat = this.store.getters['chats/get'](dialogId, true);
			return chat?.type === im_v2_const.ChatType.collab;
		}
		// endregion

		// region task
		handleTaskAdd(params) {
			if (!this.isSidebarInited(params.link.chatId)) {
				return;
			}
			void this.userManager.setUsersToModel(params.users);
			void this.store.dispatch('sidebar/tasks/set', {
				chatId: params.link.chatId,
				tasks: [params.link]
			});
		}
		handleTaskUpdate(params, extra) {
			this.handleTaskAdd(params, extra);
		}
		handleTaskDelete(params) {
			if (!this.isSidebarInited(params.chatId)) {
				return;
			}
			void this.store.dispatch('sidebar/tasks/delete', {
				chatId: params.chatId,
				id: params.linkId
			});
		}
		// endregion

		// region meetings
		handleCalendarAdd(params) {
			if (!this.isSidebarInited(params.link.chatId)) {
				return;
			}
			void this.userManager.setUsersToModel(params.users);
			void this.store.dispatch('sidebar/meetings/set', {
				chatId: params.link.chatId,
				meetings: [params.link]
			});
		}
		handleCalendarUpdate(params, extra) {
			this.handleCalendarAdd(params, extra);
		}
		handleCalendarDelete(params) {
			if (!this.isSidebarInited(params.chatId)) {
				return;
			}
			void this.store.dispatch('sidebar/meetings/delete', {
				chatId: params.chatId,
				id: params.linkId
			});
		}
		// endregion

		// region links
		handleUrlAdd(params) {
			if (!this.isSidebarInited(params.link.chatId)) {
				return;
			}
			void this.userManager.setUsersToModel(params.users);
			void this.store.dispatch('sidebar/links/set', {
				chatId: params.link.chatId,
				links: [params.link]
			});
			const counter = this.store.getters['sidebar/links/getCounter'](params.link.chatId);
			void this.store.dispatch('sidebar/links/setCounter', {
				chatId: params.link.chatId,
				counter: counter + 1
			});
		}
		handleUrlDelete(params) {
			if (!this.isSidebarInited(params.chatId)) {
				return;
			}
			void this.store.dispatch('sidebar/links/delete', {
				chatId: params.chatId,
				id: params.linkId
			});
		}
		// endregion

		// region favorite
		handleMessageFavoriteAdd(params) {
			if (!this.isSidebarInited(params.link.chatId)) {
				return;
			}
			void this.userManager.setUsersToModel(params.users);
			void this.store.dispatch('files/set', params.files);
			void this.store.dispatch('messages/store', [params.link.message]);
			void this.store.dispatch('sidebar/favorites/set', {
				chatId: params.link.chatId,
				favorites: [params.link]
			});
			const counter = this.store.getters['sidebar/favorites/getCounter'](params.link.chatId);
			void this.store.dispatch('sidebar/favorites/setCounter', {
				chatId: params.link.chatId,
				counter: counter + 1
			});
		}
		handleMessageFavoriteDelete(params) {
			if (!this.isSidebarInited(params.chatId)) {
				return;
			}
			void this.store.dispatch('sidebar/favorites/delete', {
				chatId: params.chatId,
				id: params.linkId
			});
		}
		// endregion

		// region files
		handleFileAdd(params) {
			if (!this.isSidebarInited(params.link.chatId)) {
				return;
			}
			void this.userManager.setUsersToModel(params.users);
			void this.store.dispatch('files/set', params.files);
			const group = params.link.group ?? im_v2_const.SidebarDetailBlock.fileUnsorted;
			void this.store.dispatch('sidebar/files/set', {
				chatId: params.link.chatId,
				files: [params.link],
				group
			});
		}
		handleFileDelete(params) {
			im_v2_lib_playback.PlaybackService.getInstanceIfCreated()?.handleFileDeleted(params.fileId);
			const chatId = main_core.Type.isNumber(params.chatId) ? params.chatId : Number.parseInt(params.chatId, 10);
			if (!this.isSidebarInited(chatId)) {
				return;
			}
			const sidebarFileId = params.linkId ?? params.fileId;
			void this.store.dispatch('sidebar/files/delete', {
				chatId,
				id: sidebarFileId
			});
		}
		// endregion

		// region support24

		handleChangeMultidialogSessionsLimit(params) {
			void this.store.dispatch('sidebar/multidialog/setOpenSessionsLimit', params.limit);
		}
		handleAddMultidialog(params) {
			const {
				multidialog,
				count
			} = params;
			const isSupport = multidialog.isSupport;
			if (!isSupport) {
				return;
			}
			void this.store.dispatch('sidebar/multidialog/setChatsCount', count);
			void this.store.dispatch('sidebar/multidialog/addMultidialogs', [multidialog]);
		}
		handleReadMessageChat(params) {
			this.deleteUnreadSupportChats(params);
		}
		handleReadMessage(params) {
			this.deleteUnreadSupportChats(params);
		}
		handleChangeMultidialogStatus(params) {
			const {
				bot,
				chat,
				multidialog
			} = params;
			const isSupport = multidialog.isSupport;
			if (!isSupport) {
				return;
			}
			if (chat) {
				void this.store.dispatch('chats/set', chat);
			}
			if (bot) {
				void this.userManager.setUsersToModel(bot);
			}
			void this.store.dispatch('sidebar/multidialog/addMultidialogs', [multidialog]);
		}
		handleMessage(params) {
			this.setUnreadSupportTickets(params.multidialog);
		}
		handleChatUnread(params) {
			const {
				chatId,
				dialogId
			} = params;
			const isSupport = this.store.getters['sidebar/multidialog/isSupport'](dialogId);
			const isInited = this.store.getters['sidebar/multidialog/isInited'];
			if (isSupport && isInited) {
				void this.store.dispatch('sidebar/multidialog/setUnreadChats', [chatId]);
			}
		}
		// endregion

		// region files unsorted and support24
		handleMessageChat(params) {
			// handle new files while migration is not finished.
			this.setFiles(params);

			// handle new unread chats.
			this.setUnreadSupportTickets(params.multidialog);
		}
		// endregion

		deleteUnreadSupportChats(params) {
			const notCounter = params.counter === 0;
			if (notCounter) {
				void this.store.dispatch('sidebar/multidialog/deleteUnreadChats', params.chatId);
			}
		}
		setUnreadSupportTickets(multidialog) {
			if (!multidialog) {
				return;
			}
			const oldMultidialog = this.store.getters['sidebar/multidialog/get'](multidialog.chatId);
			const status = oldMultidialog?.status || multidialog.status;
			void this.store.dispatch('sidebar/multidialog/addMultidialogs', [{
				...multidialog,
				status
			}]);
			void this.store.dispatch('sidebar/multidialog/setUnreadChats', [multidialog.chatId]);
		}
		setFiles(params) {
			const {
				chatId,
				users,
				files
			} = params;
			if (!this.isSidebarInited(chatId) || this.areFilesMigrated()) {
				return;
			}
			void this.userManager.setUsersToModel(Object.values(users));
			void this.store.dispatch('files/set', Object.values(files));
			Object.values(files).forEach(file => {
				const group = file.group ?? im_v2_const.SidebarDetailBlock.fileUnsorted;
				void this.store.dispatch('sidebar/files/set', {
					chatId: file.chatId,
					files: [file],
					group
				});
			});
		}
		isSidebarInited(chatId) {
			return this.store.getters['sidebar/isInited'](chatId);
		}
		areFilesMigrated() {
			return this.store.state.sidebar.isFilesMigrated;
		}
		getMembersCountFromStore(chatId) {
			return this.store.getters['sidebar/members/getSize'](chatId);
		}
	}

	class NotifierPullHandler {
		lastNotificationId = 0;
		constructor() {
			this.store = im_v2_application_core.Core.getStore();
			this.#setCurrentUserStatus();
			this.#restoreLastNotificationId();
		}
		getModuleId() {
			return 'im';
		}
		handleMessage(params, extraData) {
			this.handleMessageAdd(params, extraData);
		}
		handleMessageChat(params, extraData) {
			this.handleMessageAdd(params, extraData);
		}
		handleMessageAdd(params, extraData) {
			if (!this.#shouldHandleMessageNotification(params, extraData)) {
				return;
			}
			void im_v2_lib_messageNotifier.MessageNotifierManager.getInstance().handleIncomingMessage({
				dialogId: params.dialogId.toString(),
				isImportant: this.#isImportantMessage(params),
				messageId: params.message.id,
				isLines: Boolean(params.lines)
			});
			this.#updateLastNotificationId(params.message.id);
		}
		handleNotifyAdd(params, extraData) {
			if (!this.#shouldHandleNotification(params, extraData)) {
				return;
			}
			im_v2_lib_messageNotifier.MessageNotifierManager.getInstance().handleIncomingNotification({
				notificationId: params.id,
				userId: params.userId,
				isSilent: params.silent === 'Y'
			});
			this.#updateLastNotificationId(params.id);
		}
		#shouldHandleMessageNotification(params, extraData) {
			if (this.#isExpired(extraData)) {
				return false;
			}
			if (!this.#checkLastNotificationId(params.message.id)) {
				return false;
			}
			if (this.#isCurrentUserSender(params)) {
				return false;
			}
			if (params.lines && !this.#shouldShowLinesNotification(params)) {
				return false;
			}
			if (!this.#shouldShowToUser(params) || this.#desktopWillShowNotification()) {
				return false;
			}
			const callIsActive = im_v2_lib_call.CallManager.getInstance().hasCurrentCall();
			if (callIsActive && im_v2_lib_call.CallManager.getInstance().getCurrentCallDialogId() !== params.dialogId.toString()) {
				return false;
			}
			const screenSharingIsActive = im_v2_lib_call.CallManager.getInstance().hasCurrentScreenSharing();
			return !screenSharingIsActive;
		}
		#shouldHandleNotification(params, extraData) {
			if (this.#isExpired(extraData) || !this.#checkLastNotificationId(params.id)) {
				return false;
			}
			if (params.onlyFlash === true || this.#isUserDnd() || this.#desktopWillShowNotification() || im_v2_lib_call.CallManager.getInstance().hasCurrentCall()) {
				return false;
			}
			if (document.hasFocus()) {
				const areNotificationsOpen = this.store.getters['application/areNotificationsOpen'];
				if (areNotificationsOpen) {
					return false;
				}
			}
			return true;
		}
		#shouldShowLinesNotification(params) {
			if (this.#isLinesChatOpened(params.dialogId)) {
				return false;
			}
			const authorId = params.message.senderId;
			if (authorId > 0 && params.users[authorId].type !== im_v2_const.UserType.extranet) {
				return true;
			}
			const counter = this.store.getters['counters/getCounterByChatId'](params.chatId);
			return counter === 0;
		}
		#isLinesChatOpened(dialogId) {
			const isLinesChatOpen = this.store.getters['application/isLinesChatOpen'](dialogId);
			return Boolean(document.hasFocus() && isLinesChatOpen);
		}
		#isImportantMessage(params) {
			const {
				message
			} = params;
			return message.isImportant || message.importantFor.includes(im_v2_application_core.Core.getUserId());
		}
		#shouldShowToUser(params) {
			if (this.#isImportantMessage(params)) {
				return true;
			}
			const {
				notify,
				message,
				dialogId
			} = params;
			const messageParams = message?.params;
			const isNotificationDisabled = !notify || messageParams?.NOTIFY === 'N';
			if (isNotificationDisabled) {
				return false;
			}
			const {
				isMuted
			} = this.store.getters['chats/get'](dialogId, true);
			return !this.#isUserDnd() && !isMuted;
		}
		#isUserDnd() {
			const status = this.store.getters['application/settings/get'](im_v2_const.Settings.user.status);
			return status === im_v2_const.UserStatus.dnd;
		}
		#desktopWillShowNotification() {
			const isDesktopChatWindow = im_v2_lib_desktop.DesktopManager.isChatWindow();
			return !isDesktopChatWindow && im_v2_lib_desktop.DesktopManager.getInstance().isDesktopActive();
		}
		#restoreLastNotificationId() {
			const rawLastNotificationId = im_v2_lib_localStorage.LocalStorageManager.getInstance().get(im_v2_const.LocalStorageKey.lastNotificationId, 0);
			this.lastNotificationId = Number.parseInt(rawLastNotificationId, 10);
		}
		#updateLastNotificationId(notificationId) {
			const WRITE_TO_STORAGE_TIMEOUT = 2000;
			this.lastNotificationId = notificationId;
			clearTimeout(this.writeToStorageTimeout);
			this.writeToStorageTimeout = setTimeout(() => {
				im_v2_lib_localStorage.LocalStorageManager.getInstance().set(im_v2_const.LocalStorageKey.lastNotificationId, notificationId);
			}, WRITE_TO_STORAGE_TIMEOUT);
		}
		#setCurrentUserStatus() {
			const applicationData = im_v2_application_core.Core.getApplicationData();
			if (!applicationData.settings?.status) {
				return;
			}
			im_v2_application_core.Core.getStore().dispatch('application/settings/set', {
				[im_v2_const.Settings.user.status]: applicationData.settings.status
			});
		}
		#isExpired(extraData) {
			if (extraData.server_time_ago > 10) {
				im_v2_lib_logger.Logger.warn('NotifierPullHandler: received notification 10 seconds after it was actually sent, ignore');
				return true;
			}
			return false;
		}
		#checkLastNotificationId(id) {
			if (id <= this.lastNotificationId) {
				im_v2_lib_logger.Logger.warn('NotifierPullHandler: new message id is smaller than lastNotificationId');
				return false;
			}
			return true;
		}
		#isCurrentUserSender(params) {
			return im_v2_application_core.Core.getUserId() === params.message.senderId;
		}
	}

	class OnlinePullHandler {
		constructor() {
			this.store = im_v2_application_core.Core.getStore();
		}
		getModuleId() {
			return 'online';
		}
		getSubscriptionType() {
			return 'online';
		}
		handleUserStatus(params) {
			const currentUserId = im_v2_application_core.Core.getUserId();
			if (main_core.Type.isPlainObject(params.users[currentUserId])) {
				const {
					status
				} = params.users[currentUserId];
				this.store.dispatch('application/settings/set', {
					status
				});
			}
			Object.values(params.users).forEach(userInfo => {
				this.store.dispatch('users/update', {
					id: userInfo.id,
					fields: {
						lastActivityDate: userInfo.last_activity_date
					}
				});
			});
		}
	}

	class CounterPullHandler {
		getModuleId() {
			return 'im';
		}
		handleMessage(params, extra) {
			this.handleMessageChat(params, extra);
		}
		handleMessageChat(params, extra) {
			const manager = new NewMessageManager(params, extra);
			if (!manager.isUserInChat()) {
				return;
			}
			const {
				chatId,
				counter,
				userBlockChat,
				recentConfig
			} = params;
			const chatMuteMap = userBlockChat[chatId];
			const isMuted = chatMuteMap[im_v2_application_core.Core.getUserId()] === true;
			const isMarkedAsUnread = im_v2_application_core.Core.getStore().getters['counters/getUnreadStatus'](chatId);
			const counterItem = {
				chatId,
				counter,
				isMarkedAsUnread,
				isMuted,
				parentChatId: manager.getParentChatId(),
				recentSections: recentConfig.sections
			};
			void im_v2_application_core.Core.getStore().dispatch('counters/setCounters', [counterItem]);
		}
		handleReadMessage(params, extra) {
			this.handleReadMessageChat(params, extra);
		}
		handleReadMessageChat(params, extra) {
			const {
				chatId,
				counter: newCounter,
				unread,
				muted,
				parentChatId,
				recentConfig
			} = params;
			const uuidManager = im_v2_lib_uuid.UuidManager.getInstance();
			if (uuidManager.hasActionUuid(extra.action_uuid)) {
				im_v2_lib_logger.Logger.warn('CounterPullHandler: handleReadMessage: we have this uuid, skip');
				uuidManager.removeActionUuid(extra.action_uuid);
				return;
			}
			const counterItem = {
				chatId,
				counter: newCounter,
				isMarkedAsUnread: unread,
				isMuted: muted,
				parentChatId,
				recentSections: recentConfig.sections
			};
			void im_v2_application_core.Core.getStore().dispatch('counters/setCounters', [counterItem]);
		}
		handleMessageDeleteV2(params) {
			const {
				chatId,
				counter,
				unread,
				muted,
				parentChatId,
				recentConfig
			} = params;
			const counterItem = {
				chatId,
				counter,
				isMarkedAsUnread: unread,
				isMuted: muted,
				parentChatId,
				recentSections: recentConfig.sections
			};
			void im_v2_application_core.Core.getStore().dispatch('counters/setCounters', [counterItem]);
		}
		handleChatUnread(params) {
			const {
				chatId,
				counter,
				active,
				muted,
				parentChatId,
				recentConfig
			} = params;
			const counterItem = {
				chatId,
				counter,
				isMarkedAsUnread: active,
				isMuted: muted,
				parentChatId,
				recentSections: recentConfig.sections
			};
			void im_v2_application_core.Core.getStore().dispatch('counters/setCounters', [counterItem]);
		}
		handleRecentUpdate(params) {
			const {
				chat,
				recentConfig,
				lastActivityDate
			} = params;
			const needToUpdate = lastActivityDate !== null;
			if (!needToUpdate) {
				return;
			}
			const {
				id: chatId,
				parent_chat_id: parentChatId,
				mute_list: muteList
			} = chat;
			const isMuted = muteList[im_v2_application_core.Core.getUserId()] === true;

			// recentUpdate is emitted for parent chat, we add parent item for children counters to work properly
			const counterItem = {
				chatId,
				parentChatId,
				recentSections: recentConfig.sections,
				isMuted
			};
			void im_v2_application_core.Core.getStore().dispatch('counters/setCounters', [counterItem]);
		}
		handleChatPin(params) {
			const {
				chat,
				recentConfig
			} = params;
			const {
				id: chatId,
				parent_chat_id: parentChatId,
				mute_list: muteList
			} = chat;
			const isMuted = muteList[im_v2_application_core.Core.getUserId()] === true;

			// Pinning puts a chat (back) into the recent list. Its recentSections are emptied server-side
			// while a chat is hidden from recent, and only handleRecentUpdate restores them - but pin emits
			// its own event without a fresh activity date, so we restore them here too. Otherwise child
			// counters can't bubble into the section badge through this (now visible) parent until reload.
			const counterItem = {
				chatId,
				parentChatId,
				recentSections: recentConfig.sections,
				isMuted
			};
			void im_v2_application_core.Core.getStore().dispatch('counters/setCounters', [counterItem]);
		}
		handleChatDelete(params) {
			const {
				chatId
			} = params;
			void im_v2_application_core.Core.getStore().dispatch('counters/clearById', {
				chatId
			});
		}
		handleReadAllChats() {
			im_v2_lib_counter.CounterManager.clearAllCounters();
		}
		handleReadAllChatsByRecentSection(params) {
			const {
				recentSection,
				parentChatId
			} = params;
			im_v2_lib_counter.CounterManager.clearCountersByRecentType(recentSection, parentChatId);
		}
		handleReadChildren(params) {
			const {
				chatId
			} = params;
			void im_v2_application_core.Core.getStore().dispatch('counters/clearByParentId', {
				parentChatId: chatId
			});
		}
	}

	class PromotionPullHandler {
		getModuleId() {
			return 'im';
		}
		handlePromotionUpdated(params) {
			im_v2_lib_promo.PromoManager.getInstance().onPromotionUpdated(params);
		}
	}

	class AnchorPullHandler {
		constructor() {
			this.store = im_v2_application_core.Core.getStore();
		}
		getModuleId() {
			return 'im';
		}
		handleAddAnchor(anchor) {
			this.store.dispatch('messages/anchors/addAnchor', {
				anchor
			});
		}
		handleDeleteAnchor(anchor) {
			this.store.dispatch('messages/anchors/removeAnchor', {
				anchor
			});
		}
		handleDeleteAnchors(payload) {
			const {
				chatIds
			} = payload;
			chatIds.forEach(chatId => {
				void this.store.dispatch('messages/anchors/removeChatAnchors', chatId);
			});
		}
		handleDeleteChatAnchors(payload) {
			this.store.dispatch('messages/anchors/removeChatAnchors', payload.chatId);
		}
	}

	class StickersPullHandler {
		constructor() {
			this.store = im_v2_application_core.Core.getStore();
		}
		getModuleId() {
			return 'im';
		}
		handleStickerRecentDelete(params) {
			const {
				id,
				packType,
				packId
			} = params;
			void im_v2_application_core.Core.getStore().dispatch('stickers/recent/delete', {
				id,
				packType,
				packId
			});
		}
		handleStickerRecentDeleteAll() {
			void im_v2_application_core.Core.getStore().dispatch('stickers/recent/clear');
		}
		handleStickerPackAdd(params) {
			const {
				pack,
				stickers
			} = params;
			void im_v2_application_core.Core.getStore().dispatch('stickers/packs/set', [pack]);
			void im_v2_application_core.Core.getStore().dispatch('stickers/set', stickers);
		}
		handleStickerPackLink(params) {
			this.handleStickerPackAdd(params);
		}
		handleStickerPackDelete(params) {
			void im_v2_application_core.Core.getStore().dispatch('stickers/packs/delete', params);
			void im_v2_application_core.Core.getStore().dispatch('stickers/deleteByPack', params);
		}
		handleStickerPackUnlink(params) {
			void im_v2_application_core.Core.getStore().dispatch('stickers/packs/unlink', params);
		}
		handleStickerPackRename(params) {
			void im_v2_application_core.Core.getStore().dispatch('stickers/packs/rename', params);
		}
		handleStickerAdd(params) {
			this.handleStickerPackAdd(params);
		}
		handleStickerDelete(params) {
			void im_v2_application_core.Core.getStore().dispatch('stickers/delete', params);
		}
	}

	exports.AnchorPullHandler = AnchorPullHandler;
	exports.BasePullHandler = BasePullHandler;
	exports.CounterPullHandler = CounterPullHandler;
	exports.FolderPullHandler = FolderPullHandler;
	exports.NotificationPullHandler = NotificationPullHandler;
	exports.NotifierPullHandler = NotifierPullHandler;
	exports.OnlinePullHandler = OnlinePullHandler;
	exports.PromotionPullHandler = PromotionPullHandler;
	exports.RecentPullHandler = RecentPullHandler;
	exports.RecentUnreadPullHandler = RecentUnreadPullHandler;
	exports.SidebarPullHandler = SidebarPullHandler;
	exports.StickersPullHandler = StickersPullHandler;

})(this.BX.Messenger.v2.Provider.Pull = this.BX.Messenger.v2.Provider.Pull || {}, BX.Messenger.v2.Application, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX, BX.Event, BX.Messenger.v2.Const, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Service, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.UI.Accessibility, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Service, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.SidePanel, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib);
//# sourceMappingURL=registry.bundle.js.map
