export type FieldType =
	| 'string'
	| 'money'
	| 'int'
	| 'double'
	| 'date'
	| 'datetime'
	| 'timezone';

export type FileProperties = {
	encoding: string,
	separator: string,
	firstLineHeader: boolean,
	fileToken?: string,
	fileName?: string,
};

export type DataFormats = {
	money: string,
	date: string,
	datetime: string,
	double: string,
	timezone: string,
};

export type DatasetProperties = {
	id: number,
	name: string,
	description: string,
	externalCode: string,
	externalName: string,
	externalDatasets: Array<Record<string, unknown>>,
	isSystem?: boolean,
	createPhysicalDatasetUrl?: string,
	createVirtualDatasetUrl?: string,
};

export type ConnectionProperties = {
	connectionId: number,
	connectionType: string,
	connectionName?: string,
	tableName: string,
	connectionIsSupportMapping: boolean,
	createPhysicalDatasetUrl?: string,
	createVirtualDatasetUrl?: string,
};

export type FieldSettings = {
	id: number,
	visible: boolean,
	type: FieldType | string,
	name: string,
	originalName: string,
	externalCode: string,
	description?: string,
};

export type SectionsConfig = Record<string, Record<string, boolean>>;

export type AppConfig = {
	fileProperties: FileProperties,
	dataFormats: DataFormats,
	datasetProperties: DatasetProperties,
	connectionProperties?: ConnectionProperties,
	fieldsSettings: Array<FieldSettings>,
	sectionsConfig: SectionsConfig,
};

export type PreviewData = {
	rows: Array<Array<string | number | null>>,
};

export type UploadStatus = {
	isUploading: boolean,
	step: number,
};

export type ValidationError = {
	rowIndex: number,
	fieldIndex: number,
	message: string,
};

export type ValidationState = {
	isValidating: boolean,
	errors: Array<ValidationError>,
};

export type UiState = {
	activeFieldIndex: number,
	validation: ValidationState,
	isReloadingPreview: boolean,
	hasPreviewSchemaMismatch: boolean,
	connectionEditing: boolean,
};

export type RootState = {
	config: AppConfig,
	previewData: PreviewData,
	upload: UploadStatus,
	ui: UiState,
};

export type FormatOption = {
	type: 'value' | 'custom',
	value: string,
	title?: string,
};

export type DataFormatTemplates = Record<string, Array<FormatOption>>;

export type EncodingOption = { value: string, title: string };
export type SeparatorOption = { value: string, title: string };

export type ExternalConnection = {
	ID: number | string,
	TYPE: string,
	TITLE: string,
	AVATAR: string,
	IS_SUPPORT_MAPPING?: boolean,
};

export type AppParams = {
	dataFormatTemplates: DataFormatTemplates,
	encodings: Array<EncodingOption>,
	separators: Array<SeparatorOption>,
	reservedNames: Array<string>,
	connections: Array<ExternalConnection>,
	isSupersetReady: boolean,
};

export type ExtraAppOptions = {
	helpdeskCode?: number | null,
};

export type InitialData = {
	config?: Partial<AppConfig>,
	previewData?: Partial<PreviewData>,
};
