import { Type } from 'main.core';

import { RestMethod, SidebarFileGroups } from 'im.v2.const';
import { UserManager } from 'im.v2.lib.user';
import { Core } from 'im.v2.application.core';

import { getChatId } from './helpers/get-chat-id';
import { getPageCursor, SidebarFileDateOrder, usesDateOrder } from './helpers/page-cursor';

import type { Store } from 'ui.vue3.vuex';
import type { JsonObject } from 'main.core';
import type { RestClient } from 'rest.client';

type QueryParams = {
	CHAT_ID: number,
	GROUP: string,
	LIMIT: number,
	ORDER?: {[string]: string},
	LAST_ID?: number,
	LAST_DATE?: string,
}

type PageRequestOptions = {
	withGroupReset?: boolean,
}

const REQUEST_ITEMS_LIMIT = 50;

export class File
{
	store: Store;
	dialogId: string;
	chatId: number;
	userManager: UserManager;
	restClient: RestClient;

	constructor({ dialogId }: {dialogId: string})
	{
		this.store = Core.getStore();
		this.restClient = Core.getRestClient();
		this.dialogId = dialogId;
		this.chatId = getChatId(dialogId);
		this.userManager = new UserManager();
	}

	getInitialQuery(): {[$Values<typeof RestMethod>]: JsonObject}
	{
		return {
			[RestMethod.imChatFileCollectionGet]: { chat_id: this.chatId, limit: REQUEST_ITEMS_LIMIT },
		};
	}

	getResponseHandler(): Function
	{
		return (response) => {
			if (!response[RestMethod.imChatFileCollectionGet])
			{
				return Promise.reject(new Error('SidebarInfo service error: no response'));
			}

			return this.updateModels(response[RestMethod.imChatFileCollectionGet]);
		};
	}

	updateModels(resultData, group: string = ''): Promise
	{
		const { list, users, files, tariffRestrictions = {} } = resultData;

		const isHistoryLimitExceeded = Boolean(tariffRestrictions.isHistoryLimitExceeded);
		const historyLimitPromise = this.store.dispatch('sidebar/files/setHistoryLimitExceeded', {
			chatId: this.chatId,
			isHistoryLimitExceeded,
		});

		if (group && !Type.isArrayFilled(list))
		{
			return this.store.dispatch('sidebar/files/setHasNextPage', {
				chatId: this.chatId,
				group,
				hasNextPage: false,
			});
		}

		const addUsersPromise = this.userManager.setUsersToModel(users);
		const setFilesPromise = this.store.dispatch('files/set', files);

		const sortedGroups = {};
		list.forEach((file) => {
			const fileGroup = file.group ?? SidebarFileGroups.fileUnsorted;
			if (!sortedGroups[fileGroup])
			{
				sortedGroups[fileGroup] = [];
			}
			sortedGroups[fileGroup].push(file);
		});

		const setSidebarFilesPromises = [];
		Object.entries(sortedGroups).forEach(([groupName, listByGroup]) => {
			setSidebarFilesPromises.push(
				this.store.dispatch('sidebar/files/set', {
					chatId: this.chatId,
					files: listByGroup,
					group: groupName,
				}),
				this.store.dispatch('sidebar/files/setHasNextPage', {
					chatId: this.chatId,
					group: groupName,
					hasNextPage: listByGroup.length === REQUEST_ITEMS_LIMIT,
				}),
				this.store.dispatch('sidebar/files/setLastId', {
					chatId: this.chatId,
					group: groupName,
					...getPageCursor(listByGroup, usesDateOrder(group) && groupName === group),
				}),
			);
		});

		return Promise.all([
			setFilesPromise, addUsersPromise, historyLimitPromise, ...setSidebarFilesPromises,
		]);
	}

	loadFirstPage(group: string): Promise
	{
		return this.loadFirstPageByGroup(group);
	}

	loadNextPage(group: string): Promise
	{
		return this.loadNextPageByGroup(group);
	}

	loadFirstPageByGroup(group: string): Promise
	{
		// a fully loaded group is put in order by the client sorting, so a foreign cursor costs nothing here
		if (!this.hasNextPage(group))
		{
			return Promise.resolve();
		}

		if (this.hasForeignCursor(group))
		{
			return this.requestPage(this.getQueryParams(group), { withGroupReset: true });
		}

		// a group already filled to the page holds its own first page: continuing the boundary of that
		// page here would put the next one in the list without a scroll
		const filesCount = this.getFilesCountFromModel(group);
		if (filesCount >= REQUEST_ITEMS_LIMIT)
		{
			return Promise.resolve();
		}

		const queryParams = this.getQueryParams(group);

		return this.requestPage(queryParams);
	}

	loadNextPageByGroup(group: string): Promise
	{
		if (this.hasForeignCursor(group))
		{
			return this.loadFirstPageByGroup(group);
		}

		const queryParams = this.getQueryParams(group);

		return this.requestPage(queryParams);
	}

	getQueryParams(group: string): QueryParams
	{
		const queryParams = {
			CHAT_ID: this.chatId,
			GROUP: group,
			LIMIT: REQUEST_ITEMS_LIMIT,
		};

		const lastId = this.store.getters['sidebar/files/getLastId'](this.chatId, group);

		if (!usesDateOrder(group))
		{
			if (lastId > 0)
			{
				queryParams.LAST_ID = lastId;
			}

			return queryParams;
		}

		queryParams.ORDER = { ...SidebarFileDateOrder };

		const lastDate = this.store.getters['sidebar/files/getLastDate'](this.chatId, group);
		// an incomplete pair is a wrong request, so the cursor goes in only once a page has come back
		if (lastId > 0 && Type.isStringFilled(lastDate))
		{
			queryParams.LAST_ID = lastId;
			queryParams.LAST_DATE = lastDate;
		}

		return queryParams;
	}

	hasNextPage(group: string): boolean
	{
		return this.store.getters['sidebar/files/hasNextPage'](this.chatId, group);
	}

	hasForeignCursor(group: string): boolean
	{
		if (!usesDateOrder(group))
		{
			return false;
		}

		const lastId = this.store.getters['sidebar/files/getLastId'](this.chatId, group);
		const lastDate = this.store.getters['sidebar/files/getLastDate'](this.chatId, group);

		// only the branch of the date order writes the date, so a boundary without one was left by the
		// initial load of the sidebar: a boundary counted in the order by the record number (API-01)
		return lastId > 0 && !Type.isStringFilled(lastDate);
	}

	resetGroup(group: string): Promise
	{
		return this.store.dispatch('sidebar/files/clearGroup', { chatId: this.chatId, group });
	}

	requestPage(queryParams: QueryParams, { withGroupReset = false }: PageRequestOptions = {}): Promise
	{
		return this.restClient.callMethod(RestMethod.imChatFileGet, queryParams).then((response) => {
			// The group is replaced by the page, not emptied before it: the preview block of the sidebar
			// reads the same collection, and a group emptied on its own tells it the chat holds no files.
			// Both go in without an await in between, so no redraw falls between the two.
			const resetPromise = withGroupReset ? this.resetGroup(queryParams.GROUP) : Promise.resolve();

			return Promise.all([resetPromise, this.updateModels(response.data(), queryParams.GROUP)]);
		}).catch((error) => {
			console.error('SidebarInfo: imChatFileGet: page request error', error);
		});
	}

	getFilesCountFromModel(group): number
	{
		return this.store.getters['sidebar/files/getSize'](this.chatId, group);
	}
}
