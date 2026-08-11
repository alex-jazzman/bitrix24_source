import { Loc } from 'main.core';
import { Outline as OutlineIcons } from 'ui.icon-set.api.core';
import { type MenuItemOptions, type MenuSectionOptions } from 'ui.system.menu';

import { UserType } from 'im.v2.const';
import { Core } from 'im.v2.application.core';
import { MessageMenu } from 'im.v2.lib.menu';

import { Connector } from 'imopenlines.v2.const';
import { MessageService, QuickReplyService } from 'imopenlines.v2.provider.service';

const MenuSectionCode = {
	main: 'first',
	select: 'second',
	third: 'third',
};

export class OpenLinesMessageMenu extends MessageMenu
{
	getMenuItems(): MenuItemOptions[]
	{
		const firstGroupItems = [
			this.getReplyItem(),
			this.getCopyItem(),
			this.getCopyFileItem(),
			this.getMarkItem(),
			this.getForwardItem(),
			this.getFavoriteItem(),
			this.getDownloadFileItem(),
			this.getPinItem(),
			this.getEditItem(),
			this.getSaveAsQuickReplyItem(),
			this.getMultiDialogItem(),
		];

		const secondGroupItems = [
			this.getDeleteItem(),
			this.getSelectItem(),
		];

		return [
			...this.groupItems(firstGroupItems, MenuSectionCode.first),
			...this.groupItems(secondGroupItems, MenuSectionCode.second),
		];
	}

	getMenuGroups(): MenuSectionOptions[]
	{
		return [
			{ code: MenuSectionCode.first },
			{ code: MenuSectionCode.second },
		];
	}

	getSaveAsQuickReplyItem(): ?MenuItemOptions
	{
		if (this.isDeletedMessage() || this.context.text.trim().length === 0)
		{
			return null;
		}

		return {
			icon: OutlineIcons.STRESS,
			title: Loc.getMessage('IMOL_DIALOG_CHAT_MENU_SAVE_QUICK_REPLY'),
			onClick: () => {
				const quickReplyService = new QuickReplyService();
				void quickReplyService.saveFromMessage({
					dialogId: this.context.dialogId,
					messageId: this.context.id,
				}).then((reply) => {
					if (!reply)
					{
						return;
					}

					BX.UI.Notification.Center.notify({
						content: Loc.getMessage('IMOL_DIALOG_CHAT_MENU_SAVE_QUICK_REPLY_SUCCESS'),
					});
				});
			},
		};
	}

	getMultiDialogItem(): ?MenuItemOptions
	{
		const dialogId = this.context.dialogId;

		if (!this.#canShowMultiDialogMenu(dialogId))
		{
			return null;
		}

		return {
			icon: OutlineIcons.MESSAGES_MULTI,
			title: Loc.getMessage('IMOL_DIALOG_CHAT_MENU_MULTI_DIALOG'),
			onClick: () => {
				const messageService = new MessageService();
				void messageService.addSession(this.context.dialogId, this.context.id);
			},
		};
	}

	#isMultiDialog(dialogId: string): boolean
	{
		const currentSession = Core.getStore().getters['openLines/currentSession/getByDialogId'](dialogId);

		return Boolean(currentSession?.multidialog);
	}

	#isNetworkConnector(dialogId: string): boolean
	{
		const currentConnector = Core.getStore().getters['openLines/connector/getByDialogId'](dialogId);

		return currentConnector?.connectorId === Connector.network;
	}

	#isMessageFromClient(): boolean
	{
		const author = Core.getStore().getters['users/get'](this.context.authorId);

		return author?.type === UserType.extranet;
	}

	#canShowMultiDialogMenu(dialogId: string): boolean
	{
		return !this.isDeletedMessage()
			&& this.#isMultiDialog(dialogId)
			&& this.#isNetworkConnector(dialogId)
			&& this.#isMessageFromClient();
	}
}
