import { Loc } from 'main.core';

import { Utils } from 'im.v2.lib.utils';
import { RecentMenu } from 'im.v2.lib.menu';
import { ChatActionType } from 'im.v2.const';
import { PermissionManager } from 'im.v2.lib.permission';

import type { MenuItem } from 'im.v2.lib.menu';

export class MainMenu extends RecentMenu
{
	permissionManager: PermissionManager;

	static events = {
		onAddToChatShow: 'onAddToChatShow',
	};

	constructor()
	{
		super();
		this.id = 'im-sidebar-context-menu';
		this.permissionManager = PermissionManager.getInstance();
	}

	getMenuOptions(): Object
	{
		return {
			...super.getMenuOptions(),
			className: this.getMenuClassName(),
			angle: false,
		};
	}

	getMenuItems(): MenuItem[]
	{
		return [
			this.getUnreadMessageItem(),
			this.getPinMessageItem(),
			this.getCallItem(),
			this.getOpenProfileItem(),
			this.getOpenUserCalendarItem(),
			this.getChatsWithUserItem(),
			this.getAddMembersToChatItem(),
			this.getHideItem(),
			this.getLeaveItem(),
		];
	}

	getOpenUserCalendarItem(): ?MenuItem
	{
		if (!this.isUser())
		{
			return null;
		}

		if (this.isBot())
		{
			return null;
		}

		const profileUri = Utils.user.getCalendarLink(this.context.dialogId);

		return {
			text: Loc.getMessage('IM_LIB_MENU_OPEN_CALENDAR_V2'),
			onclick: () => {
				BX.SidePanel.Instance.open(profileUri);
				this.menuInstance.close();
			},
		};
	}

	getAddMembersToChatItem(): MenuItem
	{
		if (this.isBot())
		{
			return null;
		}
		const canExtend = this.permissionManager.canPerformAction(ChatActionType.extend, this.context.dialogId);
		if (!canExtend)
		{
			return null;
		}

		return {
			text: Loc.getMessage('IM_SIDEBAR_MENU_INVITE_MEMBERS_V2'),
			onclick: () => {
				this.emit(MainMenu.events.onAddToChatShow);
				this.menuInstance.close();
			},
		};
	}
}
