import { type MenuItemOptions } from 'ui.system.menu';

import { Core } from 'im.v2.application.core';
import { ChatService } from 'im.v2.provider.service.chat';
import { ChatType } from 'im.v2.const';

import { BaseRecentHeaderMenu } from '../base';

export class CollabHeaderMenu extends BaseRecentHeaderMenu
{
	getMenuItems(): MenuItemOptions
	{
		return [this.getDefaultModeItem(), this.getUnreadModeItem()];
	}

	onReadAllClick()
	{
		(new ChatService()).readAllByType(ChatType.collab);
	}

	getUnreadCounter(): number
	{
		return Core.getStore().getters['counters/getTotalCollabCounter'];
	}
}
