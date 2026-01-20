import { Core } from 'im.v2.application.core';

import { LegacyRecentService } from '../legacy-recent';

import type { JsonObject } from 'main.core';
import type { ImModelRecentItem } from 'im.v2.model';

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

	getModelSaveMethod(): string
	{
		return 'recent/setUnread';
	}

	getCollection(): ImModelRecentItem[]
	{
		return Core.getStore().getters['recent/getUnreadCollection'];
	}
}
