/**
 * @module im/messenger/controller/sidebar-v2/user-actions/participants/src/rest-service
 */
jn.define(
	'im/messenger/controller/sidebar-v2/user-actions/participants/src/rest-service',
	(require, exports, module) => {
		const { getLogger } = require('im/messenger/lib/logger');
		const { MessengerEmitter } = require('im/messenger/lib/emitter');
		const { ChatService } = require('im/messenger/provider/services/chat');
		const { serviceLocator } = require('im/messenger/lib/di/service-locator');
		const { EventType, ComponentCode } = require('im/messenger/const');

		const logger = getLogger('sidebar--sidebar-rest-service');

		/**
		 * @desc Rest call add participant
		 * @param {DialogId} dialogId
		 * @param {Array<numbers>} userIds
		 * @return {Promise}
		 */
		async function addParticipants(dialogId, userIds)
		{
			const dialog = serviceLocator.get('core').getStore().getters['dialoguesModel/getById'](dialogId);
			if (!dialog)
			{
				logger.error('ParticipantsRestService.addParticipants: unknown dialog', dialogId);

				return null;
			}

			const chatSettings = Application.storage.getObject('settings.chat', {
				historyShow: true,
			});

			const response = await new ChatService()
				.addToChat(dialog.chatId, userIds, chatSettings.historyShow)
				.catch((error) => {
					logger.error('ParticipantsRestService.addParticipants.catch:', error);
				});

			if (response)
			{
				logger.log('ParticipantsRestService.addParticipants response: ', response);
			}

			return response;
		}

		/**
		 * @desc Rest call add chat from private dialog. Opens the new chat after creation.
		 * @param {Array<numbers>} userIds
		 * @return {Promise<{chatId: number, dialogId: string}|null>}
		 */
		async function addChat(userIds)
		{
			const newChat = await new ChatService()
				.createChatFromPrivate(userIds)
				.catch((error) => {
					logger.error('ParticipantsRestService.addChat.catch:', error);

					return null;
				});

			if (!newChat)
			{
				return null;
			}

			setTimeout(() => {
				MessengerEmitter.emit(
					EventType.messenger.openDialog,
					{ dialogId: newChat.dialogId },
					ComponentCode.imMessenger,
				);
			}, 500);

			return newChat;
		}

		/**
		 * @desc Rest call delete participant by id
		 * @param {DialogId} dialogId
		 * @param {number} userId
		 * @return {Promise<boolean>}
		 */
		function deleteParticipant(dialogId, userId)
		{
			return (new ChatService()).kickUserFromChat(dialogId, userId);
		}

		module.exports = {
			addChat,
			addParticipants,
			deleteParticipant,
		};
	},
);
