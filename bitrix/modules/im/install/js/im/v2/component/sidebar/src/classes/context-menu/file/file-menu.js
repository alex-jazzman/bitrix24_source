import 'ui.viewer';
import 'ui.notification';
import { Loc, Dom } from 'main.core';

import { SidebarMenu } from '../sidebar-base-menu';
import { FileManager } from './file-manager';

import type { MenuItem } from 'im.v2.lib.menu';
import type { ImModelFile, ImModelSidebarFileItem } from 'im.v2.model';

type MediaMenuContext = {
	sidebarFile: ImModelSidebarFileItem,
	file: ImModelFile,
	messageId: number,
	dialogId: string,
}

export class FileMenu extends SidebarMenu
{
	context: MediaMenuContext;

	constructor()
	{
		super();

		this.id = 'im-sidebar-context-menu';
		this.mediaManager = new FileManager();
	}

	getMenuItems(): MenuItem[]
	{
		return [
			this.getOpenContextMessageItem(),
			this.getDownloadFileItem(),
			this.getSaveFileOnDiskItem(),
			this.getDeleteFileItem(),
		];
	}

	getDownloadFileItem(): ?MenuItem
	{
		if (!this.context.file.urlDownload)
		{
			return null;
		}

		return {
			html: this.getDownloadHtml(this.context.file.urlDownload, this.context.file.name),
			onclick: function() {
				this.menuInstance.close();
			}.bind(this),
		};
	}

	getSaveFileOnDiskItem(): ?MenuItem
	{
		if (!this.context.sidebarFile.fileId)
		{
			return null;
		}

		return {
			text: Loc.getMessage('IM_SIDEBAR_MENU_SAVE_FILE_ON_DISK_MSGVER_1'),
			onclick: function() {
				void this.mediaManager.saveOnDisk([this.context.sidebarFile.fileId]).then(() => {
					BX.UI.Notification.Center.notify({
						content: Loc.getMessage('IM_SERVICE_FILE_SAVED_ON_DISK_SUCCESS_MSGVER_1'),
					});
				});
				this.menuInstance.close();
			}.bind(this),
		};
	}

	getDeleteFileItem(): MenuItem
	{
		if (this.getCurrentUserId() !== this.context.sidebarFile.authorId)
		{
			return null;
		}

		return {
			text: Loc.getMessage('IM_SIDEBAR_MENU_DELETE_FILE'),
			onclick: function() {
				this.mediaManager.delete(this.context.sidebarFile);
				this.menuInstance.close();
			}.bind(this),
		};
	}

	getDownloadHtml(urlDownload: string, fileName: string): HTMLAnchorElement
	{
		const a = Dom.create('a', {
			text: Loc.getMessage('IM_SIDEBAR_MENU_DOWNLOAD_FILE'),
		});

		Dom.style(a, 'display', 'block');
		Dom.style(a, 'color', 'inherit');
		Dom.style(a, 'text-decoration', 'inherit');

		a.setAttribute('href', urlDownload);
		a.setAttribute('download', fileName);

		return a;
	}
}
