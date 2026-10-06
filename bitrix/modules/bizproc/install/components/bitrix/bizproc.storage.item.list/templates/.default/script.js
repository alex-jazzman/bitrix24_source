/* eslint-disable */
this.BX = this.BX || {};
this.BX.Bizproc = this.BX.Bizproc || {};
(function (exports, main_core, ui_dialogs_messagebox, ui_notification) {
	'use strict';

	class StorageItemList {
		static instance = null;
		constructor(options = {}) {
			this.gridId = options.gridId ?? null;
			StorageItemList.instance = this;
		}
		static removeStorage(storageId) {
			ui_dialogs_messagebox.MessageBox.confirm(main_core.Loc.getMessage('BIZPROC_STORAGE_ITEM_LIST_CONFIRM_MESSAGE') ?? '', messageBox => {
				BX.ajax.runAction('bizproc.storage.delete', {
					data: {
						id: storageId
					}
				}).then(response => {
					if (response.data) {
						top.BX.UI.Notification.Center.notify({
							content: main_core.Loc.getMessage('BIZPROC_STORAGE_ITEM_DELETE_MESSAGE') ?? ''
						});
						if (messageBox) {
							messageBox.close();
						}
						const slider = BX.SidePanel.Instance.getTopSlider();
						if (slider) {
							slider.close();
						}
						top.BX.Event.EventEmitter.emit('BX.Bizproc.Component.StorageItemList:onStorageRemove', {
							storageId
						});
					}
				}).catch(error => {
					ui_dialogs_messagebox.MessageBox.alert(error.errors.pop().message);
				});
			}, main_core.Loc.getMessage('BIZPROC_STORAGE_ITEM_CONFIRM_MESSAGE_OK') ?? '');
		}
		#getGrid() {
			if (!this.gridId || !BX.Main.gridManager) {
				return null;
			}
			return BX.Main.gridManager.getInstanceById(this.gridId);
		}
		#reloadGrid() {
			const grid = this.#getGrid();
			if (grid) {
				grid.reloadTable();
			}
		}
		deleteSelectedItems() {
			const grid = this.#getGrid();
			if (!grid) {
				return;
			}
			const ids = grid.getRows().getSelectedIds();
			if (!ids.length) {
				return;
			}
			main_core.ajax.runAction('bizproc.storage.deleteItems', {
				data: {
					ids
				}
			}).then(response => {
				if (response.data) {
					ui_notification.UI.Notification.Center.notify({
						content: main_core.Loc.getMessage('BIZPROC_STORAGE_ITEM_LIST_DELETE_MESSAGE') ?? ''
					});
					this.#reloadGrid();
				}
			}).catch(error => {
				ui_dialogs_messagebox.MessageBox.alert(error.errors.pop().message);
			});
		}
	}

	exports.StorageItemList = StorageItemList;

})(this.BX.Bizproc.Component = this.BX.Bizproc.Component || {}, BX, BX.UI.Dialogs, BX.UI.Notification);
//# sourceMappingURL=script.js.map
