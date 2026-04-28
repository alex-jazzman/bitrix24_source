import { Core } from 'im.v2.application.core';
import { RecentType, RestMethod } from 'im.v2.const';
import { BaseRecentService } from 'im.v2.provider.service.recent';

import type { RawRecentItem } from 'im.v2.provider.service.types';

export class CollabService extends BaseRecentService
{
	getRestMethodName(): string
	{
		return RestMethod.imV2RecentCollabTail;
	}

	saveRecentItems(recentItems: RawRecentItem[]): Promise
	{
		return Core.getStore().dispatch('recent/setCollection', {
			type: RecentType.collab,
			items: recentItems,
		});
	}
}
