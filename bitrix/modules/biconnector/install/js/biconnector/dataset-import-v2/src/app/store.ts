import { createStore } from 'ui.vue3.vuex';
import type { Store } from 'ui.vue3.vuex';
import type {
	AppConfig,
	ConnectionProperties,
	DataFormats,
	DatasetProperties,
	FieldSettings,
	FileProperties,
	InitialData,
	PreviewData,
	RootState,
	SectionsConfig,
	UploadStatus,
	ValidationError,
} from '../types/state';

const defaultConfig = (): AppConfig => ({
	fileProperties: {
		encoding: 'utf-8',
		separator: ',',
		firstLineHeader: true,
		fileToken: '',
		fileName: '',
	},
	dataFormats: {
		money: '',
		date: '',
		datetime: '',
		double: '',
		timezone: '',
	},
	datasetProperties: {
		id: 0,
		name: '',
		description: '',
		externalCode: '',
		externalName: '',
		externalDatasets: [],
	},
	fieldsSettings: [],
	sectionsConfig: {},
});

const defaultPreview = (): PreviewData => ({
	rows: [],
});

function mergeInitialState(initial: InitialData | undefined): RootState
{
	const config = defaultConfig();
	const initialConfig = initial?.config ?? {};

	if (initialConfig.fileProperties)
	{
		config.fileProperties = { ...config.fileProperties, ...initialConfig.fileProperties };
	}
	if (initialConfig.dataFormats)
	{
		config.dataFormats = { ...config.dataFormats, ...initialConfig.dataFormats };
	}
	if (initialConfig.datasetProperties)
	{
		config.datasetProperties = { ...config.datasetProperties, ...initialConfig.datasetProperties };
	}
	if (initialConfig.connectionProperties)
	{
		config.connectionProperties = { ...initialConfig.connectionProperties as ConnectionProperties };
	}
	if (Array.isArray(initialConfig.fieldsSettings))
	{
		config.fieldsSettings = initialConfig.fieldsSettings.map((f) => ({ ...f }));
	}
	if (initialConfig.sectionsConfig)
	{
		config.sectionsConfig = { ...initialConfig.sectionsConfig };
	}

	const preview = defaultPreview();
	const initialRows = initial?.previewData?.rows;
	if (Array.isArray(initialRows))
	{
		preview.rows = initialRows;
	}

	const hasConnectionTable = Boolean(
		config.connectionProperties?.connectionId && config.connectionProperties?.tableName,
	);

	return {
		config,
		previewData: preview,
		upload: { isUploading: false, step: 0 },
		ui: {
			activeFieldIndex: -1,
			validation: { isValidating: false, errors: [] },
			isReloadingPreview: false,
			hasPreviewSchemaMismatch: false,
			connectionEditing: !(config.datasetProperties.id > 0) && !hasConnectionTable,
		},
	};
}

export function buildStore(initialData?: InitialData): Store<RootState>
{
	const initial = mergeInitialState(initialData);

	return createStore<RootState>({
		state(): RootState
		{
			return initial;
		},
		mutations: {
			setFileProperties(state: RootState, payload: Partial<FileProperties>): void
			{
				state.config.fileProperties = { ...state.config.fileProperties, ...payload };
			},
			setConnectionProperties(state: RootState, payload: ConnectionProperties): void
			{
				state.config.connectionProperties = { ...payload };
			},
			setDatasetProperties(state: RootState, payload: Partial<DatasetProperties>): void
			{
				state.config.datasetProperties = { ...state.config.datasetProperties, ...payload };
			},
			toggleRowVisibility(state: RootState, rowIndex: number): void
			{
				const row = state.config.fieldsSettings[rowIndex];
				if (row)
				{
					row.visible = !row.visible;
					if (!row.visible && state.ui.activeFieldIndex === rowIndex)
					{
						state.ui.activeFieldIndex = -1;
					}
				}
			},
			setAllRowsVisible(state: RootState): void
			{
				state.config.fieldsSettings.forEach((row) => { row.visible = true; });
			},
			setAllRowsInvisible(state: RootState): void
			{
				state.config.fieldsSettings.forEach((row) => { row.visible = false; });
				state.ui.activeFieldIndex = -1;
			},
			setFieldRowSettings(
				state: RootState,
				payload: { index: number, settings: Partial<FieldSettings> },
			): void
			{
				const current = state.config.fieldsSettings[payload.index];
				if (current)
				{
					state.config.fieldsSettings[payload.index] = { ...current, ...payload.settings };
				}
			},
			setDataFormats(state: RootState, payload: Partial<DataFormats>): void
			{
				state.config.dataFormats = { ...state.config.dataFormats, ...payload };
			},
			setPreviewData(state: RootState, rows: PreviewData['rows']): void
			{
				state.previewData.rows = rows;
			},
			setFieldsSettings(state: RootState, fields: Array<FieldSettings>): void
			{
				state.config.fieldsSettings = fields.map((f) => ({ ...f }));
			},
			setSectionsConfig(state: RootState, payload: SectionsConfig): void
			{
				state.config.sectionsConfig = { ...payload };
			},
			resetSectionsConfig(state: RootState): void
			{
				state.config.sectionsConfig = {};
			},
			setUploadStatus(state: RootState, payload: Partial<UploadStatus>): void
			{
				state.upload = { ...state.upload, ...payload };
			},
			setActiveFieldIndex(state: RootState, index: number): void
			{
				state.ui.activeFieldIndex = index;
			},
			setValidationLoading(state: RootState, isValidating: boolean): void
			{
				state.ui.validation = { ...state.ui.validation, isValidating };
			},
			setValidationErrors(state: RootState, errors: Array<ValidationError>): void
			{
				state.ui.validation = { ...state.ui.validation, errors };
			},
			setPreviewReloading(state: RootState, isReloading: boolean): void
			{
				state.ui.isReloadingPreview = isReloading;
			},
			setPreviewSchemaMismatch(state: RootState, hasMismatch: boolean): void
			{
				state.ui.hasPreviewSchemaMismatch = hasMismatch;
			},
			setConnectionEditing(state: RootState, isEditing: boolean): void
			{
				state.ui.connectionEditing = isEditing;
			},
		},
		getters: {
			isEditMode: (state: RootState): boolean => state.config.datasetProperties.id > 0,
			isSystem: (state: RootState): boolean => Boolean(state.config.datasetProperties.isSystem),
			isReadOnly: (state: RootState): boolean =>
				state.config.datasetProperties.id > 0
				|| Boolean(state.config.datasetProperties.isSystem)
			,
			hasFile: (state: RootState): boolean =>
				Boolean(state.config.fileProperties.fileToken)
				|| Boolean(state.config.fileProperties.fileName)
				|| state.config.datasetProperties.id > 0
			,
			hasPreview: (state: RootState): boolean => state.config.fieldsSettings.length > 0,
			activeFieldIndex: (state: RootState): number => state.ui.activeFieldIndex,
			isValidating: (state: RootState): boolean => state.ui.validation.isValidating,
			isReloadingPreview: (state: RootState): boolean => state.ui.isReloadingPreview,
			hasPreviewSchemaMismatch: (state: RootState): boolean => state.ui.hasPreviewSchemaMismatch,
			validationErrors: (state: RootState): Array<ValidationError> => state.ui.validation.errors,
			fieldNameCounts: (state: RootState): Map<string, number> => {
				const counters = new Map<string, number>();
				state.config.fieldsSettings.forEach((field) => {
					const name = field.name ?? '';
					counters.set(name, (counters.get(name) ?? 0) + 1);
				});

				return counters;
			},
			hasFieldNameErrors: (
				state: RootState,
				getters: { fieldNameCounts: Map<string, number> },
			): boolean => {
				const nameFormat = /^[A-Z][A-Z0-9_]*$/;

				return state.config.fieldsSettings.some((field) => {
					if (field.visible === false)
					{
						return false;
					}

					const name = field.name ?? '';
					if (name.length === 0 || name.length > 32)
					{
						return true;
					}

					if (!nameFormat.test(name))
					{
						return true;
					}

					return (getters.fieldNameCounts.get(name) ?? 0) > 1;
				});
			},
			validationErrorsByField: (state: RootState): Record<number, number> => {
				const map: Record<number, number> = {};
				state.ui.validation.errors.forEach((e) => {
					map[e.fieldIndex] = (map[e.fieldIndex] ?? 0) + 1;
				});

				return map;
			},
			validationErrorCellSet: (state: RootState): Set<string> => {
				const set = new Set<string>();
				state.ui.validation.errors.forEach((e) => set.add(`${e.rowIndex}_${e.fieldIndex}`));

				return set;
			},
			isUploading: (state: RootState): boolean => state.upload.isUploading,
			uploadStep: (state: RootState): number => state.upload.step,
			areAllRowsVisible: (state: RootState): boolean =>
				state.config.fieldsSettings.length > 0
				&& state.config.fieldsSettings.every((row) => row.visible)
			,
			areNoRowsVisible: (state: RootState): boolean =>
				state.config.fieldsSettings.length > 0
				&& state.config.fieldsSettings.every((row) => !row.visible)
			,
			areSomeRowsVisible: (state: RootState, getters: Record<string, boolean>): boolean =>
				!getters.areAllRowsVisible && !getters.areNoRowsVisible
			,
			columnVisibilityMap: (state: RootState): Array<boolean> =>
				state.config.fieldsSettings.map((row) => row.visible)
			,
			hasData: (state: RootState): boolean => state.previewData.rows.length > 0,
			datasetProperties: (state: RootState): DatasetProperties => state.config.datasetProperties,
			connectionProperties: (state: RootState): ConnectionProperties | undefined =>
				state.config.connectionProperties
			,
			connectionEditing: (state: RootState): boolean => state.ui.connectionEditing,
			getSectionConfig: (state: RootState) => (sectionName: string, property: string): boolean => {
				const section = state.config.sectionsConfig[sectionName];
				if (section && property in section)
				{
					return Boolean(section[property]);
				}

				return true;
			},
		},
	});
}
