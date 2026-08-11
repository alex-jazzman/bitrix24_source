export type EditorOptions = {
	id?: string,
	target: HTMLElement,
	canUseFieldsDialog?: boolean,
	canUseFieldValueInput?: boolean,
	canUsePreview: boolean,
	isReadOnly?: boolean,
	entityType: string,
	messages?: {
		selectField?: string,
	},
	events: { [eventName: string]: () => void }
};

export type FilledPlaceholder = {
	PLACEHOLDER_ID: string,
	FIELD_NAME?: string,
	TITLE?: string,
	PARENT_TITLE?: string,
	FIELD_ENTITY_TYPE?: string,
	FIELD_VALUE?: string,
};
