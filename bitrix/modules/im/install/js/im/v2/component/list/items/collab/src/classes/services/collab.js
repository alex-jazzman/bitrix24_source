import { RecentType, type RecentTypeItem } from 'im.v2.const';
import { BaseRecentService } from 'im.v2.provider.service.recent';

export class CollabService extends BaseRecentService
{
	getRecentType(): RecentTypeItem
	{
		return RecentType.collab;
	}
}
