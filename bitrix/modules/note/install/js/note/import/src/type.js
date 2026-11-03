export type ImportCollection = {
	id: string,
	name: string,
};

export type ImportDocumentTreeNode = {
	id: string,
	title: string,
	parentId: string | null,
	children: ImportDocumentTreeNode[],
};

export type ImportProgressStatus =
	| 'in_progress'
	| 'done'
	| 'error'
	| 'cancelled'
;

export type ImportErrorDetail = {
	title: string,
	reason: string,
};

export type ImportProgress = {
	status: ImportProgressStatus,
	step: string,
	total: number,
	done: number,
	error: number,
	totalAttachments: number,
	doneAttachments: number,
	collectionName: string,
	collectionIndex: number,
	collectionCount: number,
	// Why the import stopped (API-03); empty string when it did not.
	errorMessage: string,
	errorDetails: ImportErrorDetail[],
	globalTotal?: number,
	globalDone?: number,
	globalError?: number,
	globalTotalAttachments?: number,
	globalDoneAttachments?: number,
};

export type CheckConnectionRequest = {
	sourceType: string,
	url: string,
	token: string,
};

export type CheckConnectionResponse = {
	instanceName: string,
};

export type GetCollectionsRequest = {
	sourceType: string,
	url: string,
	token: string,
};

export type GetCollectionsResponse = {
	collections: ImportCollection[],
};

export type GetDocumentTreeRequest = {
	sourceType: string,
	url: string,
	token: string,
	collectionId: string,
};

export type GetDocumentTreeResponse = {
	documents: ImportDocumentTreeNode[],
};

// A note collection a previous run created from the picked source collection (API-01).
export type ExistingCollection = {
	externalId: string,
	collectionId: number,
	name: string,
	canModerate: boolean,
};

export type CheckOverlapResponse = {
	existingCollectionIds: string[],
	existingCollections: ExistingCollection[],
};

export type StartRequest = {
	sourceType: string,
	url: string,
	token: string,
	collectionIds: string[],
	// 1 or 0, not a boolean: the form-encoded transport turns `false` into the string 'false'.
	// {@see buildStartPayload}
	overwrite: number,
};

export type StartResponse = {
	sessionId: number,
	progress: ImportProgress,
};

// The read of the active session, as the server gives it: this answer alone is not normalized, so
// `progress` arrives as it is - and it is null for a session whose run is already over.
// {@see shouldRestoreSession}
export type ActiveSessionResponse = {
	active: boolean,
	sessionId?: number,
	progress?: ImportProgress | null,
};

export type GetStatusRequest = {
	sessionId: number,
};

export type GetStatusResponse = {
	progress: ImportProgress,
};

export type CancelRequest = {
	sessionId: number,
};

export type ConvertedCollection = {
	collectionId: number,
	name: string,
};

export type GetConvertedCollectionsRequest = {
	sessionId: number,
};

export type GetConvertedCollectionsResponse = {
	collections: ConvertedCollection[],
};

// Outcome of a failed source check: the form field the message belongs to, or null when it
// belongs to the source itself. {@see resolveConnectionError}
export type ConnectionError = {
	field: string | null,
	message: string,
};

export type ConnectionFieldErrors = {
	sourceType: string,
	url: string,
	token: string,
};

export type ConnectionFieldTouched = {
	sourceType: boolean,
	url: boolean,
	token: boolean,
};

export type ConnectionFormState = {
	url: string,
	token: string,
	errorMessage: string,
	isSubmitting: boolean,
	sourceType?: string,
	touched?: ConnectionFieldTouched,
	errors?: ConnectionFieldErrors,
};

export type CollectionTreeState = {
	isLoading: boolean,
	isLoaded: boolean,
	errorMessage: string,
	documents: ImportDocumentTreeNode[],
};

export type CollectionsScreenState = {
	isLoading: boolean,
	errorMessage: string,
	collections: ImportCollection[],
	selectedCollectionIds: Set<string>,
	expandedCollectionIds: Set<string>,
	treeByCollectionId: Map<string, CollectionTreeState>,
};

export type OverwriteCollection = {
	id: string,
	name: string,
};

export type OverwriteScreenState = {
	collections: OverwriteCollection[],
	expandedCollectionIds: Set<string>,
	treeByCollectionId: Map<string, CollectionTreeState>,
};

export type ReimportAction = 'update' | 'create';

// One decision per run, not per base: the picked action applies to every matched base.
export type ReimportChoiceScreenState = {
	collections: ExistingCollection[],
	action: ReimportAction,
	errorMessage: string,
	expandedCollectionIds: Set<string>,
	treeByCollectionId: Map<string, CollectionTreeState>,
};

export type ProgressScreenState = {
	isImporting: boolean,
	isCancelling: boolean,
	errorMessage: string,
	progress: ImportProgress | null,
};

export type PermissionsListScreenState = {
	isLoading: boolean,
	errorMessage: string,
	hasLoaded: boolean,
	collections: ConvertedCollection[],
};

export type ImportDialogOptions = {
	onComplete?: (collectionId?: number) => void | Promise<void>,
	wikiImportEnabled?: boolean,
	landingImportEnabled?: boolean,
};
