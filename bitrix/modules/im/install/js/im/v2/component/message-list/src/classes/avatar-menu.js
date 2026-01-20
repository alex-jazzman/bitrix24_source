import { Core } from 'im.v2.application.core';
import { UserMenu } from 'im.v2.lib.menu';

import type { MenuItemOptions, MenuOptions } from 'ui.system.menu';
import type { ApplicationContext } from 'im.v2.const';

export class AvatarMenu extends UserMenu
{
	constructor(applicationContext: ApplicationContext)
	{
		super(applicationContext);

		this.id = 'bx-im-avatar-context-menu';
	}

	getMenuOptions(): MenuOptions
	{
		return {
			...super.getMenuOptions(),
			className: this.getMenuClassName(),
			angle: true,
			offsetLeft: 21,
		};
	}

	getMenuItems(): MenuItemOptions | null[]
	{
		const isCurrentUser = this.context.user.id === Core.getUserId();
		if (isCurrentUser)
		{
			return [
				this.getProfileItem(),
			];
		}

		return [
			this.getMentionItem(),
			this.getSendItem(),
			this.getProfileItem(),
			this.getKickItem(),
		];
	}
}
