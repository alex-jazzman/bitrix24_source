import { Loc } from 'main.core';

import { ActionByRole, Layout } from 'im.v2.const';
import { Analytics } from 'im.v2.lib.analytics';
import { showLeaveChatConfirm } from 'im.v2.lib.confirm';
import { LayoutManager } from 'im.v2.lib.layout';
import { RecentMenu } from 'im.v2.lib.menu';

import type { MenuItemOptions } from 'ui.system.menu';

export class ChannelRecentMenu extends RecentMenu
{
	getMenuItems(): MenuItemOptions[]
	{
		return [
			this.getOpenItem(),
			this.getSubscribeItem(),
			this.getUnsubscribeItem(),
		];
	}

	getOpenItem(): MenuItemOptions
	{
		return {
			title: Loc.getMessage('IM_LIB_MENU_OPEN'),
			onClick: () => {
				void LayoutManager.getInstance().setLayout({
					name: Layout.channel,
					entityId: this.context.dialogId,
				});
				this.menuInstance.close();
			},
		};
	}

	getSubscribeItem(): ?MenuItemOptions
	{
		if (!this.isGuestRole())
		{
			return null;
		}

		return {
			title: Loc.getMessage('IM_LIST_CHANNEL_MENU_SUBSCRIBE'),
			onClick: () => {
				void this.chatService.joinChat(this.context.dialogId);
				this.menuInstance.close();
			},
		};
	}

	getUnsubscribeItem(): ?MenuItemOptions
	{
		const { dialogId } = this.context;
		if (this.isGuestRole())
		{
			return null;
		}

		const canLeave = this.permissionManager.canPerformActionByRole(ActionByRole.leave, dialogId);
		if (!canLeave)
		{
			return null;
		}

		return {
			title: Loc.getMessage('IM_LIST_CHANNEL_MENU_UNSUBSCRIBE'),
			onClick: async () => {
				this.menuInstance.close();
				const userChoice = await showLeaveChatConfirm(dialogId);
				if (userChoice === true)
				{
					this.chatService.leaveChat(dialogId);
					Analytics.getInstance().recentContextMenu.onLeave(dialogId);
				}
			},
		};
	}
}
