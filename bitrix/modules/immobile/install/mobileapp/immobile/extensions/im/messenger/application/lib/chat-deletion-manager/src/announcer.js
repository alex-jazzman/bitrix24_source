/**
 * @module im/messenger/application/lib/chat-deletion-manager/src/announcer
 */
jn.define('im/messenger/application/lib/chat-deletion-manager/src/announcer', (require, exports, module) => {
	const { EventType } = require('im/messenger/const');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { MessengerEmitter } = require('im/messenger/lib/emitter');
	const { getLoggerWithContext } = require('im/messenger/lib/logger');
	const { resolveChatId } = require('im/messenger/application/lib/chat-deletion-manager/src/snapshot');
	const {
		ChatDeletionOrigin,
		ChatDeletionReason,
	} = require('im/messenger/application/lib/chat-deletion-manager/src/const');

	const logger = getLoggerWithContext('chat-deletion-manager', 'ChatDeletionAnnouncer');

	/**
	 * @class ChatDeletionAnnouncer
	 *
	 * Announces that a chat is gone: emits the chat.deleted domain fact and broadcasts
	 * the dialog.external.delete close signal to the chat and each of its open children.
	 * Every screen of the gone subtree (chat dialogs and the nested-navigation widget)
	 * self-closes on that signal — now if visible, otherwise on next show — so foreign
	 * screens above or interleaved are never disturbed.
	 */
	class ChatDeletionAnnouncer
	{
		/**
		 * @param {ChatDeletionAnnounceParams} params
		 */
		announce(params)
		{
			const { dialogId } = params;
			const chatId = params.chatId ?? resolveChatId({ dialogId });
			const parentChatId = params.parentChatId ?? 0;
			const chatType = params.chatType ?? null;
			const origin = params.origin ?? ChatDeletionOrigin.pull;
			const reason = params.reason ?? ChatDeletionReason.delete;

			const store = serviceLocator.get('core').getStore();
			// Open children of the gone chat (a project). Each self-closes on its own
			// external.delete when it surfaces, so interleaved foreign screens stay.
			const children = this.#resolveOpenChildren(store, chatId);

			logger.log('announce', { dialogId, chatId, parentChatId, children });

			// Domain fact for any non-navigation consumer (analytics, cache cleanup, ...).
			MessengerEmitter.emit(EventType.chat.deleted, {
				dialogId,
				chatId,
				parentChatId,
				chatType,
				children,
				origin,
				reason,
			});

			// Close signal for every screen of the gone subtree (the chat itself and each
			// open child). A screen self-closes on dialog.external.delete — now if it is
			// visible, otherwise on its next show; the nested-navigation widget reacts the
			// same way. Foreign screens above or interleaved are never touched.
			for (const childDialogId of children)
			{
				const childDialog = store.getters['dialoguesModel/getById'](childDialogId);
				MessengerEmitter.broadcast(EventType.dialog.external.delete, {
					dialogId: childDialogId,
					chatType: childDialog?.type ?? null,
					shouldShowAlert: false,
					shouldSendDeleteAnalytics: false,
				});
			}

			MessengerEmitter.broadcast(EventType.dialog.external.delete, {
				dialogId,
				chatType,
				parentChatId,
				shouldShowAlert: params.shouldShowAlert ?? true,
				shouldSendDeleteAnalytics: params.shouldSendDeleteAnalytics ?? true,
				deleteByCurrentUserFromMobile: params.deleteByCurrentUserFromMobile ?? false,
			});
		}

		/**
		 * @param {object} store
		 * @param {?number} chatId
		 * @return {DialogId[]}
		 */
		#resolveOpenChildren(store, chatId)
		{
			if (!chatId)
			{
				return [];
			}

			const openDialogs = store.getters['applicationModel/getOpenDialogs']();

			return openDialogs.filter((openDialogId) => {
				const openDialog = store.getters['dialoguesModel/getById'](openDialogId);

				return openDialog?.parentChatId === chatId;
			});
		}
	}

	module.exports = { ChatDeletionAnnouncer };
});
