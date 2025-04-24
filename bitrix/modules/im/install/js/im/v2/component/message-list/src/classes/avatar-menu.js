import { Core } from 'im.v2.application.core';
import { UserMenu } from 'im.v2.lib.menu';

import type { MenuItem } from 'im.v2.lib.menu';

export class AvatarMenu extends UserMenu
{
	constructor()
	{
		super();

		this.id = 'bx-im-avatar-context-menu';
	}

	getMenuOptions(): Object
	{
		return {
			...super.getMenuOptions(),
			className: this.getMenuClassName(),
			angle: true,
			offsetLeft: 21,
		};
	}

	getMenuItems(): MenuItem[]
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
