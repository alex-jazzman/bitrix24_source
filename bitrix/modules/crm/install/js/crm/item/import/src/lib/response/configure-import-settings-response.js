import { Type } from 'main.core';
import type { RequisiteDuplicateControlTarget } from '../model/import-settings';

export type ConfigureImportSettingsResponseData = {
	fileHeaders: FileHeader[],
	entityFields: EntityField[],
	fieldBindings: FieldBindings,
	filesize: number,
	previewTable: PreviewTable,
	requiredFieldIds: string[],
	requisiteDuplicateControlTargets: RequisiteDuplicateControlTarget[],
};

export type FileHeader = {
	columnIndex: number,
	title: string,
};

export type EntityField = {
	id: string,
	name: string,
	readonly?: boolean,
};

export type Binding = {
	fieldId: string,
	columnIndex: number,
	readonly: boolean,
};

export type FieldBindings = ?{
	bindings: Binding[],
};

export type PreviewTable = {
	headers: string[],
	rows: {
		errors: string[],
		values: string[],
	}[],
};

export class ConfigureImportSettingsResponse
{
	fileHeaders: FileHeader[];
	entityFields: EntityField[];
	fieldBindings: FieldBindings;
	filesize: number;
	previewTable: PreviewTable;
	requiredFieldIds: string[];
	requisiteDuplicateControlTargets: RequisiteDuplicateControlTarget[];

	constructor(data: ConfigureImportSettingsResponseData)
	{
		if (!Type.isObject(data))
		{
			throw new TypeError('Invalid data: object required');
		}

		this.fileHeaders = Type.isArray(data.fileHeaders)
			? data.fileHeaders.map((fileHeader) => {
				return this.#validateFileHeader(fileHeader);
			})
			: [];

		this.entityFields = Type.isArray(data.entityFields)
			? data.entityFields.map((entityField) => {
				return this.#validateEntityField(entityField);
			})
			: [];

		this.fieldBindings = data.fieldBindings ?? null;

		this.previewTable = data.previewTable ?? null;

		this.filesize = data.filesize ?? null;

		this.requiredFieldIds = data.requiredFieldIds ?? [];

		this.requisiteDuplicateControlTargets = data.requisiteDuplicateControlTargets ?? [];
	}

	#validateFileHeader(header: FileHeader): FileHeader
	{
		if (
			!Type.isObject(header)
			|| !Type.isNumber(header.columnIndex)
			|| !Type.isString(header.title)
		)
		{
			void console.error(header);

			throw new RangeError('Invalid header');
		}

		return header;
	}

	#validateEntityField(field: EntityField): EntityField
	{
		if (
			!Type.isObject(field)
			|| !Type.isString(field.name)
			|| !Type.isString(field.id)
		)
		{
			void console.error(field);

			throw new RangeError('Invalid entityField');
		}

		return field;
	}
}
