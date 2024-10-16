/**
 * @module im/messenger/provider/service/classes/sync/fillers/sync-filler-base
 */
jn.define('im/messenger/provider/service/classes/sync/fillers/sync-filler-base', (require, exports, module) => {
	const { Type } = require('type');
	const { DialogType, EventType, ComponentCode } = require('im/messenger/const');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { UserManager } = require('im/messenger/lib/user-manager');
	const { MessageContextCreator } = require('im/messenger/provider/service/classes/message-context-creator');
	const { LoggerManager } = require('im/messenger/lib/logger');
	const logger = LoggerManager.getInstance().getLogger('sync-service');

	/**
	 * @class SyncFillerBase
	 */
	class SyncFillerBase
	{
		constructor()
		{
			this.core = serviceLocator.get('core');
			this.store = this.core.getStore();

			this.userManager = new UserManager(this.store);

			this.dialogRepository = this.core.getRepository().dialog;
			this.userRepository = this.core.getRepository().user;
			this.fileRepository = this.core.getRepository().file;
			this.reactionRepository = this.core.getRepository().reaction;
			this.messageRepository = this.core.getRepository().message;
			this.pinMessageRepository = this.core.getRepository().pinMessage;
			this.recentRepository = this.core.getRepository().recent;

			this.messageContextCreator = new MessageContextCreator();

			this.bindMethods();
			this.subscribeEvents();
		}

		bindMethods()
		{
			this.onSyncRequestResultReceive = this.onSyncRequestResultReceive.bind(this);
		}

		subscribeEvents()
		{
			BX.addCustomEvent(EventType.sync.requestResultReceived, this.onSyncRequestResultReceive);
		}

		/**
		 * @param {object} event
		 * @param {string} event.uuid
		 * @param {SyncListResult} event.result
		 */
		async onSyncRequestResultReceive(event)
		{
			if (!this.checkEventUuid(event.uuid))
			{
				return;
			}

			await this.fillData(event);
		}

		/**
		 * @abstract
		 * @param {object} data
		 * @param {string} data.uuid
		 * @param {SyncListResult} data.result
		 */
		async fillData(data)
		{
			throw new Error('SyncFillerBase.fillData must be override in subclass');
		}

		/**
		 * @abstract
		 * @return {string}
		 *
		 * @desc the method should return a prefix unique for each filler, which determines the need for event processing
		 */
		getUuidPrefix()
		{
			throw new Error('SyncFillerBase.getUuidPrefix must be override in subclass');
		}

		/**
		 * @param {string} uuid
		 * @return {boolean}
		 *
		 * @desc the method should check whether the uuid of the event is valid for this filler or not
		 */
		checkEventUuid(uuid)
		{
			return uuid.startsWith(this.getUuidPrefix());
		}

		/**
		 * @param {SyncListResult} result
		 * @return {SyncListResult}
		 */
		prepareResult(result)
		{
			return result;
		}

		/**
		 * @private
		 * @param {SyncListResult} syncListResult
		 * @return Promise
		 */
		async updateDatabase(syncListResult)
		{
			const {
				messages,
				updatedMessages = {},
				addedChats,
				addedRecent,
				completeDeletedMessages,
				deletedChats,
				addedPins,
				deletedPins,
				dialogIds,
			} = syncListResult;

			const addedChatsWithDialogIds = await this.fillDatabaseFromDialogues(addedChats, dialogIds);
			await this.fillWasCompletelySyncDialogues(addedChatsWithDialogIds, messages.messages);

			await this.fillDatabaseFromMessages(messages, dialogIds);
			await this.updateDatabaseFromMessages(updatedMessages);
			await this.updateDatabaseFromPins(addedPins, deletedPins);

			const deletedChatsIdList = Object.values(deletedChats);
			if (Type.isArrayFilled(deletedChatsIdList))
			{
				await this.dialogRepository.deleteByChatIdList(deletedChatsIdList);
				await this.messageRepository.deleteByChatIdList(deletedChatsIdList);
				await this.pinMessageRepository.deleteByChatIdList(deletedChatsIdList);
			}

			const completeDeletedMessageIdList = Object.values(completeDeletedMessages);
			if (Type.isArrayFilled(completeDeletedMessageIdList))
			{
				await this.messageRepository.deleteByIdList(completeDeletedMessageIdList);
				await this.pinMessageRepository.deleteByMessageIdList(completeDeletedMessageIdList);
			}

			await this.fillDatabaseFromRecent(addedRecent);
		}

		/**
		 *
		 * @param {SyncListResult['messages']} syncMessages
		 * @param {SyncListResult['dialogIds']} dialogIds
		 * @return {Promise<void>}
		 */
		async fillDatabaseFromMessages(syncMessages, dialogIds)
		{
			const {
				users,
				files,
				reactions,
				messages,
			} = syncMessages;

			if (Type.isArrayFilled(users))
			{
				await this.userRepository.saveFromRest(users);
			}

			if (Type.isArrayFilled(files))
			{
				await this.fileRepository.saveFromRest(files);
			}

			if (Type.isArrayFilled(reactions))
			{
				await this.reactionRepository.saveFromRest(reactions);
			}

			const messagesLinkedList = await this.messageContextCreator.createMessageLinkedListForSyncResult(
				messages,
				dialogIds,
			);
			if (Type.isArrayFilled(messagesLinkedList))
			{
				await this.messageRepository.saveFromRest(messagesLinkedList);
			}
		}

		/**
		 * @param {SyncListResult['addedChats']} addedChats
		 * @param {SyncListResult['dialogIds']} dialogIds
		 *
		 * @return {Promise<Array>}
		 */
		async fillDatabaseFromDialogues(addedChats, dialogIds)
		{
			if (Type.isArrayFilled(addedChats))
			{
				const addedChatsWithDialogIds = [];
				addedChats.forEach((chat) => {
					const chatId = chat.id;
					const dialogId = chat.dialogId;
					if (chatId && !dialogId)
					{
						// eslint-disable-next-line no-param-reassign
						chat.dialogId = dialogIds[chatId];
					}

					addedChatsWithDialogIds.push(chat);
				});

				await this.dialogRepository.saveFromRest(addedChatsWithDialogIds);

				return addedChatsWithDialogIds;
			}

			return [];
		}

		/**
		 * @param {SyncListResult['addedChats']} addedChats
		 * @param {SyncListResult['messages']['messages']} messages
		 * @return {Promise<void>}
		 */
		async fillWasCompletelySyncDialogues(addedChats, messages)
		{
			const messageIdCollection = {};
			messages.forEach((message) => {
				messageIdCollection[message.id] = true;
			});

			const completelySyncDialogIdList = [];
			addedChats.forEach((chat) => {
				if (messageIdCollection[chat.last_message_id])
				{
					completelySyncDialogIdList.push(chat.dialogId);
				}
			});

			if (Type.isArrayFilled(completelySyncDialogIdList))
			{
				await this.dialogRepository.setWasCompletelySyncByIdList(completelySyncDialogIdList, true);
			}
		}

		/**
		 * @param {SyncListResult['addedRecent']} addedRecent
		 * @return {Promise<void>}
		 */
		async fillDatabaseFromRecent(addedRecent)
		{
			const recentUsers = [];
			addedRecent.forEach((recentItem) => {
				if (recentItem.user)
				{
					recentUsers.push(recentItem.user);
				}
			});

			if (Type.isArrayFilled(recentUsers))
			{
				await this.userRepository.saveFromRest(recentUsers);
			}

			if (Type.isArrayFilled(addedRecent))
			{
				await this.recentRepository.saveFromRest(addedRecent);
			}
		}

		/**
		 *
		 * @param {SyncListResult['updatedMessages']} updatedMessages
		 * @return {Promise<void>}
		 */
		async updateDatabaseFromMessages(updatedMessages)
		{
			const {
				users,
				files,
				reactions,
				messages,
			} = updatedMessages;

			if (Type.isArrayFilled(users))
			{
				await this.userRepository.saveFromRest(users);
			}

			if (Type.isArrayFilled(files))
			{
				await this.fileRepository.saveFromRest(files);
			}

			if (Type.isArrayFilled(reactions))
			{
				await this.reactionRepository.saveFromRest(reactions);
			}

			if (Type.isArrayFilled(messages))
			{
				logger.log('SyncService: updatedMessages', messages);

				const updatedMessageIdList = messages.map((message) => message.id);
				const existingMessages = await this.messageRepository.messageTable.getListByIds(updatedMessageIdList, false);
				const existingMessagesIdCollection = {};
				existingMessages.items.forEach((message) => {
					existingMessagesIdCollection[message.id] = true;
				});

				const updatedMessagesToSave = messages.filter((message) => existingMessagesIdCollection[message.id]);
				if (Type.isArrayFilled(updatedMessagesToSave))
				{
					logger.log('SyncService: updatedMessagesToSave', updatedMessagesToSave);

					await this.messageRepository.saveFromRest(updatedMessagesToSave);
				}
			}
		}

		/**
		 *
		 * @param {SyncListResult['addedPins']} addedPins
		 * @param {SyncListResult['deletedPins']} deletedPins
		 * @return {Promise<void>}
		 */
		async updateDatabaseFromPins(addedPins, deletedPins)
		{
			const {
				additionalMessages,
				users,
				pins,
				files,
			} = addedPins;

			if (Type.isArrayFilled(users))
			{
				await this.userRepository.saveFromRest(users);
			}

			if (Type.isArrayFilled(files))
			{
				await this.fileRepository.saveFromRest(files);
			}

			if (Type.isArrayFilled(pins) && Type.isArrayFilled(additionalMessages))
			{
				await this.pinMessageRepository.saveFromRest(pins, additionalMessages);
			}

			const deletedPinIdList = Object.values(deletedPins);
			if (Type.isArrayFilled(deletedPinIdList))
			{
				await this.pinMessageRepository.deletePinsByIdList(deletedPinIdList);
			}
		}

		/**
		 * @private
		 * @param {SyncListResult} syncListResult
		 * @return Promise
		 */
		async updateModels(syncListResult)
		{
			const {
				messages,
				addedChats,
				addedRecent,
				completeDeletedMessages,
				addedPins,
				deletedPins,
				deletedChats,
				dialogIds,
			} = syncListResult;

			const {
				users,
				files,
				reactions,
			} = messages;
			const messagesToSave = messages.messages;

			const pinnedUsers = addedPins.users ?? [];
			const recentUsers = addedRecent.map((recentItem) => recentItem.user) ?? [];
			const pinnedFiles = addedPins.files ?? [];

			const filteredUsers = [...users, ...pinnedUsers, ...recentUsers].filter((user) => user.id !== 0);
			const usersUniqueCollection = [...new Map(filteredUsers.map((user) => [user.id, user])).values()];
			const usersPromise = this.store.dispatch('usersModel/set', usersUniqueCollection);

			const addedChatsWithDialogIds = addedChats.map((chat) => {
				const dialog = chat;
				const chatId = dialog.id;
				const dialogId = dialog.dialogId;
				if (chatId && !dialogId)
				{
					// eslint-disable-next-line no-param-reassign
					chat.dialogId = dialogIds[chatId];
				}

				return dialog;
			});

			const dialoguesPromise = this.store.dispatch('dialoguesModel/set', addedChatsWithDialogIds);
			const filesPromise = this.store.dispatch('filesModel/set', [...files, ...pinnedFiles]);
			const reactionPromise = this.store.dispatch('messagesModel/reactionsModel/set', {
				reactions,
			});

			const pinPromises = [
				this.store.dispatch('messagesModel/pinModel/deleteByIdList', {
					idList: Object.values(deletedPins ?? []),
				}),
				this.store.dispatch('messagesModel/pinModel/setList', {
					pins: addedPins.pins ?? [],
					messages: addedPins.additionalMessages ?? [],
				}),
			];

			await Promise.all([
				usersPromise,
				dialoguesPromise,
				filesPromise,
				reactionPromise,
			]);

			await Promise.all(pinPromises);

			await this.store.dispatch('recentModel/update', addedRecent);

			if (deletedChats)
			{
				for await (const keyId of Object.keys(deletedChats))
				{
					let dialogId = dialogIds[keyId];
					if (!dialogId)
					{
						const dialog = this.store.getters['dialoguesModel/getByChatId'](keyId); // FIXME remove this check by dialogData when will backend always returned dialogIds with chatId
						if (dialog && dialog.dialogId)
						{
							dialogId = dialog.dialogId;
						}
					}

					this.store.dispatch('recentModel/delete', { id: dialogId ?? keyId });
				}
			}

			const openChatIdList = this.getOpenChatsToAddMessages();
			if (!Type.isArrayFilled(openChatIdList))
			{
				return Promise.resolve();
			}

			const openChatsMessages = messagesToSave.filter((message) => {
				return openChatIdList.includes(message.chat_id);
			});

			const completeDeletedMessageIdList = Object.values(completeDeletedMessages);
			const messagesPromise = [
				this.store.dispatch('messagesModel/setChatCollection', {
					messages: openChatsMessages,
				}),
				this.store.dispatch('messagesModel/deleteByIdList', {
					idList: completeDeletedMessageIdList,
				}),
				this.store.dispatch('messagesModel/pinModel/deleteMessagesByIdList', {
					idList: completeDeletedMessageIdList,
				}),
			];

			return Promise.all(messagesPromise);
		}

		/**
		 * @private
		 * @return Number[]
		 */
		getOpenChatsToAddMessages()
		{
			const openDialogs = this.store.getters['applicationModel/getOpenDialogs']();
			const openChats = this.store.getters['dialoguesModel/getByIdList'](openDialogs);
			const openChatIdList = [];
			openChats.forEach((chat) => {
				if (chat.inited && chat.hasNextPage === false)
				{
					openChatIdList.push(chat.chatId);
				}
			});

			return openChatIdList;
		}

		/**
		 *
		 * @param {Array<RawChat>} addedChats
		 * @return {Array<number>}
		 */
		findCopilotChatIds(addedChats)
		{
			const result = [];
			for (const chat of addedChats)
			{
				if (chat.type === DialogType.copilot)
				{
					result.push(chat.id);
				}
			}

			return result;
		}

		/**
		 * @param {Array<RawMessage>} messages
		 * @param {Array<number>} copilotChatIds
		 * @return {Array<number>}
		 */
		findCopilotMessageIds(messages, copilotChatIds)
		{
			const result = [];

			for (const message of messages)
			{
				if (copilotChatIds.includes(message.chat_id))
				{
					result.push(message.id);
				}
			}

			return result;
		}
	}

	module.exports = {
		SyncFillerBase,
	};
});
