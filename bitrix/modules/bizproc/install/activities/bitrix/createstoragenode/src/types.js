export type StorageField = {
	id: number;
	storageId: number;
	code: string;
	sort: number;
	name: string;
	description: string;
	type: string;
	multiple: boolean;
	mandatory: boolean;
	settings: Object | null;
};

export type StorageFieldProp = {
	property: {
		Name: string;
		FieldName: string;
		Type: string;
		Required: boolean;
		AllowSelection: boolean;
		CustomType: string;
		Options: {
			codeCaption: string;
			copyNotification: string;
		};
	};
	value: StorageField[];
	fieldName: string;
	controlId: string;
};
