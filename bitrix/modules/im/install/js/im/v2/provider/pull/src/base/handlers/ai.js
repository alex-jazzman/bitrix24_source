import { Loc, Type } from 'main.core';
import { LiveAnnouncer } from 'ui.a11y';
import { type Store } from 'ui.vue3.vuex';

import { Core } from 'im.v2.application.core';
import { AiTaskStatus, CopilotGenerationStatus, type AiTaskStatusValue } from 'im.v2.const';
import { CopilotManager } from 'im.v2.lib.copilot';
import { Logger } from 'im.v2.lib.logger';
import { Notifier } from 'im.v2.lib.notifier';
import { type AiTaskOperation, type ImModelChat, type ImModelMessage } from 'im.v2.model';

import {
	type EngineUpdateParams,
	type FileTranscriptionParams,
	type CopilotRoleParams,
	type AiAssistantTitleParams,
	type CopilotGenerationStateParams,
	type AutoTaskStatusParams,
} from '../../types/ai';
import { type PullExtraParams } from '../../types/common';

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
	completed: AiTaskStatus.taskCreationCompleted,
	// The verdict "these messages are not a new assignment": the AI read them as a result of a task
	// that already exists, so no task is created and the result is appended to that one. The name
	// reads like a stage of a longer run - which is how it came to be counted as progress here - but
	// the server sends nothing by the operation afterwards (`TranscribedResultHandler::handle()`),
	// and a frame left running would hang on the message until the watchdog took it down unanswered.
	resultAdded: AiTaskStatus.resultCreationCompleted,
	notFound: AiTaskStatus.notFound,
};

// The two ends an operation can reach successfully. They are told apart only by the caption they
// draw: the same window, no balloon and no notification of any kind, since a success leaves a trace
// in the chat of its own.
const SUCCESS_STATUSES: Set<AiTaskStatusValue> = new Set([
	TerminalStatus.completed,
	TerminalStatus.resultAdded,
]);

type TrackedOperation = {
	chatId: number,
	operation: AiTaskOperation,
};

// A timer is kept per chat, but it belongs to ONE operation of that chat: a chat outlives its
// operations, and the next one can start while a timer of the previous is still pending. So the anchor
// it was armed for rides along and is checked at its firing.
type PendingTimer = {
	timerId: number,
	anchorMessageId: number,
};

// The take-down carries the outcome that armed it as well: its own delay depends on the outcome, and
// noticing "this outcome has already been reported" means telling WHICH one that was.
type PendingTakeDown = {
	timerId: number,
	anchorMessageId: number,
	status: AiTaskStatusValue,
};

// Shared across all handler instances: `AiPullHandler` is constructed twice and independently -
// `BasePullHandler` builds one for the status events, `MessagePullHandler` builds another for the
// task card - while both paths drive the same indication of the same chat. Kept in instance fields,
// each of them would see its own, always empty registry: the deferred take-down of the terminal frame
// would be unknown to the card path, and the watchdog of a finished operation would never be cancelled.
const watchdogTimers: Map<number, PendingTimer> = new Map();
const clearTimers: Map<number, PendingTakeDown> = new Map();

export class AiPullHandler
{
	#store: Store;

	constructor()
	{
		this.#store = Core.getStore();
	}

	handleChangeEngine(params: EngineUpdateParams)
	{
		Logger.warn('AiPullHandler: handleChangeEngine', params);
		const { chatId, engineCode } = params;
		const dialog: ImModelChat = this.#store.getters['chats/getByChatId'](chatId);

		if (!dialog)
		{
			return;
		}

		this.#store.dispatch('copilot/chats/updateModel', { dialogId: dialog.dialogId, aiModel: engineCode });
	}

	handleFileTranscription(params: FileTranscriptionParams)
	{
		Logger.warn('AiPullHandler: handleFileTranscription', params);

		this.#store.dispatch('files/setTranscription', params);
	}

	handleSetCopilotTitle(params: AiAssistantTitleParams)
	{
		Logger.warn('AiPullHandler: handleSetCopilotTitle', params);
		const { dialogId } = params;

		if (!dialogId)
		{
			return;
		}

		void this.#store.dispatch('copilot/chats/setTitleIsCustom', { dialogId, titleIsCustom: true });
	}

	handleCopilotGenerationState(params: CopilotGenerationStateParams)
	{
		Logger.warn('AiPullHandler: handleCopilotGenerationState', params);
		const { dialogId, status, initiatorId } = params;

		if (!dialogId)
		{
			return;
		}

		// the model keeps only the active generation: any terminal status clears the state
		void this.#store.dispatch('copilot/chats/setGenerationState', {
			dialogId,
			generationState: { status, initiatorId },
		});

		if (status !== CopilotGenerationStatus.generating)
		{
			new CopilotManager().stopCopilotTyping(dialogId);
		}
	}

	handleChatCopilotRoleUpdate(params: CopilotRoleParams)
	{
		if (!params.copilotRole)
		{
			return;
		}

		const copilotManager = new CopilotManager();
		void copilotManager.handleRoleUpdate(params.copilotRole);
	}

	handleAutoTaskStatus(params: AutoTaskStatusParams, extra: PullExtraParams = {})
	{
		Logger.warn('AiPullHandler: handleAutoTaskStatus', params);

		if (this.#isStale(extra))
		{
			return;
		}

		const { chatId: eventChatId, messageId, status, isPartial } = params;

		const tracked = this.#resolveOperation(eventChatId, messageId);
		if (!tracked)
		{
			this.#rememberEarlyStatus(messageId, status);

			return;
		}

		const { chatId, operation } = tracked;

		if (SUCCESS_STATUSES.has(status))
		{
			this.#cancelWatchdog(chatId);
			// The partial-result flag rides on `taskCreationCompleted` alone (the payload of
			// `AutoTaskStatus` carries it under that status only), and its absence means a plain
			// success - which an appended result always is.
			void this.#store.dispatch('aiTask/applyStatus', { chatId, messageId, status, isPartial });
			this.#scheduleClear(chatId, operation.anchorMessageId, status, TERMINAL_FRAME_DELAY);

			return;
		}

		if (status === TerminalStatus.notFound)
		{
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
			if (operation.anchorVisible)
			{
				void this.#store.dispatch('aiTask/applyStatus', { chatId, messageId, status });
				this.#scheduleClear(chatId, operation.anchorMessageId, status, NOT_FOUND_CLEAR_DELAY);
			}
			else
			{
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
				if (!outcomeAlreadyReported)
				{
					LiveAnnouncer.announce(Loc.getMessage('IM_PULL_AI_TASK_CREATE_ERROR'), 'assertive');
				}
			}

			// Raised whichever way the branch went, because the frame is not a trace: it leaves the screen
			// on a timer that cannot be stopped, extended or switched off, while the balloon keeps its own
			// time and waits to be closed. A failure has nothing else to leave behind - the task card comes
			// only with a success (a partial one included), which is why progress is never notified at all.
			// Raised once, too: a redelivered terminal event is not a second failure to report, and the
			// notification centre stacks whatever it is given - it has no idea the two are the same one.
			if (!outcomeAlreadyReported)
			{
				Notifier.message.onAiTaskCreateError();
			}

			return;
		}

		// Non-terminal statuses (search / taskCreationStarted / resultCreationStarted) and any status
		// this client does not know: keep the indication up and (re)arm the watchdog, since the
		// terminal event is fire-once and may be lost.
		void this.#store.dispatch('aiTask/applyStatus', { chatId, messageId, status });
		this.#armWatchdog(chatId, operation.anchorMessageId);
	}

	handleAiTaskTriggerMessage(chatId: number, message: ImModelMessage)
	{
		// No system-flag guard: auto-task cards are regular (non-system) messages,
		// and the AI_TASK_TRIGGER_MESSAGE_ID param exists only on such cards.
		const triggerMessageId = Number(message?.params?.AI_TASK_TRIGGER_MESSAGE_ID);
		if (!Type.isNumber(triggerMessageId) || Number.isNaN(triggerMessageId))
		{
			return;
		}

		const operation: ?AiTaskOperation = this.#store.getters['aiTask/getForChat'](chatId);
		if (!operation || operation.anchorMessageId !== triggerMessageId)
		{
			return;
		}

		// Reserve terminal only: the card normally arrives while the terminal frame is still up, and
		// cutting that frame short would take the outcome off the screen before it is read. The take-down
		// is already scheduled there, so this branch is left for the operation that never got a terminal
		// pull event at all (a lost event, a reconnect). A take-down pending for another operation of the
		// chat says nothing about this one and must not stand in for its terminal.
		if (clearTimers.get(chatId)?.anchorMessageId === triggerMessageId)
		{
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
	#resolveOperation(chatId: ?number, messageId: number): ?TrackedOperation
	{
		if (Type.isNumber(chatId) && chatId > 0)
		{
			const operation: ?AiTaskOperation = this.#store.getters['aiTask/getForChat'](chatId);

			return operation?.anchorMessageId === messageId ? { chatId, operation } : null;
		}

		const collection = this.#store.state?.aiTask?.collection ?? {};
		const trackedChatId = Object.keys(collection)
			.find((key) => collection[key].anchorMessageId === messageId)
		;

		return Type.isUndefined(trackedChatId)
			? null
			: { chatId: Number(trackedChatId), operation: collection[trackedChatId] }
		;
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
	#rememberEarlyStatus(messageId: number, status: AiTaskStatusValue)
	{
		if (SUCCESS_STATUSES.has(status) || status === TerminalStatus.notFound)
		{
			return;
		}

		void this.#store.dispatch('aiTask/rememberEarlyStatus', { messageId, status });
	}

	/**
	 * A take-down pending for the same outcome of the same operation: the mark of a terminal event
	 * that has already been reported.
	 */
	#isOutcomeAlreadyReported(tracked: TrackedOperation, status: AiTaskStatusValue): boolean
	{
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
	#scheduleClear(chatId: number, anchorMessageId: number, status: AiTaskStatusValue, delay: number)
	{
		const pending = clearTimers.get(chatId);
		if (pending)
		{
			if (pending.anchorMessageId === anchorMessageId && pending.status === status)
			{
				return;
			}

			clearTimeout(pending.timerId);
		}

		const timerId = setTimeout(() => {
			clearTimers.delete(chatId);
			this.#clearIndicationOf(chatId, anchorMessageId, status);
		}, delay);
		clearTimers.set(chatId, { timerId, anchorMessageId, status });
	}

	#cancelScheduledClear(chatId: number)
	{
		const pending = clearTimers.get(chatId);
		if (pending)
		{
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
	#clearIndicationOf(chatId: number, anchorMessageId: number, status: ?AiTaskStatusValue = null)
	{
		const operation: ?AiTaskOperation = this.#store.getters['aiTask/getForChat'](chatId);
		if (operation?.anchorMessageId !== anchorMessageId)
		{
			return;
		}

		if (status !== null && operation.status !== status)
		{
			return;
		}

		this.#clearIndication(chatId);
	}

	/** The single exit of the indication: no timer of the chat outlives it. */
	#clearIndication(chatId: number)
	{
		this.#cancelWatchdog(chatId);
		this.#cancelScheduledClear(chatId);
		void this.#store.dispatch('aiTask/clear', { chatId });
	}

	#armWatchdog(chatId: number, anchorMessageId: number)
	{
		this.#cancelWatchdog(chatId);
		// A non-terminal status means an operation is running in this chat again, so a take-down still
		// pending from the terminal frame of the previous one must not fire on top of it.
		this.#cancelScheduledClear(chatId);
		const timerId = setTimeout(() => {
			watchdogTimers.delete(chatId);
			this.#clearIndicationOf(chatId, anchorMessageId);
		}, WATCHDOG_TIMEOUT);
		watchdogTimers.set(chatId, { timerId, anchorMessageId });
	}

	#cancelWatchdog(chatId: number)
	{
		const pending = watchdogTimers.get(chatId);
		if (pending)
		{
			clearTimeout(pending.timerId);
			watchdogTimers.delete(chatId);
		}
	}

	#isStale(extra: PullExtraParams): boolean
	{
		return Type.isNumber(extra?.server_time_ago) && extra.server_time_ago > STALE_THRESHOLD_SECONDS;
	}
}
