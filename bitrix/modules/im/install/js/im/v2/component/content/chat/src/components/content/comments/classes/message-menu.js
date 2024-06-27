import { MessageMenu } from 'im.v2.component.message-list';

import type { MenuItem } from 'im.v2.lib.menu';
import type { ImModelChat } from 'im.v2.model';

export class CommentsMessageMenu extends MessageMenu
{
	getMenuItems(): MenuItem[]
	{
		return [
			this.getReplyItem(),
			this.getCopyItem(),
			this.getCopyFileItem(),
			// this.getPinItem(),
			// this.getForwardItem(),
			this.getDelimiter(),
			// this.getMarkItem(),
			this.getFavoriteItem(),
			this.getDelimiter(),
			this.getCreateItem(),
			this.getDelimiter(),
			this.getDownloadFileItem(),
			this.getSaveToDisk(),
			this.getDelimiter(),
			this.getEditItem(),
			this.getDeleteItem(),
		];
	}

	getReplyItem(): ?MenuItem
	{
		if (this.isPostMessage())
		{
			return null;
		}

		return super.getReplyItem();
	}

	getEditItem(): ?MenuItem
	{
		if (this.isPostMessage())
		{
			return null;
		}

		return super.getEditItem();
	}

	getDeleteItem(): ?MenuItem
	{
		if (this.isPostMessage())
		{
			return null;
		}

		return super.getDeleteItem();
	}

	getCreateItem(): ?MenuItem
	{
		if (this.isPostMessage())
		{
			return null;
		}

		return super.getCreateItem();
	}

	isPostMessage(): boolean
	{
		const { dialogId }: ImModelChat = this.store.getters['chats/getByChatId'](this.context.chatId);

		return dialogId !== this.context.dialogId;
	}
}
