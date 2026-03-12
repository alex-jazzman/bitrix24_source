/**
 * @module im/messenger-v2/provider/pull/message/handler
 */
jn.define('im/messenger-v2/provider/pull/message/handler', (require, exports, module) => {
	const { Type } = require('type');
	const { Loc } = require('im/messenger/loc');
	const { clone } = require('utils/object');
	const {
		UserRole,
		DialogType,
		EventType,
		AiTasksStatusType,
	} = require('im/messenger/const');
	const { ChatTitle } = require('im/messenger/lib/element/chat-title');
	const { ChatAvatar } = require('im/messenger/lib/element/chat-avatar');
	const { Notifier } = require('im/messenger/lib/notifier');
	const { DialogHelper } = require('im/messenger/lib/helper');
	const { getLoggerWithContext } = require('im/messenger/lib/logger');
	const { parser } = require('im/messenger/lib/parser');
	const { MessengerEmitter } = require('im/messenger/lib/emitter');
	const { delay } = require('im/messenger/lib/utils');
	const { MessageDataConverter } = require('im/messenger/lib/converter/data/message');
	const { FileUtils } = require('im/messenger/provider/pull/lib/file');
	const { ChatDataProvider, ReactionDataProvider } = require('im/messenger/provider/data');
	const { MessengerParams } = require('im/messenger/lib/params');
	const { UuidManager } = require('im/messenger/lib/uuid-manager');
	const { BasePullHandler } = require('im/messenger/provider/pull/base');
	const { NewMessageManager } = require('im/messenger-v2/provider/pull/lib/new-message-manager');
	const { InputActionListener } = require('im/messenger-v2/provider/pull/lib/input-action-listener');

	const AUTO_TASK_STATUS_NOT_FOUND_CLEAR_DELAY = 3000;

	/**
	 * @class MessagePullHandler
	 */
	class MessagePullHandler extends BasePullHandler
	{
		constructor()
		{
			super({ logger: getLoggerWithContext('pull-handler--message-v2', MessagePullHandler) });
			/** @type {Object.<MessageId, Set<UserId>>} */
			this.messageViews = {};
		}

		/**
		 * @param {MessageAddParams} params
		 * @param {PullExtraParams} extra
		 */
		async handleMessage(params, extra)
		{
			if (this.interceptEvent(extra))
			{
				return;
			}
			this.logger.info('handleMessage:', params, extra);

			await this.#updateDialog(params);
			await this.#setUsers(params);
			await this.#setFiles(params);
			await this.#setSticker(params);
			this.#checkTimerInputAction(params.dialogId, params.message.senderId);
			this.#showMessageNotify(params, extra, true);
			await this.#processMessage(params);
			await this.#checkMessageParams(params.message);
		}

		/**
		 * @param {MessageAddParams} params
		 * @param {PullExtraParams} extra
		 */
		async handleMessageChat(params, extra)
		{
			if (this.interceptEvent(extra))
			{
				return;
			}
			this.logger.info('handleMessageChat:', params, extra);

			// TODO: MessengerV2 remove after openlines support
			if (params.lines)
			{
				return;
			}

			await this.#updateDialog(params);
			await this.#setUsers(params);
			await this.#setFiles(params);
			await this.#setSticker(params);
			this.#checkTimerInputAction(params.dialogId, params.message.senderId);
			this.#showMessageNotify(params, extra, false);
			await this.#setCommentInfo(params);
			await this.#processMessage(params);
			await this.#updateCopilot(params);
			await this.#checkMessageParams(params.message);
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

			await this.#updateMessage(params);
		}

		/**
		 * @param {MessagePullHandlerMessageParamsUpdateParams} params
		 * @param {PullExtraParams} extra
		 */
		async handleMessageParamsUpdate(params, extra)
		{
			if (this.interceptEvent(extra))
			{
				return;
			}

			this.logger.info('handleMessageParamsUpdate:', params);

			await this.store.dispatch('messagesModel/updateParams', {
				id: params.id,
				chatId: params.chatId,
				params: params.params,
			});

			if (params.params.CHAT_MESSAGE)
			{
				await this.store.dispatch('commentModel/updateComment', {
					messageId: params.id,
					messageCount: params.params.CHAT_MESSAGE,
				});
			}
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

			const fullDeletedMessageList = params.messages.filter((message) => message.completelyDeleted);
			const updateMessageList = params.messages.filter((message) => !message.completelyDeleted);

			if (fullDeletedMessageList.length > 0)
			{
				await this.#fullDeleteMessageList(fullDeletedMessageList);

				fullDeletedMessageList.forEach((message) => {
					this.#fullDeletePostMessage(message.id, params.chatId);
				});

				await this.#updateDialogByFullDelete(params);
			}

			if (updateMessageList.length > 0)
			{
				await this.#updateMessageListBySoftDelete(updateMessageList);
			}
		}

		/**
		 * @param {AddReactionParams} params
		 * @param {PullExtraParams} extra
		 */
		async handleAddReaction(params, extra)
		{
			this.logger.info('handleAddReaction:', params);
			if (this.#shouldSkipReactionByUuidAndCounters(extra, params))
			{
				return;
			}

			const {
				actualReactions: { reaction: actualReactionsState, usersShort },
				userId,
				reaction,
				dialogId,
			} = params;

			actualReactionsState.ownReactions = [];

			actualReactionsState.reactionUsers = this.#addUserIdToReactionsUserCollection(
				actualReactionsState.messageId,
				reaction,
				userId,
			);

			if (String(MessengerParams.getUserId()) === String(userId))
			{
				actualReactionsState.ownReactions = [reaction];
			}

			if (Type.isStringFilled(dialogId))
			{
				actualReactionsState.dialogId = dialogId;
			}

			this.#updateAnchor(dialogId, params)
				.catch((err) => this.logger.error('handleAddReaction.updateAnchor.catch err:', err));

			const message = this.getMessage(actualReactionsState.messageId);
			if (!message)
			{
				try
				{
					const reactionDataProvider = new ReactionDataProvider();
					reactionDataProvider.setToSource(
						ReactionDataProvider.source.database,
						actualReactionsState,
					)
						.catch((error) => this.logger.error('handleAddReaction ReactionDataProvider.setToSource catch:', error));

				}
				catch (error)
				{
					this.logger.error(
						'handleAddReaction ReactionDataProvider.setToSource catch:',
						error,
					);
				}

				return;
			}

			await this.store.dispatch('messagesModel/updateReactionState', {
				id: message.id,
				fields: {
					reactionsViewed: false,
					lastReactionId: reaction,
				},
			});

			await this.store.dispatch('usersModel/addShort', usersShort);
			await this.store.dispatch('messagesModel/reactionsModel/setFromPullEvent', {
				usersShort,
				reactions: [actualReactionsState],
			});
		}

		/**
		 * @param {DeleteReactionParams} params
		 * @param {PullExtraParams} extra
		 */
		async handleDeleteReaction(params, extra)
		{
			this.logger.info('handleDeleteReaction:', params);
			if (this.#shouldSkipReactionByUuidAndCounters(extra, params))
			{
				return;
			}

			const {
				actualReactions: { reaction: actualReactionsState, usersShort },
				dialogId,
				reaction,
				userId,
			} = params;

			actualReactionsState.ownReactions = [];

			const message = this.getMessage(actualReactionsState.messageId);
			if (!message)
			{
				try
				{
					const reactionDataProvider = new ReactionDataProvider();
					reactionDataProvider.deleteFromSource(
						ReactionDataProvider.source.database,
						actualReactionsState,
					)
						.catch((error) => this.logger.error('handleDeleteReaction ReactionDataProvider.deleteFromSource catch:', error));

				}
				catch (error)
				{
					this.logger.error(
						'handleDeleteReaction ReactionDataProvider.deleteFromSource catch:',
						error,
					);
				}

				return;
			}

			if (Type.isStringFilled(dialogId))
			{
				actualReactionsState.dialogId = dialogId;
			}

			actualReactionsState.reactionUsers = this.#removeUserIdFromReactionsUserCollection(
				actualReactionsState.messageId,
				reaction,
				userId,
			);

			await this.store.dispatch('messagesModel/updateReactionState', {
				id: message.id,
				fields: {
					reactionsViewed: true,
					lastReactionId: '',
				},
			});

			await this.store.dispatch('messagesModel/reactionsModel/setFromPullEvent', {
				usersShort,
				reactions: [actualReactionsState],
			});
		}

		/**
		 * @param {ReadMessageParams} params
		 * @param {PullExtraParams} extra
		 */
		async handleReadMessage(params, extra)
		{
			if (this.interceptEvent(extra))
			{
				return;
			}

			this.logger.info('handleReadMessage:', params);

			if (UuidManager.getInstance().hasActionUuid(extra.action_uuid))
			{
				this.logger.info('handleReadMessage: we already locally processed this action');
				UuidManager.getInstance().removeActionUuid(extra.action_uuid);

				return;
			}

			await this.#readMessage(params);
		}

		/**
		 * @param {ReadMessageParams} params
		 * @param {PullExtraParams} extra
		 */
		async handleReadMessageChat(params, extra)
		{
			if (this.interceptEvent(extra))
			{
				return;
			}

			this.logger.info('handleReadMessageChat:', params);

			if (UuidManager.getInstance().hasActionUuid(extra.action_uuid))
			{
				this.logger.info('handleReadMessageChat: we already locally processed this action');
				UuidManager.getInstance().removeActionUuid(extra.action_uuid);

				return;
			}

			await this.#readMessage(params);
		}

		/**
		 * @param {ReadMessageOpponentParams} params
		 * @param {PullExtraParams} extra
		 */
		async handleReadMessageOpponent(params, extra)
		{
			if (this.interceptEvent(extra))
			{
				return;
			}

			if (params.userId === MessengerParams.getUserId())
			{
				this.logger.warn('handleReadMessageOpponent: skip read by current user', params);

				return;
			}

			this.logger.info('handleReadMessageOpponent:', params);

			await this.#readMessageChatOpponent(params);
		}

		/**
		 * @param {ReadMessageOpponentParams} params
		 * @param {PullExtraParams} extra
		 */
		async handleReadMessageChatOpponent(params, extra)
		{
			if (this.interceptEvent(extra))
			{
				return;
			}

			if (params.userId === MessengerParams.getUserId())
			{
				this.logger.warn(
					'handleReadMessageChatOpponent: skip read by current user',
					params,
				);

				return;
			}

			this.logger.info('handleReadMessageChatOpponent:', params);

			await this.#readMessageChatOpponent(params);
		}

		/**
		 * @param {ReadMessageOpponentParams} params
		 * @param {PullExtraParams} extra
		 */
		async handleUnreadMessageOpponent(params, extra)
		{
			if (this.interceptEvent(extra))
			{
				return;
			}

			this.logger.info('handleUnreadMessageOpponent:', params);

			await this.#updateMessageStatus(params);
		}

		/**
		 * @param {ReadMessageOpponentParams} params
		 * @param {PullExtraParams} extra
		 */
		async handleUnreadMessageChatOpponent(params, extra)
		{
			if (this.interceptEvent(extra))
			{
				return;
			}

			this.logger.info('handleUnreadMessageChatOpponent:', params);

			await this.#updateMessageStatus(params);
		}

		/**
		 * @param {MessagePullHandlerPinAddParams} params
		 * @param {PullExtraParams} extra
		 */
		handlePinAdd(params, extra)
		{
			if (this.interceptEvent(extra))
			{
				return;
			}

			this.#setUsers(params)
				.catch((error) => {
					this.logger.error('ChatMessagePullHandler.handlePinAdd set users error', error);
				})
			;
			this.#setFiles(params)
				.catch((error) => {
					this.logger.error('ChatMessagePullHandler.handlePinAdd set files error', error);
				})
			;

			this.store.dispatch('messagesModel/pinModel/set', {
				pin: params.pin,
				messages: params.additionalMessages,
			})
				.catch((error) => {
					this.logger.error('handlePinAdd set pin error', error);
				})
			;
		}

		/**
		 * @param {MessagePullHandlerPinDeleteParams} params
		 * @param {PullExtraParams} extra
		 */
		handlePinDelete(params, extra)
		{
			if (this.interceptEvent(extra))
			{
				return;
			}

			this.store.dispatch('messagesModel/pinModel/delete', {
				chatId: params.chatId,
				messageId: params.messageId,
			})
				.catch((error) => {
					this.logger.error('handlePinDelete delete pin error', error);
				})
			;
		}

		/**
		 * @param {MessagePullHandleAutoTaskStatus} params
		 * @param {PullExtraParams} extra
		 */
		async handleAutoTaskStatus(params, extra)
		{
			if (this.interceptEvent(extra))
			{
				return;
			}

			this.logger.info('handleAutoTaskStatus:', params);

			const dialogHelper = DialogHelper.createByChatId(params.chatId);
			if (dialogHelper?.isChannel)
			{
				this.logger.warn('handleAutoTaskStatus skipped by message from channel:', params);

				return;
			}

			try
			{
				const payloadParams = {
					id: params.messageId,
					fields: {
						visualState: { aiTaskStatus: params.status, type: params.type },
					},
				};

				await this.store.dispatch('messagesModel/updateVisualState', payloadParams);
			}
			catch (error)
			{
				this.logger.error(
					'#handleAutoTaskStatus.messagesModel/updateVisualState.catch:',
					error,
				);
			}

			if (params.status === AiTasksStatusType.notFound)
			{
				// Wait before clearing the "not found" visual state,
				// because no more pull events will arrive and otherwise this state would remain indefinitely.
				await delay(AUTO_TASK_STATUS_NOT_FOUND_CLEAR_DELAY);

				const payloadParams = {
					id: params.messageId,
					fields: {
						visualState: { aiTaskStatus: null },
					},
				};

				await this.store.dispatch('messagesModel/updateVisualState', payloadParams);
			}
		}

		/**
		 * @param {MessageAddParams} params
		 * @param {PullExtraParams} extra
		 * @return {NewMessageManager}
		 */
		getNewMessageManager(params, extra = {})
		{
			return new NewMessageManager(params, extra);
		}

		/**
		 * @param {DialogId} dialogId
		 * @return {?DialoguesModelState}
		 */
		getDialog(dialogId)
		{
			return this.store.getters['dialoguesModel/getById'](dialogId);
		}

		/**
		 * @param {MessageId} messageId
		 * @return {MessagesModelState|null}
		 */
		getMessage(messageId)
		{
			const message = this.store.getters['messagesModel/getById'](messageId);
			if (!('id' in message))
			{
				return null;
			}

			return clone(message);
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
		 * @param {number} ownerId
		 * @return {boolean}
		 */
		isCurrentUserOwner(ownerId)
		{
			const currentUserId = MessengerParams.getUserId();

			return currentUserId === ownerId;
		}

		/**
		 * @param {ReadMessageOpponentParams} params
		 */
		async #readMessageChatOpponent(params)
		{
			await this.#updateMessageViewedByOthers(params);
			await this.#updateMessageStatus(params);
			await this.#updateChatLastMessageViews(params);
		}

		/**
		 * @param {ReadMessageOpponentParams} params
		 */
		async #updateMessageViewedByOthers(params)
		{
			return this.store.dispatch('messagesModel/setViewedByOthers', { messageIds: params.viewedMessages });
		}

		/**
		 * @param {ReadMessageOpponentParams} params
		 */
		async #updateMessageStatus(params)
		{
			const dialogId = params.dialogId;
			const userId = params.userId;

			const recentItem = this.getRecent(dialogId);
			if (!recentItem)
			{
				return;
			}

			if (params.chatMessageStatus && params.chatMessageStatus !== recentItem.message.status)
			{
				await this.store.dispatch('recentModel/update', [{
					id: dialogId,
					message: {
						status: params.chatMessageStatus,
					},
					lastActivityDate: recentItem.lastActivityDate,
				}]);
			}

			const user = clone(this.store.getters['usersModel/getById'](userId));
			if (!user)
			{
				return;
			}

			await this.store.dispatch('usersModel/update', [
				{
					id: userId,
					idle: false,
					lastActivityDate: new Date(params.date),
				},
			]);
		}

		/**
		 * @desc Update views a message in dialog model store
		 * @param {ReadMessageOpponentParams} params - pull event
		 */
		async #updateChatLastMessageViews(params)
		{
			const dialogModelState = this.getDialog(params.dialogId);
			if (!dialogModelState)
			{
				return;
			}

			const isLastMessage = params.viewedMessages.includes(dialogModelState.lastMessageId);
			if (!isLastMessage)
			{
				return;
			}

			const hasFirstViewer = Boolean(dialogModelState.lastMessageViews?.firstViewer);
			if (hasFirstViewer)
			{
				const isDialog = DialogHelper.isDialogId(params.dialogId);
				const hasViewerByUserId = this.#checkMessageViewsRegistry(
					params.userId,
					dialogModelState.lastMessageId,
				);
				if (isDialog && !hasViewerByUserId)
				{
					try
					{
						await this.store.dispatch('dialoguesModel/incrementLastMessageViews', {
							dialogId: params.dialogId,
						});

						this.#updateMessageViewsRegistry(params.userId, dialogModelState.lastMessageId);
					}
					catch (error)
					{
						this.logger.error(
							'#updateChatLastMessageViews.dialoguesModel/incrementLastMessageViews.catch:',
							error,
						);
					}
				}

				return;
			}

			if (params.userId)
			{
				try
				{
					await this.store.dispatch('dialoguesModel/setLastMessageViews', {
						dialogId: params.dialogId,
						fields: {
							userId: params.userId,
							userName: params.userName,
							date: params.date,
							messageId: dialogModelState.lastMessageId,
						},
					});

					this.#updateMessageViewsRegistry(params.userId, dialogModelState.lastMessageId);
				}
				catch (error)
				{
					this.logger.error(
						'#updateChatLastMessageViews.dialoguesModel/setLastMessageViews.catch:',
						error,
					);
				}
			}
		}

		/**
		 * @param {UserId} userId
		 * @param {MessageId} messageId
		 * @return {boolean}
		 */
		#checkMessageViewsRegistry(userId, messageId)
		{
			return Boolean(this.messageViews[messageId]?.has(userId));
		}

		/**
		 * @param {UserId} userId
		 * @param {MessageId} messageId
		 */
		#updateMessageViewsRegistry(userId, messageId)
		{
			if (!this.messageViews[messageId])
			{
				this.messageViews[messageId] = new Set();
			}

			this.messageViews[messageId].add(userId);
		}

		/**
		 * @param {ReadMessageParams} params
		 */
		async #readMessage(params)
		{
			await this.store.dispatch('messagesModel/readMessages', {
				chatId: params.chatId,
				messageIds: params.viewedMessages,
			});
		}

		/**
		 * @param {MessageId} messageId
		 * @param {number} chatId
		 */
		async #fullDeletePostMessage(messageId, chatId)
		{
			const commentInfo = this.store.getters['commentModel/getByMessageId'](messageId);
			if (commentInfo)
			{
				await this.store.dispatch('commentModel/deleteCommentByMessageId', {
					messageId,
					channelChatId: chatId,
				});

				try
				{
					const chatProvider = new ChatDataProvider();
					await chatProvider.delete({ dialogId: commentInfo.dialogId });
				}
				catch (error)
				{
					this.logger.error(
						'#fullDeletePostMessage delete comment chat error',
						error,
					);
				}

				MessengerEmitter.emit(EventType.dialog.external.delete, {
					dialogId: commentInfo.dialogId,
					shouldShowAlert: true,
					chatType: DialogType.comment,
					shouldSendDeleteAnalytics: true,
				});
			}
		}

		/**
		 * @param {Array<DeleteV2MessageObject>} messageList
		 */
		async #fullDeleteMessageList(messageList)
		{
			const idList = messageList.map((message) => message.id);

			await this.store.dispatch('messagesModel/deleteByIdList', { idList });
		}

		/**
		 * @param {MessagePullHandlerMessageDeleteV2Params|MessagePullHandlerMessageDeleteCompleteParams} params
		 */
		async #updateDialogByFullDelete(params)
		{
			const dialogItem = this.getDialog(params.dialogId);
			if (!dialogItem)
			{
				return;
			}

			const fieldsCount = {
				// counter: params.counter,
			};
			if (params.lastMessageViews?.countOfViewers
				&& (params.lastMessageViews.countOfViewers !== dialogItem.lastMessageViews.countOfViewers))
			{
				fieldsCount.lastMessageId = params.newLastMessage.id;
				fieldsCount.lastId = dialogItem.lastReadId === dialogItem.lastMessageId
					? params.newLastMessage.id : dialogItem.lastReadId;

				const fieldsViews = {
					...params.lastMessageViews.firstViewers[0],
					messageId: params.lastMessageViews.messageId,
					countOfViewers: params.lastMessageViews.countOfViewers,
				};

				await this.store.dispatch('dialoguesModel/setLastMessageViews', {
					dialogId: params.dialogId,
					fields: fieldsViews,
				});
			}

			await this.store.dispatch('dialoguesModel/update', {
				dialogId: params.dialogId,
				fields: fieldsCount,
			});
		}

		/**
		 * @param {Array<DeleteV2MessageObject>} messageList
		 */
		async #updateMessageListBySoftDelete(messageList)
		{
			const preparedMessageList = messageList.map((message) => {
				return { ...message, text: Loc.getMessage('IMMOBILE_MESSENGER_COMMON_MESSAGE_DELETED') };
			});

			await this.store.dispatch('messagesModel/updateList', {
				messageList: preparedMessageList,
			});
		}

		/**
		 * @param {MessageAddParams} params
		 * @return {Promise<any>}
		 */
		async #updateDialog(params)
		{
			const dialog = this.getDialog(params.dialogId);
			if (!dialog)
			{
				return this.#addDialog(params);
			}

			const dialogFieldsToUpdate = {};
			if (params.message.id > dialog.lastMessageId)
			{
				dialogFieldsToUpdate.lastMessageId = params.message.id;
			}

			if (params.message.senderId === MessengerParams.getUserId() && params.message.id > dialog.lastReadId)
			{
				dialogFieldsToUpdate.lastId = params.message.id;
			}

			if (this.isCurrentUserOwner(dialog.owner))
			{
				dialogFieldsToUpdate.role = UserRole.owner;
			}

			if (Object.keys(dialogFieldsToUpdate).length > 0)
			{
				await this.store.dispatch('dialoguesModel/update', {
					dialogId: params.dialogId,
					fields: dialogFieldsToUpdate,
				});

				return this.store.dispatch('dialoguesModel/clearLastMessageViews', {
					dialogId: params.dialogId,
				});
			}

			return false;
		}

		/**
		 * @param {MessageAddParams} params
		 * @return {Promise<any>}
		 */
		async #addDialog(params)
		{
			if (DialogHelper.isChatId(params.dialogId))
			{
				if (!params.users)
				{
					return false;
				}
				/** @type {UsersModelState} */
				const opponent = params.users[params.dialogId];

				return this.store.dispatch('dialoguesModel/set', {
					dialogId: params.dialogId,
					type: DialogType.user,
					name: opponent.name,
					avatar: opponent.avatar,
					color: opponent.color,
					chatId: params.chatId,
					messagesAutoDeleteDelay: params.messagesAutoDeleteConfigs?.[0]?.delay ?? 0,
				});
			}

			if (!params.chat)
			{
				return false;
			}

			const chatData = params.chat[params.chatId];
			const dialog = {
				...chatData,
				dialogId: params.dialogId,
				chatId: params.chatId,
			};

			if (this.isCurrentUserOwner(chatData.owner))
			{
				dialog.role = UserRole.owner;
			}

			return this.store.dispatch('dialoguesModel/set', dialog);
		}

		/**
		 * @param {MessageAddParams} params
		 * @param {PullExtraParams} extra
		 * @param {boolean} isChatDirect
		 */
		#showMessageNotify(params, extra, isChatDirect)
		{
			if (extra.is_shared_event)
			{
				return;
			}

			const messageWithoutNotification = !params.notify || params.message?.params?.NOTIFY === 'N';
			if (messageWithoutNotification)
			{
				return;
			}

			if (params.chat[params.chatId]?.type === DialogType.comment)
			{
				return;
			}
			const dialogId = params.dialogId;
			const dialogStateModel = this.getDialog(dialogId);
			const currentUserId = MessengerParams.getUserId();
			const senderId = params.message.senderId;

			if (extra && extra.server_time_ago <= 5
				&& senderId !== currentUserId
				&& dialogStateModel && !dialogStateModel.muteList.includes(currentUserId)
			)
			{
				const title = ChatTitle.createFromDialogId(dialogId).getTitle();
				const avatar = ChatAvatar.createFromDialogId(dialogId).getMessageAvatarProps();
				const hideUserNamePrefix = isChatDirect
					? Number(senderId) === Number(dialogId)
					: false
				;
				const text = this.#prepareMessageNotifyText(params, extra, hideUserNamePrefix);

				Notifier.notify({
					dialogId,
					title,
					text,
					avatar: avatar.uri,
					recentConfig: params.recentConfig,
				}).catch((error) => {
					this.logger.error('#showMessageNotify catch:', error);
				});
			}
		}

		/**
		 * @param {MessageAddParams} params
		 * @param {PullExtraParams} extra
		 * @param {boolean} [isChatDirect=false]
		 * @return {string}
		 */
		#prepareMessageNotifyText(params, extra, isChatDirect = false)
		{
			const senderId = params.message.senderId;

			const userName = ChatTitle.createFromDialogId(senderId).getTitle();
			const simplifiedMessageText = this.#getSimplifiedText(params, extra);

			return isChatDirect
				? simplifiedMessageText
				: (userName ? `${userName}: ` : '') + simplifiedMessageText
			;
		}

		/**
		 * @param {MessageAddParams} params
		 * @param {PullExtraParams} extra
		 */
		#getSimplifiedText(params, extra)
		{
			const { message } = params;
			if (Type.isPlainObject(message.params?.STICKER_PARAMS))
			{
				return parser.simplify({
					text: message.text,
					sticker: true,
				});
			}

			const messageManager = this.getNewMessageManager(params, extra);
			const messageText = messageManager.getPurifyMessageText();

			return parser.simplify({
				text: messageText,
			});
		}

		/**
		 * @param {object} additionalEntities
		 */
		async #processAdditionalEntities(additionalEntities)
		{
			if (Type.isObject(additionalEntities))
			{
				if (Type.isArrayFilled(additionalEntities?.users))
				{
					await this.#setUsers(additionalEntities);
				}

				if (Type.isArrayFilled(additionalEntities?.files))
				{
					await this.#setFiles(additionalEntities);
				}
			}
		}

		/**
		 * @param {MessageAddParams|MessagePullHandlerPinAddParams} params
		 * @return {Promise<any>}
		 */
		async #setUsers(params)
		{
			if (!params.users)
			{
				return false;
			}

			return this.store.dispatch('usersModel/set', Object.values(params.users));
		}

		/**
		 * @param {MessageAddParams|MessagePullHandlerPinAddParams} params
		 * @return {Promise<any>}
		 */
		async #setFiles(params)
		{
			return FileUtils.setFiles(params);
		}

		/**
		 * @param {MessageAddParams} params
		 * @return {Promise<any>}
		 */
		async #setSticker(params)
		{
			if (Type.isArrayFilled(params.stickers))
			{
				await this.store.dispatch('stickerPackModel/addStickers', {
					stickers: params.stickers,
				});
			}

			if (!Type.isPlainObject(params.message.params?.STICKER_PARAMS))
			{
				return false;
			}

			if (params.message.senderId !== MessengerParams.getUserId())
			{
				return false;
			}

			/** @type {FullStickerData} */
			const stickerParams = params.message.params.STICKER_PARAMS;

			return this.store.dispatch('stickerPackModel/addRecentSticker', stickerParams);
		}

		/**
		 * @desc Check is having input timer by user and stop it
		 * @param {string} dialogId
		 * @param {number} userId
		 */
		#checkTimerInputAction(dialogId, userId)
		{
			if (MessengerParams.getUserId() === userId)
			{
				return;
			}

			const dialogData = this.getDialog(dialogId);
			const type = dialogData?.inputActions?.find((item) => item.userId === userId)?.action?.type;

			if (!type)
			{
				return;
			}

			InputActionListener.getInstance().checkAndStopInputAction({ dialogId, userId, type });
		}

		/**
		 * @param {MessageAddParams} params
		 * @return {Promise<void>}
		 */
		async #processMessage(params)
		{
			const dialog = this.getDialog(params.dialogId);
			const hasUnloadMessages = dialog.hasNextPage;
			if (hasUnloadMessages)
			{
				await this.#storeMessage(params);

				return;
			}

			await this.#setMessage(params);
		}

		/**
		 * @param {MessageAddParams} params
		 * @return {Promise<void>}
		 */
		async #storeMessage(params)
		{
			this.logger.info('#storeMessage params:', params);

			const message = MessageDataConverter.fromPullToMessage(params);

			/**
			 * @type {MessagePullHandlerAdditionalEntities}
			 */
			const { additionalEntities } = params.message;
			await this.#processAdditionalEntities(additionalEntities);

			try
			{
				await this.store.dispatch('messagesModel/storeToLocalDatabase', [message]);
			}
			catch (error)
			{
				this.logger.error('#storeMessage.messagesModel/store.catch:', error);
			}
		}

		/**
		 * @param {MessageAddParams} params
		 * @return {Promise<void>}
		 */
		async #setMessage(params)
		{
			const messageManager = this.getNewMessageManager(params);
			if (
				messageManager.isCommentChat()
				&& !this.store.getters['applicationModel/isDialogOpen'](params.dialogId))
			{
				return;
			}

			const message = MessageDataConverter.fromPullToMessage(params);

			/**
			 * @type {MessagePullHandlerAdditionalEntities}
			 */
			const { additionalEntities, templateId, id } = params.message;

			await this.#processAdditionalEntities(additionalEntities);

			const messageWithTemplateId = this.store.getters['messagesModel/isInChatCollection']({
				messageId: templateId,
			});

			const messageWithRealId = this.store.getters['messagesModel/isInChatCollection']({
				messageId: id,
			});

			if (messageWithRealId)
			{
				this.logger.warn(
					'New message pull handler: we already have this message',
					params.message,
				);

				try
				{
					await this.store.dispatch('messagesModel/update', {
						id,
						fields: params.message,
					});
				}
				catch (error)
				{
					this.logger.error(
						'#setMessage.messagesModel/update.catch:',
						error,
					);
				}
			}
			else if (!messageWithRealId && messageWithTemplateId)
			{
				this.logger.warn(
					'New message pull handler: we already have the TEMPORARY message',
					params.message,
				);

				try
				{
					await this.store.dispatch('messagesModel/updateWithId', {
						id: templateId,
						fields: params.message,
					});
				}
				catch (error)
				{
					this.logger.error(
						'#setMessage.messagesModel/updateWithId.catch:',
						error,
					);
				}
			}
			// it's an opponent message or our own message from somewhere else
			else if (!messageWithRealId && !messageWithTemplateId)
			{
				this.logger.warn(
					'New message pull handler: we dont have this message',
					params.message,
				);

				const prevMessageId = this.store.getters['messagesModel/getLastId'](message.chatId);
				try
				{
					await this.store.dispatch('messagesModel/add', message);

					/** @type {ScrollToBottomEvent} */
					const scrollToBottomEventData = {
						dialogId: message.dialogId,
						messageId: message.id,
						withAnimation: true,
						prevMessageId,
					};

					BX.postComponentEvent(EventType.dialog.external.scrollToBottom, [scrollToBottomEventData]);
				}
				catch (error)
				{
					this.logger.error(
						'#setMessage.messagesModel/add.catch:',
						error,
					);
				}
			}
		}

		/**
		 * @param {MessageAddParams} params
		 */
		async #setCommentInfo(params)
		{
			const messageManager = this.getNewMessageManager(params);
			if (!messageManager.isCommentChat())
			{
				return;
			}

			const chat = params.chat?.[params.chatId];
			const parentChatId = chat.parent_chat_id;

			await this.store.dispatch('commentModel/setComment', {
				messageId: chat.parent_message_id,
				chatId: params.chatId,
				messageCount: chat.message_count,
				dialogId: params.dialogId,
				newUserId: params.message.senderId,
			});

			const dialog = this.store.getters['dialoguesModel/getByChatId'](parentChatId);
			if (!dialog)
			{
				return;
			}

			const recentItem = this.getRecent(dialog.dialogId);
			if (!recentItem)
			{
				return;
			}

			await this.store.dispatch('recentModel/update', [{
				id: dialog.dialogId,
			}]);
		}

		/**
		 * @param {MessageAddParams} params
		 * @return {Promise<any>}
		 */
		async #updateCopilot(params)
		{
			const messageManager = this.getNewMessageManager(params);
			if (!messageManager.isCopilotChat())
			{
				return;
			}

			const copilot = params.copilot;
			const copilotModel = {
				dialogId: params.dialogId,
				chats: copilot.chats,
				aiProvider: '',
				roles: copilot.roles,
				messages: copilot.messages,
			};

			try
			{
				await this.store.dispatch('dialoguesModel/copilotModel/setCollection', copilotModel);
			}
			catch (error)
			{
				this.logger.error('#updateCopilot:', error);
			}
		}

		/**
		 * @param {MessagePullHandlerUpdateParams} updateParams
		 */
		async #updateMessage(updateParams)
		{
			const { params, text, id } = updateParams;

			const message = this.getMessage(id);
			if (!message)
			{
				return;
			}

			if (message.params && message.params.replyId)
			{
				// this copyrighting params needs for update quote – not deleting
				// since version 24 on module im, the replyId comes from server
				params.replyId = message.params.replyId;
			}

			await this.store.dispatch('messagesModel/update', {
				id,
				fields: {
					text,
					params,
				},
			});
		}

		/**
		 * @param {DialogId} dialogId
		 * @param {AddReactionParams} params
		 */
		async #updateAnchor(dialogId, params)
		{
			const chatId = DialogHelper.isDialogId(dialogId) ? Number(dialogId.slice(4)) : dialogId;
			const { userId, actualReactions, reaction } = params;
			const anchors = this.store.getters['anchorModel/getByMessageId'](
				chatId,
				actualReactions.reaction.messageId,
			);

			if (!Type.isArrayFilled(anchors))
			{
				return;
			}

			let userAnchor = null;
			for (let i = anchors.length - 1; i >= 0; i--)
			{
				if (anchors[i].fromUserId === userId && anchors[i].messageId === actualReactions.reaction.messageId)
				{
					userAnchor = anchors[i];
					break;
				}
			}

			if (userAnchor)
			{
				userAnchor.subType = reaction;

				await this.store.dispatch('anchorModel/updateByAuthorId', userAnchor);
			}
		}

		/**
		 * @param {number} messageId
		 * @param {ReactionType} reaction
		 * @param {number} userId
		 * @return {Record<ReactionType, Array<number>>}
		 */
		#addUserIdToReactionsUserCollection(messageId, reaction, userId)
		{
			const currentReaction = this.store.getters['messagesModel/reactionsModel/getByMessageId'](messageId);

			let currentReactionUsersByKey = [];
			if (currentReaction && Type.isMap(currentReaction.reactionUsers))
			{
				currentReactionUsersByKey = currentReaction.reactionUsers.get(reaction) || [];
			}

			const newReactionUsersByKey = currentReactionUsersByKey.includes(userId)
				? currentReactionUsersByKey
				: [...currentReactionUsersByKey, userId];

			const newReactionUsers = currentReaction && Type.isMap(currentReaction.reactionUsers)
				? new Map(currentReaction.reactionUsers)
				: new Map();
			newReactionUsers.set(reaction, newReactionUsersByKey);

			return newReactionUsers;
		}

		/**
		 * @param {number} messageId
		 * @param {ReactionType} reaction
		 * @param {number} userId
		 * @return {Record<ReactionType, Array<number>>}
		 */
		#removeUserIdFromReactionsUserCollection(messageId, reaction, userId)
		{
			const currentReaction = this.store.getters['messagesModel/reactionsModel/getByMessageId'](messageId);
			const currentReactionUsersByKey = currentReaction?.reactionUsers.get(reaction) || [];

			const newReactionUsersByKey = currentReactionUsersByKey.filter(
				(removingUserId) => Number(removingUserId) !== Number(userId),
			);

			const newReactionUsers = new Map(currentReaction.reactionUsers);
			newReactionUsers.set(reaction, newReactionUsersByKey);

			if (newReactionUsersByKey.length === 0)
			{
				newReactionUsers.delete(reaction);
			}
			else
			{
				newReactionUsers.set(reaction, newReactionUsersByKey);
			}

			return newReactionUsers;
		}

		/**
		 * @param {PullExtraParams} extra
		 * @param {AddReactionParams|DeleteReactionParams} params
		 * @returns {boolean}
		 */
		#shouldSkipReactionByUuidAndCounters(extra, params)
		{
			if (!UuidManager.getInstance().hasActionUuid(extra.action_uuid))
			{
				return false;
			}

			const {
				actualReactions: { reaction: actualReactionsState },
				reaction,
			} = params;

			const currentReactionState = this.store.getters['messagesModel/reactionsModel/getByMessageId'](actualReactionsState.messageId);

			const countersEqual = this.#areReactionCountersEqual(currentReactionState, actualReactionsState, reaction);

			this.logger.log('handleReaction: comparing counters', {
				reaction,
				currentCounter: currentReactionState?.reactionCounters?.[reaction],
				pullCounter: actualReactionsState?.reactionCounters?.[reaction],
			});

			UuidManager.getInstance().removeActionUuid(extra.action_uuid);

			if (countersEqual)
			{
				this.logger.log('handleReaction: we already locally processed this action and counters are equal');

				return true;
			}
			this.logger.log('handleReaction: counters are different, continue processing');

			return false;
		}

		/**
		 * @param {object} currentReactionState
		 * @param {object} actualReactionsState
		 * @param {string} reaction
		 * @returns {boolean}
		 */
		#areReactionCountersEqual(currentReactionState, actualReactionsState, reaction)
		{
			let currentCounter = 0;
			let pullCounter = 0;

			if (Type.isNumber(currentReactionState?.reactionCounters?.[reaction]))
			{
				currentCounter = currentReactionState.reactionCounters[reaction];
			}

			if (Type.isNumber(actualReactionsState?.reactionCounters?.[reaction]))
			{
				pullCounter = actualReactionsState.reactionCounters[reaction];
			}

			return currentCounter === pullCounter;
		}

		/**
		 * @param {RawMessage} message
		 */
		async #checkMessageParams(message)
		{
			if (Type.isArray(message.params) && message.params.length === 0)
			{
				return;
			}

			const autoTaskTriggerMessageId = Number(message.params.AI_TASK_TRIGGER_MESSAGE_ID);
			if (
				message.system === 'Y'
				&& Type.isNumber(autoTaskTriggerMessageId)
				&& !Number.isNaN(autoTaskTriggerMessageId)
			)
			{
				this.logger.log('#checkMessageParams: this message is trigger ai task final');

				const payloadParams = {
					id: autoTaskTriggerMessageId,
					fields: {
						visualState: { aiTaskStatus: null },
					},
				};

				await this.store.dispatch('messagesModel/updateVisualState', payloadParams);
			}
		}
	}

	module.exports = { MessagePullHandler };
});
