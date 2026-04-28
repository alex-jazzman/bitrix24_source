import { Outline as OutlineIcons } from 'ui.icon-set.api.core';
import { Loc } from 'main.core';
import { Core } from 'im.v2.application.core';
import { MessageMenu } from 'im.v2.lib.menu';

import { MessageService } from 'imopenlines.v2.provider.service';
import { Connector } from 'imopenlines.v2.const';

import type { MenuItemOptions, MenuSectionOptions } from 'ui.system.menu';

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
			this.getMarkItem(),
			this.getForwardItem(),
			this.getFavoriteItem(),
			this.getDownloadFileItem(),
			this.getEditItem(),
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

	#isSupport24(dialogId: string): boolean
	{
		return Core.getStore().getters['users/bots/isSupport'](dialogId);
	}

	#canShowMultiDialogMenu(dialogId: string): boolean
	{
		return !this.isDeletedMessage()
			&& this.#isMultiDialog(dialogId)
			&& this.#isNetworkConnector(dialogId)
			&& this.#isSupport24(dialogId);
	}
}
