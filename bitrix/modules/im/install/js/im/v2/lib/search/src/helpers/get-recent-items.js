import { Core } from 'im.v2.application.core';
import { ActionByRole, RecentType, type RecentTypeItem, type ParentChatIdType } from 'im.v2.const';
import { ChatManager } from 'im.v2.lib.chat';
import { PermissionManager } from 'im.v2.lib.permission';
import { type ImModelRecentItem } from 'im.v2.model';

import { getRecentItemDate } from './get-recent-item-date';
import { mergeSearchItems } from './merge-search-items';
import { type SearchResultItem } from '../types/types';

type GetRecentListParams = {
	withFakeUsers: boolean,
	searchRecentSection?: RecentTypeItem,
	searchAllChats?: boolean,
	searchFolderId?: ?number,
	parentChatId: ParentChatIdType,
	onlyAttachableToCollab?: boolean,
	onlyWithManageMessagesRight?: boolean,
};

export function getRecentListItems(params: GetRecentListParams): SearchResultItem[]
{
	const { searchAllChats, searchFolderId, searchRecentSection } = params;

	// The folder scope has no section at all, so its branch goes before the section fallback below - a
	// fall-through would answer with plain chats. As on the server, the presence of the identifier alone
	// switches the mode on: an unreachable folder ends in an empty result, never in a widened search.
	if (searchFolderId !== null && searchFolderId !== undefined)
	{
		return getFolderItems(searchFolderId, params);
	}

	if (searchAllChats)
	{
		return getAllChatsItems(params);
	}

	return getSectionItems(searchRecentSection ?? RecentType.default, params);
}

const getSectionItems = (recentType: RecentTypeItem, params: GetRecentListParams): SearchResultItem[] => {
	const { parentChatId, onlyAttachableToCollab } = params;

	const payload = {
		type: recentType,
		parentChatId: ChatManager.prepareParentChatId(parentChatId),
	};

	const recentItems: ImModelRecentItem[] = Core.getStore().getters['recent/getSortedCollection'](payload);

	const filterRecentItem = onlyAttachableToCollab
		? (item: ImModelRecentItem) => isAttachableToCollab(item.dialogId, recentType)
		: (item: ImModelRecentItem) => isSearchableItem(item, params);

	return recentItems
		.filter((item) => filterRecentItem(item))
		.map(({ dialogId }) => buildSearchResultItem(dialogId));
};

// The composition is resolved at search time through the same getters the folder list is built from
// (see AllFolderRecentService.getCollection), so the scope cannot drift from the list - except for the
// loaded depth: the cursor applied on top of those getters stays in the service of the list.
const getFolderItems = (folderId: number, params: GetRecentListParams): SearchResultItem[] => {
	const store = Core.getStore();
	const sections: RecentTypeItem[] = store.getters['recent/folders/getSourceSections'](folderId);
	const recentItems: ImModelRecentItem[] = store.getters['recent/getRootUnionCollection']({ sections });

	// onlyAttachableToCollab needs no branch here: it only arrives from the selector mount points, and
	// those pass a section of their own, never a folder id.
	return recentItems
		.filter((item: ImModelRecentItem) => isSearchableItem(item, params))
		.map(({ dialogId }) => buildSearchResultItem(dialogId));
};

const getAllChatsItems = (params: GetRecentListParams): SearchResultItem[] => {
	const SectionsForAllChatsSearch: RecentTypeItem[] = [RecentType.default, RecentType.taskComments];

	return SectionsForAllChatsSearch.reduce((items: SearchResultItem[], section: RecentTypeItem) => {
		return mergeSearchItems(items, getSectionItems(section, params));
	}, []);
};

const isAttachableToCollab = (dialogId: string, recentType: RecentTypeItem): boolean => {
	const handleByRecentType = {
		[RecentType.collab]: () => PermissionManager.getInstance().canManageUsersAdd(dialogId),
		[RecentType.default]: () => canAttach(dialogId),
	};

	return handleByRecentType[recentType]();
};

const isSearchableItem = (item: ImModelRecentItem, params: GetRecentListParams): boolean => {
	const { withFakeUsers, onlyWithManageMessagesRight } = params;

	return isSearchableRecentItem(item, withFakeUsers)
		&& (!onlyWithManageMessagesRight || canSendMessage(item.dialogId));
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

const canSendMessage = (dialogId: string): boolean => {
	const permissionManager = PermissionManager.getInstance();

	return permissionManager.canPerformActionByRole(ActionByRole.send, dialogId);
};
