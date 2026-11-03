/* eslint-disable */
(function (biconnector_errorMessage, biconnector_grid_editableColumns, main_core, ui_buttons, ui_system_dialog, main_core_events) {
	'use strict';

	/**
	 * @namespace BX.BIConnector
	 */
	class ExternalSourceManager {
		#grid;
		#filter;
		#sourceTitleList;
		#datasetUrl = '/bi/table/';
		#isDatasetCreationOpening = false;
		constructor(props) {
			this.#grid = BX.Main.gridManager.getById(props.gridId)?.instance;
			this.#filter = BX.Main.filterManager.getById(props.gridId);
			this.#sourceTitleList = props.sourceTitleList ?? {};
			this.#initHints();
			this.#subscribeToEvents();
			biconnector_grid_editableColumns.EditableColumnManager.init(props.gridId, [{
				name: 'DESCRIPTION',
				saveEndpoint: 'biconnector.externalsource.source.updateComment',
				onValueCheck: () => true,
				onSave: () => {
					BX.UI.Notification.Center.notify({
						content: main_core.Text.encode(main_core.Loc.getMessage('BICONNECTOR_SUPERSET_EXTERNAL_SOURCE_GRID_COMMENT_UPDATED'))
					});
				}
			}]);
		}
		#subscribeToEvents() {
			main_core_events.EventEmitter.subscribe('Grid::updated', () => {
				this.#initHints();
			});
			main_core_events.EventEmitter.subscribe('SidePanel.Slider:onMessage', event => {
				const [messageEvent] = event.getData();
				const eventId = messageEvent.getEventId();
				if (eventId === 'BIConnector:ExternalConnectionGrid:reload' || eventId === 'BIConnector:ExternalConnection:onConnectionSave') {
					this.#grid.reload();
				}
			});
		}
		#initHints() {
			const manager = BX.UI.Hint.createInstance({
				popupParameters: {
					autoHide: true
				}
			});
			manager.init(this.#grid.getContainer());
		}
		getGrid() {
			return this.#grid;
		}
		getFilter() {
			return this.#filter;
		}
		handleCreatedByClick(ownerData) {
			this.handleDatasetFilterChange({
				fieldId: 'CREATED_BY_ID',
				...ownerData
			});
		}
		handleDatasetFilterChange(fieldData) {
			const filterFieldsValues = this.getFilter().getFilterFieldsValues();
			let currentFilteredField = filterFieldsValues[fieldData.fieldId] ?? [];
			let currentFilteredFieldLabel = filterFieldsValues[`${fieldData.fieldId}_label`] ?? [];
			if (fieldData.IS_FILTERED) {
				currentFilteredField = currentFilteredField.filter(value => parseInt(value, 10) !== fieldData.ID);
				currentFilteredFieldLabel = currentFilteredFieldLabel.filter(value => value !== fieldData.TITLE);
			} else if (!currentFilteredField.includes(fieldData.ID)) {
				currentFilteredField.push(fieldData.ID);
				currentFilteredFieldLabel.push(fieldData.TITLE);
			}
			const filterApi = this.getFilter().getApi();
			const filterToExtend = {};
			filterToExtend[fieldData.fieldId] = currentFilteredField;
			filterToExtend[`${fieldData.fieldId}_label`] = currentFilteredFieldLabel;
			filterApi.extendFilter(filterToExtend);
		}
		openSourceDetail(id, moduleId) {
			let sliderLink = '';
			let sliderWidth = 0;
			if (moduleId === 'BI') {
				sliderLink = new main_core.Uri(`/bitrix/components/bitrix/biconnector.externalconnection/slider.php?sourceId=${id}`);
				sliderWidth = 564;
			} else if (moduleId === 'CRM') {
				sliderLink = new main_core.Uri(`/crm/tracking/source/edit/${id}/`);
				sliderWidth = 900;
			} else {
				return;
			}
			BX.SidePanel.Instance.open(sliderLink.toString(), {
				width: sliderWidth,
				allowChangeHistory: false,
				cacheable: false,
				events: {
					onClose: BX.BIConnector.TrackingAnalyticsHandler.handleSliderClose
				}
			});
		}
		openDatasetCreation(id, type) {
			if (this.#isDatasetCreationOpening) {
				return;
			}
			this.#isDatasetCreationOpening = true;
			main_core.Runtime.loadExtension('biconnector.dataset-import-v2').then(exports => {
				exports.Slider.open(type, 0, {
					connectionId: id,
					connectionType: type
				});
			}).catch(() => {
				BX.UI.Notification.Center.notify({
					content: main_core.Text.encode(main_core.Loc.getMessage('BICONNECTOR_SUPERSET_EXTERNAL_SOURCE_GRID_OPEN_DATASET_CREATION_ERROR'))
				});
			}).finally(() => {
				this.#isDatasetCreationOpening = false;
			});
		}
		openCreateSourceSlider() {
			const sliderLink = new main_core.Uri('/bitrix/components/bitrix/biconnector.apachesuperset.source.connect.list/slider.php');
			BX.SidePanel.Instance.open(sliderLink.toString(), {
				width: 900,
				allowChangeHistory: false,
				cacheable: false
			});
		}
		changeActivitySource(id, moduleId) {
			main_core.ajax.runAction('biconnector.externalsource.source.changeActivity', {
				data: {
					id,
					moduleId
				}
			}).then(() => {
				this.getGrid().reload();
			}).catch(response => {
				this.#notifyError(response, main_core.Loc.getMessage('BICONNECTOR_SUPERSET_EXTERNAL_SOURCE_GRID_CHANGE_ACTIVITY_ERROR'));
			});
		}
		deleteSource(id, moduleId) {
			main_core.ajax.runAction('biconnector.externalsource.source.validateBeforeDelete', {
				data: {
					id,
					moduleId
				}
			}).then(() => {
				this.#showDeleteSourcePopup(id, moduleId);
			}).catch(response => {
				if (response.errors?.some(({
					code
				}) => code === 409)) {
					this.#getDeleteSourceWithDatasetDialog(id).show();
					return;
				}
				this.#notifyError(response, main_core.Loc.getMessage('BICONNECTOR_SUPERSET_EXTERNAL_SOURCE_GRID_DELETE_ERROR'));
			});
		}
		#showDeleteSourcePopup(id, moduleId) {
			const messageBox = new ui_system_dialog.Dialog({
				content: this.#getDeleteSourcePopupContent(),
				centerButtons: [new ui_buttons.Button({
					color: ui_buttons.AirButtonStyle.FILLED,
					useAirDesign: true,
					text: main_core.Loc.getMessage('BICONNECTOR_SUPERSET_EXTERNAL_SOURCE_GRID_DELETE_POPUP_CAPTION_YES'),
					onclick: button => {
						button.setWaiting();
						main_core.ajax.runAction('biconnector.externalsource.source.delete', {
							data: {
								id,
								moduleId
							}
						}).then(() => {
							this.getGrid().reload();
							messageBox.hide();
						}).catch(response => {
							messageBox.hide();
							this.#notifyError(response, main_core.Loc.getMessage('BICONNECTOR_SUPERSET_EXTERNAL_SOURCE_GRID_DELETE_ERROR'));
						});
					}
				}), new ui_buttons.Button({
					text: main_core.Loc.getMessage('BICONNECTOR_SUPERSET_EXTERNAL_SOURCE_GRID_DELETE_POPUP_CAPTION_NO'),
					size: ui_buttons.ButtonSize.LARGE,
					style: ui_buttons.AirButtonStyle.PLAIN,
					useAirDesign: true,
					onclick: () => messageBox.hide()
				})],
				hasOverlay: true
			});
			messageBox.show();
		}
		#getDeleteSourcePopupContent() {
			return main_core.Tag.render`
			<div class="biconnector-delete-source-popup-content">
				${main_core.Loc.getMessage('BICONNECTOR_SUPERSET_EXTERNAL_SOURCE_GRID_DELETE_POPUP_TITLE')}
			</div>
		`;
		}
		#getDeleteSourceWithDatasetDialog(id) {
			const deleteSourcePopupInstance = new ui_system_dialog.Dialog({
				title: main_core.Loc.getMessage('BICONNECTOR_SUPERSET_EXTERNAL_SOURCE_WITH_DATASET_DELETE_DIALOG_TITLE_MSGVER_1'),
				content: this.#getDeleteSourceWithDatasetDialogContent(),
				centerButtons: [new ui_buttons.Button({
					text: main_core.Loc.getMessage('BICONNECTOR_SUPERSET_EXTERNAL_SOURCE_WITH_DATASET_DELETE_DIALOG_OK_CAPTION_MSGVER_1'),
					size: ui_buttons.ButtonSize.LARGE,
					style: ui_buttons.AirButtonStyle.FILLED,
					useAirDesign: true,
					onclick: () => {
						deleteSourcePopupInstance.hide();
						this.#openDatasetSlider(id);
					}
				}), new ui_buttons.Button({
					text: main_core.Loc.getMessage('BICONNECTOR_SUPERSET_EXTERNAL_SOURCE_WITH_DATASET_DELETE_DIALOG_CANCEL_CAPTION'),
					size: ui_buttons.ButtonSize.LARGE,
					style: ui_buttons.AirButtonStyle.PLAIN,
					useAirDesign: true,
					onclick: () => deleteSourcePopupInstance.hide()
				})],
				hasOverlay: true,
				width: 446
			});
			return deleteSourcePopupInstance;
		}
		#getDeleteSourceWithDatasetDialogContent() {
			return main_core.Tag.render`
			<div class="biconnector-delete-source-with-dataset-dialog-content">
				${main_core.Loc.getMessage('BICONNECTOR_SUPERSET_EXTERNAL_SOURCE_WITH_DATASET_DELETE_DIALOG_DESCRIPTION_MSGVER_1')}
			</div>
		`;
		}
		#openDatasetSlider(id) {
			BX.SidePanel.Instance.open(this.#datasetUrl, {
				allowChangeHistory: false,
				cacheable: false,
				events: {
					onOpenComplete: event => {
						const slider = event.getSlider ? event.getSlider() : BX.SidePanel.Instance.getTopSlider();
						if (!slider) {
							return;
						}
						const sliderWindow = slider.getWindow();
						const tryApplyFilter = () => {
							if (sliderWindow && sliderWindow.BX && sliderWindow.BX.Main && sliderWindow.BX.Main.filterManager) {
								const filter = sliderWindow.BX.Main.filterManager.getById('biconnector_superset_external_dataset_grid');
								if (filter && filter instanceof sliderWindow.BX.Main.Filter) {
									const filterApi = filter.getApi();
									filterApi.setFields({
										'SOURCE.ID': String(id),
										'SOURCE.ID_label': this.#sourceTitleList[id]
									});
									filterApi.apply();
									return;
								}
							}
							setTimeout(tryApplyFilter, 100);
						};
						tryApplyFilter();
					}
				}
			});
		}
		#notifyError(response, fallbackMessage) {
			BX.UI.Notification.Center.notify({
				content: biconnector_errorMessage.resolveErrorHtml(response, fallbackMessage)
			});
		}
	}
	main_core.Reflection.namespace('BX.BIConnector').ExternalSourceManager = ExternalSourceManager;

})(BX.BIConnector, BX.BIConnector.Grid, BX, BX.UI, BX.UI.System, BX.Event);
//# sourceMappingURL=script.js.map
