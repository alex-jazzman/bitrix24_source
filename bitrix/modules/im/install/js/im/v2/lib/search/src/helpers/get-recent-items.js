import { Core } from 'im.v2.application.core';
import { RecentType, type RecentTypeItem, ParentChatScope } from 'im.v2.const';
import { type ImModelRecentItem } from 'im.v2.model';

import { getRecentItemDate } from './get-recent-item-date';
import { type SearchResultItem } from '../types/types';

type GetRecentListParams = { withFakeUsers: boolean, searchRecentSection?: RecentTypeItem, parentChatId: ?number };

export function getRecentListItems(params: GetRecentListParams): SearchResultItem[]
{
	const { withFakeUsers, searchRecentSection, parentChatId } = params;

	const recentSection = searchRecentSection ?? RecentType.default;
	const preparedParentChatId = prepareParentChatId(parentChatId);

	const payload = {
		type: recentSection,
		parentChatId: preparedParentChatId,
	};

	const recentItems: ImModelRecentItem[] = Core.getStore().getters['recent/getSortedCollection'](payload);

	return recentItems
		.filter((item) => filterRecentItem(item, withFakeUsers))
		.map(({ dialogId }) => buildSearchResultItem(dialogId));
}

const filterRecentItem = (recentItem: ImModelRecentItem, withFakeUsers: boolean): boolean => {
	if (withFakeUsers && recentItem.isFakeElement)
	{
		return true;
	}

	return !recentItem.isBirthdayPlaceholder && !recentItem.isFakeElement;
};

const buildSearchResultItem = (dialogId: string): SearchResultItem => {
	return {
		dialogId,
		dateMessage: getRecentItemDate(dialogId),
	};
};

const prepareParentChatId = (parentChatId: ?number): number => {
	const isAllScope = parentChatId === ParentChatScope.all;
	if (!parentChatId || isAllScope)
	{
		return ParentChatScope.topLevel;
	}

	return parentChatId;
};
