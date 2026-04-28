import { type JsonObject } from 'main.core';

import { Core } from 'im.v2.application.core';
import { RecentType } from 'im.v2.const';
import { LegacyRecentService } from 'im.v2.provider.service.recent';
import { type RawLegacyRecentItem } from 'im.v2.provider.service.types';

export class CopilotRecentService extends LegacyRecentService
{
	getQueryParams(firstPage: boolean): JsonObject
	{
		return {
			ONLY_COPILOT: 'Y',
			LIMIT: this.itemsPerPage,
			LAST_MESSAGE_DATE: firstPage ? null : this.lastMessageDate,
			GET_ORIGINAL_TEXT: 'Y',
			PARSE_TEXT: 'Y',
		};
	}

	saveRecentItems(recentItems: RawLegacyRecentItem[]): Promise
	{
		return Core.getStore().dispatch('recent/setCollection', {
			type: RecentType.copilot,
			items: recentItems,
		});
	}

	getExtractorOptions(): { withBirthdays?: boolean }
	{
		return { withBirthdays: false };
	}
}
