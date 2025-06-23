import { Loc } from 'main.core';
import { EventEmitter } from 'main.core.events';

import { EventType } from 'im.v2.const';
import { ChannelManager } from 'im.v2.lib.channel';

import { MessageMenu } from './message-base';

import type { MenuItem } from 'im.v2.lib.menu';

export class CommentsMessageMenu extends MessageMenu
{
	getMenuItems(): MenuItem[]
	{
		const message = this.context;
		const contextDialogId = this.context.dialogId;
		if (ChannelManager.isCommentsPostMessage(message, contextDialogId))
		{
			return [
				this.getCopyItem(),
				this.getCopyFileItem(),
				this.getDelimiter(),

				this.getDownloadFileItem(),
				this.getSaveToDiskItem(),
				this.getDelimiter(),

				this.getOpenInChannelItem(),
			];
		}

		return [
			this.getReplyItem(),
			this.getCopyItem(),
			this.getEditItem(),
			...this.getAdditionalItems(),
			this.getDeleteItem(),
		];
	}

	getNestedItems(): MenuItem[]
	{
		return [
			this.getCopyFileItem(),
			this.getFavoriteItem(),
			this.getDownloadFileItem(),
			this.getSaveToDiskItem(),
			this.getDelimiter(),
			this.getCreateTaskItem(),
			this.getCreateMeetingItem(),
		];
	}

	getOpenInChannelItem(): MenuItem
	{
		return {
			text: Loc.getMessage('IM_LIB_MENU_COMMENTS_OPEN_IN_CHANNEL'),
			onclick: () => {
				EventEmitter.emit(EventType.dialog.closeComments);

				this.menuInstance.close();
			},
		};
	}
}
