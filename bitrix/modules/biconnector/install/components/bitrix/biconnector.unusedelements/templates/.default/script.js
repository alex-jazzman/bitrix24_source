/* eslint-disable */
(function (biconnector_errorMessage, main_core, main_core_events, ui_dialogs_messagebox) {
	'use strict';

	/**
	 * @namespace BX.BIConnector
	 */
	class UnusedElementsGridManager {
		#grid;
		constructor(props) {
			this.#grid = BX.Main.gridManager.getById(props.gridId)?.instance;
			this.#initHints();
			this.#subscribeToEvents();
		}
		#initHints() {
			const manager = BX.UI.Hint.createInstance({
				popupParameters: {
					autoHide: true
				}
			});
			manager.init(this.#grid.getContainer());
		}
		#subscribeToEvents() {
			main_core_events.EventEmitter.subscribe('Grid::updated', () => {
				this.#initHints();
			});
		}
		deleteElement(elements) {
			let popupTitle = main_core.Loc.getMessage('BI_UNUSED_ELEMENTS_POPUP_DELETE_TITLE_SINGLE');
			let popupText = main_core.Loc.getMessage('BI_UNUSED_ELEMENTS_POPUP_DELETE_TEXT_SINGLE');
			let deleteErrorMessage = main_core.Loc.getMessage('BI_UNUSED_ELEMENTS_DELETE_ERROR_SINGLE');
			if (elements.length > 1) {
				popupTitle = main_core.Loc.getMessage('BI_UNUSED_ELEMENTS_POPUP_DELETE_TITLE');
				popupText = main_core.Loc.getMessage('BI_UNUSED_ELEMENTS_POPUP_DELETE_TEXT');
				deleteErrorMessage = main_core.Loc.getMessage('BI_UNUSED_ELEMENTS_DELETE_ERROR');
			}
			const messageBox = new ui_dialogs_messagebox.MessageBox({
				title: popupTitle,
				message: popupText,
				maxWidth: 300,
				minWidth: 300,
				buttons: [new BX.UI.Button({
					color: BX.UI.Button.Color.DANGER,
					text: main_core.Loc.getMessage('BI_UNUSED_ELEMENTS_POPUP_DELETE_BUTTON_YES'),
					onclick: button => {
						button.setWaiting();
						main_core.ajax.runComponentAction('bitrix:biconnector.unusedelements', 'delete', {
							mode: 'class',
							data: {
								elements
							}
						}).then(() => {
							this.#grid.reload();
							messageBox.close();
						}).catch(response => {
							messageBox.close();
							this.#notifyError(response, deleteErrorMessage);
						});
					}
				}), new BX.UI.CancelButton({
					text: main_core.Loc.getMessage('BI_UNUSED_ELEMENTS_POPUP_DELETE_BUTTON_NO'),
					onclick: () => messageBox.close()
				})]
			});
			messageBox.show();
		}

		// noinspection JSUnusedGlobalSymbols
		openElement(openUrl) {
			this.#grid.tableFade();
			main_core.ajax.runComponentAction('bitrix:biconnector.unusedelements', 'getOpenUrl', {
				mode: 'class',
				data: {
					openUrl
				}
			}).then(response => {
				const link = response.data;
				if (link) {
					window.open(link, '_blank').focus();
				}
				this.#grid.tableUnfade();
			}).catch(response => {
				this.#notifyError(response, main_core.Loc.getMessage('BI_UNUSED_ELEMENTS_OPEN_ERROR'));
				this.#grid.tableUnfade();
			});
		}

		// noinspection JSUnusedGlobalSymbols
		deleteSelectedElements() {
			const selectedElements = this.#grid.getRows().getSelected();
			const elementsToDelete = [];
			for (const row of selectedElements) {
				const rowData = row.getEditData();
				elementsToDelete.push({
					elementId: rowData.EXTERNAL_ID,
					elementType: rowData.TYPE
				});
			}
			this.deleteElement(elementsToDelete);
		}
		#notifyError(response, fallbackMessage) {
			BX.UI.Notification.Center.notify({
				content: biconnector_errorMessage.resolveErrorHtml(response, fallbackMessage)
			});
		}
	}
	main_core.Reflection.namespace('BX.BIConnector').UnusedElementsGridManager = UnusedElementsGridManager;

})(BX.BIConnector, BX, BX.Event, BX.UI.Dialogs);
//# sourceMappingURL=script.js.map
