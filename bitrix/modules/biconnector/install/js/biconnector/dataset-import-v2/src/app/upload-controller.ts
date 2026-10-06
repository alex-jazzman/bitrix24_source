import { Loc, Runtime } from 'main.core';
import type { Store } from 'ui.vue3.vuex';
import type { FileProperties, RootState } from '../types/state';
import { showErrorPopup } from './error-popup';
import {
	extractPreviewRows,
	hasPreviewSchemaMismatch,
	isParsingSettingsError,
	mapHeadersToFieldsSettings,
	requestDatasetView,
} from './dataset-view';
import type { DatasetViewResponse } from './dataset-view';

const STEP_FILE = 1;
const STEP_PARSE = 2;
const STEP_REPORT = 3;
const STEP_3_HOLD_MS = 600;
const MAX_FILE_SIZE = 60 * 1024 * 1024;

type UploaderFile = {
	isComplete?: () => boolean,
	getServerFileId: () => string,
	getName: () => string,
};

type UploaderInstance = {
	addFiles: (files: Array<File>) => void,
	getFiles: () => Array<UploaderFile>,
	destroy: () => void,
};

export class UploadController
{
	private readonly store: Store<RootState>;

	private readonly sourceCode: string;

	private uploader: UploaderInstance | null = null;

	private currentUploadId: number = 0;

	constructor(store: Store<RootState>, options: { sourceCode: string })
	{
		this.store = store;
		this.sourceCode = options.sourceCode;
	}

	destroy(): void
	{
		this.cancelPending();
		this.disposeUploader();
	}

	cancelPending(): void
	{
		this.currentUploadId++;
	}

	async upload(file: File): Promise<void>
	{
		const uploadId = ++this.currentUploadId;
		this.store.commit('setUploadStatus', { isUploading: true, step: STEP_FILE });

		try
		{
			const { token, name } = await this.runUpload(file);
			if (uploadId !== this.currentUploadId)
			{
				return;
			}
			this.store.commit('setFileProperties', { fileToken: token, fileName: name });

			const datasetName = this.store.state.config.datasetProperties.name;
			if (!datasetName || datasetName.length === 0)
			{
				const autoName = this.makeDatasetName(name);
				if (autoName)
				{
					this.store.commit('setDatasetProperties', { name: autoName });
				}
			}

			this.store.commit('setUploadStatus', { step: STEP_PARSE });
			const parsingProperties = this.getParsingProperties();
			let response: DatasetViewResponse;
			try
			{
				response = await requestDatasetView(this.store, this.sourceCode, {
					skipExistingSchemaCheck: true,
				});
			}
			catch (error)
			{
				if (uploadId !== this.currentUploadId)
				{
					return;
				}

				if (!isParsingSettingsError(error) || !this.store.getters.isEditMode)
				{
					throw error;
				}

				if (this.areParsingPropertiesCurrent(parsingProperties))
				{
					this.store.commit('setPreviewData', []);
					this.store.commit('setPreviewSchemaMismatch', false);
				}

				return;
			}

			if (uploadId !== this.currentUploadId || !this.areParsingPropertiesCurrent(parsingProperties))
			{
				return;
			}
			this.store.commit('setUploadStatus', { step: STEP_REPORT });

			if (this.store.getters.isEditMode)
			{
				await this.applyEditResponse(response, parsingProperties, uploadId);
			}
			else
			{
				this.applyResponse(response);
			}

			await new Promise((resolve) => setTimeout(resolve, STEP_3_HOLD_MS));
		}
		catch (error)
		{
			if (uploadId === this.currentUploadId)
			{
				showErrorPopup(error, Loc.getMessage('DATASET_IMPORT_V2_ERROR_POPUP_TITLE_UPLOAD'));
			}
		}
		finally
		{
			if (uploadId === this.currentUploadId)
			{
				this.store.commit('setUploadStatus', { isUploading: false, step: 0 });
			}
		}
	}

	private async applyEditResponse(
		response: DatasetViewResponse,
		parsingProperties: Pick<FileProperties, 'fileToken' | 'encoding' | 'separator' | 'firstLineHeader'>,
		uploadId: number,
	): Promise<void>
	{
		const hasMismatch = hasPreviewSchemaMismatch(this.store, response);
		this.store.commit('setPreviewSchemaMismatch', hasMismatch);
		this.store.commit('setPreviewData', hasMismatch ? [] : extractPreviewRows(response));
		if (hasMismatch)
		{
			await this.showSchemaMismatchError(parsingProperties, uploadId);
		}
	}

	private async showSchemaMismatchError(
		parsingProperties: Pick<FileProperties, 'fileToken' | 'encoding' | 'separator' | 'firstLineHeader'>,
		uploadId: number,
	): Promise<void>
	{
		try
		{
			await requestDatasetView(this.store, this.sourceCode);
		}
		catch (error)
		{
			if (uploadId === this.currentUploadId && this.areParsingPropertiesCurrent(parsingProperties))
			{
				showErrorPopup(error, Loc.getMessage('DATASET_IMPORT_V2_ERROR_POPUP_TITLE_UPLOAD'));
			}
		}
	}

	private getParsingProperties(): Pick<FileProperties, 'fileToken' | 'encoding' | 'separator' | 'firstLineHeader'>
	{
		const { fileToken, encoding, separator, firstLineHeader } = this.store.state.config.fileProperties;

		return { fileToken, encoding, separator, firstLineHeader };
	}

	private areParsingPropertiesCurrent(
		properties: Pick<FileProperties, 'fileToken' | 'encoding' | 'separator' | 'firstLineHeader'>,
	): boolean
	{
		const current = this.getParsingProperties();

		return Object.keys(properties).every((key) => {
			const property = key as keyof typeof properties;

			return properties[property] === current[property];
		});
	}

	private async runUpload(file: File): Promise<{ token: string, name: string }>
	{
		const { Uploader } = await Runtime.loadExtension('ui.uploader.core') as unknown as {
			Uploader: new (options: Record<string, unknown>) => UploaderInstance,
		};
		this.disposeUploader();

		return new Promise((resolve, reject) => {
			const uploader: UploaderInstance = new Uploader({
				controller: 'biconnector.integration.ui.fileUploaderController.datasetUploaderController',
				controllerOptions: {},
				multiple: false,
				autoUpload: true,
				maxFileSize: MAX_FILE_SIZE,
				acceptedFileTypes: ['.csv'],
				events: {
					'File:onUploadComplete': () => {
						const f = uploader.getFiles()[0];
						if (f && (!f.isComplete || f.isComplete()))
						{
							resolve({
								token: f.getServerFileId(),
								name: f.getName(),
							});
						}
					},
					'File:onError': (event: unknown) => {
						reject(this.normalizeError(event));
					},
					onError: (event: unknown) => {
						reject(this.normalizeError(event));
					},
				},
			});
			this.uploader = uploader;
			uploader.addFiles([file]);
		});
	}

	private disposeUploader(): void
	{
		this.uploader?.destroy();
		this.uploader = null;
	}

	private applyResponse(response: DatasetViewResponse): void
	{
		const headers = response?.data?.headers ?? [];
		const currentFields = this.store.state.config.fieldsSettings;

		this.store.commit('setFieldsSettings', mapHeadersToFieldsSettings(headers, currentFields));
		this.store.commit('setPreviewData', extractPreviewRows(response));
	}

	private normalizeError(event: unknown): Error
	{
		const data = (event as { getData?: () => Array<unknown> })?.getData?.()?.[0];
		const message = (data as { message?: string })?.message
			|| (event as { message?: string })?.message
			|| Loc.getMessage('DATASET_IMPORT_V2_UPLOAD_ERROR')
			|| '';

		return new Error(message);
	}

	private makeDatasetName(fileName: string): string
	{
		const base = String(fileName ?? '').replace(/\.[^./\\]+$/, '');
		const cleaned = base
			.replace(/[^A-Za-z0-9_]/g, '_')
			.replace(/_+/g, '_')
			.replace(/^_+|_+$/g, '');

		if (cleaned.length === 0)
		{
			return '';
		}

		const prefixed = /^[A-Za-z]/.test(cleaned) ? cleaned : `D_${cleaned}`;

		return prefixed.slice(0, 30).toLowerCase();
	}
}
