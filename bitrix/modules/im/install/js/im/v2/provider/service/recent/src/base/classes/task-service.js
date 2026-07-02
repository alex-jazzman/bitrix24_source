import { RecentType, type RecentTypeItem } from 'im.v2.const';

import { BaseRecentService } from '../base-recent';

export class TaskRecentService extends BaseRecentService
{
	getRecentType(): RecentTypeItem
	{
		return RecentType.taskComments;
	}
}
