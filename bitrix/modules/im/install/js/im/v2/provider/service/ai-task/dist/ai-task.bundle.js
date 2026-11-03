/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
(function (exports, im_v2_application_core, im_v2_const, im_v2_lib_logger, im_v2_lib_messageComponent, im_v2_lib_notifier, im_v2_lib_rest) {
	'use strict';

	// Mirror of `WATCHDOG_TIMEOUT` of the pull handler (`im.v2.provider.pull`, `base/handlers/ai`): the
	// window an operation gets between two statuses is the same one a start gets before its first.
	const WATCHDOG_TIMEOUT = 90_000;

	// The outcomes an operation ends on. Its frame outlives it by seconds - the terminal caption is taken
	// down on a timer of the pull handler - but nothing is being created any more, and the backend frees
	// the slot of a finished operation, so its sources are free here as well.
	const TERMINAL_STATUSES = new Set([im_v2_const.AiTaskStatus.taskCreationCompleted, im_v2_const.AiTaskStatus.resultCreationCompleted, im_v2_const.AiTaskStatus.notFound]);

	// Drawn without a bubble, so a rim around them would outline empty space.
	const COMPONENTS_WITHOUT_INDICATION = new Set([im_v2_const.MessageComponent.sticker, im_v2_const.MessageComponent.smile]);

	// The sources of the starts that have gone to the server and have not been answered yet, by chat.
	// Shared by every instance on purpose: both entry points build the service anew on each click
	// (`im.v2.lib.menu`, `message/classes/message-base`; `im.v2.component.content.elements`,
	// `chat/base-content/components/bulk-actions-panel`), so an instance does not outlive the start it
	// made. Until the answer arrives the store holds no operation either, which leaves two starts of one
	// round trip reading it as empty - the very window the refusal below is meant to close. The pull
	// handler keeps its timer registries at module level for the same reason.
	const sourcesInFlight = new Map();
	function holdSources(chatId, messageIds) {
		const held = sourcesInFlight.get(chatId) ?? new Set();
		messageIds.forEach(messageId => held.add(messageId));
		sourcesInFlight.set(chatId, held);
	}
	function releaseSources(chatId, messageIds) {
		const held = sourcesInFlight.get(chatId);
		if (!held) {
			return;
		}
		messageIds.forEach(messageId => held.delete(messageId));
		if (held.size === 0) {
			sourcesInFlight.delete(chatId);
		}
	}
	class AiTaskService {
		/**
		 * Resolves to whether the start has gone through, so that a caller undoing what the user did to
		 * make it - the multiselect panel closes the selection of up to twenty messages - can leave that
		 * alone on a refusal. A refused start is reported to the user here either way.
		 */
		createForMessage(messageId, context) {
			return this.createForMessages([messageId], {
				chatId: context.chatId,
				anchorMessageId: messageId
			});
		}
		createForMessages(messageIds, context) {
			const {
				chatId,
				anchorMessageId
			} = context;
			const busySources = this.#busySources(chatId, messageIds);
			if (busySources.length > 0) {
				// The count of the busy sources, not of the request: the phrase names the messages a task
				// is already being created for, and only those of the request are among them.
				im_v2_lib_notifier.Notifier.message.onAiTaskCreateRefusal({
					code: im_v2_const.ErrorCode.aiTask.creationInProgress,
					messageCount: busySources.length
				});
				return Promise.resolve(false);
			}
			holdSources(chatId, messageIds);
			return im_v2_lib_rest.runAction(im_v2_const.RestMethod.imV2ChatTaskCreateByAi, {
				data: {
					ids: messageIds
				}
			}).then(() => {
				// The requested composition is fixed at start and does not follow sources the server
				// excludes later (EVENT-02); the indication is drawn on the part of it that can carry one.
				void im_v2_application_core.Core.getStore().dispatch('aiTask/start', {
					chatId,
					anchorMessageId,
					messageIds,
					indicatedMessageIds: this.#indicatedSources(messageIds)
				});
				this.#armStartWatchdog(chatId, anchorMessageId);
				return true;
			}).catch(([error]) => {
				im_v2_lib_logger.Logger.error('AiTaskService: create task error', error);
				// The refusal is told apart by its code, and the size of the requested composition
				// decides between the singular and the plural wording of the reason.
				im_v2_lib_notifier.Notifier.message.onAiTaskCreateRefusal({
					code: error?.code,
					messageCount: messageIds.length
				});
				return false;
			}).finally(() => {
				// On both branches, and only once the operation is in the store: a start that never
				// answers would otherwise hold its sources for the rest of the session, and one released
				// before `aiTask/start` would leave a gap where the chat has neither.
				releaseSources(chatId, messageIds);
			});
		}

		/**
		 * The sources of this request a task is already being created for - by the operation the chat
		 * draws, or by a start of this client that is still on its way to the server.
		 *
		 * The model keeps ONE operation per chat, so a second start buries the running one: its
		 * composition and anchor are replaced, and its events stop reaching the user. When the second
		 * start is made from the newest message of the running selection - the anchor of a multiselect
		 * is `Math.max` of it - both operations even share the anchor, and then the terminal of the
		 * first is drawn on the source of the second while the outcome of the second is lost entirely.
		 *
		 * So a start over a source that is already being worked on is refused here, with the very code
		 * the backend refuses a busy deduplication slot with. The refusal is by composition and not by
		 * chat: another set of messages of the same chat is a legitimate second operation, and the
		 * backend runs it - as it runs the automatic ones of voice messages and video notes.
		 */
		#busySources(chatId, messageIds) {
			const inFlight = sourcesInFlight.get(chatId) ?? new Set();
			const running = this.#runningComposition(chatId);
			return messageIds.filter(messageId => inFlight.has(messageId) || running.includes(messageId));
		}

		/**
		 * The composition an operation of the chat is working on, empty for a chat working on none. An
		 * operation that has reached its outcome is over even though its frame is still up: the terminal
		 * caption is read for seconds after the fact, and refusing a start during those seconds would
		 * name a task that has already been created - or decided against - as one still being created.
		 */
		#runningComposition(chatId) {
			const operation = im_v2_application_core.Core.getStore().getters['aiTask/getForChat'](chatId);
			if (!operation || TERMINAL_STATUSES.has(operation.status)) {
				return [];
			}
			return operation.messageIds;
		}

		/**
		 * The sources the indication can be drawn on, told apart by the component the message list
		 * renders them with. A message the store does not hold is not rendered either, so it stays.
		 */
		#indicatedSources(messageIds) {
			const store = im_v2_application_core.Core.getStore();
			return messageIds.filter(messageId => {
				const message = store.getters['messages/getById'](messageId);
				if (!message) {
					return true;
				}
				return !COMPONENTS_WITHOUT_INDICATION.has(new im_v2_lib_messageComponent.MessageComponentManager(message).getName());
			});
		}

		/**
		 * The success of the method promises the indication, not a single pull event: three branches of the
		 * backend answer it with a plain success and send nothing at all (a chat where an auto-task is
		 * denied - an open line, a support chat, a network dialog), and an event whose anchor the server
		 * recounted lands on no tracked operation. Neither case reaches the watchdog of the pull handler,
		 * which is armed by an incoming status, so the raised frame would stay on the source messages until
		 * the page is reloaded - on the whole selection of up to twenty of them.
		 *
		 * So the start guards itself, and steps aside as soon as the operation is heard from through the
		 * pull handler: a status delivered there means its watchdog owns the lifetime from that moment
		 * (every status re-arms it), and an operation that has left the store or been replaced by a later
		 * one in the same chat is none of this timer's business.
		 */
		#armStartWatchdog(chatId, anchorMessageId) {
			// The status an operation starts with is normally none, but the first status of an operation
			// can overtake the answer that raises it, and `aiTask/start` applies the one that did. Such a
			// status armed no watchdog in the pull handler - there was no operation for it to belong to
			// yet - so the guard waits for the NEXT status of the operation, not for any status at all.
			const operationAtStart = im_v2_application_core.Core.getStore().getters['aiTask/getForChat'](chatId);
			const statusAtStart = operationAtStart?.status ?? null;
			setTimeout(() => {
				const store = im_v2_application_core.Core.getStore();
				const operation = store.getters['aiTask/getForChat'](chatId);
				if (!operation || operation.anchorMessageId !== anchorMessageId || operation.status !== statusAtStart) {
					return;
				}
				void store.dispatch('aiTask/clear', {
					chatId
				});
			}, WATCHDOG_TIMEOUT);
		}
	}

	exports.AiTaskService = AiTaskService;

})(this.BX.Messenger.v2.Service = this.BX.Messenger.v2.Service || {}, BX.Messenger.v2.Application, BX.Messenger.v2.Const, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib);
//# sourceMappingURL=ai-task.bundle.js.map
