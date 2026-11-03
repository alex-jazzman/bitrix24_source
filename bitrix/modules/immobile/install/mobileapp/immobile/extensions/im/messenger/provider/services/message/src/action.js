/**
 * @module im/messenger/provider/services/message/action
 */
jn.define('im/messenger/provider/services/message/action', (require, exports, module) => {
	/* global ChatMessengerCommon */
	const { Type } = require('type');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { Loc } = require('im/messenger/loc');
	const { Logger } = require('im/messenger/lib/logger');
	const { clone } = require('utils/object');
	const { ShareDialogCache } = require('im/messenger/cache/share-dialog');
	const { runAction } = require('im/messenger/lib/rest');
	const { RestMethod, DialogType } = require('im/messenger/const');
	const { QueueService } = require('im/messenger/provider/services/queue');
	const { DialogHelper } = require('im/messenger/lib/helper');

	class ActionService
	{
		/** @type {Map<MessageId, number>} */
		#editAttemptNumberByMessageId = new Map();

		constructor()
		{
			/** @type {MessengerCoreStore} */
			this.store = serviceLocator.get('core').getStore();
			/** @type {QueueService} */
			this.queueServiceInstanse = null;

			this.shareDialogCache = new ShareDialogCache();
		}

		get queueService()
		{
			if (!this.queueServiceInstanse)
			{
				this.queueServiceInstanse = serviceLocator.get('queue-service');
			}

			return this.queueServiceInstanse;
		}

		/**
		 * @desc delete message
		 * @param {MessagesModelState} modelMessage
		 * @param {string} dialogId
		 */
		async delete(modelMessage, dialogId)
		{
			if (modelMessage.error)
			{
				this.fullDeleteMessage([modelMessage], dialogId)
					.catch((error) => Logger.error(error));

				return;
			}

			await this.saveMessages([modelMessage]);

			this.#localDeleteByDialogType([modelMessage], dialogId)
				.then(() => this.deleteRequest([modelMessage.id]))
				.catch((errors) => {
					Logger.error('ActionService.delete.deleteRequest.catch: ', errors);

					return this.restoreMessage([modelMessage.id], dialogId);
				})
				.finally(() => this.deleteTemporaryMessages([modelMessage.id]))
				.catch((errors) => Logger.error('ActionService.delete.deleteTemporaryMessages.catch: ', errors))
			;
		}

		/**
		 * @param {Array<string|number>} listId
		 * @param {string} dialogId
		 */
		async deleteByIdList(listId, dialogId)
		{
			const messageModels = this.store.getters['messagesModel/getListByIds'](listId);
			await this.saveMessages(messageModels);

			this.#localDeleteByDialogType(messageModels, dialogId)
				.then(() => this.deleteRequest(listId))
				.catch((error) => {
					Logger.error(`${this.constructor.name}.deleteByIdList.deleteRequest.catch: `, error);

					return this.restoreMessage(listId, dialogId);
				})
				.finally(() => this.deleteTemporaryMessages(listId))
				.catch((error) => Logger.error(`${this.constructor.name}.deleteByIdList.deleteTemporaryMessages.catch: `, error))
			;
		}

		/**
		 * @param {MessagesModelState[]} messageModels
		 * @param {string} dialogId
		 */
		async #localDeleteByViewed(messageModels, dialogId)
		{
			const viewedMessages = [];
			const newMessages = [];
			messageModels.forEach((message) => {
				if (this.isViewedByOtherUsers(message))
				{
					return viewedMessages.push(message);
				}

				return newMessages.push(message);
			});

			if (newMessages)
			{
				await this.fullDeleteMessage(newMessages, dialogId)
					.catch((error) => Logger.error(error));
			}

			return this.updateMessage(
				viewedMessages,
				Loc.getMessage('IMMOBILE_PULL_HANDLER_MESSAGE_DELETED'),
				dialogId,
				true,
			)
				.catch((error) => Logger.error(error))
			;
		}

		/**
		 * @param {MessagesModelState[]} messageModels
		 * @param {string} dialogId
		 */
		async #localDeleteByDialogType(messageModels, dialogId)
		{
			const dialogModel = this.store.getters['dialoguesModel/getById'](dialogId);

			switch (dialogModel.type)
			{
				case DialogType.comment:
				{
					return this.updateMessage(
						messageModels,
						Loc.getMessage('IMMOBILE_PULL_HANDLER_MESSAGE_DELETED'),
						dialogId,
						true,
					)
						.catch((error) => Logger.error(error))
					;
				}

				case DialogType.channel:
				case DialogType.generalChannel:
				case DialogType.openChannel:
				{
					return this.fullDeleteMessage(messageModels, dialogId)
						.catch((error) => Logger.error(error))
					;
				}

				case DialogType.collab:
				case DialogType.chat:
				case DialogType.copilot:
				case DialogType.tasks:
				case DialogType.calendar:
				{
					const dialogHelper = DialogHelper.createByModel(dialogModel);
					if (dialogHelper?.isCurrentUserManager || dialogHelper?.isCurrentUserOwner)
					{
						return this.fullDeleteMessage(messageModels, dialogId)
							.catch((error) => Logger.error(error));
					}

					return this.#localDeleteByViewed(messageModels, dialogId);
				}

				default:
				{
					return this.#localDeleteByViewed(messageModels, dialogId);
				}
			}
		}

		/**
		 * @desc update text message
		 * @param {MessageId} messageId
		 * @param {string} text
		 * @param {DialogId} dialogId
		 * @return {Promise<MessageUpdateTextResult>}
		 */
		async updateText(messageId, text, dialogId)
		{
			// the attempt is registered before the early exit below: an answer that skipped the registry
			// would call itself the latest one while a newer attempt for the same message is still in flight
			const attempt = this.#registerEditAttempt(messageId);

			const getMessageStateModel = this.store.getters['messagesModel/getById'](messageId);
			if (Type.isNil(getMessageStateModel.id))
			{
				Logger.warn('ActionService.updateText.messageNotFound: ', messageId);

				// nothing to update and nothing to roll back: for the caller this is a failed attempt, so the
				// typed text goes to recovery unless a newer attempt has already replaced it
				return this.#buildUpdateTextResult(this.#isLatestEditAttempt(attempt), { success: false });
			}

			await this.saveMessages([getMessageStateModel]);

			await this.updateMessage([getMessageStateModel], text, dialogId)
				.catch((r) => Logger.error(r));

			// without a connection the request is queued instead of being rejected, so there is nothing to wait for
			const isQueued = !this.isAvailableInternet();

			let updateResult;
			try
			{
				await this.updateRequest(getMessageStateModel.id, text);

				updateResult = { success: !isQueued, queued: isQueued };
			}
			catch (errors)
			{
				Logger.error('ActionService.updateText.updateRequest.catch: ', errors);

				await this.#restoreMessageByFailedUpdate(getMessageStateModel.id, text, dialogId);

				updateResult = { reason: errors?.[0] ?? null };
			}

			const isLatestAttempt = this.#isLatestEditAttempt(attempt);
			if (isLatestAttempt)
			{
				// the snapshot is one per message: the answer of a superseded attempt must not drop the snapshot
				// a newer attempt rolls back to
				this.deleteTemporaryMessages([getMessageStateModel.id]);
			}

			return this.#buildUpdateTextResult(isLatestAttempt, updateResult);
		}

		/**
		 * @desc rolls the message back to the state before the failed update attempt
		 * @param {MessageId} messageId
		 * @param {string} text text written by this attempt
		 * @param {DialogId} dialogId
		 * @return {Promise}
		 */
		async #restoreMessageByFailedUpdate(messageId, text, dialogId)
		{
			const messageModel = this.store.getters['messagesModel/getById'](messageId);
			if (messageModel?.text !== text)
			{
				// a newer update or a delete wins: only the text this attempt wrote may be rolled back
				return;
			}

			// restoreMessage answers false in three places: one before it applies the snapshot and two after,
			// so its answer alone cannot tell a missed rollback from an unrefreshed chat list preview. The read
			// below sees the state restoreMessage sees: both happen before its first await
			const hasSnapshotToRestore = Type.isArrayFilled(
				this.store.getters['messagesModel/getTemporaryMessagesByIdList']([messageId]),
			);

			const isRestored = await this.restoreMessage([messageId], dialogId, {
				// a message may have had no text before the attempt - a picture without a caption as much as
				// a video note - and that state has to come back
				allowEmptyText: true,
			})
				.catch((errors) => Logger.error('ActionService.updateText.restoreMessage.catch: ', errors));

			if (!hasSnapshotToRestore)
			{
				// nothing to roll back to: the model silently keeps the text of the failed attempt
				Logger.error('ActionService.updateText.restoreMessage.nothingToRestore: ', messageId);
			}
			else if (isRestored === false)
			{
				// the message is already rolled back here, only the chat list preview was left untouched
				Logger.warn('ActionService.updateText.restoreMessage.recentNotUpdated: ', messageId);
			}
		}

		/**
		 * @param {MessageId} messageId
		 * @return {MessageUpdateTextAttempt}
		 */
		#registerEditAttempt(messageId)
		{
			// the registry is keyed the way the message collection is: the id of one message may arrive both
			// as a number and as a string, and its attempts have to share a single counter
			const attemptKey = String(messageId);
			const attemptNumber = (this.#editAttemptNumberByMessageId.get(attemptKey) ?? 0) + 1;
			this.#editAttemptNumberByMessageId.set(attemptKey, attemptNumber);

			return { messageId: attemptKey, attemptNumber, attemptId: `${attemptKey}:${attemptNumber}` };
		}

		/**
		 * @param {MessageUpdateTextAttempt} attempt
		 * @return {boolean}
		 */
		#isLatestEditAttempt(attempt)
		{
			return this.#editAttemptNumberByMessageId.get(attempt.messageId) === attempt.attemptNumber;
		}

		/**
		 * @param {boolean} isLatestAttempt
		 * @param {{success?: boolean, queued?: boolean, reason?: RunActionError}} result
		 * @return {MessageUpdateTextResult}
		 */
		#buildUpdateTextResult(isLatestAttempt, result)
		{
			return {
				isLatestAttempt,
				success: result.success ?? false,
				queued: result.queued ?? false,
				reason: result.reason ?? null,
			};
		}

		/**
		 * @desc call a rest request delete message
		 * @param {Array<MessageId>} messageIdList
		 * @return {Promise}
		 */
		deleteRequest(messageIdList)
		{
			const deleteData = {
				messageIds: messageIdList,
			};
			if (this.isAvailableInternet())
			{
				return runAction(RestMethod.imV2ChatMessageDelete, { data: deleteData });
			}

			return this.queueService.putRequest(
				RestMethod.imV2ChatMessageDelete,
				deleteData,
				1,
				messageIdList,
			);
		}

		/**
		 * @desc call rest request update message
		 * @param {number|string} messageId
		 * @param {string} text
		 * @return {Promise}
		 */
		updateRequest(messageId, text)
		{
			const updateData = {
				id: messageId,
				fields: {
					message: text,
				},
			};

			if (this.isAvailableInternet())
			{
				return runAction(RestMethod.imV2ChatMessageUpdate, { data: updateData });
			}

			return this.queueService.putRequest(
				RestMethod.imV2ChatMessageUpdate,
				updateData,
				1,
				[messageId],
			);
		}

		/**
		 * @desc check is connection
		 * @return {boolean}
		 */
		isAvailableInternet()
		{
			return this.store.getters['applicationModel/getNetworkStatus']();
		}

		/**
		 * @desc delete temporary message from vuex store
		 * @param {Array<MessageId>} messageIdList
		 */
		deleteTemporaryMessages(messageIdList)
		{
			this.store.dispatch('messagesModel/deleteTemporaryMessages', { ids: messageIdList })
				.catch((errors) => {
					Logger.error('ActionService.deleteTemporaryMessages from store error: ', errors);
				});
		}

		/**
		 * @desc save a message in local or vuex store
		 * @param {Array<MessagesModelState>} modelMessages
		 * @return {Promise}
		 */
		saveMessages(modelMessages)
		{
			return this.saveMessagesToVuexStore(modelMessages).catch(
				(err) => Logger.error('ActionService.saveMessages messagesModel catch', err),
			);
		}

		/**
		 * @desc save a message in vuex store
		 * @param {Array<MessagesModelState>} modelMessages
		 */
		async saveMessagesToVuexStore(modelMessages)
		{
			await this.store.dispatch('messagesModel/setTemporaryMessages', modelMessages);
		}

		/**
		 * @desc update a message and recent
		 * @param {Array<MessagesModelState>} modelMessages
		 * @param {string} dialogId
		 * @param {string} text
		 * @param {boolean} [isDeleted=false]
		 */
		async updateMessage(modelMessages, text, dialogId, isDeleted = false)
		{
			const preparedMessageList = modelMessages.map((message) => {
				const preparedMessage = { ...message, text };
				if (isDeleted)
				{
					preparedMessage.params = { ...message.params, IS_DELETED: 'Y', ATTACH: [] };
				}

				return preparedMessage;
			});

			await this.store.dispatch('messagesModel/updateList', {
				messageList: preparedMessageList,
				// the caller hands over the whole text of the message, so an empty one is a removed text
				allowEmptyText: true,
			});

			const recentItem = clone(this.store.getters['recentModel/getById'](dialogId));
			if (!recentItem)
			{
				return;
			}

			const lastMessage = preparedMessageList.sort((a, b) => b.date.getTime() - a.date.getTime())[0];
			const messageRecentData = clone(lastMessage);
			if (recentItem.message.id === modelMessages[0]?.id)
			{
				messageRecentData.text = ChatMessengerCommon.purifyText(text, messageRecentData.params);
				messageRecentData.file = Array.isArray(messageRecentData.files) && messageRecentData.files.length > 0;

				recentItem.message = {
					...recentItem.message,
					...messageRecentData,
				};

				recentItem.date_update = new Date();
			}

			recentItem.writing = false;
			await this.store.dispatch('recentModel/set', [recentItem]);
		}

		/**
		 * @desc full delete messages
		 * @param {Array<MessagesModelState>} modelMessages
		 * @param {string} dialogId
		 */
		async fullDeleteMessage(modelMessages, dialogId)
		{
			const idList = modelMessages.map((message) => message.id);

			await this.store.dispatch('messagesModel/deleteByIdList', { idList })
				.catch((error) => Logger.error(`${this.constructor.name}.fullDeleteMessage catch:`, error))
			;

			const recentItem = clone(this.store.getters['recentModel/getById'](dialogId));
			if (!recentItem)
			{
				return false;
			}

			const currentRecentMessageId = recentItem.message?.id;
			const deletedRecentMessage = modelMessages.find((modelMessage) => {
				if (modelMessage.id === currentRecentMessageId)
				{
					return modelMessage;
				}

				return false;
			});

			if (Type.isNil(deletedRecentMessage))
			{
				return false;
			}

			const messages = this.store.getters['messagesModel/getByChatId'](modelMessages[0].chatId);
			const newLastMessage = Type.isArrayFilled(messages) ? messages[messages.length - 1] : null;
			let newRecentItem = recentItem;
			if (recentItem.uploadingState?.message?.id === deletedRecentMessage.id)
			{
				newRecentItem = {
					...recentItem,
					uploadingState: null,
				};
			}
			else if (newLastMessage)
			{
				newRecentItem.message = {
					text: newLastMessage.text,
					date: newLastMessage.date,
					author_id: newLastMessage.authorId,
					id: newLastMessage.id,
					file: newLastMessage.files ? (newLastMessage.files.length > 0) : false,
				};

				newRecentItem.lastActivityDate = newLastMessage.date;
			}
			else
			{
				await this.store.dispatch('dialoguesModel/update', {
					dialogId,
					fields: {
						lastMessageId: 0,
						lastId: 0,
					},
				}).catch((error) => Logger.error(
					`${this.constructor.name}.fullDeleteMessage.dialoguesModel/update.catch:`,
					error,
				));

				return this.store.dispatch('recentModel/delete', { id: dialogId })
					.catch((error) => Logger.error(
						`${this.constructor.name}.fullDeleteMessage.recentModel/delete.catch:`,
						error,
					));
			}

			const dialogItem = this.store.getters['dialoguesModel/getById'](dialogId);
			await this.updateDialog(
				dialogItem,
				{
					message: {
						senderId: newLastMessage?.authorId,
						id: newLastMessage?.id,
					},
				},
			);

			return this.updateRecentItem(newRecentItem);
		}

		/**
		 * @desc update dialog store and clear views
		 * @param {DialoguesModelState} dialogItem
		 * @param {Object} params
		 * @param {Object} params.message
		 * @param {Number} params.counter
		 * @return {Promise<any>}
		 */
		async updateDialog(dialogItem, params)
		{
			const dialog = dialogItem;

			if (!dialog)
			{
				return Promise.resolve(false);
			}

			const dialogFieldsToUpdate = {};
			if (params.message.id < dialog.lastMessageId)
			{
				dialogFieldsToUpdate.lastMessageId = params.message.id;
			}

			if (params.message.id < dialog.lastReadId)
			{
				dialogFieldsToUpdate.lastId = params.message.id;
			}

			if (Object.keys(dialogFieldsToUpdate).length > 0)
			{
				return this.store.dispatch('dialoguesModel/update', {
					dialogId: dialogItem.dialogId,
					fields: dialogFieldsToUpdate,
				}).then(() => this.store.dispatch('dialoguesModel/clearLastMessageViews', {
					dialogId: dialogItem.dialogId,
				}));
			}

			return Promise.resolve(false);
		}

		/**
		 * @param {RecentModelState} recentItem
		 * @returns {Promise<any>}
		 */
		async updateRecentItem(recentItem)
		{
			try
			{
				await this.store.dispatch('recentModel/set', [recentItem])
					.then(() => {
						this.saveShareDialogCache();
					})
				;
			}
			catch (error)
			{
				Logger.error(`${this.constructor.name}.updateRecentItem.recentModel/set.catch:`, error);
			}
		}

		/**
		 * @desc is have views on a message
		 * @param {MessagesModelState} modelMessage
		 */
		isViewedByOtherUsers(modelMessage)
		{
			return modelMessage.viewedByOthers;
		}

		saveShareDialogCache()
		{
			this.shareDialogCache.saveRecentItemListThrottled();
		}

		/**
		 * @param {Array<MessageId>} messageIdList
		 * @param {DialogId} dialogId
		 * @param {{ allowEmptyText?: boolean }} [options] a snapshot may carry no text at all, and an
		 *   empty text reaches the model only when the caller asks for it
		 */
		async restoreMessage(messageIdList, dialogId, { allowEmptyText = false } = {})
		{
			const tempMessages = this.store.getters['messagesModel/getTemporaryMessagesByIdList'](messageIdList);
			if (!Type.isArrayFilled(tempMessages))
			{
				return false;
			}

			const updateMessages = [];
			const addMessages = [];
			tempMessages.forEach((message) => {
				// eslint-disable-next-line no-param-reassign
				message.params = { ...message.params, IS_DELETED: 'N' };
				if (this.isViewedByOtherUsers(message))
				{
					return updateMessages.push(message);
				}

				return addMessages.push(message);
			});

			if (updateMessages.length > 0)
			{
				await this.store.dispatch('messagesModel/updateList', {
					messageList: updateMessages,
					allowEmptyText,
				});
			}

			// addList rebuilds the record of the model from the snapshot, and an absent text falls back to
			// the empty default: this branch needs no intent of its own
			if (addMessages.length > 0)
			{
				await this.store.dispatch('messagesModel/addList', { messageList: addMessages });
			}

			const recentItem = clone(this.store.getters['recentModel/getById'](dialogId));
			if (!recentItem)
			{
				return false;
			}

			const messages = this.store.getters['messagesModel/getByChatId'](tempMessages[0].chatId);
			const newLastMessage = Type.isArrayFilled(messages) ? messages[messages.length - 1] : null;
			const newRecentItem = recentItem;
			if (newLastMessage)
			{
				newRecentItem.message = {
					text: newLastMessage.text,
					date: newLastMessage.date,
					author_id: newLastMessage.authorId,
					id: newLastMessage.id,
					file: newLastMessage.files ? (newLastMessage.files.length > 0) : false,
				};

				newRecentItem.lastActivityDate = newLastMessage.date;
			}
			else
			{
				return false;
			}

			return this.updateRecentItem(newRecentItem);
		}
	}

	module.exports = { ActionService };
});
