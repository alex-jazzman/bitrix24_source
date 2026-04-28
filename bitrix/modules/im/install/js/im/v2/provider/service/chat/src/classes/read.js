import { Store } from 'ui.vue3.vuex';
import { RestClient } from 'rest.client';

import { Core } from 'im.v2.application.core';
import { RestMethod, ChatType } from 'im.v2.const';
import { Logger } from 'im.v2.lib.logger';
import { UuidManager } from 'im.v2.lib.uuid';
import { runAction } from 'im.v2.lib.rest';
import { CounterManager, CounterClearHandlersByChatType, CounterClearActions } from 'im.v2.lib.counter';

import type { ImModelChat } from 'im.v2.model';

type ReadResult = {
	chatId: number,
	counter: number,
	lastId: number,
	viewedMessages: number[]
};

const READ_TIMEOUT = 300;

export class ReadService
{
	#store: Store;
	#restClient: RestClient;

	#messagesToRead: {[chatId: string]: Set<number>} = {};

	constructor()
	{
		this.#store = Core.getStore();
		this.#restClient = Core.getRestClient();
	}

	readAllByType(type: $Values<typeof ChatType>)
	{
		const counterClearHandlers = CounterClearHandlersByChatType[type];

		if (counterClearHandlers)
		{
			counterClearHandlers.forEach((handler) => {
				handler(type);
			});
		}

		runAction(RestMethod.imV2ChatReadAllByType, {
			data: { type },
		}).catch(([error]) => {
			console.error('ReadService: readAllByType error', error);
		});
	}

	readAll(): void
	{
		Logger.warn('ReadService: readAll');
		CounterClearActions.forEach((actionHandler) => {
			void actionHandler();
		});

		runAction(RestMethod.imV2ChatReadAll)
			.catch(([error]) => {
				console.error('ReadService: readAll error', error);
			});
	}

	readDialog(dialogId: string): void
	{
		Logger.warn('ReadService: readDialog', dialogId);
		const { chatId }: ImModelChat = this.#store.getters['chats/get'](dialogId);
		void this.#store.dispatch('counters/clearById', { chatId });

		this.#restClient.callMethod(RestMethod.imV2ChatRead, { dialogId })
			.catch((result: RestResult) => {
				console.error('ReadService: error reading chat', result.error());
			});
	}

	unreadDialog(dialogId: string): void
	{
		Logger.warn('ReadService: unreadDialog', dialogId);
		this.#restClient.callMethod(RestMethod.imV2ChatUnread, { dialogId })
			.catch((result: RestResult) => {
				console.error('ReadService: error setting chat as unread', result.error());
			});
	}

	readMessage(chatId: number, messageId: number): void
	{
		if (!this.#messagesToRead[chatId])
		{
			this.#messagesToRead[chatId] = new Set();
		}
		this.#messagesToRead[chatId].add(messageId);

		clearTimeout(this.readTimeout);
		this.readTimeout = setTimeout(() => {
			Object.entries(this.#messagesToRead).forEach(([rawChatId, messageIds]) => {
				void this.#readMessagesForChat(rawChatId, messageIds);
			});
		}, READ_TIMEOUT);
	}

	async readChatQueuedMessages(chatId: number): void
	{
		if (!this.#messagesToRead[chatId])
		{
			return;
		}

		clearTimeout(this.readTimeout);

		void this.#readMessagesForChat(chatId, this.#messagesToRead[chatId]);
	}

	clearDialogMark(dialogId: string): void
	{
		Logger.warn('ReadService: clear dialog mark', dialogId);
		const { markedId, chatId }: ImModelChat = this.#store.getters['chats/get'](dialogId);
		const unreadStatus = this.#store.getters['counters/getUnreadStatus'](chatId);
		if (markedId === 0 && !unreadStatus)
		{
			return;
		}

		void this.#store.dispatch('counters/setUnreadStatus', { chatId, status: false });
		void this.#store.dispatch('chats/update', {
			dialogId,
			fields: { markedId: 0 },
		});

		this.#restClient.callMethod(RestMethod.imV2ChatRead, {
			dialogId,
			onlyRecent: 'Y',
		}).catch((result: RestResult) => {
			console.error('ReadService: error clearing dialog mark', result.error());
		});
	}

	async #readMessagesForChat(rawChatId: string, messageIds: Set<number>): Promise<boolean>
	{
		const queueChatId = Number.parseInt(rawChatId, 10);
		Logger.warn('ReadService: readMessages', messageIds);
		if (messageIds.size === 0)
		{
			return true;
		}

		const copiedMessageIds = [...messageIds];
		delete this.#messagesToRead[queueChatId];

		const readMessagesCount = await this.#readMessageOnClient(queueChatId, copiedMessageIds);

		Logger.warn('ReadService: readMessage, need to reduce counter by', readMessagesCount);
		await this.#decreaseChatCounter(queueChatId, readMessagesCount);

		const readResult = await this.#readMessageOnServer(queueChatId, copiedMessageIds)
			.catch(([error]) => {
				console.error('ReadService: error reading message', error);
			});

		this.#checkChatCounter(readResult);

		return true;
	}

	#readMessageOnClient(chatId: number, messageIds: number[]): Promise<number>
	{
		const maxMessageId = Math.max(...messageIds);
		const dialog = this.#getDialogByChatId(chatId);
		if (maxMessageId > dialog.lastReadId)
		{
			void this.#store.dispatch('chats/update', {
				dialogId: this.#getDialogIdByChatId(chatId),
				fields: { lastId: maxMessageId },
			});
		}

		return this.#store.dispatch('messages/readMessages', {
			chatId,
			messageIds,
		});
	}

	#decreaseChatCounter(chatId: number, readMessagesCount: number): Promise
	{
		const currentCounter = this.#store.getters['counters/getCounterByChatId'](chatId);
		const shouldSkipLocalUpdate = currentCounter >= CounterManager.getCounterDisplayLimit();
		if (shouldSkipLocalUpdate)
		{
			return Promise.resolve();
		}

		let newCounter = currentCounter - readMessagesCount;
		if (newCounter < 0)
		{
			newCounter = 0;
		}

		return this.#store.dispatch('counters/setCounter', { chatId, counter: newCounter });
	}

	#readMessageOnServer(chatId: number, messageIds: number[]): Promise
	{
		Logger.warn('ReadService: readMessages on server', messageIds);

		return runAction(RestMethod.imV2ChatMessageRead, {
			data: {
				chatId,
				ids: messageIds,
				actionUuid: UuidManager.getInstance().getActionUuid(),
			},
		});
	}

	#checkChatCounter(readResult: ReadResult)
	{
		if (!readResult)
		{
			return;
		}

		const { chatId, counter } = readResult;

		const currentCounter = this.#store.getters['counters/getCounterByChatId'](chatId);
		if (currentCounter > counter)
		{
			Logger.warn('ReadService: counter from server is lower than local one', currentCounter, counter);
			void this.#store.dispatch('counters/setCounter', { chatId, counter });
		}
	}

	#getDialogIdByChatId(chatId: number): number
	{
		const dialog = this.#store.getters['chats/getByChatId'](chatId);
		if (!dialog)
		{
			return 0;
		}

		return dialog.dialogId;
	}

	#getDialogByChatId(chatId: number): ?ImModelChat
	{
		return this.#store.getters['chats/getByChatId'](chatId);
	}
}
