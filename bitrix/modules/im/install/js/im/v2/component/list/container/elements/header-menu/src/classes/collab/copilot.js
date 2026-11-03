import { Core } from 'im.v2.application.core';
import { RecentType } from 'im.v2.const';
import { Analytics } from 'im.v2.lib.analytics';

import { BaseRecentHeaderMenu } from '../base';

export class CollabCopilotHeaderMenu extends BaseRecentHeaderMenu
{
	onSelectUnreadMode()
	{
		Analytics.getInstance().recentHeaderMenu.onOpenProjectUnreadMode();

		this.emit(BaseRecentHeaderMenu.events.onToggleUnreadMode);
	}

	getUnreadCounter(): number
	{
		return Core.getStore().getters['counters/getChildrenTotalCounter'](this.context.parentChatId, RecentType.copilot);
	}
}
