import { CalendarRecentService, type RecentFirstPageRestResult } from 'im.v2.provider.service.recent';

import { saveCollabInfo } from './helpers/save-collab-info';

export class CollabCalendarRecentService extends CalendarRecentService
{
	saveFirstPageData(restResult: RecentFirstPageRestResult): Promise
	{
		return saveCollabInfo(restResult, this.getParentChatId());
	}
}
