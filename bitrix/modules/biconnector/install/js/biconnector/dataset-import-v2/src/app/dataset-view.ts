import { ajax } from 'main.core';
import type { Store } from 'ui.vue3.vuex';
import type { FieldSettings, RootState } from '../types/state';

const PARSING_SETTINGS_ERROR_CODES = new Set(['DIFFERENT_COUNT_FIELDS', 'EMPTY_DATA']);

export type DatasetViewHeader = {
	type: string,
	name?: string,
	externalCode: string,
	description?: string,
};

export type DatasetViewResponse = {
	data?: {
		headers?: Array<DatasetViewHeader>,
		data?: Array<Array<string | number | null>>,
	},
	errors?: Array<{ message: string }>,
};

export type DatasetViewRequestOptions = {
	skipExistingSchemaCheck?: boolean,
};

export function isParsingSettingsError(error: unknown): boolean
{
	const errors = (error as { errors?: Array<{ code?: string }> } | undefined)?.errors ?? [];

	return errors.length > 0 && errors.every(({ code }) => code && PARSING_SETTINGS_ERROR_CODES.has(code));
}

export function requestDatasetView(
	store: Store<RootState>,
	sourceCode: string,
	options: DatasetViewRequestOptions = {},
): Promise<DatasetViewResponse>
{
	const state = store.state.config;
	const datasetProperties = options.skipExistingSchemaCheck
		? { ...state.datasetProperties, id: 0 }
		: state.datasetProperties;

	return ajax.runAction('biconnector.externalsource.dataset.view', {
		data: {
			type: sourceCode,
			fields: {
				fileProperties: state.fileProperties,
				datasetProperties,
				fieldsSettings: state.fieldsSettings,
				dataFormats: state.dataFormats,
			},
		},
	}) as Promise<DatasetViewResponse>;
}

export function mapHeadersToFieldsSettings(
	headers: Array<DatasetViewHeader>,
	currentFields: Array<FieldSettings> = [],
): Array<FieldSettings>
{
	return headers.map((header, index) => {
		const currentField = currentFields[index];
		const isExistingField = (currentField?.id ?? 0) > 0;

		return {
			id: currentField?.id ?? 0,
			visible: true,
			type: isExistingField ? currentField.type : header.type,
			name: isExistingField
				? currentField.name
				: (header.name && header.name.length > 0 ? header.name : `FIELD_${index}`),
			originalName: header.externalCode,
			externalCode: header.externalCode,
			description: header.description ?? '',
		};
	});
}

export function extractPreviewRows(response: DatasetViewResponse): Array<Array<string | number | null>>
{
	return response?.data?.data ?? [];
}

export function hasPreviewSchemaMismatch(store: Store<RootState>, response: DatasetViewResponse): boolean
{
	return store.getters.isEditMode
		&& (response?.data?.headers?.length ?? 0) !== store.state.config.fieldsSettings.length;
}
