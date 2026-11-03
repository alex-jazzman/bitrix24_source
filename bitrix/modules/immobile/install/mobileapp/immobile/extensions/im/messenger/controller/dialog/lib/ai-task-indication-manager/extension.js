/**
 * @module im/messenger/controller/dialog/lib/ai-task-indication-manager
 */
jn.define('im/messenger/controller/dialog/lib/ai-task-indication-manager', (require, exports, module) => {
	const { Type } = require('type');
	const { PerfPoint } = require('debug/prism');

	const {
		AiTasksStatusType,
		AiTaskIndicationRole,
		AiTaskIndicationStatus,
		EventType,
		MessageType,
	} = require('im/messenger/const');
	const { getLogger } = require('im/messenger/lib/logger');
	const { Notification, ToastType } = require('im/messenger/lib/ui/notification');

	const logger = getLogger('dialog--ai-task-indication-manager');

	// Max silence (ms) between non-terminal statuses of one operation. A silent transcription failure
	// may never send the terminal event, so without the watchdog the indication would stay around the
	// message forever. Re-armed on every non-terminal status: this is the ceiling for a single stage.
	// The same window as the staleness threshold of an auto-task status in
	// `im/messenger/provider/pull/message/handler`, and both mirror the web.
	const AI_TASK_INDICATION_WATCHDOG_TIMEOUT = 90000;

	// How long the terminal frame (task created, result added, nothing found) stays around the message
	// before the indication is taken down. The task card usually arrives earlier and takes it down itself.
	const AI_TASK_INDICATION_TERMINAL_FRAME_TIMEOUT = 3000;

	// Delay (ms) between the frame that switches the animation off and the wipe of the visualState
	// subfields it was built from. The two cannot share a tick: mutation handlers run asynchronously
	// (MessengerMutationManager.handle awaits) and the renderer reads the message back from the store,
	// so a wipe committed in the same tick would be the state both redraws see - the native side would
	// never receive `animate: false` and the indication would stay lit until the message is rebuilt.
	const AI_TASK_INDICATION_STATE_RESET_DELAY = 1000;

	// The native side draws no indication around a sticker or a large emoji.
	const MESSAGE_TYPES_WITHOUT_FRAME = new Set([MessageType.sticker, MessageType.emojiOnly]);

	/**
	 * @class AiTaskIndicationManager
	 * @desc Owns the lifecycle of a single AI-task indication operation of the dialog: which message is
	 * the anchor, which messages carry the frame, which frame they currently carry and when the
	 * indication is taken down. An operation is started by a tap of the user - the task is created out
	 * of a message or out of a selection - or adopted from a pull status of an operation nobody started
	 * here: the automatic task of a voice or a video note has no tap behind it at all, and the first
	 * status of a manual one may outrun the answer of the REST call. The frame itself (text, icon,
	 * animation flag) is assembled out of visualState by AiAnimation on the message-element side - this
	 * class only writes the status, the role and the partial-result flag of every message of the set.
	 */
	class AiTaskIndicationManager
	{
		/**
		 * @desc The correlation key of the operation: pull events of the AI task carry it as messageId.
		 * @type {number|null}
		 */
		#activeAnchor = null;

		/**
		 * @desc Messages of the operation that carry the frame: stickers and large emoji carry none.
		 * @type {Array<number>}
		 */
		#activeIds = [];

		/**
		 * @desc Message the status row is drawn on: the latest of #activeIds, null when there is none.
		 * @type {number|null}
		 */
		#captionPlace = null;

		/** @type {boolean} */
		#isPartial = false;

		/**
		 * @desc Whether the operation was adopted from a pull status instead of being started by a tap.
		 * An adopted operation is answered differently in two places: a refusal takes it down silently,
		 * and a local start over the same anchor joins it instead of being dropped as a second tap.
		 * @type {boolean}
		 */
		#isAdopted = false;

		/**
		 * @desc Status of the frame the set currently carries: preparing, a status of the server or off.
		 * A message joining the operation later is given this very frame, so that the set the user sees
		 * is one stage and not two.
		 * @type {string|null}
		 */
		#lastStatus = null;

		#watchdogTimer = null;
		#terminalFrameTimer = null;
		#stateResetTimer = null;

		/**
		 * @desc Set of the operation the indication has already left: its subfields are wiped a moment
		 * after the switch-off frame has been written.
		 * @type {Array<number>}
		 */
		#idsToReset = [];

		/**
		 * @desc Messages the last visibility event of the dialog reported on screen. Whether the caption
		 * place is among them decides how a refusal is announced: by the frame around the message, or -
		 * when the message is nowhere to be seen - by a toast.
		 * @type {Set<number>}
		 */
		#visibleMessageIds = new Set();

		/**
		 * @desc Whether the view of the dialog has been taken down. The delay of the state reset is owed
		 * to a redraw of the message and to nothing else, so with the dialog closed the wipe has nothing
		 * left to wait for - while a timer outliving the dialog would land on the operation the next
		 * dialog of the same chat starts over the same messages.
		 * @type {boolean}
		 */
		#isViewGone = false;

		/**
		 * @desc Measurement of one operation, from the first frame to the moment the indication is taken
		 * down. Lives exactly as long as the operation does: created in start(), closed in finish().
		 * @type {PerfPoint|null}
		 */
		#operationPoint = null;

		/**
		 * @param {{ dialogLocator: DialogLocator }} params
		 */
		constructor({ dialogLocator })
		{
			this.dialogLocator = dialogLocator;
			this.store = dialogLocator.get('store');
		}

		/**
		 * @desc Taken from the locator on demand and never cached: the manager is built while the locator
		 * of the dialog is still being filled, while the subscription below happens later, when the view
		 * is certainly in place.
		 * @return {DialogView}
		 */
		get view()
		{
			return this.dialogLocator.get('view');
		}

		/**
		 * @desc The operation needs to know whether its status row is on screen: an outcome the user
		 * cannot see has to be announced some other way.
		 * @return {void}
		 */
		subscribeViewEvents()
		{
			this.view.on(EventType.dialog.visibleMessagesChanged, this.#visibleMessagesChangedHandler);

			this.#isViewGone = false;
		}

		/**
		 * @return {void}
		 */
		unsubscribeViewEvents()
		{
			this.view.off(EventType.dialog.visibleMessagesChanged, this.#visibleMessagesChangedHandler);

			// Nothing of the dialog is on screen any more, and a set kept from the previous subscription
			// would claim a message is visible while the list has not reported anything yet.
			this.#visibleMessageIds.clear();

			this.#isViewGone = true;

			// A wipe of a previous operation is landed here instead of being left to its timer: with the
			// dialog closed there is no redraw left to wait for, and a timer of a closed dialog would
			// wipe the state of the operation the next one starts over the same messages.
			this.#resetIndicationState();
		}

		/**
		 * @desc Raises the first frame of the indication around every message of the operation that
		 * carries it; with no such message nothing is written, yet the operation runs as usual.
		 * One operation per dialog: a start while another one is running is dropped, so a second tap
		 * cannot leave the first set lit with nothing to take it down. The single exception is the
		 * operation this very request has already been adopted into: there the set is merged instead.
		 * @param {number} anchor max message id of the request; matches the server anchor
		 * @param {Array<number>} messageIds every message the task is built from
		 * @return {void}
		 */
		start(anchor, messageIds)
		{
			if (this.#activeAnchor !== null)
			{
				if (this.#isAdopted && this.isActive(anchor))
				{
					this.#mergeIntoAdoptedOperation(messageIds);

					return;
				}

				logger.log(`${this.constructor.name}.start skipped: an operation is already running`, {
					anchor,
					activeAnchor: this.#activeAnchor,
				});

				return;
			}

			const preparedAnchor = this.#prepareId(anchor);
			if (preparedAnchor === null)
			{
				logger.error(`${this.constructor.name}.start: anchor is not a message id`, anchor);

				return;
			}

			// The reset of the previous operation may still be pending: its set can overlap the new one,
			// and a timer left armed would wipe a frame it has not written.
			this.#resetIndicationState();

			this.#activeAnchor = preparedAnchor;
			this.#activeIds = this.#selectFramed(this.#prepareIds(messageIds, preparedAnchor));
			this.#captionPlace = this.#pickCaptionPlace(this.#activeIds);
			this.#isPartial = false;

			logger.log(`${this.constructor.name}.start`, {
				anchor: this.#activeAnchor,
				messageIds: this.#activeIds,
				captionPlace: this.#captionPlace,
			});

			this.#operationPoint = new PerfPoint('IM AI Task Indication', `anchor ${this.#activeAnchor}`).start();

			// The frame is written to every message of the set one dispatch at a time, so the cost of the
			// first frame grows with the size of the selection: itemsCount is what it has to be read with.
			this.#operationPoint.startPoint('First Frame');
			this.#writeFrame(AiTaskIndicationStatus.preparing);
			this.#operationPoint.endPoint('First Frame', { itemsCount: this.#activeIds.length });

			// Two waits of the user, both open here: until the operation says anything at all, and until
			// it says the last thing. Both are closed by the statuses arriving in applyStatus.
			this.#operationPoint.startPoint('First Status');
			this.#operationPoint.startPoint('Server Work');

			this.#armWatchdog();
		}

		/**
		 * @desc Applies an AI-task status of the operation to the whole set. With no operation running,
		 * a non-terminal status is adopted: the automatic task of a voice or a video note is announced
		 * by pull alone, and the first status of a manual request may arrive before the REST call that
		 * starts the operation locally has answered. A terminal status with nothing to end, and a status
		 * of another anchor while an operation is running, are dropped - but the event still belongs to
		 * this track and never goes anywhere else.
		 * @param {string} status one of AiTasksStatusType
		 * @param {number} anchor anchor of the event
		 * @param {boolean} [isPartial] whether the task was built out of a part of the set only
		 * @return {boolean} whether the status was applied to an operation or adopted as a new one
		 */
		applyStatus(status, anchor, isPartial = false)
		{
			if (this.#activeAnchor === null)
			{
				const preparedAnchor = this.#prepareId(anchor);
				if (preparedAnchor !== null && this.#isNonTerminalStatus(status))
				{
					this.#adopt(preparedAnchor, status, isPartial);

					return true;
				}

				// Nothing to end and nothing to raise: a terminal status alone tells the user of no
				// operation they could have seen, exactly as the panel track has always answered it.
				logger.log(`${this.constructor.name}.applyStatus skipped: no operation of this dialog`, {
					status,
					anchor,
				});

				return false;
			}

			if (!this.isActive(anchor))
			{
				logger.log(`${this.constructor.name}.applyStatus skipped: anchor mismatch`, {
					status,
					anchor,
					activeAnchor: this.#activeAnchor,
				});

				return false;
			}

			const isTerminal = this.#isTerminalStatus(status);
			if (!isTerminal && !this.#isNonTerminalStatus(status))
			{
				// A status the client does not know says nothing about the outcome, so it neither draws
				// a frame nor ends the operation: the watchdog stays the only way out.
				logger.log(`${this.constructor.name}.applyStatus skipped: unknown status`, status);

				return false;
			}

			logger.log(`${this.constructor.name}.applyStatus`, { status, isPartial });

			// A no-op after the first status: endPoint drops the key it has closed.
			this.#operationPoint?.endPoint('First Status', { status });

			if (status === AiTasksStatusType.notFound && this.#isAdopted)
			{
				// An adopted operation was never asked for by the user, so "no task in this message" is
				// its ordinary outcome and not a refusal of anything: the indication goes down at once,
				// without the frame of the refusal and without the toast that would announce it.
				this.#operationPoint?.endPoint('Server Work', { status });

				this.finish();

				return true;
			}

			this.#isPartial = isPartial === true;
			this.#writeFrame(status);

			if (isTerminal)
			{
				this.#operationPoint?.endPoint('Server Work', { status });

				this.#notifyRefusalOutOfSight(status);
				this.#armTerminalFrameTimer();

				return true;
			}

			this.#armWatchdog();

			return true;
		}

		/**
		 * @desc Whether the operation of this dialog is the one the given anchor belongs to.
		 * Lets pull events be routed to the new track and a repeated creation be refused while the
		 * indication is on screen.
		 * @param {number} anchor
		 * @return {boolean}
		 */
		isActive(anchor)
		{
			return this.#activeAnchor !== null && this.#prepareId(anchor) === this.#activeAnchor;
		}

		/**
		 * @desc Whether the message carries the frame of the running operation. Movement over any of them
		 * has to leave the indication alone: the frame lives in the very visualState an interruption
		 * overwrites, and for an interrupted status the frame builder returns null, so the glow of that
		 * message would go dark. A message without the frame has nothing to protect. Unlike isActive()
		 * this is not a correlation key: the anchor stays the only thing a pull event is matched by.
		 * @param {number|string} messageId
		 * @return {boolean}
		 */
		isMessageOfOperation(messageId)
		{
			if (this.#activeAnchor === null)
			{
				return false;
			}

			const preparedId = this.#prepareId(messageId);

			return preparedId !== null && this.#activeIds.includes(preparedId);
		}

		/**
		 * @desc Takes the indication down for the whole set: the task card has arrived, the terminal
		 * frame has been shown long enough, or the watchdog gave up.
		 * @return {void}
		 */
		finish()
		{
			if (this.#activeAnchor === null)
			{
				return;
			}

			logger.log(`${this.constructor.name}.finish`, {
				anchor: this.#activeAnchor,
				messageIds: this.#activeIds,
			});

			this.#cancelOperationTimers();

			// Order matters: the field carries no state subfield, so the frame with the animation off is
			// the only command that takes a running indication down. Wiping the subfields first would
			// leave the message without the field at all - the native side would get no command, and an
			// AI-task frame of the copilot would fall back to the generation glow instead of going dark.
			this.#writeFrame(AiTaskIndicationStatus.off);
			this.#armStateReset(this.#activeIds);

			this.#activeAnchor = null;
			this.#activeIds = [];
			this.#captionPlace = null;
			this.#isPartial = false;
			this.#isAdopted = false;
			this.#lastStatus = null;

			// Every exit of the operation goes through here - the card, the terminal frame timer, the
			// watchdog, the closed dialog - so this is the single place the measurement is closed at.
			// Sub-points still open (an operation the watchdog gave up on) are dropped with the multi.
			this.#operationPoint?.end();
			this.#operationPoint = null;
		}

		/**
		 * @desc Raises the first frame of the AI-task indication optimistically, when this build has the
		 * track: the manager is created in dialog.js by the capability flag, so the locator holding it is
		 * the whole condition. Asked for through the guard: on a build without the flag the manager is
		 * not there at all, and an unguarded call used to throw after the task had already been created -
		 * the user got an error toast and the dialog stayed in the selection mode. `anchor` is the max
		 * message id of the request, the key the pull events of the operation are correlated by.
		 * @param {DialogLocator} dialogLocator
		 * @param {{anchor: number, messageIds: Array<number>}} params
		 * @return {boolean} false when the build has no track to raise the frame on
		 */
		static startOnAvailableTrack(dialogLocator, { anchor, messageIds })
		{
			const indicationManager = dialogLocator?.get?.('ai-task-indication-manager');
			if (!indicationManager)
			{
				return false;
			}

			indicationManager.start(anchor, messageIds);

			return true;
		}

		/**
		 * @desc Whether an AI-task operation of the dialog is already running around the given message.
		 * Nothing but a literal true counts - the manager comes from the locator, so a build answering
		 * something else is not a running operation.
		 * @param {DialogLocator} dialogLocator
		 * @param {number} anchor
		 * @return {boolean}
		 */
		static isOperationRunning(dialogLocator, anchor)
		{
			return dialogLocator?.get?.('ai-task-indication-manager')?.isActive?.(anchor) === true;
		}

		/**
		 * @desc Takes over an operation nobody started here. The anchor of the event is the whole set
		 * until a local start() brings the rest of it in: pull names the anchor and nothing about the
		 * messages the task is built from. An anchor drawn as a sticker - the first status of a selection
		 * may outrun the answer of the REST call - carries no frame.
		 * @param {number} anchor
		 * @param {string} status
		 * @param {boolean} isPartial
		 * @return {void}
		 */
		#adopt(anchor, status, isPartial)
		{
			// The reset of the previous operation may still be pending: its set can overlap the new one,
			// and a timer left armed would wipe a frame it has not written.
			this.#resetIndicationState();

			this.#activeAnchor = anchor;
			this.#activeIds = this.#selectFramed([anchor]);
			this.#captionPlace = this.#pickCaptionPlace(this.#activeIds);
			this.#isPartial = isPartial === true;
			this.#isAdopted = true;

			logger.log(`${this.constructor.name}.adopt`, { anchor, status, isPartial: this.#isPartial });

			this.#operationPoint = new PerfPoint('IM AI Task Indication', `anchor ${anchor}`).start();

			this.#operationPoint.startPoint('First Frame');
			this.#writeFrame(status);
			this.#operationPoint.endPoint('First Frame', { itemsCount: this.#activeIds.length });

			// Only one of the two waits of a local start is open here: the status that raised the
			// operation is its first status, so there is nothing left to wait for.
			this.#operationPoint.startPoint('Server Work');

			this.#armWatchdog();
		}

		/**
		 * @desc Takes the set of a local request into the operation it has already been adopted into:
		 * the first status outran the answer of the REST call. The messages that join are given the
		 * frame the operation stands at rather than the first one - the anchor must not fall back to
		 * `preparing` out of a stage it has already left - and the operation stops being an adopted one:
		 * from here it is the request of the user, with the refusal announced as a refusal.
		 * @param {Array<number>} messageIds
		 * @return {void}
		 */
		#mergeIntoAdoptedOperation(messageIds)
		{
			const idsToJoin = this.#selectFramed(this.#prepareIds(messageIds, this.#activeAnchor))
				.filter((id) => !this.#activeIds.includes(id))
			;

			this.#activeIds = [...this.#activeIds, ...idsToJoin];
			// The request is merged over its own anchor, its max id: a caption place taken before the merge
			// stays the max, so no message already written to changes its role.
			this.#captionPlace = this.#pickCaptionPlace(this.#activeIds);
			this.#isAdopted = false;

			logger.log(`${this.constructor.name}.start merged into the adopted operation`, {
				anchor: this.#activeAnchor,
				messageIds: this.#activeIds,
				captionPlace: this.#captionPlace,
				status: this.#lastStatus,
			});

			this.#writeFrameTo(idsToJoin, this.#lastStatus);
		}

		/**
		 * @desc Writes one frame of the operation to every message of the set and remembers it: a
		 * message joining the operation later is given the very frame the set carries.
		 * @param {string} status
		 * @return {void}
		 */
		#writeFrame(status)
		{
			this.#lastStatus = status;

			this.#writeFrameTo(this.#activeIds, status);
		}

		/**
		 * @desc Writes one frame to the given messages of the operation. Only the caption place is given
		 * the anchor role: the status row of the operation is drawn once, while the rest of the set gets
		 * the same frame as the glow alone.
		 * @param {Array<number>} messageIds
		 * @param {string} status
		 * @return {void}
		 */
		#writeFrameTo(messageIds, status)
		{
			messageIds.forEach((id) => {
				const role = id === this.#captionPlace
					? AiTaskIndicationRole.anchor
					: AiTaskIndicationRole.member;

				this.store.dispatch('messagesModel/updateAiTaskIndication', {
					id,
					status,
					role,
					isPartial: this.#isPartial,
				});
			});
		}

		/**
		 * @desc A refusal leaves no other trace - no task card follows it - so with the status row off
		 * screen, or with no message to draw it on, the refusal would never be seen. On a visible caption
		 * place the frame is the whole answer and a toast on top of it would report one refusal twice.
		 * Only the refusal is announced this way: progress out of sight needs no toast, the outcome still
		 * arrives as a frame and a card.
		 * @param {string} status
		 * @return {void}
		 */
		#notifyRefusalOutOfSight(status)
		{
			if (status !== AiTasksStatusType.notFound || this.#isCaptionPlaceVisible())
			{
				return;
			}

			logger.log(`${this.constructor.name}.notifyRefusalOutOfSight`, {
				anchor: this.#activeAnchor,
				captionPlace: this.#captionPlace,
			});

			Notification.showToast(ToastType.aiTaskNotFound);
		}

		/**
		 * @desc Whether the status row of the operation is on screen right now. With the dialog left
		 * while the operation was running there is no visible message at all, so the outcome goes to
		 * the toast.
		 * @return {boolean}
		 */
		#isCaptionPlaceVisible()
		{
			return this.#captionPlace !== null && this.#visibleMessageIds.has(this.#captionPlace);
		}

		/**
		 * @param {Array<number>} messageIds
		 * @return {void}
		 */
		#armStateReset(messageIds)
		{
			// The timer carries one set at a time, so a reset still pending from a previous operation is
			// landed instead of being dropped: otherwise its role and partial flag outlive the operation.
			this.#resetIndicationState();

			this.#idsToReset = [...messageIds];

			// The delay buys the switch-off frame a redraw of its own. With the dialog closed there is
			// nothing left to draw it for, and the timer would fire after the dialog is gone: over the
			// operation of the next one, if it starts one over the same messages within the second.
			if (this.#isViewGone)
			{
				this.#resetIndicationState();

				return;
			}

			this.#stateResetTimer = setTimeout(() => {
				this.#resetIndicationState();
			}, AI_TASK_INDICATION_STATE_RESET_DELAY);
		}

		/**
		 * @desc Wipes the three visualState subfields of the set the indication has just left. Nothing
		 * of the operation may outlive it: a leftover role would keep the next redraw of the message on
		 * the indication track, and a leftover partial flag would mislabel the next outcome.
		 * @return {void}
		 */
		#resetIndicationState()
		{
			this.#cancelStateReset();

			if (this.#idsToReset.length === 0)
			{
				return;
			}

			const messageIds = this.#idsToReset;
			this.#idsToReset = [];

			logger.log(`${this.constructor.name}.resetIndicationState`, messageIds);

			messageIds.forEach((id) => {
				this.store.dispatch('messagesModel/updateAiTaskIndication', {
					id,
					status: null,
					role: null,
					isPartial: null,
				});
			});
		}

		#armWatchdog()
		{
			this.#cancelOperationTimers();

			this.#watchdogTimer = setTimeout(() => {
				this.#watchdogTimer = null;
				logger.log(`${this.constructor.name}.watchdog fired -> finish`);
				this.finish();
			}, AI_TASK_INDICATION_WATCHDOG_TIMEOUT);
		}

		#armTerminalFrameTimer()
		{
			this.#cancelOperationTimers();

			this.#terminalFrameTimer = setTimeout(() => {
				this.#terminalFrameTimer = null;
				logger.log(`${this.constructor.name}.terminalFrameTimer fired -> finish`);
				this.finish();
			}, AI_TASK_INDICATION_TERMINAL_FRAME_TIMEOUT);
		}

		#cancelOperationTimers()
		{
			if (this.#watchdogTimer)
			{
				clearTimeout(this.#watchdogTimer);
				this.#watchdogTimer = null;
			}

			if (this.#terminalFrameTimer)
			{
				clearTimeout(this.#terminalFrameTimer);
				this.#terminalFrameTimer = null;
			}
		}

		#cancelStateReset()
		{
			if (this.#stateResetTimer)
			{
				clearTimeout(this.#stateResetTimer);
				this.#stateResetTimer = null;
			}
		}

		/**
		 * @desc Statuses that keep the operation running: each of them re-arms the watchdog.
		 * @param {string} status
		 * @return {boolean}
		 */
		#isNonTerminalStatus(status)
		{
			return status === AiTasksStatusType.search
				|| status === AiTasksStatusType.taskCreationStarted
				|| status === AiTasksStatusType.resultCreationStarted;
		}

		/**
		 * @desc Statuses that end the operation: the frame is shown for a moment and taken down.
		 * @param {string} status
		 * @return {boolean}
		 */
		#isTerminalStatus(status)
		{
			return status === AiTasksStatusType.taskCreationCompleted
				|| status === AiTasksStatusType.resultCreationCompleted
				|| status === AiTasksStatusType.notFound;
		}

		/**
		 * @desc The anchor is part of the request by construction, even when the caller left it out of
		 * the list.
		 * @param {Array<number>} messageIds
		 * @param {number} anchor
		 * @return {Array<number>}
		 */
		#prepareIds(messageIds, anchor)
		{
			const preparedIds = Type.isArrayFilled(messageIds)
				? messageIds.map((id) => this.#prepareId(id)).filter((id) => id !== null)
				: [];

			return [...new Set([anchor, ...preparedIds])];
		}

		/**
		 * @desc Messages of the given ones that carry the frame. A message the converter cannot classify
		 * carries it, as does every message of a dialog without the converter.
		 * @param {Array<number>} messageIds
		 * @return {Array<number>}
		 */
		#selectFramed(messageIds)
		{
			const messageUiConverter = this.dialogLocator.get('message-ui-converter');

			return messageIds.filter((id) => {
				return !MESSAGE_TYPES_WITHOUT_FRAME.has(messageUiConverter?.getMessageTypeById(id));
			});
		}

		/**
		 * @param {Array<number>} framedIds
		 * @return {number|null}
		 */
		#pickCaptionPlace(framedIds)
		{
			return framedIds.length > 0 ? Math.max(...framedIds) : null;
		}

		/**
		 * @desc A message of an AI-task operation always exists on the server, so an id that is not a
		 * message id of the collection - a uuid of a message still being sent, for one - is dropped.
		 * @param {number|string} id
		 * @return {number|null}
		 */
		#prepareId(id)
		{
			const preparedId = Number(id);

			return Number.isInteger(preparedId) && preparedId > 0 ? preparedId : null;
		}

		// A message still being sent carries a uuid instead of an id and is dropped: no message of an
		// AI-task operation can be one of those, so it could never be the anchor either.
		#visibleMessagesChangedHandler = ({ messageList = [] }) => {
			this.#visibleMessageIds = new Set(
				messageList
					.map((message) => this.#prepareId(message.id))
					.filter((id) => id !== null),
			);
		};
	}

	module.exports = { AiTaskIndicationManager };
});
