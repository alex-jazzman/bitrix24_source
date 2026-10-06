/**
 * @module im/messenger/provider/pull/recent
 */
jn.define('im/messenger/provider/pull/recent', (require, exports, module) => {
	/* global ChatMessengerCommon */
	const { Type } = require('type');
	const { clone } = require('utils/object');
	const { ShareDialogCache } = require('im/messenger/cache/share-dialog');
	const { MessengerParams } = require('im/messenger/lib/params');
	const { MessageStatus } = require('im/messenger/const');
	const { DialogHelper } = require('im/messenger/lib/helper');
	const { getLoggerWithContext } = require('im/messenger/lib/logger');
	const { RecentDataProvider } = require('im/messenger/provider/data');
	const { ChatRecentUpdateManager } = require('im/messenger/provider/pull/lib/recent/chat/update-manager');
	const { Feature } = require('im/messenger/lib/feature');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');

	const { BasePullHandler } = require('im/messenger/provider/pull/base');
	const { NewMessageManager } = require('im/messenger/provider/pull/lib/new-message-manager');

	/**
	 * @class RecentPullHandler
	 */
	class RecentPullHandler extends BasePullHandler
	{
		constructor()
		{
			super({ logger: getLoggerWithContext('pull-handler--recent-v2', RecentPullHandler) });

			this.shareDialogCache = new ShareDialogCache();
		}

		/**
		 * @return {RecentRepository}
		 */
		get recentRepository()
		{
			return serviceLocator.get('core').getRepository().recent;
		}

		/**
		 * @param {MessageAddParams} params
		 * @param {PullExtraParams} extra
		 */
		async handleMessage(params, extra)
		{
			await this.#messageAdd(params, extra);
		}

		/**
		 * @param {MessageAddParams} params
		 * @param {PullExtraParams} extra
		 */
		async handleMessageChat(params, extra)
		{
			await this.#messageAdd(params, extra);
		}

		/**
		 * @param {MessagePullHandlerUpdateParams} params
		 * @param {PullExtraParams} extra
		 */
		async handleMessageUpdate(params, extra)
		{
			if (this.interceptEvent(extra))
			{
				return;
			}

			this.logger.info('handleMessageUpdate:', params);

			await this.#updateRecentMessage(params);
		}

		/**
		 * @param {MessagePullHandlerMessageDeleteV2Params} params
		 * @param {PullExtraParams} extra
		 */
		async handleMessageDeleteV2(params, extra)
		{
			if (this.interceptEvent(extra))
			{
				return;
			}
			this.logger.info('handleMessageDeleteV2:', params, extra);

			this.recentRepository.setSections(params.dialogId, params.recentConfig?.sections)
				.catch((error) => this.logger.error('handleMessageDeleteV2: setSections error', error));

			const hasNewLastMessage = Boolean(params.newLastMessage);
			if (hasNewLastMessage)
			{
				await this.#updateRecentByNewLastMessage(params.newLastMessage, params.dialogId);

				return;
			}

			await this.#updateRecentByUpdatedMessages(params.messages, params.dialogId);
		}

		/**
		 * @param {ChatUnreadPullHandlerParams} params
		 * @param {PullExtraParams} extra
		 */
		async handleChatUnread(params, extra)
		{
			if (this.interceptEvent(extra))
			{
				return;
			}
			this.logger.info('handleChatUnread:', params, extra);

			await this.store.dispatch('recentModel/update', [
				{
					id: params.dialogId,
					unread: params.active,
				},
			]);

			const markedId = params.active ? Number(params.markedId ?? 0) : 0;
			await this.store.dispatch('dialoguesModel/update', {
				dialogId: params.dialogId,
				fields: { markedId },
			});

			await this.recentRepository.setSections(params.dialogId, params.recentConfig?.sections);
		}

		/**
		 * @param {object} params
		 * @param {PullExtraParams} extra
		 */
		async handleReadMessage(params, extra)
		{
			if (this.interceptEvent(extra))
			{
				return;
			}

			await this.recentRepository.setSections(params.dialogId, params.recentConfig?.sections);
		}

		/**
		 * @param {object} params
		 * @param {PullExtraParams} extra
		 */
		async handleReadMessageChat(params, extra)
		{
			if (this.interceptEvent(extra))
			{
				return;
			}

			await this.recentRepository.setSections(params.dialogId, params.recentConfig?.sections);
		}

		/**
		 * @param {object} params
		 * @param {PullExtraParams} extra
		 */
		async handleUnreadMessage(params, extra)
		{
			if (this.interceptEvent(extra))
			{
				return;
			}

			await this.recentRepository.setSections(params.dialogId, params.recentConfig?.sections);
		}

		/**
		 * @param {object} params
		 * @param {PullExtraParams} extra
		 */
		async handleUnreadMessageChat(params, extra)
		{
			if (this.interceptEvent(extra))
			{
				return;
			}

			await this.recentRepository.setSections(params.dialogId, params.recentConfig?.sections);
		}

		/**
		 * @param {object} params
		 * @param {PullExtraParams} extra
		 */
		async handleChatMuteNotify(params, extra)
		{
			if (this.interceptEvent(extra))
			{
				return;
			}

			await this.recentRepository.setSections(params.dialogId, params.recentConfig?.sections);
		}

		/**
		 * @param {object} params
		 * @param {PullExtraParams} extra
		 */
		async handleChatPin(params, extra)
		{
			if (this.interceptEvent(extra))
			{
				return;
			}
			this.logger.info('handleChatPin:', params, extra);

			// Per-folder pin (folderId is a number) is owned by folder navigation,
			// not the global recent model — skip it here.
			if (Type.isNumber(params.folderId))
			{
				return;
			}

			// folderId === null/undefined → global (legacy) pin, fall through.
			await this.store.dispatch('recentModel/update', [
				{
					id: params.dialogId,
					pinned: params.active,
				},
			]);
		}

		/**
		 * @param {object} params
		 * @param {PullExtraParams} extra
		 */
		async handleChatHide(params, extra)
		{
			if (this.interceptEvent(extra))
			{
				return;
			}
			this.logger.info('handleChatHide:', params, extra);

			if (!Feature.isOpenlinesInMessengerAvailable && params.lines)
			{
				return;
			}

			// Section-aware hide: removes the chat from the hidden sections, fully removes
			// it from recent + announces the close only if it is gone from every section
			// (checked across ROOT and the chat's own parentChatId). Data is not touched.
			await serviceLocator.get('chat-deletion-manager').hide({
				dialogId: params.dialogId,
				sections: params.recentConfigToHide?.sections,
				parentChatId: params.parentChatId,
			});

			this.#saveShareDialogCache();
		}

		/**
		 * @param {ChatUserLeavePullHandlerParams} params
		 * @param {PullExtraParams} extra
		 */
		async handleChatUserLeave(params, extra)
		{
			if (this.interceptEvent(extra))
			{
				return;
			}
			this.logger.info('handleChatUserLeave:', params);

			const { dialogId, userId } = params;
			if (Number(userId) !== MessengerParams.getUserId())
			{
				return;
			}

			const chatHelper = DialogHelper.createByDialogId(dialogId);
			const recentProvider = new RecentDataProvider();
			try
			{
				if (chatHelper?.isOpenChannel)
				{
					await this.store.dispatch('recentModel/deleteOpenChannel', { id: dialogId });
					await recentProvider.deleteFromSource(RecentDataProvider.source.database, { dialogId });
				}
				else
				{
					await recentProvider.delete({ dialogId });
					this.#saveShareDialogCache();
				}
			}
			catch (error)
			{
				this.logger.error('handleChatUserLeave delete chat catch:', error);
			}
		}

		// No handleChatDelete here: chat deletion (recent + chat data) is owned by
		// ChatDeletionManager via DialogPullHandler. Leave handling stays below.

		/**
		 * @param {UserInvitePullHandlerParams} params
		 * @param {PullExtraParams} extra
		 */
		async handleUserInvite(params, extra)
		{
			if (this.interceptEvent(extra))
			{
				return;
			}

			this.logger.info('handleUserInvite:', params);
			const messageManager = this.getNewMessageManager(params, extra);
			const preparedRecentItem = messageManager.getPreparedRecentItemByUserInvite();

			await this.store.dispatch('recentModel/setChat', {
				itemList: [preparedRecentItem],
				parentChatId: messageManager.getParentChatId(),
			});
		}

		/**
		 * @param {ChatAvatarPullHandlerParams} params
		 * @param {PullExtraParams} extra
		 */
		async handleChatAvatar(params, extra)
		{
			if (this.interceptEvent(extra))
			{
				return;
			}

			this.logger.info('handleChatAvatar:', params);

			const dialogId = `chat${params.chatId}`;

			const recentItem = this.store.getters['recentModel/getById'](dialogId);
			if (!recentItem)
			{
				return;
			}

			await this.store.dispatch('recentModel/update', [{
				id: dialogId,
				avatar: params.avatar,
				lastActivityDate: recentItem.lastActivityDate,
			}]);
		}

		/**
		 * @desc maybe it is legacy and not used
		 * @param {ChatChangeColorPullHandlerParams} params
		 * @param {PullExtraParams} extra
		 */
		async handleChatChangeColor(params, extra)
		{
			if (this.interceptEvent(extra))
			{
				return;
			}

			this.logger.info('handleChatChangeColor:', params);

			const dialogId = `chat${params.chatId}`;

			const recentItem = this.store.getters['recentModel/getById'](dialogId);
			if (!recentItem)
			{
				return;
			}

			await this.store.dispatch('recentModel/update', [{
				id: dialogId,
				avatar: params.color,
				lastActivityDate: recentItem.lastActivityDate,
			}]);
		}

		/**
		 * @param {object} params
		 * @param {PullExtraParams} extra
		 */
		async handleBotDelete(params, extra)
		{
			if (this.interceptEvent(extra))
			{
				return;
			}

			this.logger.info('handleBotDelete:', params);

			await this.store.dispatch('recentModel/delete', { id: params.botId });
		}

		/**
		 * @param {object} params
		 * @param {PullExtraParams} extra
		 */
		async handleUserUpdate(params, extra)
		{
			if (this.interceptEvent(extra))
			{
				return;
			}

			this.logger.info('handleUserUpdate:', params);

			const recentMessageManager = this.getNewMessageManager(params, extra);
			const preparedRecentItem = recentMessageManager.getPreparedRecentItemByUserUpdate();

			await this.store.dispatch('recentModel/update', [preparedRecentItem]);
		}

		/**
		 * @desc this handler works for the scenario of adding a new bot to the portal (new registration)
		 * @param {BotUpdateParams} params
		 * @param {PullExtraParams} extra
		 */
		async handleBotAdd(params, extra)
		{
			if (this.interceptEvent(extra))
			{
				return;
			}

			this.logger.info('handleBotAdd:', params);

			const recentMessageManager = this.getNewMessageManager(params, extra);
			const preparedRecentItem = recentMessageManager.getPreparedRecentItemByUserUpdate();

			await this.store.dispatch('recentModel/update', [preparedRecentItem]);
		}

		/**
		 * @param {BotUpdateParams} params
		 * @param {PullExtraParams} extra
		 */
		async handleBotUpdate(params, extra)
		{
			if (this.interceptEvent(extra))
			{
				return;
			}

			this.logger.info('handleBotUpdate:', params);

			const recentMessageManager = this.getNewMessageManager(params, extra);
			const preparedRecentItem = recentMessageManager.getPreparedRecentItemByUserUpdate();

			await this.store.dispatch('recentModel/update', [preparedRecentItem]);
		}

		/**
		 * @param {AddReactionParams} params
		 * @param {PullExtraParams} extra
		 */
		async handleAddReaction(params, extra)
		{
			if (this.interceptEvent(extra))
			{
				return;
			}
			this.logger.info('handleAddReaction:', params, extra);

			await this.#updateReaction(params, true);
		}

		/**
		 * @param {DeleteReactionParams} params
		 * @param {PullExtraParams} extra
		 */
		async handleDeleteReaction(params, extra)
		{
			if (this.interceptEvent(extra))
			{
				return;
			}
			this.logger.info('handleDeleteReaction:', params, extra);

			await this.#updateReaction(params, false);
		}

		/**
		 * @param {RecentUpdateParams} params
		 * @param {PullExtraParams} extra
		 */
		async handleRecentUpdate(params, extra)
		{
			if (this.interceptEvent(extra))
			{
				return;
			}

			this.logger.info('handleRecentUpdate:', params, extra);

			const manager = new ChatRecentUpdateManager(params);
			manager.setLastMessageInfo();

			const sections = params.recentConfig?.sections;
			const isMetaOnly = Type.isNull(params.lastActivityDate);
			const shouldUpdateRecentModel = !isMetaOnly || Boolean(this.getRecent(params.dialogId));

			if (shouldUpdateRecentModel && Type.isArrayFilled(sections))
			{
				const recentItem = manager.getPreparedRecentItem();
				await this.store.dispatch('recentModel/setByRecentConfigTabs', {
					sections,
					itemList: recentItem,
					parentChatId: manager.getParentChatId(),
				});
			}

			await this.recentRepository.setSections(params.dialogId, sections);
		}

		/**
		 * @param {UserShowInRecentParams} params
		 * @param {PullExtraParams} extra
		 */
		async handleUserShowInRecent(params, extra)
		{
			if (this.interceptEvent(extra))
			{
				return;
			}

			this.logger.info('handleUserShowInRecent:', params, extra);

			const { items } = params;

			const users = items.map((item) => {
				return {
					...item.user,
					lastActivityDate: item.date, // draw collaber avatar without an invited default avatar
				};
			});
			await this.store.dispatch('usersModel/set', users);

			const recentItems = items.map((item) => {
				return {
					id: item.user.id,
					lastActivityDate: item.date,
					invited: false,
				};
			});
			await this.store.dispatch('recentModel/setChat', recentItems);
		}

		/**
		 * @param {MessagePullHandlerBlockAppendParams} params
		 * @param {PullExtraParams} extra
		 */
		async handleMessageBlockElementAppend(params, extra)
		{
			if (this.interceptEvent(extra))
			{
				return;
			}

			this.logger.info('handleMessageBlockElementAppend:', params);

			await this.#updateRecentBlockText(params);
		}

		/**
		 * @param {MessagePullHandlerBlockUpdateParams} params
		 * @param {PullExtraParams} extra
		 */
		async handleMessageBlockElementUpdate(params, extra)
		{
			if (this.interceptEvent(extra))
			{
				return;
			}

			this.logger.info('handleMessageBlockElementUpdate:', params);

			await this.#updateRecentBlockText(params);
		}

		/**
		 * @param {MessagePullHandlerBlockDeleteParams} params
		 * @param {PullExtraParams} extra
		 */
		async handleMessageBlockElementDelete(params, extra)
		{
			if (this.interceptEvent(extra))
			{
				return;
			}

			this.logger.info('handleMessageBlockElementDelete:', params);

			await this.#updateRecentBlockText(params);
		}

		/**
		 * @param {DialogId} id
		 * @return {?RecentModelState}
		 */
		getRecent(id)
		{
			return this.store.getters['recentModel/getById'](id);
		}

		/**
		 * @param {object} params
		 * @param {PullExtraParams} extra
		 * @return {NewMessageManager}
		 */
		getNewMessageManager(params, extra)
		{
			return new NewMessageManager(params, extra);
		}

		/**
		 * @param {object} params
		 * @param {PullExtraParams} extra
		 */
		async #messageAdd(params, extra)
		{
			if (this.interceptEvent(extra))
			{
				return;
			}
			this.logger.info('messageAdd:', params, extra);

			const messageManager = this.getNewMessageManager(params, extra);
			if (messageManager.needToSkipMessageEvent())
			{
				return;
			}

			const recentItem = messageManager.getPreparedRecentItem();
			const sections = messageManager.getRecentTabs();
			await this.store.dispatch('recentModel/setByRecentConfigTabs', {
				sections,
				itemList: recentItem,
				parentChatId: messageManager.getParentChatId(),
			});

			const dialogId = String(recentItem.id);
			await this.recentRepository.setSections(dialogId, sections);
		}

		/**
		 * @param {DeleteReactionParams|AddReactionParams} params
		 * @param {boolean} liked
		 */
		async #updateReaction(params, liked)
		{
			const {
				userId,
				dialogId,
				actualReactions,
			} = params;

			if (this.store.getters['applicationModel/isDialogOpen'](dialogId))
			{
				return;
			}

			const recentItem = this.getRecent(dialogId);
			const isOwnLike = MessengerParams.getUserId() === userId;
			const isOwnLastMessage = MessengerParams.getUserId() === recentItem?.message.senderId;
			if (isOwnLike || !isOwnLastMessage)
			{
				return;
			}

			await this.store.dispatch('recentModel/like', {
				messageId: actualReactions.reaction?.messageId,
				id: recentItem?.id || String(dialogId),
				liked,
			});
		}

		/**
		 * @param {NewLastMessageDataMessageDeleteV2Params} newLastMessage
		 * @param {string} dialogId
		 */
		async #updateRecentByNewLastMessage(newLastMessage, dialogId)
		{
			const currentRecentItem = this.getRecent(dialogId);
			if (!currentRecentItem)
			{
				return;
			}

			const message = {
				text: ChatMessengerCommon.purifyText(newLastMessage.text, newLastMessage.params),
				date: newLastMessage.date,
				author_id: newLastMessage.author_id,
				chat_id: newLastMessage.chat_id,
				id: newLastMessage.id,
				file: (newLastMessage.file || newLastMessage.params.FILE_ID) ?? false,
				unread: newLastMessage.unread ?? false,
			};

			const recentUpdate = {
				id: dialogId,
				message,
				lastActivityDate: currentRecentItem.lastActivityDate,
			};

			const mainCollabChatId = this.#getMainCollabChatId(dialogId);
			if (mainCollabChatId !== null && Number(newLastMessage.chat_id) === mainCollabChatId)
			{
				recentUpdate.ownMessage = Number.isInteger(newLastMessage.id) && newLastMessage.id > 0
					? this.#prepareOwnMessageFromRaw(newLastMessage)
					: null;
			}

			await this.store.dispatch('recentModel/update', [recentUpdate]);
			this.#saveShareDialogCache();
		}

		/**
		 * @param {DialogId} dialogId
		 * @return {number|null}
		 */
		#getMainCollabChatId(dialogId)
		{
			if (!Feature.isCollabPreviewSourceAvailable)
			{
				return null;
			}

			const dialogHelper = DialogHelper.createByDialogId(dialogId);
			if (!dialogHelper || !dialogHelper.isCollab)
			{
				return null;
			}

			const chatId = Number(dialogHelper.chatId);

			return chatId > 0 ? chatId : null;
		}

		/**
		 * @param {NewLastMessageDataMessageDeleteV2Params|RawMessage} rawMessage
		 * @return {object}
		 */
		#prepareOwnMessageFromRaw(rawMessage)
		{
			const ownMessage = { ...rawMessage };
			ownMessage.status = ownMessage.author_id === MessengerParams.getUserId() ? MessageStatus.received : '';
			ownMessage.senderId = ownMessage.author_id;
			ownMessage.text = ChatMessengerCommon.purifyText(ownMessage.text, ownMessage.params);

			return ownMessage;
		}

		/**
		 * @param {Array<DeleteV2MessageObject>} messages
		 * @param {string} dialogId
		 */
		async #updateRecentByUpdatedMessages(messages, dialogId)
		{
			const currentRecentItem = this.getRecent(dialogId);
			if (!currentRecentItem)
			{
				return;
			}

			const lastMessageFromServer = messages.find(
				(message) => message.id === currentRecentItem.message?.id,
			);
			if (!lastMessageFromServer)
			{
				return;
			}

			const message = this.store.getters['messagesModel/getById'](lastMessageFromServer.id);
			if (!('id' in message))
			{
				return;
			}

			const recentMessageParams = lastMessageFromServer.params;
			if (lastMessageFromServer)
			{
				message.text = ChatMessengerCommon.purifyText(lastMessageFromServer.text, recentMessageParams);
				message.params = recentMessageParams;
				message.file = recentMessageParams && recentMessageParams.FILE_ID
					? recentMessageParams.FILE_ID.length > 0
					: false
				;
				message.attach = recentMessageParams && recentMessageParams.ATTACH
					? recentMessageParams.ATTACH.length > 0
					: false
				;

				currentRecentItem.message = {
					...currentRecentItem.message,
					...message,
				};
			}

			await this.store.dispatch('recentModel/update', [currentRecentItem]);
			this.#saveShareDialogCache();
		}

		/**
		 * @param {{ messageId: number, text: string }} params
		 */
		async #updateRecentBlockText(params)
		{
			const { messageId, text } = params;

			const message = this.store.getters['messagesModel/getById'](messageId);
			if (Type.isNil(message.id))
			{
				return;
			}

			const dialog = this.store.getters['dialoguesModel/getByChatId'](message.chatId);
			if (!dialog)
			{
				return;
			}

			const recentItem = this.getRecent(dialog.dialogId);
			if (!recentItem || recentItem.message?.id !== messageId)
			{
				return;
			}

			await this.store.dispatch('recentModel/update', [{
				id: dialog.dialogId,
				message: {
					...recentItem.message,
					text,
				},
				lastActivityDate: recentItem.lastActivityDate,
			}]);
		}

		/**
		 * @param {MessagePullHandlerUpdateParams} params
		 */
		async #updateRecentMessage(params)
		{
			const recentItem = this.getRecent(params.dialogId);
			if (!recentItem)
			{
				return;
			}

			const message = clone(this.store.getters['messagesModel/getById'](params.id));
			if (Type.isNil(message.id))
			{
				return;
			}

			const recentParams = params;
			message.text = ChatMessengerCommon.purifyText(recentParams.text, recentParams.params);
			message.params = recentParams.params;
			message.file = recentParams.params && recentParams.params.FILE_ID
				? recentParams.params.FILE_ID.length > 0
				: false
			;
			message.attach = recentParams.params && recentParams.params.ATTACH
				? recentParams.params.ATTACH.length > 0
				: false
			;

			const recentUpdate = {
				id: params.dialogId,
				lastActivityDate: recentItem.lastActivityDate,
			};

			let hasChange = false;
			if (recentItem.message.id === message.id)
			{
				recentUpdate.message = message;
				hasChange = true;
			}

			const mainCollabChatId = this.#getMainCollabChatId(params.dialogId);
			const currentOwnId = recentItem.ownMessage?.id;
			if (
				mainCollabChatId !== null
				&& Number(params.chatId) === mainCollabChatId
				&& currentOwnId === message.id
			)
			{
				recentUpdate.ownMessage = { ...recentItem.ownMessage, ...message };
				hasChange = true;
			}

			if (hasChange)
			{
				await this.store.dispatch('recentModel/update', [recentUpdate]);
			}
		}

		/**
		 * @void
		 */
		#saveShareDialogCache()
		{
			this.shareDialogCache.saveRecentItemListThrottled();
		}
	}

	module.exports = { RecentPullHandler };
});
