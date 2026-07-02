import { Loc } from 'main.core';

import { Layout, ChatType } from 'im.v2.const';
import { LayoutManager } from 'im.v2.lib.layout';
import { BaseMenu } from 'im.v2.lib.menu';
import { Utils } from 'im.v2.lib.utils';

import type { MenuItemOptions } from 'ui.system.menu';

const OPENLINES_PAGE_PATH = '/online/?IM_LINES=';

export class RecentContextMenu extends BaseMenu
{
	static events = {
		...BaseMenu.events,
		openItem: 'openItem',
	};

	getMenuItems(): MenuItemOptions | null[]
	{
		return [
			this.#getOpenItem(),
			this.#getOpenItemInNewTab(),
		];
	}

	#getOpenItem(): MenuItemOptions
	{
		return {
			title: Loc.getMessage('IM_LIB_MENU_OPEN'),
			onClick: () => {
				this.emit(RecentContextMenu.events.openItem, { dialogId: this.context.dialogId });
				void LayoutManager.getInstance().setLayout({
					name: this.#getLayoutName(),
					entityId: this.context.dialogId,
				});
			},
		};
	}

	#getLayoutName(): string
	{
		const chat = this.store.getters['chats/get'](this.context.dialogId);
		const isOpenLinesChat = chat && chat.type === ChatType.lines;

		return isOpenLinesChat ? Layout.openlinesV2 : Layout.chat;
	}

	#getOpenItemInNewTab(): MenuItemOptions
	{
		return {
			title: Loc.getMessage('IM_LIB_MENU_OPEN_IN_NEW_TAB'),
			onClick: () => {
				Utils.browser.openLink(`${OPENLINES_PAGE_PATH}${this.context.dialogId}`);
			},
		};
	}
}
