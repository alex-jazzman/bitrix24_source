/* eslint-disable */
type InitialData = {
	config?: Partial<AppConfig>;
	previewData?: Partial<PreviewData>;
};

type AppConfig = {
	fileProperties: FileProperties;
	dataFormats: DataFormats;
	datasetProperties: DatasetProperties;
	connectionProperties?: ConnectionProperties;
	fieldsSettings: Array<FieldSettings>;
	sectionsConfig: SectionsConfig;
};

type FileProperties = {
	encoding: string;
	separator: string;
	firstLineHeader: boolean;
	fileToken?: string;
	fileName?: string;
};

type DataFormats = {
	money: string;
	date: string;
	datetime: string;
	double: string;
	timezone: string;
};

type DatasetProperties = {
	id: number;
	name: string;
	description: string;
	externalCode: string;
	externalName: string;
	externalDatasets: Array<Record<string, unknown>>;
	isSystem?: boolean;
	createPhysicalDatasetUrl?: string;
	createVirtualDatasetUrl?: string;
};

type ConnectionProperties = {
	connectionId: number;
	connectionType: string;
	connectionName?: string;
	tableName: string;
	connectionIsSupportMapping: boolean;
	createPhysicalDatasetUrl?: string;
	createVirtualDatasetUrl?: string;
};

type FieldSettings = {
	id: number;
	visible: boolean;
	type: FieldType | string;
	name: string;
	originalName: string;
	externalCode: string;
	description?: string;
};

type FieldType = 'string' | 'money' | 'int' | 'double' | 'date' | 'datetime' | 'timezone';

type SectionsConfig = Record<string, Record<string, boolean>>;

type PreviewData = {
	rows: Array<Array<string | number | null>>;
};

type AppParams = {
	dataFormatTemplates: DataFormatTemplates;
	encodings: Array<EncodingOption>;
	separators: Array<SeparatorOption>;
	reservedNames: Array<string>;
	connections: Array<ExternalConnection>;
	isSupersetReady: boolean;
};

type DataFormatTemplates = Record<string, Array<FormatOption>>;

type FormatOption = {
	type: 'value' | 'custom';
	value: string;
	title?: string;
};

type EncodingOption = {
	value: string;
	title: string;
};

type SeparatorOption = {
	value: string;
	title: string;
};

type ExternalConnection = {
	ID: number | string;
	TYPE: string;
	TITLE: string;
	AVATAR: string;
	IS_SUPPORT_MAPPING?: boolean;
};

type ExtraAppOptions = {
	helpdeskCode?: number | null;
};

type ConnectionParams = {
	connectionId?: number;
	connectionType?: string;
	tableName?: string;
	connectionIsSupportMapping?: boolean | string;
};

type SectionsConfig = Record<string, Record<string, boolean | string>>;

declare namespace BX.BIConnector.DatasetImportV2 {
	class AppFactory {
		static getApp(sourceId: string, initialData?: InitialData, appParams?: AppParams, extra?: ExtraAppOptions): ReturnType<typeof BX.Vue3.BitrixVue.createApp>;
	}

	class Slider {
		static open(sourceId: string, datasetId?: number, connection?: ConnectionParams, sectionsConfig?: SectionsConfig): void;
	}
}
