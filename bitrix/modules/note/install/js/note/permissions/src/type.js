export type PermissionLevel = 'view' | 'edit' | 'manage' | 'moderate';

export type PermissionScope = 'document' | 'subtree';

export type PopupKind = 'collection' | 'document';

export type PopupMode = 'create' | 'edit';

export type Member = {
	subjectCode: string,
	title: string,
	entityId: string,
	entityItemId: string,
	// Document-scope grants only; collections leave it at the 'document' default.
	scope: PermissionScope,
	// Inherited rows (derived from an ancestor) are read-only: kept out of byLevel and never
	// sent back on save; the selector renders them as non-removable tags. sourceDocumentId
	// names the originating document.
	inherited: boolean,
	sourceDocumentId: number | null,
};

export type DecodedSubjectCode = {
	entityId: string,
	entityItemId: string,
};

export type PermissionPayloadItem = {
	subjectCode: string,
	level: string,
	// Present on document API-02 responses; absent on collection payloads.
	scope?: PermissionScope,
	inherited?: boolean,
	sourceDocumentId?: number | null,
	name?: string,
};

export type CollectionPermissionsPayload = {
	policyLevel?: string,
	permissions?: PermissionPayloadItem[],
	// Document API-02 only: server-confirmed availability of the subtree-scope
	// feature. When absent/false the scope switcher stays hidden.
	subtreeAvailable?: boolean,
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
