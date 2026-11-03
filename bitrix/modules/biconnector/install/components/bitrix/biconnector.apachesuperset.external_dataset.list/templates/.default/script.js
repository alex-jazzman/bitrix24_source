/* eslint-disable */
(function (biconnector_errorMessage, biconnector_fileExport, biconnector_loadingPopup, main_popup, main_core, main_core_events, ui_buttons, ui_system_dialog) {
	'use strict';

	const NEW_GROUP_ID = 'new_T0';
	/** The field the filter of the section keeps its level in; the reports grid names it the same way. */
	const GROUP_FILTER_FIELD = 'GROUPS.ID';
	const CREATE_MENU_ID = 'biconnector-dataset-creation-menu';
	const CREATE_MENU_ITEM_NEW_GROUP = 'new-group';
	/** What the items of the import open the slider with; the server names the items, the page acts. */
	const CREATE_MENU_IMPORT_SOURCES = {
		'import-csv': 'csv',
		'external-connection': '1c'
	};

	/**
	 * @namespace BX.BIConnector
	 */
	class ExternalDatasetManager {
		#grid;
		#filter;
		#isAvailableGroupManagement = false;
		#createMenuItems = [];
		#isGroupLevelOnRender = false;
		#isGroupPopupOpening = false;
		constructor(props) {
			this.#grid = BX.Main.gridManager.getById(props.gridId)?.instance;
			this.#filter = BX.Main.filterManager.getById(props.gridId);
			this.#isAvailableGroupManagement = props.isAvailableGroupManagement === true;
			this.#createMenuItems = Array.isArray(props.createMenuItems) ? props.createMenuItems : [];
			this.#isGroupLevelOnRender = props.isGroupLevelSelected === true;
			this.#subscribeToEvents();
			this.#initHints();
		}

		/**
		 * The level of the section is a condition of the filter and nothing else: the grid asks the
		 * server on its own, the slider is not reloaded, and the way back up is taking the condition off.
		 */
		handleGroupTitleClick(groupJson) {
			this.handleDatasetFilterChange({
				fieldId: GROUP_FILTER_FIELD,
				...groupJson
			});
		}

		/**
		 * The menu of the create button of the panel.
		 *
		 * The menu is built anew at every opening and is never cached: the level of the section changes
		 * on the page itself - a group is entered by a click on its row, and the filter is applied
		 * without a reload - so the answer to "may a group be created right now" holds only for the
		 * moment it is asked.
		 */
		showCreationMenu(event) {
			const openedMenu = main_popup.MenuManager.getMenuById(CREATE_MENU_ID);
			if (openedMenu) {
				openedMenu.close();
				return;
			}
			const menu = main_popup.MenuManager.create({
				id: CREATE_MENU_ID,
				bindElement: event.target,
				cacheable: false,
				closeByEsc: true,
				closeIcon: false,
				autoHide: true,
				angle: true,
				offsetLeft: 20,
				items: this.#createMenuItems.map(item => ({
					text: item.text,
					// A group inside a group does not exist, so on the level of a group the item is drawn
					// unavailable instead of being taken away.
					disabled: item.id === CREATE_MENU_ITEM_NEW_GROUP && this.#isGroupLevelSelected(),
					onclick: () => {
						menu.close();
						this.#runCreateMenuAction(item.id);
					}
				}))
			});
			menu.show();
		}
		#runCreateMenuAction(itemId) {
			if (itemId === CREATE_MENU_ITEM_NEW_GROUP) {
				this.showCreationGroupPopup();
				return;
			}
			const source = CREATE_MENU_IMPORT_SOURCES[itemId];
			if (source) {
				BX.BIConnector.DatasetImportV2.Slider.open(source);
			}
		}

		/**
		 * Tells whether the section stands on a group right now.
		 *
		 * The level lives in the filter, and the filter of the page is the only one who knows it after
		 * the very first drawing. The answer of the server is kept for the moment the filter is not up
		 * yet, so that the item does not blink on the loading of the page.
		 */
		#isGroupLevelSelected() {
			const filterFieldsValues = this.#filter?.getFilterFieldsValues();
			if (!filterFieldsValues) {
				return this.#isGroupLevelOnRender;
			}
			const selectedGroups = filterFieldsValues[GROUP_FILTER_FIELD] ?? [];
			return selectedGroups.length > 0;
		}
		showCreationGroupPopup() {
			this.#openGroupPopup(NEW_GROUP_ID);
		}
		editGroup(groupId) {
			this.#openGroupPopup(`T${main_core.Text.toInteger(groupId)}`);
		}
		deleteGroup(groupId) {
			// The dialog repeats the one the reports grid asks a group deletion with: the destructive
			// answer is the accented one, the way out is plain.
			const dialog = new ui_system_dialog.Dialog({
				title: main_core.Loc.getMessage('BICONNECTOR_SUPERSET_EXTERNAL_DATASET_GRID_GROUP_DELETE_TITLE'),
				content: main_core.Tag.render`
				<div class="biconnector-delete-dataset-popup-content">
					${main_core.Text.encode(main_core.Loc.getMessage('BICONNECTOR_SUPERSET_EXTERNAL_DATASET_GRID_GROUP_DELETE_MESSAGE'))}
				</div>
			`,
				hasCloseButton: true,
				closeByEsc: true,
				hasOverlay: true,
				disableScrolling: true,
				centerButtons: [new ui_buttons.Button({
					text: main_core.Loc.getMessage('BICONNECTOR_SUPERSET_EXTERNAL_DATASET_GRID_GROUP_DELETE_CONFIRM'),
					size: ui_buttons.ButtonSize.LARGE,
					style: ui_buttons.AirButtonStyle.FILLED_ALERT,
					useAirDesign: true,
					onclick: button => {
						button.setWaiting();
						void this.#deleteGroupRequest(main_core.Text.toInteger(groupId)).finally(() => dialog.hide());
					}
				}), new ui_buttons.CancelButton({
					text: main_core.Loc.getMessage('BICONNECTOR_SUPERSET_EXTERNAL_DATASET_GRID_DELETE_POPUP_CAPTION_NO'),
					size: ui_buttons.ButtonSize.LARGE,
					style: ui_buttons.AirButtonStyle.PLAIN,
					useAirDesign: true,
					onclick: () => dialog.hide()
				})]
			});
			dialog.show();
		}
		#openGroupPopup(groupIdCode) {
			if (!this.#isAvailableGroupManagement) {
				return;
			}
			if (this.#isGroupPopupOpening) {
				return;
			}
			this.#isGroupPopupOpening = true;

			// The editor pulls in the entity selector and Vue, so it is loaded only when it is opened.
			Promise.all([main_core.Runtime.loadExtension('biconnector.table-group'), main_core.ajax.runAction('biconnector.TableGroup.loadSettingsData', {})]).then(([{
				TableGroupPopup
			}, response]) => {
				TableGroupPopup.open({
					groupId: groupIdCode,
					groups: response.data.groups ?? [],
					tables: response.data.tables ?? [],
					saveEnabled: true
				});
			}).catch(response => {
				this.#notifyError(response, main_core.Loc.getMessage('BICONNECTOR_SUPERSET_EXTERNAL_DATASET_GRID_GROUP_SAVE_ERROR'));
			}).finally(() => {
				this.#isGroupPopupOpening = false;
			});
		}

		// The chain of the action is a BX.Promise, and that one has no finally(): awaiting it here gives
		// back a native promise the caller closes its dialog by, whatever the answer of the server was.
		async #deleteGroupRequest(groupId) {
			try {
				await main_core.ajax.runAction('biconnector.TableGroup.delete', {
					data: {
						groupId
					}
				});
				this.#grid.reload();
			} catch (response) {
				this.#notifyError(response, main_core.Loc.getMessage('BICONNECTOR_SUPERSET_EXTERNAL_DATASET_GRID_GROUP_SAVE_ERROR'));
			}
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

			// The popup of the rights slider writes by its own button here: the page opened it and only
			// redraws the list by the answer of that one save.
			main_core_events.EventEmitter.subscribe('BIConnector.TableGroupPopup:onGroupSaved', () => {
				this.#grid.reload();
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
		}
		exportDataset(id) {
			this.#grid.tableFade();
			biconnector_fileExport.FileExport.getInstance().downloadOnce(id).then(() => {
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
							this.#notifyError(response, main_core.Loc.getMessage('BICONNECTOR_SUPERSET_EXTERNAL_DATASET_GRID_DELETE_ERROR'));
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
				this.#notifyError(response, main_core.Loc.getMessage('BICONNECTOR_SUPERSET_EXTERNAL_DATASET_GRID_ERROR_SUPERSET_MSGVER_1'));
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
				this.#notifyError(response, main_core.Loc.getMessage('BICONNECTOR_SUPERSET_EXTERNAL_DATASET_GRID_ERROR_SUPERSET_MSGVER_1'));
			});
		}
		showSupersetError() {
			BX.UI.Notification.Center.notify({
				content: main_core.Text.encode(main_core.Loc.getMessage('BICONNECTOR_SUPERSET_EXTERNAL_DATASET_GRID_ERROR_SUPERSET_MSGVER_1'))
			});
		}
		#notifyError(response, fallbackMessage) {
			BX.UI.Notification.Center.notify({
				content: biconnector_errorMessage.resolveErrorHtml(response, fallbackMessage)
			});
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
						BX.BIConnector.DatasetImportV2.Slider.open(datasetType, datasetId, {}, {
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

})(BX.BIConnector, BX.BIConnector.FileExport, BX.BIConnector, BX.Main, BX, BX.Event, BX.UI, BX.UI.System);
//# sourceMappingURL=script.js.map
