import { RecentType, type RecentTypeItem } from 'im.v2.const';
import { BaseRecentService, type RecentFirstPageRestResult } from 'im.v2.provider.service.recent';

import { saveCollabInfo } from './helpers/save-collab-info';

export class CollabChatService extends BaseRecentService
{
	getRecentType(): RecentTypeItem
	{
		return RecentType.collabChat;
	}

	saveFirstPageData(restResult: RecentFirstPageRestResult): Promise
	{
		return saveCollabInfo(restResult, this.getParentChatId());
	}
}
