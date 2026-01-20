import { Loc } from 'main.core';
import { Outline as OutlineIcons } from 'ui.icon-set.api.core';

import { EventType } from 'im.v2.const';
import { ChannelManager } from 'im.v2.lib.channel';

import { MessageMenu, MenuSectionCode, NestedMenuSectionCode } from './message-base';

import type { MenuItemOptions, MenuSectionOptions } from 'ui.system.menu';

export class CommentsMessageMenu extends MessageMenu
{
	getMenuItems(): MenuItemOptions[]
	{
		const message = this.context;
		const contextDialogId = this.context.dialogId;
		if (ChannelManager.isCommentsPostMessage(message, contextDialogId))
		{
			return this.#getCommentsPostMenuItems();
		}

		return this.#getDefaultMenuItems();
	}

	getNestedItems(): MenuItemOptions[]
	{
		const firstGroupItems = [
			this.getCopyFileItem(),
			this.getFavoriteItem(),
			this.getSaveToDiskItem(),
			this.getCreateMeetingItem(),
		];

		return this.groupItems(firstGroupItems, NestedMenuSectionCode.first);
	}

	getMenuGroups(): MenuSectionOptions[]
	{
		return [
			{ code: MenuSectionCode.first },
			{ code: MenuSectionCode.second },
			{ code: MenuSectionCode.third },
		];
	}

	getNestedMenuGroups(): MenuSectionOptions[]
	{
		return [
			{ code: NestedMenuSectionCode.first },
		];
	}

	getOpenInChannelItem(): MenuItemOptions
	{
		return {
			title: Loc.getMessage('IM_LIB_MENU_COMMENTS_OPEN_IN_CHANNEL'),
			icon: OutlineIcons.GO_TO_MESSAGE,
			onClick: () => {
				this.emitter.emit(EventType.dialog.closeComments);

				this.menuInstance.close();
			},
		};
	}

	#getCommentsPostMenuItems(): MenuItemOptions[]
	{
		const firstGroupItems = [
			this.getCopyItem(),
			this.getCopyFileItem(),
		];
		const secondGroupItems = [
			this.getDownloadFileItem(),
			this.getSaveToDiskItem(),
		];

		return [
			...this.groupItems(firstGroupItems, MenuSectionCode.first),
			...this.groupItems(secondGroupItems, MenuSectionCode.second),
			...this.groupItems([this.getOpenInChannelItem()], MenuSectionCode.third),
		];
	}

	#getDefaultMenuItems(): MenuItemOptions[]
	{
		const firstGroupItems = [
			this.getReplyItem(),
			this.getCopyItem(),
			this.getEditItem(),
			this.getDownloadFileItem(),
			this.getAskCopilotItem(),
			this.getCreateTaskItem(),
			...this.getAdditionalItems(),
		];

		return [
			...this.groupItems(firstGroupItems, MenuSectionCode.first),
			...this.groupItems([this.getDeleteItem()], MenuSectionCode.second),
		];
	}
}
