import { RecentType, type RecentTypeItem } from 'im.v2.const';

import { BaseRecentService } from '../base-recent';

export class CopilotRecentV2Service extends BaseRecentService
{
	getRecentType(): RecentTypeItem
	{
		return RecentType.copilot;
	}
}
