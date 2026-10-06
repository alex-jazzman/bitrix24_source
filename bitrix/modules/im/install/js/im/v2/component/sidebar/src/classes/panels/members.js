import { ChatType, RestMethod } from 'im.v2.const';
import { UserManager } from 'im.v2.lib.user';
import { Core } from 'im.v2.application.core';

import { getChatId } from './helpers/get-chat-id';

import type { Store } from 'ui.vue3.vuex';
import type { JsonObject } from 'main.core';
import type { RestClient } from 'rest.client';
import type { RawUser } from 'im.v2.provider.service';
import type { ImModelChat } from 'im.v2.model';

const REQUEST_ITEMS_LIMIT = 50;

type QueryParams = {
	dialogId: string,
	limit: number,
	withGroupSort?: boolean,
	cursor?: MembersPaginationCursor,
};

type MembersRestResult = {
	users: RawUser[],
	nextCursor: MembersPaginationCursor | null,
};

type MembersPaginationCursor = JsonObject;

export class MembersService
{
	store: Store;
	dialogId: string;
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
			[RestMethod.imV2ChatMemberTail]: this.getBaseQueryParams(),
		};
	}

	getBaseQueryParams(): QueryParams
	{
		const queryParams: QueryParams = {
			dialogId: this.dialogId,
			limit: REQUEST_ITEMS_LIMIT,
		};

		// Collab members are grouped by role on the server; other chat types keep the flat list.
		if (this.needGroupSort())
		{
			queryParams.withGroupSort = true;
		}

		return queryParams;
	}

	loadFirstPage(): Promise
	{
		const membersCount = this.getMembersCountFromModel();
		if (membersCount > REQUEST_ITEMS_LIMIT)
		{
			return Promise.resolve();
		}

		const queryParams = this.getQueryParams();

		return this.requestPage(queryParams);
	}

	loadNextPage(): Promise
	{
		const queryParams = this.getQueryParams();

		return this.requestPage(queryParams);
	}

	getQueryParams(): QueryParams
	{
		const queryParams = this.getBaseQueryParams();

		const nextCursor = this.store.getters['sidebar/members/getNextCursor'](this.chatId);
		if (nextCursor)
		{
			queryParams.cursor = nextCursor;
		}

		return queryParams;
	}

	needGroupSort(): boolean
	{
		const chat: ImModelChat = this.store.getters['chats/get'](this.dialogId, true);

		return chat.type === ChatType.collab;
	}

	async requestPage(queryParams: QueryParams): Promise
	{
		let restResult: MembersRestResult = {};

		try
		{
			const response = await this.restClient.callMethod(RestMethod.imV2ChatMemberTail, queryParams);
			restResult = response.data();
		}
		catch (error)
		{
			console.error('SidebarMain: Im.DialogUsersList: page request error', error);

			// Surface the failure to the panel so it can show an error state with a retry button.
			// Already loaded members stay in the model, so retry re-requests only the failed page.
			throw error;
		}

		return this.updateModels(restResult);
	}

	getResponseHandler(): Function
	{
		return (response) => {
			return this.updateModels(response[RestMethod.imV2ChatMemberTail]);
		};
	}

	updateModels(restResult: MembersRestResult): Promise
	{
		const { users, nextCursor } = restResult;

		const userIds = [];
		const addUsersPromise = this.userManager.setUsersToModel(users);
		users.forEach((user) => {
			userIds.push(user.id);
		});

		const setMembersPromise = this.store.dispatch('sidebar/members/set', {
			chatId: this.chatId,
			users: userIds,
			hasNextPage: users.length === REQUEST_ITEMS_LIMIT,
		});

		let cursorPromise = Promise.resolve();
		if (nextCursor)
		{
			cursorPromise = this.store.dispatch('sidebar/members/setNextCursor', {
				chatId: this.chatId,
				nextCursor,
			});
		}

		return Promise.all([addUsersPromise, setMembersPromise, cursorPromise]);
	}

	getMembersCountFromModel(): number
	{
		return this.store.getters['sidebar/members/getSize'](this.chatId);
	}
}
