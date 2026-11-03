export type AvailableProcess = {
	id: number,
	name: string,
	description: string,
	hasParameters: boolean,
	isConstantsTuned: boolean,
	modifiedTs: number,
	authorId: number,
};

export type AvailableProcessListResponse = {
	processes: AvailableProcess[],
	hasAny: boolean,
	canCreateProcess: boolean,
	isEntityAvailable: boolean,
};

/**
 * A start field as `\Bitrix\Bizproc\FieldType::normalizePropertyList()` gives it out. The shape belongs to
 * bizproc and is passed to its control renderer as it came; `Options`, `Settings` and `Default` differ by
 * field type and are read by the renderer alone.
 */
export type ProcessStartField = {
	Id: string,
	Type: string,
	BaseType: string | null,
	Name: string | null,
	Description: string | null,
	Multiple: boolean,
	Required: boolean,
	Options: mixed,
	Settings: mixed,
	Default: mixed,
};

export type ProcessStartFieldsResponse = {
	documentType: [string, string, string],
	fields: ProcessStartField[],
};

/**
 * Values of the start fields keyed by field id, as the form filled them in.
 */
export type ProcessStartParameters = { [fieldId: string]: mixed };

export type ProcessStartMember = {
	entityType: string,
	entityId: number | string,
};

export type ProcessLaunchResponse = {
	launchId: number,
	totalCount: number,
	memberCount: number,
	excludedCount: number,
};

export type ProcessRetryResponse = {
	retriedCount: number,
};

export type RunningProcessStatus = 'launching' | 'inWork' | 'completed' | 'error';

export type ProcessDocumentsState = 'none' | 'created' | 'notCreated';

export type ProcessParticipant = {
	userId: number,
	holdingSinceTs: number | null,
};

export type ProcessDocument = {
	id: number,
	title: string,
	statusName: string,
	url: string | null,
};

export type RunningProcess = {
	workflowId: string | null,
	entityId: number | null,
	employeeId: number,
	title: string,
	status: RunningProcessStatus,
	stageName: string,
	lastActivityTs: number | null,
	participants: ProcessParticipant[],
	documents: ProcessDocument[],
	documentsState: ProcessDocumentsState,
	noDocumentReason: string | null,
	canRetry: boolean,
	launchItemId: number,
	protocolUrl: string | null,
};

export type ProcessLaunchGroup = {
	launchId: number,
	processName: string,
	memberCount: number,
	hasChildren: boolean,
	status: RunningProcessStatus,
	startedTs: number,
	process: RunningProcess | null,
};

export type RunningProcessFilterState = 'inWork' | 'completed';

export type RunningProcessFilter = {
	state?: RunningProcessFilterState,
	searchQuery?: string,
};

export type RunningProcessGroupPage = {
	groups: ProcessLaunchGroup[],
	hasNextPage: boolean,
	hasAnyRunning: boolean,
};

export type RunningProcessPage = {
	processes: RunningProcess[],
	hasNextPage: boolean,
};

/**
 * The process a signing document was created by, as the card of the document names it: the element is what
 * the link leads to, the process itself is what the row of the list is named by.
 */
export type DocumentProcess = {
	workflowId: string,
	entityId: number,
	name: string,
	url: string,
};

/**
 * An empty `process` is the ordinary answer and not a failure: a document created by no process and a
 * process the person may not see arrive alike, and the card must not tell them apart.
 */
export type DocumentProcessResponse = {
	process: DocumentProcess | null,
};
