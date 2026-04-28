import { FileExport } from 'biconnector.dataset-import.file-export';
import { LoadingPopup } from 'biconnector.loading-popup';
import { Popup as MainPopup } from 'main.popup';
import { Reflection, Loc, Text, ajax as Ajax, Tag } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { AirButtonStyle, Button, ButtonSize } from 'ui.buttons';
import { Dialog as SystemDialog } from 'ui.system.dialog';

type Props = {
	gridId: ?string,
	isNeedShowTopMenuGuide: boolean,
	isNeedShowDraftGuide: boolean,
};

/**
 * @namespace BX.BIConnector
 */
class ExternalDatasetManager
{
	#grid: BX.Main.grid;
	#filter: BX.Main.Filter;

	constructor(props: Props)
	{
		this.#grid = BX.Main.gridManager.getById(props.gridId)?.instance;
		this.#filter = BX.Main.filterManager.getById(props.gridId);
		this.#subscribeToEvents();
		this.#initHints();
	}

	#initHints(): void
	{
		const manager = BX.UI.Hint.createInstance({
			popupParameters: {
				autoHide: true,
			},
		});
		manager.init(this.#grid.getContainer());
	}

	#subscribeToEvents()
	{
		EventEmitter.subscribe('SidePanel.Slider:onMessage', (event) => {
			const [messageEvent] = event.getData();
			if (messageEvent.getEventId() === 'BIConnector.dataset-import:onDatasetCreated')
			{
				this.#grid.reload();
			}
		});

		EventEmitter.subscribe('Grid::updated', () => {
			this.#initHints();
		});
	}

	handleCreatedByClick(ownerData: Object)
	{
		this.handleDatasetFilterChange({
			fieldId: 'CREATED_BY_ID',
			...ownerData,
		});
	}

	handleUpdatedByClick(ownerData: Object)
	{
		this.handleDatasetFilterChange({
			fieldId: 'UPDATED_BY_ID',
			...ownerData,
		});
	}

	handleSourceClick(sourceData: Object)
	{
		this.handleDatasetFilterChange({
			fieldId: 'SOURCE.ID',
			...sourceData,
		});
	}

	handleDatasetFilterChange(fieldData: Object)
	{
		const filterFieldsValues = this.#filter.getFilterFieldsValues();
		let currentFilteredField = filterFieldsValues[fieldData.fieldId] ?? [];
		let currentFilteredFieldLabel = filterFieldsValues[`${fieldData.fieldId}_label`] ?? [];

		if (fieldData.IS_FILTERED)
		{
			currentFilteredField = currentFilteredField.filter((value) => parseInt(value, 10) !== fieldData.ID);
			currentFilteredFieldLabel = currentFilteredFieldLabel.filter((value) => value !== fieldData.TITLE);
		}
		else if (!currentFilteredField.includes(fieldData.ID))
		{
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

	exportDataset(id)
	{
		this.#grid.tableFade();
		FileExport.getInstance().downloadOnce(id)
			.then(() => {
				this.#grid.tableUnfade();
			})
			.catch(() => {
				this.#grid.tableUnfade();
			});
	}

	deleteDataset(datasetId: number, datasetType: string)
	{
		const callbacks = {
			loadData: () => this.#checkRelatedDatasets(datasetId),
			checkData: (result) => result.data && result.data.length > 0,
			onSuccess: () => {
				this.#getRelatedDatasetsWarningPopup(datasetId, datasetType).show();
			},
			onFail: () => {
				this.#getDeleteDatasetPopup(datasetId).show();
			},
		};

		const loadingPopup = new LoadingPopup({
			callbacks,
		});

		loadingPopup.showLoadPopup();
	}

	#getDeleteDatasetPopup(datasetId: number): MainPopup
	{
		const deleteDatasetPopupInstance = new SystemDialog({
			title: Loc.getMessage('BICONNECTOR_SUPERSET_EXTERNAL_DATASET_GRID_DELETE_POPUP_TITLE_MSGVER_2'),
			content: this.#getDeleteDatasetPopupContent(),
			centerButtons: [
				new Button({
					text: Loc.getMessage('BICONNECTOR_SUPERSET_EXTERNAL_DATASET_GRID_DELETE_POPUP_CAPTION_NO'),
					size: ButtonSize.LARGE,
					style: AirButtonStyle.FILLED,
					useAirDesign: true,
					onclick: () => deleteDatasetPopupInstance.hide(),
				}),
				new Button({
					text: Loc.getMessage('BICONNECTOR_SUPERSET_EXTERNAL_DATASET_GRID_DELETE_POPUP_CAPTION_YES'),
					size: ButtonSize.LARGE,
					style: AirButtonStyle.PLAIN,
					useAirDesign: true,
					onclick: (button) => {
						button.setWaiting();
						this.deleteDatasetAjaxAction(datasetId)
							.then(() => {
								this.#grid.reload();
								deleteDatasetPopupInstance.hide();
							})
							.catch((response) => {
								deleteDatasetPopupInstance.hide();
								if (response.errors)
								{
									this.#notifyErrors(response.errors);
								}
							})
						;
					},
				}),
			],
			hasOverlay: true,
			width: 400,
		});

		return deleteDatasetPopupInstance;
	}

	#getDeleteDatasetPopupContent(): HTMLElement
	{
		return Tag.render`
			<div class="biconnector-delete-dataset-popup-content">
				${Loc.getMessage('BICONNECTOR_SUPERSET_EXTERNAL_DATASET_GRID_DELETE_POPUP_DESCRIPTION_MSGVER_2')}
			</div>
		`;
	}

	deleteDatasetAjaxAction(datasetId: number): Promise
	{
		return Ajax.runAction('biconnector.externalsource.dataset.delete', {
			data: {
				id: datasetId,
			},
		});
	}

	createExternalDataset(datasetId: number): void
	{
		this.#grid.tableFade();
		Ajax.runAction(
			'biconnector.externalsource.dataset.getCreateUrl',
			{
				data: {
					id: datasetId,
				},
			},
		)
			.then((response) => {
				const link = response.data;
				if (link)
				{
					window.open(link, '_blank').focus();
				}
				this.#grid.tableUnfade();
			})
			.catch((response) => {
				this.#grid.tableUnfade();
				if (response.errors)
				{
					this.#notifyErrors(response.errors);
				}
			})
		;
	}

	showSupersetError(): void
	{
		BX.UI.Notification.Center.notify({
			content: Text.encode(Loc.getMessage('BICONNECTOR_SUPERSET_EXTERNAL_DATASET_GRID_ERROR_SUPERSET_MSGVER_1')),
		});
	}

	#notifyErrors(errors: Array): void
	{
		if (errors[0] && errors[0].message)
		{
			BX.UI.Notification.Center.notify({
				content: Text.encode(errors[0].message),
			});
		}
	}

	#checkRelatedDatasets(datasetId: number): Promise<Array>
	{
		return Ajax.runAction('biconnector.externalsource.dataset.getRelatedSupersetDatasets', {
			data: {
				id: datasetId,
			},
		});
	}

	#getRelatedDatasetsWarningPopup(datasetId: number, datasetType: string): MainPopup
	{
		const warningContent = this.#getWarningDatasetPopupContent();

		const popup = new SystemDialog({
			title: Loc.getMessage('BICONNECTOR_SUPERSET_EXTERNAL_DATASET_GRID_DELETE_WARNING_TITLE'),
			content: warningContent,
			centerButtons: [
				new Button({
					text: Loc.getMessage('BICONNECTOR_SUPERSET_EXTERNAL_DATASET_GRID_DELETE_POPUP_CAPTION_NO'),
					size: ButtonSize.LARGE,
					style: AirButtonStyle.FILLED,
					useAirDesign: true,
					onclick: () => popup.hide(),
				}),
				new Button({
					text: Loc.getMessage('BICONNECTOR_SUPERSET_EXTERNAL_DATASET_GRID_DELETE_WARNING_GO_BUTTON'),
					size: ButtonSize.LARGE,
					style: AirButtonStyle.PLAIN,
					useAirDesign: true,
					onclick: () => {
						BX.BIConnector.DatasetImport.Slider.open(datasetType, datasetId, {}, {
							properties: {
								isOpenInitially: false,
								isOpenOnLoadData: false,
							},
							fields: {
								isOpenInitially: false,
								isOpenOnLoadData: false,
							},
						});
						popup.hide();
					},
				}),
			],
			hasOverlay: true,
			width: 400,
		});

		return popup;
	}

	#getWarningDatasetPopupContent(): HTMLElement
	{
		return Tag.render`
			<div class="biconnector-delete-dataset-popup-content">
				${Loc.getMessage('BICONNECTOR_SUPERSET_EXTERNAL_DATASET_GRID_DELETE_WARNING_TEXT')}
			</div>
		`;
	}
}

Reflection.namespace('BX.BIConnector').ExternalDatasetManager = ExternalDatasetManager;
