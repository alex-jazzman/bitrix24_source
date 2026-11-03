/**
 * @module im/messenger/controller/sidebar-v2/user-actions/participants/src/rest-service
 */
jn.define(
	'im/messenger/controller/sidebar-v2/user-actions/participants/src/rest-service',
	(require, exports, module) => {
		const { Type } = require('type');
		const { PerfPoint } = require('debug/prism');
		const { getLogger } = require('im/messenger/lib/logger');
		const { MessengerEmitter } = require('im/messenger/lib/emitter');
		const { ChatService } = require('im/messenger/provider/services/chat');
		const { MemberEntitySelector } = require('im/messenger/controller/selector/member-entity');
		const { serviceLocator } = require('im/messenger/lib/di/service-locator');
		const { ComponentCode, EventType } = require('im/messenger/const');

		const logger = getLogger('sidebar--sidebar-rest-service');

		const CHAT_SETTINGS_STORAGE_KEY = 'settings.chat';

		/**
		 * @desc Hands the selection of the member selector over to the chat and tells the user how it
		 * went. The split of the selection and the calls themselves belong to the selector.
		 * @param {DialogId} dialogId
		 * @param {Array<MemberEntity>} addedEntities the part of the selection the chat does not have
		 * yet: the selector counts it against the composition the window was opened with
		 * @return {Promise<void>}
		 */
		async function addParticipants(dialogId, addedEntities)
		{
			const dialog = serviceLocator.get('core').getStore().getters['dialoguesModel/getById'](dialogId);
			if (!dialog)
			{
				logger.error('ParticipantsRestService.addParticipants: unknown dialog', dialogId);

				return;
			}

			// One tap costs two requests at most, and they are the calls themselves: the delta comes
			// counted from the selector. `Confirm Access` holds the wait for the user as well, so that
			// its time is told apart from the time of the calls.
			const point = new PerfPoint('IM Add Members Submit', `dialog ${dialogId}`).start();

			try
			{
				const chatService = new ChatService();

				// The two calls take people and nodes and nothing else, so an element of any other type
				// never reaches the server. It is reported instead of being dropped: silence here reads
				// as "the whole selection went through".
				const {
					userIds,
					structureNodes,
					unsupportedEntities,
				} = MemberEntitySelector.splitEntities(addedEntities);

				if (userIds.length === 0 && structureNodes.length === 0)
				{
					// The alert waits for the user, so the measurement stops before it.
					point.end();
					await MemberEntitySelector.showUnsupportedEntitiesError(unsupportedEntities);

					return;
				}

				point.startPoint('Confirm Access');
				const isConfirmed = await MemberEntitySelector.confirmAdditionToProjectChildChat(dialog, addedEntities);
				point.endPoint('Confirm Access', { isConfirmed });
				if (!isConfirmed)
				{
					return;
				}

				const chatSettings = Application.storage.getObject(CHAT_SETTINGS_STORAGE_KEY, {
					historyShow: true,
				});

				const { usersErrors, nodesErrors } = await MemberEntitySelector.sendEntities({
					chatService,
					chatId: dialog.chatId,
					userIds,
					structureNodes,
					historyShow: chatSettings.historyShow,
					probe: {
						onUsersCallStart: () => point.startPoint('Add Users'),
						onUsersCallEnd: () => point.endPoint('Add Users', { itemsCount: userIds.length }),
						onNodesCallStart: () => point.startPoint('Link Nodes'),
						onNodesCallEnd: () => point.endPoint('Link Nodes', { itemsCount: structureNodes.length }),
					},
				});

				// The alerts below wait for the user to dismiss them, so the measurement stops with
				// the calls. The `finally` below only covers the branches that never get here.
				point.end();

				// The linking is confirmed before the alerts and not after them: an alert dismissed with
				// the system back button never resolves, and word of what went through must not wait on
				// word of what did not.
				if (nodesErrors === null)
				{
					MemberEntitySelector.showStructureNodesLinkedToast(structureNodes.length);
				}

				await MemberEntitySelector.showCallError(usersErrors);
				await MemberEntitySelector.showCallError(nodesErrors);
				await MemberEntitySelector.showUnsupportedEntitiesError(unsupportedEntities);
			}
			catch (errors)
			{
				logger.error('ParticipantsRestService.addParticipants.catch:', errors);

				// The alert waits for the user, so the measurement stops before it.
				point.end();

				// A failure of the handler is told about in the words a refused call is told about by:
				// this entry point has nothing of its own to say it with. A throw is not a list of errors
				// of the server, so what is not a list goes on as an empty one. The failure is passed on
				// as well: the caller settles its own promise by it.
				await MemberEntitySelector.showCallError(Type.isArray(errors) ? errors : []);

				throw errors;
			}
			finally
			{
				point.end();
			}
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
