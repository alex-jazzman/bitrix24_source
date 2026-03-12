import { Loc } from 'main.core';

import { RecentMenu, BaseMenu } from 'im.v2.lib.menu';
import { ChatService } from 'im.v2.provider.service.chat';

import type { MenuItemOptions } from 'ui.system.menu';
import type { ApplicationContext } from 'im.v2.const';

export class SearchContextMenu extends RecentMenu
{
	static events = {
		...BaseMenu.events,
		openItem: 'openItem',
	};

	chatService: ChatService;

	constructor(applicationContext: ApplicationContext)
	{
		super(applicationContext);

		this.id = 'im-chat-search-context-menu';
		this.chatService = new ChatService();
	}

	getMenuItems(): MenuItemOptions | null[]
	{
		return [
			this.getOpenItem(),
			this.getOpenProfileItem(),
			this.getChatsWithUserItem(),
			this.getPinMessageItem(),
			this.getJoinItem(),
		];
	}

	getOpenItem(): MenuItemOptions
	{
		return {
			title: Loc.getMessage('IM_LIB_MENU_OPEN'),
			onClick: () => {
				this.emit(SearchContextMenu.events.openItem, { dialogId: this.context.dialogId });
				this.menuInstance.close();
			},
		};
	}

	getJoinItem(): ?MenuItemOptions
	{
		const { dialogId } = this.context;
		if (!this.isGuestRole())
		{
			return null;
		}

		return {
			title: this.isOpenChat()
				? Loc.getMessage('IM_SEARCH_ITEM_JOIN_TO_CHAT')
				: Loc.getMessage('IM_SEARCH_ITEM_JOIN_TO_CHANNEL'),
			onClick: () => {
				this.chatService.joinChat(dialogId);
				this.menuInstance.close();
			},
		};
	}
}
