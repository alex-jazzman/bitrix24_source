export type PermissionLevel = 'view' | 'edit' | 'manage' | 'moderate';

export type PopupKind = 'collection' | 'document';

export type PopupMode = 'create' | 'edit';

export type Member = {
	subjectCode: string,
	title: string,
	entityId: string,
	entityItemId: string,
};

export type DecodedSubjectCode = {
	entityId: string,
	entityItemId: string,
};

export type PermissionPayloadItem = {
	subjectCode: string,
	level: string,
};

export type CollectionPermissionsPayload = {
	policyLevel?: string,
	permissions?: PermissionPayloadItem[],
};

export type LevelSection = {
	level: PermissionLevel,
	title: string,
	hintText?: string,
	required: boolean,
};

export type PopupNameConfig = {
	visible: boolean,
	initialValue: string,
	placeholder: string,
};

export type PopupSaveState = {
	name: string,
	byLevel: { [PermissionLevel]: Member[] },
};

export type PopupConfig = {
	kind: PopupKind,
	mode: PopupMode,
	targetId: number | null,
	sections: LevelSection[],
	name: PopupNameConfig,
	tagSelectorContext: string,
	load: () => Promise<CollectionPermissionsPayload>,
	save: (state: PopupSaveState) => Promise<mixed>,
	successMessage: string,
	errorMessage: string,
	loadErrorMessage: string,
	primaryButtonText: string,
	dialogTitle: string,
};

export type CollectionPopupOptions = {
	collectionName?: string,
};

export type CreateCollectionPopupOptions = {
	onCreated?: (collection: { id: number, name: string, position?: number }) => mixed,
};

export type DocumentPopupOptions = {
	documentTitle?: string,
};
