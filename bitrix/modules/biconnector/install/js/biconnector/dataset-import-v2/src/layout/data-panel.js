import { EventEmitter } from 'main.core.events';
import { mapGetters } from 'ui.vue3.vuex';

import { FileSection } from '../sections/file-section';
import { ConnectionSection } from '../sections/connection-section';
import { PreviewSection } from '../sections/preview-section';
import { UploadController } from '../app/upload-controller';

const LOAD_EVENT = 'biconnector:dataset-import-v2:connection-load';

export const DataPanel = {
	inject: ['sourceId'],
	components: { FileSection, ConnectionSection, PreviewSection },
	data()
	{
		return {
			connectionReselect: false,
		};
	},
	computed:
	{
		...mapGetters(['hasFile', 'isSystem', 'connectionEditing']),
		isCsv()
		{
			return this.sourceId === 'csv';
		},
		isExternalConnection()
		{
			return this.sourceId !== 'csv' && this.sourceId !== 'system';
		},
		showPreview()
		{
			if (this.isCsv)
			{
				return this.hasFile;
			}

			if (this.isExternalConnection)
			{
				return !this.connectionEditing;
			}

			return this.isSystem;
		},
	},
	mounted()
	{
		this.initialCsvState = {
			fileProperties: { ...this.$store.state.config.fileProperties },
			dataFormats: { ...this.$store.state.config.dataFormats },
			previewRows: this.$store.state.previewData.rows.map((row) => [...row]),
		};
		this.uploadController = new UploadController(this.$store, { sourceCode: this.sourceId });
	},
	beforeUnmount()
	{
		this.uploadController?.destroy();
		this.uploadController = null;
	},
	methods:
	{
		onConnectionContinue()
		{
			this.connectionReselect = false;
			this.$store.commit('setConnectionEditing', false);
			EventEmitter.emit(LOAD_EVENT, {});
		},
		onConnectionReplace()
		{
			this.connectionReselect = true;
			this.$store.commit('setConnectionEditing', true);
			this.$store.commit('setFieldsSettings', []);
			this.$store.commit('setPreviewData', []);
		},
		onPickFile(file)
		{
			if (!this.uploadController)
			{
				return;
			}
			this.uploadController.upload(file);
		},
		onRemoveFile()
		{
			this.uploadController?.cancelPending();
			this.$store.commit('setUploadStatus', { isUploading: false, step: 0 });
			this.$store.commit('setValidationLoading', false);
			if (this.$store.getters.isEditMode && this.initialCsvState)
			{
				this.$store.commit('setFileProperties', { ...this.initialCsvState.fileProperties });
				this.$store.commit('setDataFormats', { ...this.initialCsvState.dataFormats });
				this.$store.commit('setPreviewData', this.initialCsvState.previewRows.map((row) => [...row]));
				this.$store.commit('setPreviewSchemaMismatch', false);
				this.$store.commit('setValidationErrors', []);

				return;
			}
			this.$store.commit('setFileProperties', {
				fileName: '',
				fileToken: '',
			});
			this.$store.commit('setFieldsSettings', []);
			this.$store.commit('setPreviewData', []);
		},
	},
	// language=Vue
	template: `
		<section class="biconnector-dataset-import-v2__data-panel">
			<FileSection
				v-if="isCsv"
				@pick-file="onPickFile"
				@remove-file="onRemoveFile"
			/>
			<ConnectionSection
				v-if="isExternalConnection"
				:is-editing="connectionEditing"
				:is-reselect="connectionReselect"
				@continue="onConnectionContinue"
				@replace="onConnectionReplace"
			/>
			<PreviewSection v-if="showPreview" />
		</section>
	`,
};
