import { Loc } from 'main.core';
import { MessageBox } from 'ui.dialogs.messagebox';

import './style.css';

export class StorageItemList
{
	static instance: ?StorageItemList = null;

	constructor()
	{
		StorageItemList.instance = this;
	}

	static removeStorage(storageId: number): void
	{
		MessageBox.confirm(
			Loc.getMessage('BIZPROC_STORAGE_ITEM_LIST_CONFIRM_MESSAGE') ?? '',
			(messageBox) => {
				BX.ajax.runAction('bizproc.storage.delete', { data: {id: storageId} })
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
								{ storageId: storageId }
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
}