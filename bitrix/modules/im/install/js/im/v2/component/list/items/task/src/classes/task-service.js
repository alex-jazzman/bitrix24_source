import { Core } from 'im.v2.application.core';
import { RestMethod, ChatType, RecentType } from 'im.v2.const';
import { BaseRecentService, type BaseRecentQueryParams } from 'im.v2.provider.service.recent';

import type { RawRecentItem } from 'im.v2.provider.service.types';

export class TaskService extends BaseRecentService
{
	getRestMethodName(): string
	{
		return RestMethod.imV2RecentExternalChatTail;
	}

	getQueryParams(firstPage: boolean = false): BaseRecentQueryParams & { type: string }
	{
		return {
			...super.getQueryParams(firstPage),
			type: ChatType.taskComments,
		};
	}

	saveRecentItems(recentItems: RawRecentItem[]): Promise
	{
		return Core.getStore().dispatch('recent/setCollection', {
			type: RecentType.taskComments,
			items: recentItems,
		});
	}
}
