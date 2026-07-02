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

export type StartRequest = {
	sourceType: string,
	url: string,
	token: string,
	collectionIds: string[],
	overwrite: boolean,
};

export type StartResponse = {
	sessionId: number,
	progress: ImportProgress,
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

export type ProgressScreenState = {
	isImporting: boolean,
	isCancelling: boolean,
	errorMessage: string,
	progress: ImportProgress | null,
	isFinishing?: boolean,
};

export type ImportDialogOptions = {
	onComplete?: () => void | Promise<void>,
};
