import { Core } from 'im.v2.application.core';
import { RecentType, RestMethod, type RecentTypeItem, ParentChatScope } from 'im.v2.const';
import { CopilotManager } from 'im.v2.lib.copilot';
import { Logger } from 'im.v2.lib.logger';
import { runAction } from 'im.v2.lib.rest';
import { UserManager } from 'im.v2.lib.user';
import { type RawChat, type RawMessage, type RawRecentItem } from 'im.v2.provider.service.types';

import {
	type BaseRecentQueryParams,
	type BaseRecentFilterParams,
	type RecentRestResult,
	type RecentFirstPageRestResult,
} from './types/base-recent-types';

export class BaseRecentService
{
	#unreadMode: boolean = false;
	#parentChatId: ?number = 0;
	#itemsPerPage: number = 50;
	#isLoading: boolean = false;
	#pagesLoaded: number = 0;
	#hasMoreItemsToLoad: boolean = true;
	#lastMessageDate: number = 0;

	constructor(params: { unreadMode: boolean, parentChatId: ?number } = {})
	{
		const { unreadMode = false, parentChatId = ParentChatScope.topLevel } = params;

		this.#unreadMode = unreadMode;
		this.#parentChatId = parentChatId;
	}

	loadFirstPage(): Promise
	{
		this.#isLoading = true;

		return this.#requestItems({ firstPage: true });
	}

	loadNextPage(): Promise
	{
		if (this.#isLoading || !this.#hasMoreItemsToLoad)
		{
			return Promise.resolve();
		}

		this.#isLoading = true;

		return this.#requestItems();
	}

	hasMoreItemsToLoad(): boolean
	{
		return this.#hasMoreItemsToLoad;
	}

	getItemsPerPage(): number
	{
		return this.#itemsPerPage;
	}

	getRestMethodName(firstPage: boolean): string
	{
		if (firstPage)
		{
			return RestMethod.imV2RecentLoad;
		}

		return RestMethod.imV2RecentTail;
	}

	getRecentType(): RecentTypeItem
	{
		return RecentType.default;
	}

	getUnreadMode(): boolean
	{
		return this.#unreadMode;
	}

	getParentChatId(): ?number
	{
		return this.#parentChatId;
	}

	saveRecentItems(restResult: RecentRestResult): Promise
	{
		const { recentItems } = restResult;

		const setPayload = {
			type: this.getRecentType(),
			items: recentItems,
			unread: this.getUnreadMode(),
		};

		if (this.getParentChatId() !== null)
		{
			setPayload.parentChatId = this.getParentChatId();
		}

		return Core.getStore().dispatch('recent/setCollection', setPayload);
	}

	saveFirstPageData(restResult: RecentFirstPageRestResult): Promise
	{
		// The base class does nothing here
		return Promise.resolve();
	}

	getQueryParams(firstPage: boolean = false): BaseRecentQueryParams
	{
		return {
			limit: this.getItemsPerPage(),
			filter: this.getRequestFilter(firstPage),
		};
	}

	getRequestFilter(firstPage: boolean = false): BaseRecentFilterParams
	{
		return {
			lastMessageDate: firstPage ? null : this.#lastMessageDate,
			recentSection: this.getRecentType(),
			parentId: this.getParentChatId(),
			unread: this.getUnreadMode(),
		};
	}

	handlePaginationField(result: RecentRestResult)
	{
		this.#lastMessageDate = this.#getLastMessageDate(result);
	}

	onAfterRequest(firstPage: boolean)
	{
		// The base class does nothing here
	}

	async #requestItems({ firstPage = false } = {}): Promise
	{
		const queryParams = {
			data: this.getQueryParams(firstPage),
		};

		const result: RecentRestResult = await runAction(this.getRestMethodName(firstPage), queryParams)
			.catch(([error]) => {
				console.error('BaseRecentList: page request error', error);
				throw error;
			});

		this.#pagesLoaded++;
		Logger.warn(`BaseRecentList: ${firstPage ? 'First' : this.#pagesLoaded} page request result`, result);
		const { hasNextPage } = result;
		this.handlePaginationField(result);
		this.#hasMoreItemsToLoad = hasNextPage;

		this.#isLoading = false;

		this.onAfterRequest(firstPage);

		if (firstPage)
		{
			await this.saveFirstPageData(result);
		}

		return this.#updateModels(result, firstPage);
	}

	#updateModels(restResult: RecentRestResult): Promise
	{
		const { users, chats, messages, files, recentItems, messagesAutoDeleteConfigs, copilot } = restResult;
		const chatsWithCounters = this.#getChatsWithCounters(chats, recentItems);

		// private chats objects are empty, so we should handle chats before users to not overwrite real info
		const chatsPromise = Core.getStore().dispatch('chats/set', chatsWithCounters);
		const usersPromise = (new UserManager()).setUsersToModel(users);
		const autoDeletePromise = Core.getStore().dispatch('chats/autoDelete/set', messagesAutoDeleteConfigs);
		const messagesPromise = Core.getStore().dispatch('messages/store', messages);
		const filesPromise = Core.getStore().dispatch('files/set', files);
		const recentPromise = this.saveRecentItems(restResult);

		const copilotManager = new CopilotManager();
		const copilotPromise = copilotManager.handleRecentListResponse(copilot);

		return Promise.all([
			usersPromise,
			chatsPromise,
			messagesPromise,
			filesPromise,
			recentPromise,
			autoDeletePromise,
			copilotPromise,
		]);
	}

	#getChatsWithCounters(chats: RawChat[], recentItems: RawRecentItem[]): RawChat[]
	{
		const chatMap = {};
		chats.forEach((chat) => {
			chatMap[chat.id] = chat;
		});
		recentItems.forEach((recentItem) => {
			const { counter, chatId } = recentItem;
			if (counter === 0)
			{
				return;
			}

			chatMap[chatId] = { ...chatMap[chatId], counter };
		});

		return Object.values(chatMap);
	}

	#getLastMessageDate(restResult: RecentRestResult): string
	{
		const messages = this.#filterPinnedItemsMessages(restResult);
		if (messages.length === 0)
		{
			return '';
		}

		// comparing strings in atom format works correctly because the format is lexically sortable
		let firstMessageDate = messages[0].date;
		messages.forEach((message) => {
			if (message.date < firstMessageDate)
			{
				firstMessageDate = message.date;
			}
		});

		return firstMessageDate;
	}

	#filterPinnedItemsMessages(restResult: RecentRestResult): RawMessage[]
	{
		const { messages, recentItems, sectionMeta } = restResult;
		const fixedChatIds = sectionMeta ? sectionMeta.fixedChatIds : [];

		return messages.filter((message) => {
			const chatId = message.chat_id;
			const recentItem: RawRecentItem = recentItems.find((item) => {
				return item.chatId === chatId;
			});

			const isPinnedItem = recentItem.pinned === true;
			const isFixedItem = fixedChatIds.includes(chatId);

			return !isPinnedItem && !isFixedItem;
		});
	}
}
