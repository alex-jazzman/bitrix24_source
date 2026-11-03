/* eslint-disable */
(function (biconnector_errorMessage, biconnector_grid_editableColumns, main_core, ui_notification, ui_dialogs_messagebox, main_sidepanel) {
	'use strict';

	class SupersetDashboardTagGridManager {
		#grid;
		constructor(props) {
			this.#grid = BX.Main.gridManager.getById(props.gridId)?.instance;
			biconnector_grid_editableColumns.EditableColumnManager.init(props.gridId, [{
				name: 'TITLE',
				saveEndpoint: 'biconnector.dashboardTag.rename',
				onValueCheck: newValue => {
					if (newValue.trim() === '') {
						ui_notification.UI.Notification.Center.notify({
							content: main_core.Loc.getMessage('BICONNECTOR_APACHE_SUPERSET_DASHBOARD_TAG_LIST_TITLE_ERROR_EMPTY')
						});
						return false;
					}
					return true;
				},
				onSave: (rowId, newValue) => {
					const msg = main_core.Loc.getMessage('BICONNECTOR_APACHE_SUPERSET_DASHBOARD_TAG_LIST_RENAME_TITLE_SUCCESS', {
						'#NEW_TITLE#': main_core.Text.encode(newValue)
					});
					ui_notification.UI.Notification.Center.notify({
						content: msg
					});
					this.#sendChangeEventMessage(rowId, newValue);
				}
			}]);
		}
		getGrid() {
			return this.#grid;
		}
		deleteTag(tagId) {
			const grid = this.getGrid();
			const row = grid.getRows().getById(tagId);
			const count = row.getEditData().DASHBOARD_COUNT;
			if (!count) {
				this.#delete(tagId);
				return;
			}
			const messageBox = ui_dialogs_messagebox.MessageBox.confirm(main_core.Loc.getMessage('BICONNECTOR_APACHE_SUPERSET_DASHBOARD_TAG_LIST_DELETE_POPUP'), () => {
				this.#delete(tagId);
				messageBox.close();
			}, main_core.Loc.getMessage('BICONNECTOR_APACHE_SUPERSET_DASHBOARD_TAG_LIST_DELETE_POPUP_YES'));
		}
		#delete(tagId) {
			return main_core.ajax.runAction('biconnector.dashboardTag.delete', {
				data: {
					id: tagId
				}
			}).then(() => {
				this.getGrid().removeRow(tagId, null, null, () => {
					this.#sendDeleteEventMessage(tagId);
				});
				const msg = main_core.Loc.getMessage('BICONNECTOR_APACHE_SUPERSET_DASHBOARD_TAG_LIST_DELETE_SUCCESS');
				ui_notification.UI.Notification.Center.notify({
					content: msg
				});
			}).catch(response => {
				ui_notification.UI.Notification.Center.notify({
					content: biconnector_errorMessage.resolveErrorHtml(response, main_core.Loc.getMessage('BICONNECTOR_APACHE_SUPERSET_DASHBOARD_TAG_LIST_DELETE_ERROR'))
				});
			});
		}
		#sendChangeEventMessage(tagId, title) {
			if (main_sidepanel.SidePanel.Instance) {
				main_sidepanel.SidePanel.Instance.postMessage(window, 'BIConnector.Superset.DashboardTagGrid:onTagChange', {
					tagId,
					title
				});
			}
		}
		#sendDeleteEventMessage(tagId) {
			if (main_sidepanel.SidePanel.Instance) {
				main_sidepanel.SidePanel.Instance.postMessage(window, 'BIConnector.Superset.DashboardTagGrid:onTagDelete', {
					tagId
				});
			}
		}
	}
	main_core.Reflection.namespace('BX.BIConnector').SupersetDashboardTagGridManager = SupersetDashboardTagGridManager;

})(BX.BIConnector, BX.BIConnector.Grid, BX, BX.UI.Notification, BX.UI.Dialogs, BX.SidePanel);
//# sourceMappingURL=script.js.map
