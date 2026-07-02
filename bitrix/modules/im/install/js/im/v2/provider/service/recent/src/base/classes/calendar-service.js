import { RecentType, type RecentTypeItem } from 'im.v2.const';

import { BaseRecentService } from '../base-recent';

export class CalendarRecentService extends BaseRecentService
{
	getRecentType(): RecentTypeItem
	{
		return RecentType.calendar;
	}
}
