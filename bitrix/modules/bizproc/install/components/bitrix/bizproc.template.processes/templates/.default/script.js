/* eslint-disable */
this.BX = this.BX || {};
this.BX.Bizproc = this.BX.Bizproc || {};
(function (exports, main_core, ui_dialogs_messagebox) {
	'use strict';

	class TemplateProcesses {
		#signedParameters;
		#componentName;
		#gridId;
		constructor(options = {
			signedParameters: string,
			componentName: string,
			gridId: string
		}) {
			this.#signedParameters = options.signedParameters;
			this.#componentName = options.componentName;
			this.#gridId = options.gridId;
		}
		#getSelectedTemplateIds() {
			const grid = this.#getGrid();
			if (main_core.Type.isNull(grid)) {
				return [];
			}
			const $templateIds = grid.getRows().getSelectedIds();
			if ($templateIds.length === 0) {
				return [];
			}
			return $templateIds;
		}
		deleteBulkTemplateAction() {
			const templateIds = this.#getSelectedTemplateIds();
			if (templateIds.length === 0) {
				return;
			}
			BX.ajax.runComponentAction(this.#componentName, 'deleteBulkTemplate', {
				mode: 'class',
				data: {
					ids: templateIds
				}
			}).then(() => {
				this.#reloadGrid();
			}).catch(response => {
				ui_dialogs_messagebox.MessageBox.alert(response.errors[0].message);
			});
		}
		editTemplateAction(id) {
			const url = `/bizprocdesigner/editor/?ID=${encodeURIComponent(id)}`;
			window.open(url, '_blank');
		}
		deleteTemplateAction(id) {
			const me = this;
			new ui_dialogs_messagebox.MessageBox({
				message: main_core.Loc.getMessage('BIZPROC_TEMPLATE_PROCESSES_DELETE_CONFIRMATION'),
				okCaption: main_core.Loc.getMessage('BIZPROC_TEMPLATE_PROCESSES_DELETE_OK_CAPTION_TEXT'),
				onOk: messageBox => {
					BX.ajax.runComponentAction(this.#componentName, 'deleteTemplate', {
						mode: 'class',
						data: {
							id: id
						}
					}).then(() => {
						me.#reloadGrid();
						messageBox.close();
					}).catch(response => {
						ui_dialogs_messagebox.MessageBox.alert(response.errors[0].message);
						messageBox.close();
					});
				},
				buttons: ui_dialogs_messagebox.MessageBoxButtons.OK_CANCEL,
				popupOptions: {
					events: {
						onAfterShow: event => {
							const okBtn = event.getTarget().getButton('ok');
							if (okBtn) {
								okBtn.getContainer().focus();
							}
						}
					}
				},
				useAirDesign: true
			}).show();
		}
		#reloadGrid() {
			const grid = this.#getGrid();
			if (grid) {
				grid.reload();
			}
		}
		#getGrid() {
			if (this.#gridId) {
				return BX.Main.gridManager && BX.Main.gridManager.getInstanceById(this.#gridId);
			}
			return null;
		}
		applyActionPanelValues() {
			const grid = this.#getGrid();
			const actionsPanel = grid?.getActionsPanel();
			if (!main_core.Type.isObject(grid) || !main_core.Type.isObject(actionsPanel)) {
				return;
			}
			const action = actionsPanel.getValues();
			if (!action.hasOwnProperty('groupAction')) {
				return;
			}
			if (action['groupAction'] === 'delete') {
				this.deleteBulkTemplateAction();
			}
		}
	}

	exports.TemplateProcesses = TemplateProcesses;

})(this.BX.Bizproc.Component = this.BX.Bizproc.Component || {}, BX, BX.UI.Dialogs);
//# sourceMappingURL=script.js.map
