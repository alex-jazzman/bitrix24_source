// Module actions the popup calls. Nothing else reaches the server from this extension.
export const ConnectionAction = Object.freeze({
	GetState: 'biconnector.mcpconnection.getState',
	Issue: 'biconnector.mcpconnection.issue',
	Reissue: 'biconnector.mcpconnection.reissue',
});

export type ConnectionAction = typeof ConnectionAction[keyof typeof ConnectionAction];

// Outcome of issue and reissue. 'exists' is a success without a command, not a refusal.
export const ConnectionOutcome = Object.freeze({
	Issued: 'issued',
	Exists: 'exists',
});

export type ConnectionOutcome = typeof ConnectionOutcome[keyof typeof ConnectionOutcome];

// Refusal branches of the adapter: the branch arrives both as the error code and as its own field.
export const RefusalBranch = Object.freeze({
	AuthRequired: 'BI_MCP_AUTH_REQUIRED',
	PortalDisabled: 'BI_MCP_PORTAL_DISABLED',
	AdminDisabled: 'BI_MCP_ADMIN_DISABLED',
	SubscriptionRequired: 'BI_MCP_SUBSCRIPTION_REQUIRED',
	NotEmployee: 'BI_MCP_NOT_EMPLOYEE',
	ScopesDisabled: 'BI_MCP_SCOPES_DISABLED',
	NotCreator: 'BI_MCP_NOT_CREATOR',
	ConstructorDisabled: 'BI_MCP_CONSTRUCTOR_DISABLED',
	ModuleUnavailable: 'BI_MCP_MODULE_UNAVAILABLE',
	UnsupportedDatabase: 'BI_MCP_UNSUPPORTED_DATABASE',
	IssueFailed: 'BI_MCP_ISSUE_FAILED',
	Unavailable: 'BI_MCP_UNAVAILABLE',
	ServerUrlMissing: 'BI_MCP_SERVER_URL_MISSING',
});

export type RefusalBranch = typeof RefusalBranch[keyof typeof RefusalBranch];

// Two codes the classification names apart, and no table of codes to texts grows out of them (AC-025).
// The first the core synthesizes for a broken connection and for an expired wait (core_ajax.js:1037-1048):
// a refusal carrying it has no server verdict behind it. The second the filter of the core puts on an
// expired session; its server text comes without the sign of being meant for a person, so the requirement
// to sign in is said by a phrase of the popup itself (AC-023).
export const NETWORK_ERROR_CODE = 'NETWORK_ERROR';
export const AUTH_REQUIRED_ERROR_CODE = 'invalid_authentication';

// Three forms of the refusal of CONTRACT-CONN-01, told apart by the fields of the first error: the gateway
// of the access to BI, the adapter and the filter of the core.
export const RefusalForm = Object.freeze({
	Gateway: 'GATEWAY',
	Adapter: 'ADAPTER',
	Core: 'CORE',
});

export type RefusalForm = typeof RefusalForm[keyof typeof RefusalForm];

// The refusal as ALG-01 describes it. The form is the only field every refusal carries; the rest exists in
// one form each, and no consumer may read them before it knows the form. `branch` stays a plain string: a
// code the server cannot map collapses into `BI_MCP_ISSUE_FAILED` there, so the client validates nothing
// against its own registry of branches.
export type Refusal = {
	form: RefusalForm,
	humanText: string | null,
	code?: string,
	branch?: string,
	retryable?: boolean,
	previousConnectionMayBeLost?: boolean,
	limitCode?: string | null,
	noServerVerdict?: boolean,
	authRequired?: boolean,
};

export const PopupState = Object.freeze({
	AwaitState: 'AWAIT_STATE',
	OperationsBeforeIssue: 'OPERATIONS_BEFORE_ISSUE',
	AwaitIssue: 'AWAIT_ISSUE',
	AwaitReissue: 'AWAIT_REISSUE',
	CommandIssued: 'COMMAND_ISSUED',
	ConnectionExists: 'CONNECTION_EXISTS',
	ActiveConnection: 'ACTIVE_CONNECTION',
	GatewayRefusal: 'GATEWAY_REFUSAL',
	AdapterRefusal: 'ADAPTER_REFUSAL',
	TechnicalRefusal: 'TECHNICAL_REFUSAL',
	PreviousConnectionInDoubt: 'PREVIOUS_CONNECTION_IN_DOUBT',
	UnknownResult: 'UNKNOWN_RESULT',
});

export type PopupState = typeof PopupState[keyof typeof PopupState];

export type AgentOperationImpact = 'read' | 'modify' | 'destructive';

export type AgentOperation = {
	toolSetCode: string,
	toolName: string,
	impact: AgentOperationImpact,
	title: string,
	warning: string | null,
};

export type AgentOperationCatalog = {
	[toolSetCode: string]: AgentOperation[],
};

// Names of the sets of the catalogue as the popup says them. The provider hands the records over grouped by
// the code of the set and carries no name a person could read, so the wording is the popup's own. A code
// missing from this table leaves its group without a caption and its records in place: the server may
// declare a fifth set before the popup learns of it.
export const TOOL_SET_TITLE_KEY: Readonly<Record<string, string>> = Object.freeze({
	bi_dashboards: 'BICONNECTOR_AGENT_CONNECTION_TOOL_SET_BI_DASHBOARDS',
	bi_charts: 'BICONNECTOR_AGENT_CONNECTION_TOOL_SET_BI_CHARTS',
	bi_datasets: 'BICONNECTOR_AGENT_CONNECTION_TOOL_SET_BI_DATASETS',
	bi_tables: 'BICONNECTOR_AGENT_CONNECTION_TOOL_SET_BI_TABLES',
});

// Where the text of a refusal came from. The ready server text is encoded by the common contract of the
// module already and reaches the DOM as prepared markup, a phrase of the popup itself is written as text:
// the view needs that difference and never puts the two into one insertion.
export const RefusalTextSource = Object.freeze({
	Server: 'SERVER',
	Own: 'OWN',
});

export type RefusalTextSource = typeof RefusalTextSource[keyof typeof RefusalTextSource];

export type RefusalText = {
	source: RefusalTextSource,
	value: string,
};

// What the popup shows of a refusal. Both fields are decided by the scenarios - which text stands and
// whether a retry is offered - and the view only draws them.
export type RefusalDisplay = {
	text: RefusalText | null,
	canRetry: boolean,
};

// The data of the last successful answer the view is allowed to draw. The secret lives here too: the
// scenarios hand this snapshot out, the view only reads it, and the node it was drawn into dies with the
// closing of the popup. Both dates come as ATOM strings with the offset of the server.
export type ConnectionSnapshot = {
	command: string | null,
	scopeNames: string[],
	issuedAt: string | null,
	expiresAt: string | null,
};

// The transport hands the parsed core envelope up as is: whether this is a success or a refusal
// is decided by the refusal classification and the state model, not by the transport.
export type ConnectionResponse = {
	status: string,
	data: { [field: string]: unknown } | null,
	errors: { code: string, [field: string]: unknown }[],
};

export type ConnectionTransport = {
	getState(): Promise<ConnectionResponse>,
	issue(): Promise<ConnectionResponse>,
	reissue(): Promise<ConnectionResponse>,
};
