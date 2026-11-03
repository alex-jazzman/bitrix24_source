import { Type } from 'main.core';

import { Core } from 'im.v2.application.core';
import { RecentType, RestMethod, type RecentTypeItem, ParentChatScope, type ParentChatIdType } from 'im.v2.const';
import { CopilotManager } from 'im.v2.lib.copilot';
import { Logger } from 'im.v2.lib.logger';
import { runAction } from 'im.v2.lib.rest';
import { UserManager } from 'im.v2.lib.user';
import {
	type RawChat,
	type RawMessage,
	type RawRecentItem,
	type RawStickerMessage,
} from 'im.v2.provider.service.types';

import {
	type BaseRecentQueryParams,
	type BaseRecentFilterParams,
	type RecentRestResult,
	type RecentFirstPageRestResult,
} from './types/base-recent-types';

export class BaseRecentService
{
	#unreadMode: boolean = false;
	#parentChatId: ParentChatIdType = 0;
	#itemsPerPage: number = 50;
	#isLoading: boolean = false;
	#pagesLoaded: number = 0;
	#hasMoreItemsToLoad: boolean = true;
	#lastMessageDate: string = '';

	constructor(params: { unreadMode: boolean, parentChatId: ParentChatIdType } = {})
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
			lastMessageDate: firstPage ? null : this.getLastMessageDate(),
			recentSection: this.getRecentType(),
			parentId: this.getParentChatId(),
			unread: this.getUnreadMode(),
		};
	}

	getLastMessageDate(): string
	{
		return this.#lastMessageDate;
	}

	handlePaginationField(result: RecentRestResult)
	{
		this.#setLastMessageDate(result);
	}

	onAfterRequest(firstPage: boolean)
	{
		// The base class does nothing here
	}

	async #requestItems({ firstPage = false } = {}): Promise
	{
		try
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

			this.onAfterRequest(firstPage);

			if (firstPage)
			{
				await this.saveFirstPageData(result);
			}

			return this.#updateModels(result, firstPage);
		}
		finally
		{
			this.#isLoading = false;
		}
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
		// sticker messages have no text, recent preview detects them through the stickers model
		const stickerMessages = this.#getStickerMessages(messages);
		const stickersPromise = Core.getStore().dispatch('stickers/messages/set', stickerMessages);

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
			stickersPromise,
		]);
	}

	#getStickerMessages(messages: RawMessage[]): RawStickerMessage[]
	{
		const stickerMessages = [];
		if (!messages)
		{
			return stickerMessages;
		}

		messages.forEach((message: RawMessage) => {
			const stickerParams = message.params?.STICKER_PARAMS;
			if (!Type.isPlainObject(stickerParams))
			{
				return;
			}

			stickerMessages.push({
				messageId: message.id,
				...stickerParams,
			});
		});

		return stickerMessages;
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

	#setLastMessageDate(restResult: RecentRestResult)
	{
		const { recentItems, sectionMeta } = restResult;
		const fixedChatIds = sectionMeta ? sectionMeta.fixedChatIds : [];

		// The REST filter field is named lastMessageDate, but the server matches it against
		// DATE_LAST_ACTIVITY - the field it sorts and cuts the page by. So the cursor is the oldest
		// activity date of the page, not the date of any message.
		let lastMessageDate = '';
		recentItems.forEach((recentItem: RawRecentItem) => {
			const isPinnedItem = recentItem.pinned === true;
			const isFixedItem = fixedChatIds.includes(recentItem.chatId);
			if (isPinnedItem || isFixedItem)
			{
				return;
			}

			const { dateLastActivity } = recentItem;
			if (!dateLastActivity)
			{
				return;
			}

			// comparing strings in atom format works correctly because the format is lexically sortable
			if (lastMessageDate === '' || dateLastActivity < lastMessageDate)
			{
				lastMessageDate = dateLastActivity;
			}
		});

		this.#lastMessageDate = lastMessageDate;
	}
}
