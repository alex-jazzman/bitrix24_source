/* eslint-disable */
this.BX = this.BX || {};
this.BX.Bizproc = this.BX.Bizproc || {};
(function (exports, main_core, main_core_events, ui_notification, ui_dialogs_messagebox, ui_a11y) {
	'use strict';

	const ROW_CREATED_CLASS = 'bizproc-storage-list-row-created';
	const ROW_CREATED_HIGHLIGHT_DURATION = 2400;
	class StorageList {
		static Instance = null;
		#gridId;
		#onStorageRemoveHandler;
		constructor(options) {
			StorageList.Instance = this;
			this.#gridId = options.gridId;
			main_core.Runtime.loadExtension('bizproc.router').then(({
				Router
			}) => {
				Router.init();
			}).catch(e => console.error(e));
			this.#onStorageRemoveHandler = this.#reloadGrid.bind(this);
			top.BX.Event.EventEmitter.subscribe('BX.Bizproc.Component.StorageItemList:onStorageRemove', this.#onStorageRemoveHandler);
			const slider = BX.SidePanel?.Instance?.getSliderByWindow(window);
			if (slider) {
				main_core_events.EventEmitter.subscribeOnce(slider, 'SidePanel.Slider:onDestroy', () => {
					this.destroy();
				});
			}
		}
		destroy() {
			top.BX.Event.EventEmitter.unsubscribe('BX.Bizproc.Component.StorageItemList:onStorageRemove', this.#onStorageRemoveHandler);
		}
		deleteSelected() {
			const grid = BX.Main.gridManager.getInstanceById(this.#gridId);
			const ids = grid?.getRows()?.getSelectedIds?.() || [];
			if (!ids.length) {
				return;
			}
			main_core.ajax.runAction('bizproc.storage.deleteList', {
				data: {
					ids
				}
			}).then(() => grid.reloadTable()).catch(({
				errors
			}) => {
				if (errors?.length) {
					const content = errors.map(({
						message
					}) => message).join('<br>');
					ui_notification.UI.Notification.Center.notify({
						content
					});
				}
			});
		}
		createStorage() {
			main_core.Runtime.loadExtension('bizproc.router').then(({
				Router
			}) => {
				Router.openStorageEdit({
					events: {
						onCloseComplete: event => this.#onStorageCreated(event.getSlider())
					}
				});
			}).catch(e => console.error(e));
		}
		#onStorageCreated(slider) {
			const {
				storageId,
				storageTitle
			} = slider?.getData().get('data') ?? {};
			if (!storageId) {
				return;
			}
			const grid = BX.Main.gridManager.getInstanceById(this.#gridId);
			if (!grid) {
				return;
			}
			grid.reloadTable('POST', {
				createdStorageId: storageId
			}, () => {
				const createdRow = grid.getRows().getById(storageId);
				this.#highlightRow(createdRow);
				this.#announceStorageCreated(storageTitle, createdRow !== null);
			});
		}
		#highlightRow(row) {
			const rowNode = row?.getNode();
			if (!rowNode) {
				return;
			}
			const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
			rowNode.scrollIntoView({
				behavior,
				block: 'nearest'
			});
			main_core.Dom.addClass(rowNode, ROW_CREATED_CLASS);
			setTimeout(() => main_core.Dom.removeClass(rowNode, ROW_CREATED_CLASS), ROW_CREATED_HIGHLIGHT_DURATION);
		}
		#announceStorageCreated(title, isRowShown) {
			let messageId;
			if (isRowShown) {
				messageId = title ? 'BIZPROC_STORAGE_LIST_CREATED_ANNOUNCE' : 'BIZPROC_STORAGE_LIST_CREATED_ANNOUNCE_NO_TITLE';
			} else {
				messageId = title ? 'BIZPROC_STORAGE_LIST_CREATED_ANNOUNCE_NOT_SHOWN' : 'BIZPROC_STORAGE_LIST_CREATED_ANNOUNCE_NOT_SHOWN_NO_TITLE';
			}
			ui_a11y.LiveAnnouncer.announce(main_core.Loc.getMessage(messageId, {
				'#TITLE#': title
			}));
		}
		#reloadGrid() {
			const grid = BX.Main.gridManager.getInstanceById(this.#gridId);
			if (grid) {
				grid.reloadTable();
			}
		}
		removeStorage(storageId) {
			ui_dialogs_messagebox.MessageBox.confirm(main_core.Loc.getMessage('BIZPROC_STORAGE_LIST_CONFIRM_MESSAGE'), messageBox => {
				main_core.ajax.runAction('bizproc.storage.delete', {
					data: {
						id: storageId
					}
				}).then(response => {
					if (response.data) {
						ui_notification.UI.Notification.Center.notify({
							content: main_core.Loc.getMessage('BIZPROC_STORAGE_LIST_DELETE_SUCCESS')
						});
						if (messageBox) {
							messageBox.close();
						}
						this.#reloadGrid();
					}
				}).catch(error => {
					ui_dialogs_messagebox.MessageBox.alert(error.errors.pop().message);
				});
			}, main_core.Loc.getMessage('BIZPROC_STORAGE_LIST_CONFIRM_OK'));
		}
	}

	exports.StorageList = StorageList;

})(this.BX.Bizproc.Component = this.BX.Bizproc.Component || {}, BX, BX.Event, BX.UI.Notification, BX.UI.Dialogs, BX.UI.Accessibility);
//# sourceMappingURL=script.js.map
