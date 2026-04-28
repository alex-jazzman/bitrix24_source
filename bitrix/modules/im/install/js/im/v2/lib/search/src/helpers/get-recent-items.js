import { Core } from 'im.v2.application.core';
import { RecentType } from 'im.v2.const';

import { getRecentItemDate } from './get-recent-item-date';

import type { ImModelRecentItem } from 'im.v2.model';
import type { RecentTypeItem } from 'im.v2.const';
import type { SearchResultItem } from '../types/types';

type GetRecentListParams = { withFakeUsers: boolean, searchRecentSection: RecentTypeItem };

export function getRecentListItems({ withFakeUsers, searchRecentSection }: GetRecentListParams): SearchResultItem[]
{
	const recentSection = searchRecentSection ?? RecentType.default;
	const recentItems: ImModelRecentItem[] = Core.getStore().getters['recent/getSortedCollection']({ type: recentSection });

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
