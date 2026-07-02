export type FormFieldsToMergeResult = {
	target: EntityInfo,
	editMode: boolean;
	fields: FieldInfo[];
	entity: {
		entityId: number;
		entityTypeName: string;
		editorId: string;
	}
}

export type FieldInfo = {
	name: string;
	type: string;
	title: string;
	aiModel: UserFieldModel;
	isMultiple: boolean;
	isUserField: boolean;
}

export type EntityInfo = {
	entityTypeName: string;
	entityTypeId: number;
	entityId: number;
	categoryId: ?number;
	editorId: string;
	feedbackWasSent: boolean;
}

export type ConflictField = {
	...FieldInfo;
	aiValue: any;
	originalValue: any;
	originalModel: ?UserFieldModel,
	isAiValuesUsed: boolean;
	order: number;
}

export type UserFieldModel = {
	VALUE: any;
	IS_EMPTY: boolean;
	SIGNATURE: string;
}

export type EditorControlsParams = {
	fieldId: string;
	relatedFieldOffsetY: number;
	originalValue: any;
	originalModel: ?UserFieldModel,
	order: number;
}

export const FEEDBACK_TRIGGER_CONTROL = 'FEEDBACK_TRIGGER_CONTROL';
export const FEEDBACK_TRIGGER_APP_CLOSE = 'FEEDBACK_TRIGGER_APP_CLOSE';

