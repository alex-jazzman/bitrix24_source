import { Core } from 'im.v2.application.core';
import { ActionByRole } from 'im.v2.const';
import { PermissionManager } from 'im.v2.lib.permission';
import { RecentType, type RecentTypeItem, type ParentChatIdType } from 'im.v2.const';
import { ChatManager } from 'im.v2.lib.chat';
import { type ImModelRecentItem } from 'im.v2.model';

import { getRecentItemDate } from './get-recent-item-date';
import { type SearchResultItem } from '../types/types';

type GetRecentListParams = {
	withFakeUsers: boolean,
	searchRecentSection?: RecentTypeItem,
	parentChatId: ParentChatIdType,
	onlyAttachableToCollab?: boolean,
};

export function getRecentListItems(params: GetRecentListParams): SearchResultItem[]
{
	const { searchRecentSection, parentChatId, onlyAttachableToCollab, withFakeUsers } = params;

	const recentType = searchRecentSection ?? RecentType.default;
	const preparedParentChatId = ChatManager.prepareParentChatId(parentChatId);

	const payload = {
		type: recentType,
		parentChatId: preparedParentChatId,
	};

	const recentItems: ImModelRecentItem[] = Core.getStore().getters['recent/getSortedCollection'](payload);

	const filterRecentItem = onlyAttachableToCollab
		? (item: ImModelRecentItem) => isAttachableToCollab(item.dialogId, recentType)
		: (item: ImModelRecentItem) => isSearchableRecentItem(item, withFakeUsers);

	return recentItems
		.filter((item) => filterRecentItem(item))
		.map(({ dialogId }) => buildSearchResultItem(dialogId));
}

const isAttachableToCollab = (dialogId: string, recentType: RecentTypeItem): boolean => {
	const handleByRecentType = {
		[RecentType.collab]: () => PermissionManager.getInstance().canManageUsersAdd(dialogId),
		[RecentType.default]: () => canAttach(dialogId),
	};

	return handleByRecentType[recentType]();
};

const isSearchableRecentItem = (item: ImModelRecentItem, withFakeUsers: boolean): boolean => {
	if (withFakeUsers && item.isFakeElement)
	{
		return true;
	}

	return !item.isBirthdayPlaceholder && !item.isFakeElement;
};

const buildSearchResultItem = (dialogId: string): SearchResultItem => {
	return {
		dialogId,
		dateMessage: getRecentItemDate(dialogId),
	};
};

const canAttach = (dialogId: string): boolean => {
	const permissionManager = PermissionManager.getInstance();

	return permissionManager.canPerformActionByRole(ActionByRole.attachToParent, dialogId);
};
