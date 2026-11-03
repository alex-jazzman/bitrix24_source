import { Loc } from 'main.core';
import { Outline as OutlineIcons } from 'ui.icon-set.api.core';
import { type MenuItemOptions } from 'ui.system.menu';

import { type RecentTypeItem } from 'im.v2.const';
import { AnalyticsSection } from 'im.v2.lib.analytics';

import { BaseMenu } from '../base/base';
import { ReadAllOperation } from '../read-all/read-all';

// Test label of every item of this menu is `{menu id}-{action}` - the same rule the folder menus
// follow, so a label never has to be looked up to be known.
const MENU_ID = 'im-list-filter-unread-menu';

// The context menu of the unread chip: the chip itself is the filter, so the menu carries the one
// action the filter has no room for.
export class UnreadFilterMenu extends BaseMenu
{
	context: { section: RecentTypeItem };

	static isAvailableFor(section: ?RecentTypeItem): boolean
	{
		return ReadAllOperation.isSupported(section);
	}

	constructor()
	{
		super();

		this.id = MENU_ID;
	}

	getMenuItems(): MenuItemOptions[]
	{
		return [this.getReadAllItem()];
	}

	getReadAllItem(): MenuItemOptions
	{
		return {
			title: Loc.getMessage('IM_LIB_MENU_READ_ALL_CHATS'),
			icon: OutlineIcons.CHATS_WITH_CHECK,
			dataset: { testid: `${MENU_ID}-read-all` },
			onClick: () => ReadAllOperation.run(this.context.section, AnalyticsSection.filterRow),
		};
	}
}
