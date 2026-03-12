import { Core } from 'im.v2.application.core';
import { RecentType } from 'im.v2.const';

import { getRecentItemDate } from './get-recent-item-date';

import type { SearchResultItem } from '../types/types';
import type { ImModelRecentItem } from 'im.v2.model';

const GetterNameByRecentSection = {
	[RecentType.taskComments]: 'recent/getTaskCollection',
	[RecentType.default]: 'recent/getSortedCollection',
};

export function getRecentListItems({ withFakeUsers, searchConfig = {} }: { withFakeUsers: boolean }): SearchResultItem[]
{
	const getterName = getRecentGetterName(searchConfig?.searchRecentSection);
	let recent: ImModelRecentItem[] = Core.getStore().getters[getterName];

	recent = recent.filter((item) => {
		if (withFakeUsers && item.isFakeElement)
		{
			return true;
		}

		return !item.isBirthdayPlaceholder && !item.isFakeElement;
	});

	return recent.map(({ dialogId }) => {
		return {
			dialogId,
			dateMessage: getRecentItemDate(dialogId),
		};
	});
}

function getRecentGetterName(searchRecentSection?: $Values<typeof RecentType>): string
{
	return GetterNameByRecentSection[searchRecentSection] ?? GetterNameByRecentSection[RecentType.default];
}
