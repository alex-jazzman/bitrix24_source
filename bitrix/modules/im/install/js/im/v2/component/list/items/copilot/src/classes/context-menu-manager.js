import { Loc } from 'main.core';

import { Messenger } from 'im.public';
import { RecentMenu, type MenuItem } from 'im.v2.lib.menu';
import { Feature, FeatureManager } from 'im.v2.lib.feature';

import { CopilotRecentService } from './copilot-service';

export class CopilotRecentMenu extends RecentMenu
{
	getMenuItems(): MenuItem[]
	{
		if (FeatureManager.isFeatureAvailable(Feature.showCopilotChatsInRecentTab))
		{
			return [
				this.getUnreadMessageItem(),
				this.getPinMessageItem(),
				this.getMuteItem(),
				this.getHideItem(),
				this.getLeaveItem(),
			];
		}

		return [
			this.getPinMessageItem(),
			this.getHideItem(),
			this.getLeaveItem(),
		];
	}

	getOpenItem(): MenuItem
	{
		return {
			text: Loc.getMessage('IM_LIB_MENU_OPEN'),
			onclick: () => {
				Messenger.openCopilot(this.context.dialogId);
				this.menuInstance.close();
			},
		};
	}

	getHideItem(): MenuItem
	{
		return {
			text: Loc.getMessage('IM_LIB_MENU_HIDE_MSGVER_1'),
			onclick: () => {
				this.getRecentService().hideChat(this.context.dialogId);
				this.menuInstance.close();
			},
		};
	}

	getRecentService(): CopilotRecentService
	{
		if (!this.service)
		{
			this.service = new CopilotRecentService();
		}

		return this.service;
	}
}
