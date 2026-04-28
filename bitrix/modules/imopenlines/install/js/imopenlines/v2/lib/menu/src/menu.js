import { Loc } from 'main.core';

import { Layout } from 'im.v2.const';
import { LayoutManager } from 'im.v2.lib.layout';
import { BaseMenu } from 'im.v2.lib.menu';
import { Utils } from 'im.v2.lib.utils';

import type { MenuItemOptions } from 'ui.system.menu';

const OPENLINES_PAGE_PATH = '/online/?IM_LINES=';

export class RecentContextMenu extends BaseMenu
{
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
				void LayoutManager.getInstance().setLayout({
					name: Layout.openlinesV2,
					entityId: this.context.dialogId,
				});
				this.menuInstance.close();
			},
		};
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
