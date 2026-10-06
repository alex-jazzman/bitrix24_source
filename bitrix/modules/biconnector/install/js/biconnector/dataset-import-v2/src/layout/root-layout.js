import { EventEmitter } from 'main.core.events';
import { mapGetters } from 'ui.vue3.vuex';
import { CardsColumn } from './cards-column';
import { DataPanel } from './data-panel';
import { SaveController } from '../app/save-controller';
import { ValidationController } from '../app/validation-controller';
import { PreviewReloadController } from '../app/preview-reload-controller';
import { ConnectionController } from '../app/connection-controller';
import { hasDatasetNameError } from '../lib/dataset-name-validation';

const SAVE_EVENT = 'biconnector:dataset-import-v2:save';
const CHECK_FILE_EVENT = 'biconnector:dataset-import-v2:check-file';
const EXPORT_FILE_EVENT = 'biconnector:dataset-import-v2:export-file';
const DATA_FORMATS_SAVE_EVENT = 'BIConnector.DatasetImportV2.DataFormats:onSave';
const SLIDER_MESSAGE_EVENT = 'SidePanel.Slider:onMessage';
const SAVE_BUTTON_SELECTOR = '.biconnector-dataset-import-v2-save-btn';

export const RootLayout = {
	components: {
		CardsColumn,
		DataPanel,
	},
	inject: ['appParams'],
	props: {
		sourceId: {
			type: String,
			required: true,
		},
	},
	data()
	{
		return {
			isSaving: false,
		};
	},
	computed:
	{
		...mapGetters([
			'hasFile',
			'areNoRowsVisible',
			'hasFieldNameErrors',
			'isSystem',
			'isEditMode',
			'datasetProperties',
			'connectionProperties',
			'connectionEditing',
			'hasPreviewSchemaMismatch',
		]),
		isExternalConnection()
		{
			return this.sourceId !== 'csv' && this.sourceId !== 'system';
		},
		hasSource()
		{
			return this.hasFile
				|| Boolean(this.connectionProperties?.connectionId && this.connectionProperties?.tableName);
		},
		reservedNames()
		{
			return this.appParams?.reservedNames ?? [];
		},
		hasDatasetNameErrors()
		{
			if (this.isEditMode || this.isSystem)
			{
				return false;
			}

			return hasDatasetNameError(this.datasetProperties?.name, this.reservedNames);
		},
		isSaveEnabled()
		{
			return this.hasSource
				&& (!this.isExternalConnection || !this.connectionEditing)
				&& !this.areNoRowsVisible
				&& !this.hasDatasetNameErrors
				&& !this.hasFieldNameErrors
				&& !this.hasPreviewSchemaMismatch
				&& !this.isSystem;
		},
	},
	watch:
	{
		isSaveEnabled:
		{
			immediate: true,
			handler(value)
			{
				this.$nextTick(() => this.syncSaveButton(Boolean(value)));
			},
		},
	},
	created()
	{
		this.onSaveClick = () => this.handleSave();
		this.onCheckFileClick = () => this.saveController?.checkFile();
		this.onExportFileClick = () => this.saveController?.exportFile();
		this.onDataFormatsSaved = (event) => {
			const [messageEvent] = event?.getData?.() ?? [];
			if (messageEvent?.getEventId?.() !== DATA_FORMATS_SAVE_EVENT)
			{
				return;
			}

			const data = messageEvent.data;
			if (data && typeof data === 'object')
			{
				this.$store.commit('setDataFormats', data);
			}
		};
		EventEmitter.subscribe(SAVE_EVENT, this.onSaveClick);
		EventEmitter.subscribe(CHECK_FILE_EVENT, this.onCheckFileClick);
		EventEmitter.subscribe(EXPORT_FILE_EVENT, this.onExportFileClick);
		EventEmitter.subscribe(SLIDER_MESSAGE_EVENT, this.onDataFormatsSaved);
	},
	mounted()
	{
		this.saveController = new SaveController(this.$store, {
			sourceCode: this.sourceId,
			isSupersetReady: Boolean(this.appParams?.isSupersetReady),
		});
		this.saveController.attach();
		this.validationController = new ValidationController(this.$store, { sourceCode: this.sourceId });
		this.validationController.attach();
		this.previewReloadController = new PreviewReloadController(this.$store, {
			sourceCode: this.sourceId,
			onReloadStart: () => this.validationController.cancelScheduled(),
			onReloadFinish: () => {
				void this.validationController.validate();
			},
		});
		this.previewReloadController.attach();
		this.connectionController = new ConnectionController(this.$store, { sourceCode: this.sourceId });
		this.connectionController.attach();
		this.syncSaveButton(this.isSaveEnabled);
	},
	beforeUnmount()
	{
		EventEmitter.unsubscribe(SAVE_EVENT, this.onSaveClick);
		EventEmitter.unsubscribe(CHECK_FILE_EVENT, this.onCheckFileClick);
		EventEmitter.unsubscribe(EXPORT_FILE_EVENT, this.onExportFileClick);
		EventEmitter.unsubscribe(SLIDER_MESSAGE_EVENT, this.onDataFormatsSaved);
		this.saveController?.detach();
		this.validationController?.detach();
		this.previewReloadController?.detach();
		this.connectionController?.detach();
	},
	methods:
	{
		async handleSave()
		{
			if (!this.saveController || this.isSaving || !this.isSaveEnabled)
			{
				return;
			}
			this.isSaving = true;
			this.setSaveButtonWaiting(true);
			try
			{
				await this.saveController.save();
			}
			finally
			{
				this.isSaving = false;
				this.setSaveButtonWaiting(false);
			}
		},
		syncSaveButton(enabled)
		{
			const btn = document.querySelector(SAVE_BUTTON_SELECTOR);
			if (!btn)
			{
				return;
			}
			btn.disabled = !enabled;
			btn.classList.toggle('ui-btn-disabled', !enabled);
		},
		setSaveButtonWaiting(isWaiting)
		{
			const btn = document.querySelector(SAVE_BUTTON_SELECTOR);
			if (!btn)
			{
				return;
			}
			btn.classList.toggle('ui-btn-wait', isWaiting);
			if (isWaiting)
			{
				btn.setAttribute('disabled', 'disabled');
			}
			else
			{
				btn.disabled = !this.isSaveEnabled;
				btn.classList.toggle('ui-btn-disabled', !this.isSaveEnabled);
			}
		},
	},
	// language=Vue
	template: `
		<div class="biconnector-dataset-import-v2">
			<div class="biconnector-dataset-import-v2__body">
				<CardsColumn />
				<DataPanel />
			</div>
		</div>
	`,
};
