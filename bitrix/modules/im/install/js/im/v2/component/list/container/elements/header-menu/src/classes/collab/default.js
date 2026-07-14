import { Core } from 'im.v2.application.core';
import { RecentType } from 'im.v2.const';

import { BaseRecentHeaderMenu } from '../base';

export class CollabDefaultHeaderMenu extends BaseRecentHeaderMenu
{
	getUnreadCounter(): number
	{
		const childrenCounter = Core.getStore().getters['counters/getChildrenTotalCounter'](this.context.parentChatId, RecentType.collabDefault);
		const parentCounter = Core.getStore().getters['counters/getTotalCounterByIds']([this.context.parentChatId]);

		return parentCounter + childrenCounter;
	}
}
