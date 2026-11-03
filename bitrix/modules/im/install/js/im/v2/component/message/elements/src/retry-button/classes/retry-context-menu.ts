import { Loc } from 'main.core';
import { MenuItemDesign, type MenuItemOptions } from 'ui.system.menu';

import { Core } from 'im.v2.application.core';
import { BaseMenu } from 'im.v2.lib.menu';
import { type ImModelMessage } from 'im.v2.model';
import { MessageService } from 'im.v2.provider.service.message';
import { SendingService } from 'im.v2.provider.service.sending';
import { UploadingService } from 'im.v2.provider.service.uploading';

export class RetryContextMenu extends BaseMenu
{
	declare context: ImModelMessage & { dialogId: string };

	constructor()
	{
		super();

		this.id = 'bx-im-message-retry-context-menu';
	}

	getMenuItems(): MenuItemOptions[] | null[]
	{
		return [this.getRetryItem(), this.getDeleteItem()] as MenuItemOptions[];
	}

	getRetryItem(): MenuItemOptions | null
	{
		if (!this.#isOwnMessage() || !this.#hasError())
		{
			return null;
		}

		return {
			title: Loc.getMessage('IM_MESSENGER_MESSAGE_CONTEXT_MENU_RETRY') ?? '',
			onClick: () => {
				this.#retrySend();
				this.menuInstance.close();
			},
		} as unknown as MenuItemOptions;
	}

	getDeleteItem(): MenuItemOptions | null | undefined
	{
		if (!this.#isOwnMessage() || !this.#hasError())
		{
			return null;
		}

		return {
			title: Loc.getMessage('IM_MESSENGER_MESSAGE_CONTEXT_MENU_DELETE') ?? '',
			design: MenuItemDesign.Alert,
			onClick: () => {
				const messageService = new MessageService({ chatId: this.context.chatId });
				messageService.deleteMessages([this.context.id as number]);
				this.menuInstance.close();
			},
		} as unknown as MenuItemOptions;
	}

	#isOwnMessage(): boolean
	{
		return this.context.authorId === Core.getUserId();
	}

	#hasError(): boolean
	{
		return this.context.error;
	}

	#hasFiles(): boolean
	{
		return this.context.files.length > 0;
	}

	#retrySend()
	{
		if (this.#hasFiles())
		{
			const uploadingService: UploadingService = UploadingService.getInstance();
			const uploaderId: string = uploadingService.getUploaderIdByFileId(this.context.files[0]) as string;

			uploadingService.retry(uploaderId);

			return;
		}

		this.#retrySendMessage();
	}

	#retrySendMessage()
	{
		void new SendingService().retrySendMessage({
			tempMessageId: this.context.id as string,
			dialogId: this.context.dialogId,
		});
	}
}
