import { type MenuItemOptions } from 'ui.system.menu';

import { Core } from 'im.v2.application.core';
import { SystemFolderCode } from 'im.v2.const';
import { Analytics } from 'im.v2.lib.analytics';
import { UnreadModeManager } from 'im.v2.lib.unread-mode';
import { ChatService } from 'im.v2.provider.service.chat';

import { BaseRecentHeaderMenu } from './base';

export class AllFolderHeaderMenu extends BaseRecentHeaderMenu
{
	onSelectUnreadMode()
	{
		Analytics.getInstance().recentHeaderMenu.onOpenUnreadMode();

		this.emit(BaseRecentHeaderMenu.events.onToggleUnreadMode);
	}

	onReadAllClick()
	{
		Analytics.getInstance().recentHeaderMenu.onReadAllChats();

		UnreadModeManager.removeAllClosedChats();

		(new ChatService()).readAll();
	}

	getUnreadModeItem(): MenuItemOptions
	{
		return { ...super.getUnreadModeItem(), dataset: { testid: 'im-recent-header-menu-item-unread' } };
	}

	getDefaultModeItem(): MenuItemOptions
	{
		return { ...super.getDefaultModeItem(), dataset: { testid: 'im-recent-header-menu-item-all' } };
	}

	getReadAllItem(): MenuItemOptions
	{
		return { ...super.getReadAllItem(), dataset: { testid: 'im-recent-header-menu-item-read-all' } };
	}

	getUnreadCounter(): number
	{
		const store = Core.getStore();
		const folderId = store.getters['recent/folders/getByCode'](SystemFolderCode.all).id;
		const sourceDefinitions = store.getters['recent/folders/getSourceDefinitions'](folderId);

		return store.getters['counters/getCounterByRecentSections'](sourceDefinitions);
	}
}
