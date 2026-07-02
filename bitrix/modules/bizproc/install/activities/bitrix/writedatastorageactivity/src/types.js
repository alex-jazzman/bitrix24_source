// @flow

export type PropertyOptions = {
	documentType: Array<string>;
	filteringFieldsPrefix: string;
	filterFieldsMap: Object;
	conditions: Object;
	headCaption?: string;
	collapsedCaption: string;
};

export type WriteFieldsOptions = {
	documentType: Array<string>;
	writeFieldsMap: Object;
	currentFieldValues: Object;
	addFieldCaption: string;
	newFieldCaption: string;
	newStorageCaption?: string;
};

export type FieldProperty = {
	Name: string;
	FieldName: string;
	Type: string;
	Required: boolean;
	AllowSelection: boolean;
	CustomType: string;
	Options: PropertyOptions | WriteFieldsOptions;
};

export type Field = {
	controlId: string;
	fieldName: string;
	property: FieldProperty;
	value: ?Object;
};

export type ControlRenderers = {
	filterFields: (field: Field) => HTMLElement;
	writeFields: (field: Field) => HTMLElement;
};

export type StorageField = {
	Id: number | string;
	Name: string;
	FieldName: string;
	Type: string;
	Multiple?: boolean;
	Required: boolean;
	Options?: Object;
	AllowSelection: boolean;
	Value?: mixed;
};

export const Action = {
	GET_FIELDS: 'bizproc.v2.StorageField.getFieldsByStorageId',
	DELETE_FIELD: 'bizproc.v2.StorageField.delete',
};
