import { Loc } from 'main.core';
import { Outline } from 'ui.icon-set.api.core';

import { Tab } from './tab';
import { type TabOptions } from './tab-options';
import { type Dialog } from '../dialog';

export class RecentTab extends Tab
{
	constructor(dialog: Dialog, tabOptions: Omit<TabOptions, 'id'> | undefined)
	{
		const defaults = {
			title: Loc.getMessage('UI_SELECTOR_RECENT_TAB_TITLE') || '',
			itemOrder: { sort: 'asc' } as const,
			visible: !dialog.isDropdownMode(),
			stub: !dialog.isDropdownMode(),
			icon: Outline.SEARCH,
		};

		const options: TabOptions = { ...defaults, ...tabOptions, id: 'recents' };

		super(dialog, options);
	}
}
