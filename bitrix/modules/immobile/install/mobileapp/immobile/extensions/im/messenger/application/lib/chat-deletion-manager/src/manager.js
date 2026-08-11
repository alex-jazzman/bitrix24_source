/**
 * @module im/messenger/application/lib/chat-deletion-manager/src/manager
 */
jn.define('im/messenger/application/lib/chat-deletion-manager/src/manager', (require, exports, module) => {
	const { Type } = require('type');
	const { UserRole } = require('im/messenger/const');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { DialogHelper } = require('im/messenger/lib/helper');
	const { ChatDataProvider, RecentDataProvider } = require('im/messenger/provider/data');
	const { getLoggerWithContext } = require('im/messenger/lib/logger');
	const {
		ChatDeletionOrigin,
		ChatDeletionReason,
	} = require('im/messenger/application/lib/chat-deletion-manager/src/const');
	const {
		ChatDeletionSnapshot,
		resolveChatId,
	} = require('im/messenger/application/lib/chat-deletion-manager/src/snapshot');
	const { ChatDeletionAnnouncer } = require('im/messenger/application/lib/chat-deletion-manager/src/announcer');

	const ROOT_PARENT_CHAT_ID = 0;
	const logger = getLoggerWithContext('chat-deletion-manager', 'ChatDeletionManager');

	/**
	 * @class ChatDeletionManager
	 *
	 * Single owner of chat removal: delete()/leave()/hide()/closeOnSync() remove the
	 * data the way each case needs and announce the EventType.chat.deleted domain fact.
	 * Widget/navigation closing reacts to that event elsewhere — never here.
	 *
	 * Operations on the same chatId run on a per-chat serial queue and are idempotent by
	 * state, so a local action and its echo pull event can run in any order without
	 * doing the work twice.
	 */
	class ChatDeletionManager
	{
		/** @type {Map<number, Promise>} chatId -> tail of the per-chat serial queue */
		#queues = new Map();
		#snapshot = new ChatDeletionSnapshot();
		#announcer = new ChatDeletionAnnouncer();

		get #store()
		{
			return serviceLocator.get('core').getStore();
		}

		get #recentRepository()
		{
			return serviceLocator.get('core').getRepository().recent;
		}

		/**
		 * Full removal of a chat (recent + chat data) followed by the nested-aware close.
		 * The toast/analytics policy depends on origin: local stays silent in the event
		 * (the action UI shows its own toast), pull drives the screen toast and analytics.
		 *
		 * @param {ChatDeletionParams} params
		 * @return {Promise<void>}
		 */
		delete({ dialogId = null, chatId = null, origin = ChatDeletionOrigin.pull, reason = ChatDeletionReason.delete } = {})
		{
			const resolvedChatId = chatId ?? resolveChatId({ dialogId });

			return this.#runQueued(resolvedChatId, () => this.#runDelete({
				dialogId,
				chatId: resolvedChatId,
				origin,
				reason,
			}));
		}

		/**
		 * The current user leaving a chat. Data semantics are type-specific:
		 * - regular chat -> delete chat data;
		 * - channel -> openChannel becomes guest (kept in the model for the "Channels"
		 *   section), only the local DB record is dropped; an open comment chat is deleted.
		 * Then the nested-aware UI close is announced.
		 *
		 * @param {{ dialogId: DialogId, chatId?: number }} params
		 * @return {Promise<void>}
		 */
		leave({ dialogId, chatId = null } = {})
		{
			const resolvedChatId = chatId ?? resolveChatId({ dialogId });

			return this.#runQueued(resolvedChatId, () => this.#runLeave({ dialogId, chatId: resolvedChatId }));
		}

		/**
		 * Hide removes a chat from recent sections; it does NOT delete the chat data.
		 * Fully removes it from recent + announces the close only once it is gone from
		 * every section (checked across ROOT and the chat's own parentChatId).
		 *
		 * @param {{ dialogId: DialogId, sections: string[], parentChatId?: ?number }} params
		 * @return {Promise<void>}
		 */
		hide({ dialogId, sections, parentChatId = null } = {})
		{
			const chatId = resolveChatId({ dialogId });

			return this.#runQueued(chatId, () => this.#runHide({ dialogId, sections, parentChatId }));
		}

		/**
		 * Announce-only close for the sync path: the data is already removed by sync's
		 * source-specific deleteFromSource, so this only announces the nested-aware UI
		 * close. Guarded to an open dialog (matches the original closeDeletedChat guard).
		 *
		 * @param {{ dialogId: DialogId, chatType?: string, parentChatId?: number, shouldShowAlert?: boolean, shouldSendDeleteAnalytics?: boolean }} params
		 * @return {Promise<void>}
		 */
		closeOnSync({ dialogId, chatType = null, parentChatId = 0, shouldShowAlert = true, shouldSendDeleteAnalytics = true } = {})
		{
			const chatId = resolveChatId({ dialogId });

			return this.#runQueued(chatId, () => this.#runSyncClose({
				dialogId,
				chatId,
				chatType,
				parentChatId,
				shouldShowAlert,
				shouldSendDeleteAnalytics,
			}));
		}

		/**
		 * Escape hatch: announce a chat is gone without removing data or queueing, for a
		 * caller that handles removal itself (recent full-delete with its own rollback).
		 * Prefer delete()/leave()/hide().
		 *
		 * @param {ChatDeletionAnnounceParams} params
		 */
		announceDeleted(params)
		{
			this.#announcer.announce(params);
		}

		/**
		 * Runs a task on the per-chat serial queue. A second op for the same chatId waits
		 * for the in-flight one (closing the local vs pull TOCTOU race) and then runs and
		 * early-exits by state. The previous tail never rejects, so a failing op does not
		 * stall the chat's queue.
		 *
		 * @param {?number} chatId
		 * @param {function(): Promise<void>} task
		 * @return {Promise<void>}
		 */
		#runQueued(chatId, task)
		{
			if (Type.isNil(chatId))
			{
				logger.error('runQueued: cannot resolve chatId, skip');

				return Promise.resolve();
			}

			const previous = this.#queues.get(chatId) ?? Promise.resolve();
			const tail = previous
				.then(() => task())
				.catch((error) => {
					logger.error('runQueued: task error', error, chatId);
				})
				.finally(() => {
					if (this.#queues.get(chatId) === tail)
					{
						this.#queues.delete(chatId);
					}
				})
			;

			this.#queues.set(chatId, tail);

			return tail;
		}

		/**
		 * @param {{ dialogId: ?DialogId, chatId: number, origin: string, reason: string }} params
		 * @return {Promise<void>}
		 */
		async #runDelete({ dialogId, chatId, origin, reason })
		{
			const chatDataResult = await this.#getChatData({ dialogId, chatId });

			// State-based idempotency: data already gone -> the removal already happened.
			if (!chatDataResult.hasData())
			{
				return;
			}

			const chatData = chatDataResult.getData();
			const resolvedDialogId = dialogId ?? chatData.dialogId;

			// Snapshot strictly BEFORE removal so children/parentChatId survive for the announce.
			const fact = this.#snapshot.capture({
				dialogId: resolvedDialogId,
				chatId,
				chatData,
				origin,
				reason,
			});

			await this.#removeFullData(resolvedDialogId);

			await this.#announcer.announce({ ...fact, ...this.#deleteAlertPolicy(origin, reason) });
		}

		/**
		 * @param {{ dialogId: DialogId, chatId: number }} params
		 * @return {Promise<void>}
		 */
		async #runLeave({ dialogId })
		{
			const chatProvider = new ChatDataProvider();
			const chatDataResult = await chatProvider.get({ dialogId });
			if (!chatDataResult.hasData())
			{
				logger.info('runLeave: no chatData', dialogId);

				return;
			}

			const chatData = chatDataResult.getData();
			const chatHelper = DialogHelper.createByModel(chatData);
			if (chatHelper?.isChannel)
			{
				await this.#leaveFromChannel({ chatProvider, chatHelper, chatData });
			}
			else
			{
				await this.#leaveFromChat({ chatProvider, chatData });
			}
		}

		async #leaveFromChannel({ chatProvider, chatHelper, chatData })
		{
			const store = this.#store;

			if (chatHelper?.isOpenChannel)
			{
				await store.dispatch('dialoguesModel/update', {
					dialogId: chatHelper.dialogId,
					fields: {
						role: UserRole.guest,
					},
				});
			}

			void store.dispatch('commentModel/deleteChannelCounters', {
				channelId: chatHelper.chatId,
			});

			const commentChatData = store.getters['dialoguesModel/getByParentChatId'](chatHelper.chatId);
			if (
				Type.isPlainObject(commentChatData)
				&& store.getters['applicationModel/isDialogOpen'](commentChatData.dialogId)
			)
			{
				await chatProvider.delete({ dialogId: commentChatData.dialogId });
				await this.#announcer.announce({
					dialogId: commentChatData.dialogId,
					chatId: commentChatData.chatId,
					parentChatId: commentChatData.parentChatId,
					chatType: commentChatData.type,
					origin: ChatDeletionOrigin.pull,
					reason: ChatDeletionReason.leave,
					shouldShowAlert: false,
					shouldSendDeleteAnalytics: false,
				});
			}

			// openChannel intentionally stays in the model as guest and is only dropped
			// from the local DB — it must remain present in the "Channels" section.
			await chatProvider.deleteFromSource(ChatDataProvider.source.database, {
				dialogId: chatHelper.dialogId,
			});

			await this.#announcer.announce({
				dialogId: chatHelper.dialogId,
				chatId: chatData.chatId,
				parentChatId: chatData.parentChatId,
				chatType: chatData.type,
				origin: ChatDeletionOrigin.pull,
				reason: ChatDeletionReason.leave,
				shouldShowAlert: true,
				shouldSendDeleteAnalytics: false,
			});
		}

		async #leaveFromChat({ chatProvider, chatData })
		{
			try
			{
				await chatProvider.delete({ dialogId: chatData.dialogId });
			}
			catch (error)
			{
				logger.error('leaveFromChat chatProvider.delete catch:', error);
			}

			await this.#announcer.announce({
				dialogId: chatData.dialogId,
				chatId: chatData.chatId,
				parentChatId: chatData.parentChatId,
				chatType: chatData.type,
				origin: ChatDeletionOrigin.pull,
				reason: ChatDeletionReason.leave,
				shouldShowAlert: true,
				shouldSendDeleteAnalytics: false,
			});
		}

		/**
		 * @param {{ dialogId: DialogId, sections: string[], parentChatId: ?number }} params
		 * @return {Promise<void>}
		 */
		async #runHide({ dialogId, sections, parentChatId })
		{
			const targetParentChatId = this.#resolveHideParentChatId(dialogId, parentChatId);
			const parentChatIdsToCheck = [...new Set([ROOT_PARENT_CHAT_ID, targetParentChatId])];

			await this.#hideRecentSections(dialogId, sections, targetParentChatId);

			// If the chat still remains in at least one recent section, this is a partial
			// hide — do NOT fully remove it and do NOT close its screen.
			if (this.#remainingRecentSections(dialogId, parentChatIdsToCheck).length > 0)
			{
				return;
			}

			// Gone from every section -> full removal from recent + nested-aware close.
			// Hide does not delete the chat data itself, so we only announce the UI close.
			await this.#removeRecentItem(dialogId);
			await this.#announcer.announce({
				dialogId,
				reason: ChatDeletionReason.hide,
				shouldShowAlert: false,
				shouldSendDeleteAnalytics: false,
			});
		}

		/**
		 * @param {{ dialogId: DialogId, chatId: number, chatType: ?string, parentChatId: number, shouldShowAlert: boolean, shouldSendDeleteAnalytics: boolean }} params
		 * @return {Promise<void>}
		 */
		async #runSyncClose({ dialogId, chatId, chatType, parentChatId, shouldShowAlert, shouldSendDeleteAnalytics })
		{
			if (!this.#store.getters['applicationModel/isDialogOpen'](dialogId))
			{
				return;
			}

			await this.#announcer.announce({
				dialogId,
				chatId,
				parentChatId,
				chatType,
				origin: ChatDeletionOrigin.pull,
				reason: ChatDeletionReason.delete,
				shouldShowAlert,
				shouldSendDeleteAnalytics,
			});
		}

		/**
		 * @param {{ dialogId?: DialogId, chatId?: number }} params
		 * @return {Promise<DataProviderResult>}
		 */
		#getChatData({ dialogId, chatId })
		{
			const provider = new ChatDataProvider();

			return Type.isNil(dialogId)
				? provider.get({ chatId })
				: provider.get({ dialogId });
		}

		/**
		 * Deletes recent first (it resolves the chat by chatId via ChatDataProvider),
		 * then the chat itself. Order matters — keep recent before chat.
		 *
		 * @param {DialogId} dialogId
		 * @return {Promise<void>}
		 */
		async #removeFullData(dialogId)
		{
			try
			{
				await new RecentDataProvider().delete({ dialogId });
				await new ChatDataProvider().delete({ dialogId });
			}
			catch (error)
			{
				logger.error('removeFullData error', error, dialogId);
			}

			serviceLocator.get('tab-counters')?.update();
		}

		/**
		 * @param {DialogId} dialogId
		 * @param {string[]} sections
		 * @param {number} parentChatId
		 * @return {Promise<void>}
		 */
		async #hideRecentSections(dialogId, sections, parentChatId)
		{
			await this.#recentRepository.removeSections(dialogId, sections);
			this.#store.dispatch('recentModel/hideByRecentConfigTabs', {
				id: dialogId,
				fromSections: sections,
				parentChatId,
			});
		}

		/**
		 * @param {DialogId} dialogId
		 * @param {number[]} parentChatIds
		 * @return {Array<{ parentChatId: number, recentSection: string }>}
		 */
		#remainingRecentSections(dialogId, parentChatIds)
		{
			return this.#store.getters['recentModel/getSectionsContainingItem'](dialogId, parentChatIds);
		}

		/**
		 * @param {DialogId} dialogId
		 * @return {Promise<void>}
		 */
		async #removeRecentItem(dialogId)
		{
			await this.#store.dispatch('recentModel/delete', { id: dialogId });
		}

		/**
		 * The hide pull event does not carry parentChatId yet (backend will add it).
		 * Until then we derive it from the dialog model — the chat's parentChatId is
		 * intrinsic and equals what the event will eventually send. Once the field
		 * arrives it takes precedence automatically.
		 *
		 * @param {DialogId} dialogId
		 * @param {?number} parentChatId
		 * @return {number}
		 */
		#resolveHideParentChatId(dialogId, parentChatId)
		{
			if (!Type.isNil(parentChatId))
			{
				return parentChatId;
			}

			const derived = this.#store.getters['dialoguesModel/getById'](dialogId)?.parentChatId
				?? ROOT_PARENT_CHAT_ID;

			logger.info('hide: parentChatId is absent in the event, derived from dialog model:', {
				dialogId,
				parentChatId: derived,
			});

			return derived;
		}

		/**
		 * @param {string} origin
		 * @param {string} reason
		 * @return {{ shouldShowAlert: boolean, shouldSendDeleteAnalytics: boolean, deleteByCurrentUserFromMobile: boolean }}
		 */
		#deleteAlertPolicy(origin, reason)
		{
			const isLocal = origin === ChatDeletionOrigin.local;

			return {
				shouldShowAlert: !isLocal,
				shouldSendDeleteAnalytics: !isLocal && reason === ChatDeletionReason.delete,
				deleteByCurrentUserFromMobile: isLocal,
			};
		}
	}

	module.exports = {
		ChatDeletionManager,
		ChatDeletionOrigin,
		ChatDeletionReason,
	};
});
