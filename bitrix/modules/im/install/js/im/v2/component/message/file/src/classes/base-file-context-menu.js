import { Loc } from 'main.core';

import { DiskService } from 'im.v2.provider.service.disk';
import { BaseMenu } from 'im.v2.lib.menu';
import { Utils } from 'im.v2.lib.utils';
import { PopupType } from 'im.v2.const';
import { Notifier } from 'im.v2.lib.notifier';

import type { MenuItem } from 'im.v2.lib.menu';
import type { ImModelFile, ImModelMessage } from 'im.v2.model';

export class BaseFileContextMenu extends BaseMenu
{
	context: ImModelMessage & {dialogId: string, fileId: number};

	id: String = PopupType.messageBaseFileMenu;
	diskService: DiskService;

	constructor()
	{
		super();

		this.id = 'bx-im-message-file-context-menu';
		this.diskService = new DiskService();
	}

	getMenuItems(): Array
	{
		return [
			this.getDownloadFileItem(),
			this.getSaveToDiskItem(),
		];
	}

	getDownloadFileItem(): ?MenuItem
	{
		const file = this.#getMessageFile();
		if (!file)
		{
			return null;
		}

		return {
			html: Utils.file.createDownloadLink(
				Loc.getMessage('IM_MESSAGE_FILE_MENU_DOWNLOAD_FILE'),
				file.urlDownload,
				file.name,
			),
			onclick: function() {
				this.menuInstance.close();
			}.bind(this),
		};
	}

	getSaveToDiskItem(): ?MenuItem
	{
		const file = this.#getMessageFile();
		if (!file)
		{
			return null;
		}

		return {
			text: Loc.getMessage('IM_MESSAGE_FILE_MENU_SAVE_ON_DISK_MSGVER_1'),
			onclick: async function() {
				this.menuInstance.close();
				await this.diskService.save(this.context.files);
				Notifier.file.onDiskSaveComplete();
			}.bind(this),
		};
	}

	#getMessageFile(): ?ImModelFile
	{
		if (!this.context.fileId)
		{
			return null;
		}

		return this.store.getters['files/get'](this.context.fileId);
	}
}
