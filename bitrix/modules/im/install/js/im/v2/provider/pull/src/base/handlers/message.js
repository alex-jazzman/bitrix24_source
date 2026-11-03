import { Type } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { type Store } from 'ui.vue3.vuex';

import { Core } from 'im.v2.application.core';
import { EventType, DialogScrollThreshold, UserRole, CopilotSimpleReasoningPlanField } from 'im.v2.const';
import { CopilotManager } from 'im.v2.lib.copilot';
import { CopilotSimpleStatus } from 'im.v2.lib.copilot-simple-status';
import { DeliveryWatchdog } from 'im.v2.lib.delivery-watchdog';
import { InputActionListener } from 'im.v2.lib.input-action';
import { Logger } from 'im.v2.lib.logger';
import { UserManager } from 'im.v2.lib.user';
import { type ImModelChat, type ImModelMessage } from 'im.v2.model';
import { MessageService } from 'im.v2.provider.service.message';

import { type RawFile, type RawUser, type RawMessage } from '../../types/common';
import {
	type MessageAddParams,
	type MessageUpdateParams,
	type MessageDeleteParams,
	type MessageDeleteCompleteParams,
	type MultipleMessageDeleteParams,
	type ReadMessageParams,
	type ReadMessageOpponentParams,
	type PinAddParams,
	type PinDeleteParams,
	type AddReactionParams,
	type DeleteReactionParams,
	type MessageDeleteCompletePreparedParams,
	type PrepareDeleteMessageParams,
	type RawReaction,
	type MessageBlockElementAppendParams,
	type MessageBlockElementDeleteParams,
	type MessageBlockElementUpdateParams,
} from '../../types/message';
import { MessageDeleteManager } from './classes/message-delete-manager';
import { AiPullHandler } from './ai';
import { NewMessageManager } from '../../classes/new-message-manager';

type UserId = number;

export class MessagePullHandler
{
	#store: Store;
	#messageViews: {[messageId: string]: Set<UserId>} = {};
	#messageDeleteManager: MessageDeleteManager;
	#aiPullHandler: AiPullHandler;
	#copilotSimpleStatus: CopilotSimpleStatus;

	constructor()
	{
		this.#store = Core.getStore();
		this.#messageDeleteManager = new MessageDeleteManager();
		this.#aiPullHandler = new AiPullHandler();
		// Taken here, at messenger boot: the player also picks up placeholders that come back with a
		// history load, and such a turn has no pull event of its own to wake it up.
		this.#copilotSimpleStatus = CopilotSimpleStatus.getInstance();
	}

	handleMessageAdd(params: MessageAddParams)
	{
		Logger.warn('MessagePullHandler: handleMessageAdd', params);
		this.#setMessageChat(params);
		this.#setUsers(params.users);
		this.#setFiles(params);
		this.#setAdditionalEntities(params);
		this.#setCommentInfo(params);
		this.#setCopilotData(params);
		this.#setMessagesAutoDeleteConfig(params);
		this.#setStickers(params);
		this.#setBuilder(params.message);
		this.#aiPullHandler.handleAiTaskTriggerMessage(params.chatId, params.message);

		const messageWithTemplateId = this.#store.getters['messages/isInChatCollection']({
			messageId: params.message.templateId,
		});

		const messageWithRealId = this.#store.getters['messages/isInChatCollection']({
			messageId: params.message.id,
		});

		// update message with parsed link info
		if (messageWithRealId)
		{
			Logger.warn('New message pull handler: we already have this message', params.message);
			void this.#store.dispatch('messages/update', {
				id: params.message.id,
				fields: { ...this.#withKnownForwardTitle(params.message.id, params.message), error: false },
			});
			this.#sendScrollEvent(params.chatId);
		}
		else if (!messageWithRealId && messageWithTemplateId)
		{
			Logger.warn('New message pull handler: we already have the TEMPORARY message', params.message);
			void this.#store.dispatch('messages/updateWithId', {
				id: params.message.templateId,
				fields: {
					...this.#withKnownForwardTitle(params.message.templateId, params.message),
					error: false,
				},
			});
		}
		// it's an opponent message or our own message from somewhere else
		else if (!messageWithRealId && !messageWithTemplateId)
		{
			Logger.warn('New message pull handler: we dont have this message', params.message);
			this.#handleAddingMessageToModel({
				...params,
				message: this.#withLocalParentChatName(params.message),
			});
		}

		// the loading message has to be dropped no matter which branch handled the message
		const hasLoadingMessage: boolean = this.#store.getters['messages/hasLoadingMessageByMessageId'](
			params.message.templateId,
		);
		if (hasLoadingMessage)
		{
			void this.#store.dispatch('messages/delete', {
				id: params.message.templateId,
			});
		}

		InputActionListener.getInstance().stopAction({
			userId: params.message.senderId,
			dialogId: params.dialogId,
		});

		DeliveryWatchdog.getInstance().schedule(params.message);

		this.#updateDialog(params);
		this.#syncCopilotSimpleReasoning(params.message.id);
	}

	handleMessageUpdate(params: MessageUpdateParams)
	{
		Logger.warn('MessagePullHandler: handleMessageUpdate', params);
		InputActionListener.getInstance().stopAction({
			userId: params.senderId,
			dialogId: params.dialogId,
		});
		// Before the composition: it comes as file ids in params, and the files getter has nothing
		// to return for an id whose entity is not in the model yet.
		this.#setFiles(params);
		this.#store.dispatch('messages/update', {
			id: params.id,
			fields: {
				text: params.text,
				params: params.params,
			},
		});
		this.#setBuilder(params);
		this.#sendScrollEvent(params.chatId);
		this.#syncCopilotSimpleReasoning(params.id);
	}

	handleMessageDeleteV2(params: MultipleMessageDeleteParams)
	{
		Logger.warn('MessageDeletePullHandler: handleMultipleMessageDelete', params);

		const messages = params.messages;

		messages.forEach((message) => {
			this.#copilotSimpleStatus.stop(message.id);
			DeliveryWatchdog.getInstance().cancel(message.id);

			if (message.completelyDeleted)
			{
				const preparedParams = this.#prepareDeleteMessageParams(params, true, message);
				this.#messageDeleteManager.deleteMessageComplete(preparedParams);

				return;
			}

			const preparedParams = this.#prepareDeleteMessageParams(params, false, message);
			this.#messageDeleteManager.deleteMessage(preparedParams);
		});
	}

	handleMessageDelete(params: MessageDeleteParams)
	{
		Logger.warn('MessageDeletePullHandler: handleMessageDelete', params);
		this.#copilotSimpleStatus.stop(params.id);
		DeliveryWatchdog.getInstance().cancel(params.id);
		const preparedParams = this.#prepareDeleteMessageParams(params);
		this.#messageDeleteManager.deleteMessage(preparedParams);
	}

	handleMessageDeleteComplete(params: MessageDeleteCompleteParams)
	{
		Logger.warn('MessageDeletePullHandler: handleMessageDeleteComplete', params);
		this.#copilotSimpleStatus.stop(params.id);
		DeliveryWatchdog.getInstance().cancel(params.id);
		const preparedParams = this.#prepareDeleteMessageParams(params, true);
		this.#messageDeleteManager.deleteMessageComplete(preparedParams);
	}

	handleAddReaction(params: AddReactionParams)
	{
		Logger.warn('MessagePullHandler: handleAddReaction', params);
		const {
			actualReactions: { reaction: actualReactionsState, usersShort },
			userId,
			reaction,
		} = params;

		if (Core.getUserId() === userId)
		{
			actualReactionsState.ownReactions = [reaction];
		}

		const userManager = new UserManager();
		void userManager.addUsersToModel(usersShort);

		void this.#store.dispatch('messages/reactions/set', [actualReactionsState]);
	}

	handleDeleteReaction(params: DeleteReactionParams)
	{
		Logger.warn('MessagePullHandler: handleDeleteReaction', params);
		const { actualReactions: { reaction: rawReaction }, reaction: reactionType, userId } = params;

		const newReactionItem: RawReaction = { ...rawReaction };

		if (Core.getUserId() === userId)
		{
			newReactionItem.ownReactionsToRemove = [reactionType];
		}

		void this.#store.dispatch('messages/reactions/set', [newReactionItem]);
	}

	handleMessageParamsUpdate(params)
	{
		Logger.warn('MessagePullHandler: handleMessageParamsUpdate', params);

		this.#store.dispatch('messages/update', {
			id: params.id,
			chatId: params.chatId,
			fields: { params: params.params },
		});
		this.#syncCopilotSimpleReasoning(params.id);

		const rawSending = params.params?.SENDING;
		if (rawSending === 'Y')
		{
			DeliveryWatchdog.getInstance().schedule({ id: params.id, params: params.params });
		}
		else if (!Type.isUndefined(rawSending))
		{
			DeliveryWatchdog.getInstance().cancel(params.id);
		}
	}

	handleReadMessage(params: ReadMessageParams)
	{
		Logger.warn('MessagePullHandler: handleReadMessage', params);
		const { chatId, dialogId, viewedMessages, lastId, exact } = params;

		void this.#store.dispatch('messages/readMessages', {
			chatId,
			messageIds: viewedMessages,
			exact,
		});

		// Exact read: the server cursor didn't move, lastId here is the old value.
		// Don't update lastReadId so the cursor isn't rolled back. Normal read (no flag) —
		// prior behavior.
		if (!exact)
		{
			void this.#store.dispatch('chats/update', {
				dialogId,
				fields: { lastId },
			});
		}
	}

	handleReadMessageOpponent(params: ReadMessageOpponentParams)
	{
		if (params.userId === Core.getUserId())
		{
			return;
		}
		Logger.warn('MessagePullHandler: handleReadMessageOpponent', params);
		this.#updateMessageViewedByOthers(params);
		this.#updateChatLastMessageViews(params);
	}

	handlePinAdd(params: PinAddParams)
	{
		Logger.warn('MessagePullHandler: handlePinAdd', params);
		this.#setFiles(params);
		this.#setUsers(params.users);
		this.#store.dispatch('messages/store', params.additionalMessages);
		this.#store.dispatch('messages/pin/add', {
			chatId: params.pin.chatId,
			messageId: params.pin.messageId,
		});
		if (Core.getUserId() !== params.pin.authorId)
		{
			// this.#sendScrollEvent(params.link.chatId);
		}
	}

	handlePinDelete(params: PinDeleteParams)
	{
		Logger.warn('MessagePullHandler: handlePinDelete', params);
		this.#store.dispatch('messages/pin/delete', {
			chatId: params.chatId,
			messageId: params.messageId,
		});
	}

	handleMessageBlockElementAppend(params: MessageBlockElementAppendParams)
	{
		Logger.warn('MessagePullHandler: handleMessageBlockElementAppend', params);
		const { element, messageId, text, chatId, files } = params;
		void this.#store.dispatch('messages/builder/appendBlock', { messageId, block: element });
		this.#updateMessageText(messageId, text);
		void this.#store.dispatch('files/set', files);
		// incoming content, not a user action: follow it only while the user stays at the bottom,
		// otherwise the appended block (the BitrixGPT "Thinking" status) steals the reading position
		this.#sendScrollEvent(chatId);
	}

	handleMessageBlockElementUpdate(params: MessageBlockElementUpdateParams)
	{
		Logger.warn('MessagePullHandler: handleMessageBlockElementUpdate', params);
		const { element, elementId, messageId, text, files } = params;
		void this.#store.dispatch('messages/builder/updateBlock', { messageId, blockId: elementId, block: element });
		this.#updateMessageText(messageId, text);
		void this.#store.dispatch('files/set', files);
	}

	handleMessageBlockElementDelete(params: MessageBlockElementDeleteParams)
	{
		Logger.warn('MessagePullHandler: handleMessageBlockElementDelete', params);
		const { elementId, messageId, text } = params;
		void this.#store.dispatch('messages/builder/deleteBlock', { messageId, blockId: elementId });
		this.#updateMessageText(messageId, text);
	}

	// helpers
	#setMessageChat(params: MessageAddParams)
	{
		const manager = new NewMessageManager(params);

		const chat = manager.getChat();
		if (!chat)
		{
			return;
		}

		const chatToAdd = { ...chat, dialogId: params.dialogId };
		const dialogExists = Boolean(this.#getDialog(params.dialogId));
		const messageWithoutNotification = !params.notify || params.message?.params?.NOTIFY === 'N';
		if (!dialogExists && !messageWithoutNotification && !chatToAdd.role)
		{
			chatToAdd.role = UserRole.member;
		}

		void this.#store.dispatch('chats/set', chatToAdd);
	}

	#setUsers(users: {[userId: string]: RawUser} | [])
	{
		if (!users)
		{
			return;
		}

		const userManager = new UserManager();
		userManager.setUsersToModel(Object.values(users));
	}

	#setFiles(params: {files: {[fileId: string]: RawFile} | [], message?: RawMessage})
	{
		if (!params.files)
		{
			return;
		}

		void this.#store.dispatch('files/set', Object.values(params.files));
	}

	#setAdditionalEntities(params: MessageAddParams): void
	{
		if (!params.message.additionalEntities)
		{
			return;
		}

		const {
			additionalMessages,
			messages,
			files,
			users,
			stickers,
		} = params.message.additionalEntities;
		const newMessages = [...messages, ...additionalMessages];
		void this.#store.dispatch('messages/store', newMessages);
		void this.#store.dispatch('files/set', files);
		void this.#store.dispatch('users/set', users);
		void this.#store.dispatch('stickers/set', stickers);
		this.#setBuilder(newMessages);
	}

	#setCommentInfo(params: MessageAddParams): void
	{
		const manager = new NewMessageManager(params);

		const chat = manager.getChat();
		if (!chat || !manager.isCommentChat())
		{
			return;
		}

		this.#store.dispatch('messages/comments/set', {
			messageId: chat.parent_message_id,
			chatId: params.chatId,
			messageCount: chat.message_count,
		});
		this.#store.dispatch('messages/comments/setLastUser', {
			messageId: chat.parent_message_id,
			newUserId: params.message.senderId,
		});
	}

	/**
	 * An event never carries the name of the discussion a fragment was forwarded from: the name is
	 * personal to the reader, so the server resolves it per request. Blanking it belongs to a request
	 * that resolved it, so an event arriving without it keeps the name the client already has.
	 */
	#withKnownForwardTitle(storedMessageId: number | string, message: RawMessage): RawMessage
	{
		if (!Type.isPlainObject(message.forward) || Type.isStringFilled(message.forward.chatTitle))
		{
			return message;
		}

		const storedMessage: ?ImModelMessage = this.#store.getters['messages/getById'](storedMessageId);
		const knownTitle = storedMessage?.forward?.chatTitle;
		if (!Type.isStringFilled(knownTitle))
		{
			return this.#withLocalParentChatName(message);
		}

		return { ...message, forward: { ...message.forward, chatTitle: knownTitle } };
	}

	/**
	 * The reader side of the caption: an event brought somebody else's message, there is no stored name
	 * to keep and nothing re-reads the message afterwards. The name is resolved only while the reader
	 * holds the parent chat loaded - records that arrive within recent carry no inited flag - so for the
	 * rest of the chats the caption stays nameless until the next read of the feed, which is the
	 * expected state and not a gap to be filled from somewhere else.
	 *
	 * The author of a forward names the source through a path of its own and needs no confirmed state
	 * there: see #describeForwardSource of im.v2.provider.service.sending.
	 */
	#withLocalParentChatName(message: RawMessage): RawMessage
	{
		if (!Type.isPlainObject(message.forward) || !(message.forward.parentChatId > 0))
		{
			return message;
		}

		const parentChat: ?ImModelChat = this.#store.getters['chats/getByChatId'](message.forward.parentChatId);
		// inited is best-effort, not an access check: a record outlives the access to it. Leaving a chat
		// merely drops the flag, a hidden relation drops nothing at all, and an event that never arrives
		// leaves it set until the page is reloaded. The access is checked by the server on every read.
		if (parentChat?.inited !== true || !Type.isStringFilled(parentChat.name))
		{
			return message;
		}

		return { ...message, forward: { ...message.forward, chatTitle: parentChat.name } };
	}

	#handleAddingMessageToModel(params: MessageAddParams)
	{
		const dialog = this.#getDialog(params.dialogId, true);
		if (dialog.hasNextPage)
		{
			this.#store.dispatch('messages/store', params.message);

			return;
		}

		const chatIsOpened = this.#store.getters['application/isChatOpen'](params.dialogId);
		const unreadMessages: ImModelMessage[] = this.#store.getters['messages/getChatUnreadMessages'](params.chatId);
		const RELOAD_LIMIT = MessageService.getMessageRequestLimit() * 5;
		if (dialog.inited && !chatIsOpened && unreadMessages.length > RELOAD_LIMIT)
		{
			void this.#store.dispatch('messages/store', params.message);
			const messageService = new MessageService({ chatId: params.chatId });
			messageService.reloadMessageList();

			return;
		}

		this.#addMessageToModel(params.message);
		this.#sendScrollEvent(params.chatId);
	}

	#addMessageToModel(message)
	{
		const newMessage = { ...message };
		if (message.senderId === Core.getUserId())
		{
			newMessage.unread = false;
		}
		else
		{
			newMessage.unread = true;
			newMessage.viewed = false;
		}
		this.#store.dispatch('messages/setChatCollection', { messages: [newMessage] });
	}

	#updateDialog(params: MessageAddParams)
	{
		const manager = new NewMessageManager(params);
		const { dialogId, chatId, message } = params;

		const dialog = this.#getDialog(dialogId, true);

		const dialogFieldsToUpdate = {};
		if (message.id > dialog.lastMessageId)
		{
			dialogFieldsToUpdate.lastMessageId = message.id;
		}

		if (message.senderId === Core.getUserId() && message.id > dialog.lastReadId)
		{
			dialogFieldsToUpdate.lastId = message.id;
		}

		if (manager.isUserChat() && !dialog.chatId)
		{
			dialogFieldsToUpdate.chatId = chatId;
		}

		void this.#store.dispatch('chats/update', {
			dialogId,
			fields: dialogFieldsToUpdate,
		});
		void this.#store.dispatch('chats/clearLastMessageViews', {
			dialogId,
		});
	}

	#updateMessageViewedByOthers(params: ReadMessageOpponentParams)
	{
		this.#store.dispatch('messages/setViewedByOthers', { ids: params.viewedMessages });
	}

	#updateChatLastMessageViews(params: ReadMessageOpponentParams)
	{
		const dialog = this.#getDialog(params.dialogId);
		if (!dialog)
		{
			return;
		}

		const isLastMessage = params.viewedMessages.includes(dialog.lastMessageId);
		if (!isLastMessage)
		{
			return;
		}

		if (this.#checkMessageViewsRegistry(params.userId, dialog.lastMessageId))
		{
			return;
		}

		const hasFirstViewer = Boolean(dialog.lastMessageViews.firstViewer);
		if (hasFirstViewer)
		{
			this.#store.dispatch('chats/incrementLastMessageViews', {
				dialogId: params.dialogId,
			});
			this.#updateMessageViewsRegistry(params.userId, dialog.lastMessageId);

			return;
		}

		this.#store.dispatch('chats/setLastMessageViews', {
			dialogId: params.dialogId,
			fields: {
				userId: params.userId,
				userName: params.userName,
				date: params.date,
				messageId: dialog.lastMessageId,
			},
		});

		this.#updateMessageViewsRegistry(params.userId, dialog.lastMessageId);
	}

	#checkMessageViewsRegistry(userId: number, messageId: number): boolean
	{
		return Boolean(this.#messageViews[messageId]?.has(userId));
	}

	#updateMessageViewsRegistry(userId: number, messageId: number): void
	{
		if (!this.#messageViews[messageId])
		{
			this.#messageViews[messageId] = new Set();
		}

		this.#messageViews[messageId].add(userId);
	}

	// Block events carry the whole payload text, which stays the same for edits that don't
	// change it (a progress tick, for one). Updating the message anyway replaces its object
	// in the collection and makes the whole loaded chat list re-render for nothing.
	#updateMessageText(messageId: number, text: string): void
	{
		const message: ?ImModelMessage = this.#store.getters['messages/getById'](messageId);
		if (message && message.text === text)
		{
			return;
		}

		void this.#store.dispatch('messages/update', { id: messageId, fields: { text } });
	}

	#sendScrollEvent(
		chatId: number,
		threshold: $Values<typeof DialogScrollThreshold> = DialogScrollThreshold.nearTheBottom,
	)
	{
		EventEmitter.emit(EventType.dialog.scrollToBottom, { chatId, threshold });
	}

	#getDialog(dialogId: string, temporary: boolean = false): ?ImModelChat
	{
		return this.#store.getters['chats/get'](dialogId, temporary);
	}

	#setCopilotData(params)
	{
		if (!params.copilot)
		{
			return;
		}

		const copilotManager = new CopilotManager();
		void copilotManager.handleMessageAdd(params.copilot);
	}

	/**
	 * A reasoning plan on a message is the only sign of a BitrixGPT placeholder in simple mode.
	 * Deletion is a terminal signal handled where it happens, not here: a soft delete leaves the plan
	 * on the message, and reconciling with the model would restart the show on a deleted bubble.
	 */
	#syncCopilotSimpleReasoning(messageId: number | string): void
	{
		const message: ?ImModelMessage = this.#store.getters['messages/getById'](messageId);
		const plan = message?.[CopilotSimpleReasoningPlanField];
		if (plan)
		{
			this.#copilotSimpleStatus.start(messageId, plan);

			return;
		}

		this.#copilotSimpleStatus.stop(messageId);
	}

	#setMessagesAutoDeleteConfig(params: MessageAddParams)
	{
		const { messagesAutoDeleteConfigs } = params;
		void this.#store.dispatch('chats/autoDelete/set', messagesAutoDeleteConfigs);
	}

	#setStickers(params: MessageAddParams)
	{
		const hasMessageSticker = Type.isPlainObject(params.message.params.STICKER_PARAMS);
		if (hasMessageSticker)
		{
			void this.#store.dispatch('stickers/messages/set', [{
				messageId: params.message.id,
				...params.message.params.STICKER_PARAMS,
			}]);
			void this.#store.dispatch('stickers/set', params.stickers);
		}
	}

	#setBuilder(payload: RawMessage | RawMessage[])
	{
		const messages = Type.isArray(payload) ? payload : [payload];

		void this.#store.dispatch('messages/builder/set', messages);
	}

	#prepareDeleteMessageParams(
		params: PrepareDeleteMessageParams,
		isComplete = false,
		message = null,
	): MessageDeleteCompletePreparedParams
	{
		const baseParams = {
			id: message ? message.id : params.id,
			senderId: message ? message.senderId : params.senderId,
			dialogId: params.dialogId,
		};

		if (isComplete)
		{
			return {
				...baseParams,
				newLastMessage: params.newLastMessage,
				lastMessageViews: params.lastMessageViews,
			};
		}

		return baseParams;
	}
}
