import { type JsonObject } from 'main.core';

import { Core } from 'im.v2.application.core';
import { RecentType } from 'im.v2.const';
import { type RawLegacyRecentItem } from 'im.v2.provider.service.types';

import { LegacyRecentService } from '../legacy-recent';

export class UnreadRecentService extends LegacyRecentService
{
	static instance = null;

	static getInstance(): UnreadRecentService
	{
		if (!this.instance)
		{
			this.instance = new this();
		}

		return this.instance;
	}

	getQueryParams(firstPage: boolean): JsonObject
	{
		return {
			...super.getQueryParams(firstPage),
			UNREAD_ONLY: 'Y',
		};
	}

	saveRecentItems(recentItems: RawLegacyRecentItem[]): Promise
	{
		return Core.getStore().dispatch('recent/setUnreadCollection', {
			type: RecentType.default,
			items: recentItems,
		});
	}
}
