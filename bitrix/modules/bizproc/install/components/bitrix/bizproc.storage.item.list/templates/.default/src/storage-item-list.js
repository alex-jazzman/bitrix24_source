import { Loc, ajax } from 'main.core';
import { MessageBox } from 'ui.dialogs.messagebox';
import { UI } from 'ui.notification';

import './style.css';

export class StorageItemList
{
	static instance: ?StorageItemList = null;

	constructor(options: { gridId?: string } = {})
	{
		this.gridId = options.gridId ?? null;
		StorageItemList.instance = this;
	}

	static removeStorage(storageId: number): void
	{
		MessageBox.confirm(
			Loc.getMessage('BIZPROC_STORAGE_ITEM_LIST_CONFIRM_MESSAGE') ?? '',
			(messageBox) => {
				BX.ajax.runAction('bizproc.storage.delete', { data: { id: storageId } })
					.then((response) => {
						if (response.data)
						{
							top.BX.UI.Notification.Center.notify({
								content: Loc.getMessage('BIZPROC_STORAGE_ITEM_DELETE_MESSAGE') ?? '',
							});

							if (messageBox)
							{
								messageBox.close();
							}

							const slider = BX.SidePanel.Instance.getTopSlider();
							if (slider)
							{
								slider.close();
							}

							top.BX.Event.EventEmitter.emit(
								'BX.Bizproc.Component.StorageItemList:onStorageRemove',
								{ storageId },
							);
						}
					})
					.catch((error) => {
						MessageBox.alert(error.errors.pop().message);
					});
			},
			Loc.getMessage('BIZPROC_STORAGE_ITEM_CONFIRM_MESSAGE_OK') ?? '',
		);
	}

	#getGrid()
	{
		if (!this.gridId || !BX.Main.gridManager)
		{
			return null;
		}

		return BX.Main.gridManager.getInstanceById(this.gridId);
	}

	#reloadGrid(): void
	{
		const grid = this.#getGrid();
		if (grid)
		{
			grid.reloadTable();
		}
	}

	deleteSelectedItems(): void
	{
		const grid = this.#getGrid();
		if (!grid)
		{
			return;
		}

		const ids = grid.getRows().getSelectedIds();
		if (!ids.length)
		{
			return;
		}

		ajax.runAction('bizproc.storage.deleteItems', { data: { ids } })
			.then((response) => {
				if (response.data)
				{
					UI.Notification.Center.notify({
						content: Loc.getMessage('BIZPROC_STORAGE_ITEM_LIST_DELETE_MESSAGE') ?? '',
					});

					this.#reloadGrid();
				}
			})
			.catch((error) => {
				MessageBox.alert(error.errors.pop().message);
			});
	}
}
