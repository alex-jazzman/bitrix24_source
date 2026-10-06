import { Core } from 'im.v2.application.core';
import { RecentType } from 'im.v2.const';

import { BaseRecentHeaderMenu } from '../base';

export class CollabCopilotHeaderMenu extends BaseRecentHeaderMenu
{
	getUnreadCounter(): number
	{
		return Core.getStore().getters['counters/getChildrenTotalCounter'](this.context.parentChatId, RecentType.copilot);
	}
}
