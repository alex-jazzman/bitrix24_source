/* eslint-disable */
(function (biconnector_datasetImport_fileExport, biconnector_loadingPopup, main_popup, main_core, main_core_events, ui_buttons, ui_system_dialog) {
	'use strict';

	/**
	 * @namespace BX.BIConnector
	 */
	class ExternalDatasetManager {
		#grid;
		#filter;
		constructor(props) {
			this.#grid = BX.Main.gridManager.getById(props.gridId)?.instance;
			this.#filter = BX.Main.filterManager.getById(props.gridId);
			this.#subscribeToEvents();
			this.#initHints();
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
			main_core_events.EventEmitter.subscribe('SidePanel.Slider:onMessage', event => {
				const [messageEvent] = event.getData();
				if (messageEvent.getEventId() === 'BIConnector.dataset-import:onDatasetCreated') {
					this.#grid.reload();
				}
			});
			main_core_events.EventEmitter.subscribe('Grid::updated', () => {
				this.#initHints();
			});
		}
		handleCreatedByClick(ownerData) {
			this.handleDatasetFilterChange({
				fieldId: 'CREATED_BY_ID',
				...ownerData
			});
		}
		handleUpdatedByClick(ownerData) {
			this.handleDatasetFilterChange({
				fieldId: 'UPDATED_BY_ID',
				...ownerData
			});
		}
		handleSourceClick(sourceData) {
			this.handleDatasetFilterChange({
				fieldId: 'SOURCE.ID',
				...sourceData
			});
		}
		handleDatasetFilterChange(fieldData) {
			const filterFieldsValues = this.#filter.getFilterFieldsValues();
			let currentFilteredField = filterFieldsValues[fieldData.fieldId] ?? [];
			let currentFilteredFieldLabel = filterFieldsValues[`${fieldData.fieldId}_label`] ?? [];
			if (fieldData.IS_FILTERED) {
				currentFilteredField = currentFilteredField.filter(value => parseInt(value, 10) !== fieldData.ID);
				currentFilteredFieldLabel = currentFilteredFieldLabel.filter(value => value !== fieldData.TITLE);
			} else if (!currentFilteredField.includes(fieldData.ID)) {
				currentFilteredField.push(fieldData.ID);
				currentFilteredFieldLabel.push(fieldData.TITLE);
			}
			const filterApi = this.#filter.getApi();
			const filterToExtend = {};
			filterToExtend[fieldData.fieldId] = currentFilteredField;
			filterToExtend[`${fieldData.fieldId}_label`] = currentFilteredFieldLabel;
			filterApi.extendFilter(filterToExtend);
			filterApi.apply();
		}
		exportDataset(id) {
			this.#grid.tableFade();
			biconnector_datasetImport_fileExport.FileExport.getInstance().downloadOnce(id).then(() => {
				this.#grid.tableUnfade();
			}).catch(() => {
				this.#grid.tableUnfade();
			});
		}
		deleteDataset(datasetId, datasetType) {
			const callbacks = {
				loadData: () => this.#checkRelatedDatasets(datasetId),
				checkData: result => result.data && result.data.length > 0,
				onSuccess: () => {
					this.#getRelatedDatasetsWarningPopup(datasetId, datasetType).show();
				},
				onFail: () => {
					this.#getDeleteDatasetPopup(datasetId).show();
				}
			};
			const loadingPopup = new biconnector_loadingPopup.LoadingPopup({
				callbacks
			});
			loadingPopup.showLoadPopup();
		}
		#getDeleteDatasetPopup(datasetId) {
			const deleteDatasetPopupInstance = new ui_system_dialog.Dialog({
				title: main_core.Loc.getMessage('BICONNECTOR_SUPERSET_EXTERNAL_DATASET_GRID_DELETE_POPUP_TITLE_MSGVER_2'),
				content: this.#getDeleteDatasetPopupContent(),
				centerButtons: [new ui_buttons.Button({
					text: main_core.Loc.getMessage('BICONNECTOR_SUPERSET_EXTERNAL_DATASET_GRID_DELETE_POPUP_CAPTION_NO'),
					size: ui_buttons.ButtonSize.LARGE,
					style: ui_buttons.AirButtonStyle.FILLED,
					useAirDesign: true,
					onclick: () => deleteDatasetPopupInstance.hide()
				}), new ui_buttons.Button({
					text: main_core.Loc.getMessage('BICONNECTOR_SUPERSET_EXTERNAL_DATASET_GRID_DELETE_POPUP_CAPTION_YES'),
					size: ui_buttons.ButtonSize.LARGE,
					style: ui_buttons.AirButtonStyle.PLAIN,
					useAirDesign: true,
					onclick: button => {
						button.setWaiting();
						this.deleteDatasetAjaxAction(datasetId).then(() => {
							this.#grid.reload();
							deleteDatasetPopupInstance.hide();
						}).catch(response => {
							deleteDatasetPopupInstance.hide();
							if (response.errors) {
								this.#notifyErrors(response.errors);
							}
						});
					}
				})],
				hasOverlay: true,
				width: 400
			});
			return deleteDatasetPopupInstance;
		}
		#getDeleteDatasetPopupContent() {
			return main_core.Tag.render`
			<div class="biconnector-delete-dataset-popup-content">
				${main_core.Loc.getMessage('BICONNECTOR_SUPERSET_EXTERNAL_DATASET_GRID_DELETE_POPUP_DESCRIPTION_MSGVER_2')}
			</div>
		`;
		}
		deleteDatasetAjaxAction(datasetId) {
			return main_core.ajax.runAction('biconnector.externalsource.dataset.delete', {
				data: {
					id: datasetId
				}
			});
		}
		createExternalDataset(datasetId) {
			this.#grid.tableFade();
			main_core.ajax.runAction('biconnector.externalsource.dataset.getCreateUrl', {
				data: {
					id: datasetId
				}
			}).then(response => {
				const link = response.data;
				if (link) {
					window.open(link, '_blank').focus();
				}
				this.#grid.tableUnfade();
			}).catch(response => {
				this.#grid.tableUnfade();
				if (response.errors) {
					this.#notifyErrors(response.errors);
				}
			});
		}
		createExternalDatasetByName(tableName) {
			this.#grid.tableFade();
			main_core.ajax.runAction('biconnector.externalsource.dataset.getCreateUrlByName', {
				data: {
					tableName
				}
			}).then(response => {
				const link = response.data;
				if (link) {
					window.open(link, '_blank').focus();
				}
				this.#grid.tableUnfade();
			}).catch(response => {
				this.#grid.tableUnfade();
				if (response.errors) {
					this.#notifyErrors(response.errors);
				}
			});
		}
		showSupersetError() {
			BX.UI.Notification.Center.notify({
				content: main_core.Text.encode(main_core.Loc.getMessage('BICONNECTOR_SUPERSET_EXTERNAL_DATASET_GRID_ERROR_SUPERSET_MSGVER_1'))
			});
		}
		#notifyErrors(errors) {
			if (errors[0] && errors[0].message) {
				BX.UI.Notification.Center.notify({
					content: main_core.Text.encode(errors[0].message)
				});
			}
		}
		#checkRelatedDatasets(datasetId) {
			return main_core.ajax.runAction('biconnector.externalsource.dataset.getRelatedSupersetDatasets', {
				data: {
					id: datasetId
				}
			});
		}
		#getRelatedDatasetsWarningPopup(datasetId, datasetType) {
			const warningContent = this.#getWarningDatasetPopupContent();
			const popup = new ui_system_dialog.Dialog({
				title: main_core.Loc.getMessage('BICONNECTOR_SUPERSET_EXTERNAL_DATASET_GRID_DELETE_WARNING_TITLE'),
				content: warningContent,
				centerButtons: [new ui_buttons.Button({
					text: main_core.Loc.getMessage('BICONNECTOR_SUPERSET_EXTERNAL_DATASET_GRID_DELETE_POPUP_CAPTION_NO'),
					size: ui_buttons.ButtonSize.LARGE,
					style: ui_buttons.AirButtonStyle.FILLED,
					useAirDesign: true,
					onclick: () => popup.hide()
				}), new ui_buttons.Button({
					text: main_core.Loc.getMessage('BICONNECTOR_SUPERSET_EXTERNAL_DATASET_GRID_DELETE_WARNING_GO_BUTTON'),
					size: ui_buttons.ButtonSize.LARGE,
					style: ui_buttons.AirButtonStyle.PLAIN,
					useAirDesign: true,
					onclick: () => {
						BX.BIConnector.DatasetImport.Slider.open(datasetType, datasetId, {}, {
							properties: {
								isOpenInitially: false,
								isOpenOnLoadData: false
							},
							fields: {
								isOpenInitially: false,
								isOpenOnLoadData: false
							}
						});
						popup.hide();
					}
				})],
				hasOverlay: true,
				width: 400
			});
			return popup;
		}
		#getWarningDatasetPopupContent() {
			return main_core.Tag.render`
			<div class="biconnector-delete-dataset-popup-content">
				${main_core.Loc.getMessage('BICONNECTOR_SUPERSET_EXTERNAL_DATASET_GRID_DELETE_WARNING_TEXT')}
			</div>
		`;
		}
	}
	main_core.Reflection.namespace('BX.BIConnector').ExternalDatasetManager = ExternalDatasetManager;

})(BX.BIConnector.DatasetImport, BX.BIConnector, BX.Main, BX, BX.Event, BX.UI, BX.UI.System);
//# sourceMappingURL=script.js.map
