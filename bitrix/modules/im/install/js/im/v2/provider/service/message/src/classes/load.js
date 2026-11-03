import { type Store } from 'ui.vue3.vuex';

import { Core } from 'im.v2.application.core';
import { callBatch, runAction } from 'im.v2.lib.rest';
import { UserManager } from 'im.v2.lib.user';
import { Logger } from 'im.v2.lib.logger';
import { RestMethod, ErrorCode } from 'im.v2.const';
import { CopilotManager } from 'im.v2.lib.copilot';
import { Analytics } from 'im.v2.lib.analytics';
import { Notifier } from 'im.v2.lib.notifier';

import { type ImModelChat, type ImModelMessage } from 'im.v2.model';
import {
	type RawMessage,
	type RawCommentInfo,
	type RawTariffRestrictions,
	type RawStickerMessage,
} from 'im.v2.provider.service.types';
import { type PaginationRestResult } from '../types/message';

/**
 * The number of the last context load asked for in a chat, by chat id. A context load replaces the
 * whole collection of its chat and cannot be called back, so the collection belongs to the context
 * asked for LAST and not to the one the network happened to answer first.
 *
 * It is kept beside the class and not inside an instance because the sides asking for a context of
 * one chat do not share a service: the dialog holds one, the send path builds its own to move the
 * chat to its end, and each of them would otherwise count only its own loads. What the count belongs
 * to is the chat whose collection is being replaced - one integer per chat opened in the session.
 */
const lastContextLoadRequest: Map<number, number> = new Map();

export class LoadService
{
	static MESSAGE_REQUEST_LIMIT = 25;

	#store: Store;
	#chatId: number;
	#userManager: UserManager;

	#preparedHistoryMessages: RawMessage[] = [];
	#preparedUnreadMessages: RawMessage[] = [];
	#isLoading: boolean = false;
	#contextLoadsInFlight: number = 0;

	constructor(chatId: number)
	{
		this.#store = Core.getStore();
		this.#userManager = new UserManager();

		this.#chatId = chatId;
	}

	async loadUnread(): Promise
	{
		if (this.#isLoading || !this.#getDialog().hasNextPage)
		{
			return Promise.resolve(false);
		}
		Logger.warn('MessageService: loadUnread');
		const lastUnreadMessageId = this.#store.getters['messages/getLastId'](this.#chatId);
		if (!lastUnreadMessageId)
		{
			Logger.warn('MessageService: no lastUnreadMessageId, cant load unread');

			return Promise.resolve(false);
		}

		this.#isLoading = true;

		const query = {
			chatId: this.#chatId,
			filter: { lastId: lastUnreadMessageId },
			order: { id: 'ASC' },
			limit: LoadService.MESSAGE_REQUEST_LIMIT,
		};

		const result: PaginationRestResult = await runAction(RestMethod.imV2ChatMessageTail, { data: query })
			.catch((error) => {
				console.error('MessageService: loadUnread error:', error);
				this.#isLoading = false;
			});

		Logger.warn('MessageService: loadUnread result', result);
		this.#preparedUnreadMessages = result.messages;

		const rawData: PaginationRestResult = {
			...result,
			tariffRestrictions: this.#prepareTariffRestrictions(result.tariffRestrictions),
		};
		await this.#updateModels(rawData);

		this.#isLoading = false;

		return Promise.resolve();
	}

	async loadHistory(): Promise
	{
		if (this.#isLoading || !this.#getDialog().hasPrevPage)
		{
			return Promise.resolve(false);
		}
		Logger.warn('MessageService: loadHistory');
		const lastHistoryMessageId = this.#store.getters['messages/getFirstId'](this.#chatId);
		if (!lastHistoryMessageId)
		{
			Logger.warn('MessageService: no lastHistoryMessageId, cant load unread');

			return Promise.resolve();
		}

		this.#isLoading = true;

		const query = {
			chatId: this.#chatId,
			filter: { lastId: lastHistoryMessageId },
			order: { id: 'DESC' },
			limit: LoadService.MESSAGE_REQUEST_LIMIT,
		};

		const result: PaginationRestResult = await runAction(RestMethod.imV2ChatMessageTail, { data: query })
			.catch((error) => {
				console.error('MessageService: loadHistory error:', error);
				this.#isLoading = false;
			});

		Logger.warn('MessageService: loadHistory result', result);
		this.#preparedHistoryMessages = result.messages;

		const hasPrevPage = result.hasNextPage;
		const rawData = { ...result, hasPrevPage, hasNextPage: null };
		await this.#updateModels(rawData);

		this.#isLoading = false;

		return Promise.resolve();
	}

	hasPreparedHistoryMessages(): boolean
	{
		return this.#preparedHistoryMessages.length > 0;
	}

	drawPreparedHistoryMessages(): Promise
	{
		if (!this.hasPreparedHistoryMessages())
		{
			return Promise.resolve();
		}

		return this.#store.dispatch('messages/setChatCollection', {
			messages: this.#preparedHistoryMessages,
		}).then(() => {
			this.#preparedHistoryMessages = [];

			return true;
		});
	}

	hasPreparedUnreadMessages(): boolean
	{
		return this.#preparedUnreadMessages.length > 0;
	}

	drawPreparedUnreadMessages(): Promise
	{
		if (!this.hasPreparedUnreadMessages())
		{
			return Promise.resolve();
		}

		return this.#store.dispatch('messages/setChatCollection', {
			messages: this.#preparedUnreadMessages,
		}).then(() => {
			this.#preparedUnreadMessages = [];

			return true;
		});
	}

	async loadFirstPage(): Promise
	{
		Logger.warn('MessageService: loadFirstPage for: ', this.#chatId);
		this.#isLoading = true;

		const payload = {
			data: {
				chatId: this.#chatId,
				limit: LoadService.MESSAGE_REQUEST_LIMIT,
				order: { id: 'ASC' },
			},
		};
		const restResult = await runAction(RestMethod.imV2ChatMessageTail, payload)
			.catch(([error]) => {
				console.error('MessageService: loadFirstPage error:', error);
				this.#isLoading = false;
				throw error;
			});
		Logger.warn('MessageService: loadFirstPage result', restResult);

		await this.#handleLoadedMessages(restResult);
		await this.#store.dispatch('chats/update', {
			dialogId: this.#getDialog().dialogId,
			fields: {
				hasPrevPage: false,
				hasNextPage: restResult.hasNextPage,
			},
		});
		this.#isLoading = false;
	}

	/**
	 * The answer replaces the whole message collection, and the request behind it cannot be called
	 * back. Two things therefore decide whether an answer is still wanted, and they are asked at the
	 * same point - between the answer and the collection, where an answer refused changes nothing at
	 * all and the list stays where the caller left it.
	 *
	 * The first belongs to the load itself and is asked of every caller alike: a context overtaken by
	 * a LATER context of the same chat is not the one the user asked for, whoever asked for either of
	 * them - a jump by date, a message sent while it was loading, a scroll to the end of the chat.
	 * Nobody has to pass anything for it, which is the point: an answer that has stopped being the
	 * last one asked for must not reach the collection even when the caller never thought about it.
	 *
	 * The second is `isActual`, and it says something the count cannot: the caller has moved on to
	 * something newer of ITS own, which is not always a load - a jump to a message already in the
	 * collection only scrolls, and leaves the count exactly where it was while making the context
	 * still on its way unwanted. Left out, every answer that is still the last one requested is
	 * applied, which is the behaviour of a single load.
	 */
	loadContext(messageId: number, options: { isActual?: () => boolean } = {}): Promise
	{
		const { isActual = () => true } = options;
		const query = {
			[RestMethod.imV2ChatMessageGetContext]: {
				id: messageId,
				range: LoadService.MESSAGE_REQUEST_LIMIT,
			},
			[RestMethod.imV2ChatMessageRead]: {
				chatId: this.#chatId,
				ids: [messageId],
			},
		};
		Logger.warn('MessageService: loadContext for: ', messageId);
		this.#contextLoadsInFlight++;
		this.#isLoading = true;
		const requestNumber = this.#numberContextLoadRequest();

		return callBatch(query)
			.then((data) => {
				Logger.warn('MessageService: loadContext result', data);
				const isLastRequested = requestNumber === lastContextLoadRequest.get(this.#chatId);
				if (!isLastRequested || !isActual())
				{
					Logger.warn('MessageService: loadContext for', messageId, 'is not wanted any more');

					return null;
				}

				return this.#handleLoadedMessages(data[RestMethod.imV2ChatMessageGetContext]);
			})
			.catch((error) => {
				this.#sendAnalytics(error);
				Notifier.message.handleLoadContextError(error);
				console.error('MessageService: loadContext error:', error);
			})
			.finally(() => {
				this.#contextLoadsInFlight--;
				// the loading is over for the pagination only once the LAST context is in: a context
				// still on its way replaces the whole collection when it lands, and a page loaded
				// into the meantime would be built on a list about to be thrown away
				this.#isLoading = this.#contextLoadsInFlight > 0;
			});
	}

	#numberContextLoadRequest(): number
	{
		const requestNumber = (lastContextLoadRequest.get(this.#chatId) ?? 0) + 1;
		lastContextLoadRequest.set(this.#chatId, requestNumber);

		return requestNumber;
	}

	async loadContextByChatId(chatId: number): Promise<number>
	{
		const queryParams = {
			data: { commentChatId: chatId },
		};
		const requestNumber = this.#numberContextLoadRequest();
		const result = await runAction(RestMethod.imV2ChatMessageGetContext, queryParams)
			.catch(([error]) => {
				console.error('MessageService: loadContextByChatId error:', error);
				throw error;
			});

		const commentInfo: RawCommentInfo[] = result.commentInfo;
		const targetCommentInfo: ?RawCommentInfo = commentInfo.find((item) => {
			return item.chatId === chatId;
		});
		const targetMessageId = targetCommentInfo?.messageId;

		Logger.warn('MessageService: loadContextByChatId result', result);
		// the same collection and the same rule: the identifier of the post is answered back either
		// way, so the caller can go to it, but the context of a chat overtaken by a later one does
		// not get to replace the list on the way there
		if (requestNumber === lastContextLoadRequest.get(this.#chatId))
		{
			void this.#handleLoadedMessages(result);
		}

		return targetMessageId;
	}

	reloadMessageList(): void
	{
		Logger.warn('MessageService: loadChatOnExit for: ', this.#chatId);
		let targetMessageId = 0;
		if (this.#getDialog().chatId <= 0)
		{
			return;
		}

		if (this.#getDialog().markedId)
		{
			targetMessageId = this.#getDialog().markedId;
		}
		else if (this.#getDialog().savedPositionMessageId)
		{
			targetMessageId = this.#getDialog().savedPositionMessageId;
		}

		const wasInitedBefore = this.#getDialog().inited;
		this.#setDialogInited(false);
		if (targetMessageId)
		{
			void this.loadContext(targetMessageId)
				.finally(() => {
					this.#setDialogInited(true, wasInitedBefore);
				});
		}

		void this.loadInitialMessages()
			.finally(() => {
				this.#setDialogInited(true, wasInitedBefore);
			});
	}

	async loadInitialMessages(): Promise
	{
		Logger.warn('MessageService: loadInitialMessages for: ', this.#chatId);
		this.#isLoading = true;

		const payload = {
			data: {
				chatId: this.#chatId,
				limit: LoadService.MESSAGE_REQUEST_LIMIT,
			},
		};
		const restResult = await runAction(RestMethod.imV2ChatMessageList, payload)
			.catch(([error]) => {
				console.error('MessageService: loadInitialMessages error:', error);
				this.#isLoading = false;
				throw error;
			});
		Logger.warn('MessageService: loadInitialMessages result', restResult);
		restResult.messages = this.#prepareInitialMessages(restResult.messages);

		await this.#handleLoadedMessages(restResult);
		this.#isLoading = false;

		return Promise.resolve();
	}

	#prepareInitialMessages(rawMessages: RawMessage[]): RawMessage[]
	{
		if (rawMessages.length === 0)
		{
			return rawMessages;
		}

		const lastMessageId = this.#getDialog().lastMessageId;
		const newMaxId = Math.max(...rawMessages.map((message) => message.id));
		if (newMaxId >= lastMessageId)
		{
			return rawMessages;
		}

		const messagesCollection: ImModelMessage[] = this.#store.getters['messages/getByChatId'](this.#chatId);
		const additionalMessages = messagesCollection.filter((message) => {
			return message.id > newMaxId;
		});
		Logger.warn('MessageService: loadInitialMessages: local id is higher than server one', additionalMessages);

		return [...rawMessages, ...additionalMessages];
	}

	isLoading(): boolean
	{
		return this.#isLoading;
	}

	#handleLoadedMessages(restResult): Promise
	{
		const { messages } = restResult;
		const messagesPromise = this.#store.dispatch('messages/setChatCollection', {
			messages,
			clearCollection: true,
		});
		const updateModelsPromise = this.#updateModels(restResult);

		return Promise.all([messagesPromise, updateModelsPromise]);
	}

	#updateModels(rawData: PaginationRestResult): Promise
	{
		const {
			files,
			users,
			usersShort,
			reactions,
			hasPrevPage,
			hasNextPage,
			additionalMessages,
			commentInfo,
			copilot,
			tariffRestrictions,
			stickers,
			messages,
		} = rawData;

		const dialogPromise = this.#store.dispatch('chats/update', {
			dialogId: this.#getDialog().dialogId,
			fields: {
				hasPrevPage,
				hasNextPage,
				tariffRestrictions,
			},
		});
		const usersPromise = Promise.all([
			this.#userManager.setUsersToModel(users),
			this.#userManager.addUsersToModel(usersShort),
		]);
		const filesPromise = this.#store.dispatch('files/set', files);
		const reactionsPromise = this.#store.dispatch('messages/reactions/set', reactions);
		const additionalMessagesPromise = this.#store.dispatch('messages/store', additionalMessages);
		const commentInfoPromise = this.#store.dispatch('messages/comments/set', commentInfo);
		const copilotManager = new CopilotManager();
		const copilotPromise = copilotManager.handleChatLoadResponse(copilot);

		const stickersPromise = Promise.all([
			this.#store.dispatch('stickers/messages/set', this.#getStickerMessages(rawData)),
			this.#store.dispatch('stickers/set', stickers),
		]);

		const builderPromise = this.#store.dispatch('messages/builder/set', messages);

		return Promise.all([
			dialogPromise,
			filesPromise,
			usersPromise,
			reactionsPromise,
			additionalMessagesPromise,
			commentInfoPromise,
			copilotPromise,
			stickersPromise,
			builderPromise,
		]);
	}

	#setDialogInited(flag: boolean, wasInitedBefore: boolean = true)
	{
		const fields = {
			inited: flag,
			loading: !flag,
		};
		if (flag === true && !wasInitedBefore)
		{
			delete fields.inited;
		}

		this.#store.dispatch('chats/update', {
			dialogId: this.#getDialog().dialogId,
			fields,
		});
	}

	#prepareTariffRestrictions(restrictions: RawTariffRestrictions): RawTariffRestrictions
	{
		const dialogId = this.#getDialog().dialogId;
		const chat: ?ImModelChat = this.#store.getters['chats/get'](dialogId);
		if (!chat)
		{
			return restrictions;
		}

		const { tariffRestrictions: { isHistoryLimitExceeded } } = chat;
		if (isHistoryLimitExceeded === true)
		{
			return {
				...restrictions,
				isHistoryLimitExceeded: true,
			};
		}

		return restrictions;
	}

	#getDialog(): ImModelChat
	{
		return this.#store.getters['chats/getByChatId'](this.#chatId);
	}

	#sendAnalytics(error)
	{
		if (error.code !== ErrorCode.message.notFound)
		{
			return;
		}

		const chat = this.#getDialog();
		const dialogId = chat.dialogId;
		Analytics.getInstance().messageDelete.onNotFoundNotification({ dialogId });
	}

	#getStickerMessages(rawData: PaginationRestResult): RawStickerMessage[]
	{
		const stickerMessages = [];
		rawData.messages.forEach((message) => {
			const isSticker = Boolean(message.params.STICKER_PARAMS);
			if (!isSticker)
			{
				return;
			}

			stickerMessages.push({
				messageId: message.id,
				...message.params.STICKER_PARAMS,
			});
		});

		return stickerMessages;
	}
}
