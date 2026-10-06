import { Core } from 'im.v2.application.core';
import { ChatType, UserType } from 'im.v2.const';

import { getRecentListItems } from './get-recent-items';
import { MAX_USERS_IN_SEARCH_LIST_DEFAULT } from '../const/const';

import type { SearchResultItem } from '../types/types';
import type { ImModelChat, ImModelUser } from 'im.v2.model';

type GetUsersFromRecentItemsParams = {
	withFakeUsers: boolean,
	withGuests?: boolean,
	userLimit: number,
}

export function getUsersFromRecentItems(
	{ withFakeUsers, withGuests = true, userLimit = MAX_USERS_IN_SEARCH_LIST_DEFAULT }: GetUsersFromRecentItemsParams,
): SearchResultItem[]
{
	return getRecentListItems({ withFakeUsers }).filter(({ dialogId }) => {
		const chat: ImModelChat = Core.getStore().getters['chats/get'](dialogId, true);
		const user: ImModelUser = Core.getStore().getters['users/get'](dialogId, true);

		return chat.type === ChatType.user && user.type !== UserType.bot && user.id !== Core.getUserId()
			&& (withGuests || !Core.getStore().getters['users/isGuest'](dialogId));
	}).slice(0, userLimit);
}
