// Flow type surface for the vibeoffice editor wrapper.
//
// Mirrors the canonical TPL-VOEDITOR option block (SDD) as it is actually emitted by
// the P1 template `disk.file.editor-vibeoffice/templates/.default/template.php`.

export type DocumentSession = {
	id: number,
	hash: string,
};

export type BaseObject = {
	id: number,
	name: string,
	size: ?number,
	uniqueCode: ?string,
	docType: ?string,
};

export type AttachedObject = {
	id: ?number,
};

export type CurrentUser = {
	id: number,
	name: string,
	avatar: ?string,
	infoToken: ?string,
};

export type PanelButtonUniqIds = {
	edit: ?string,
	setupSharing: ?string,
};

export type PresenceParticipant = {
	id: number,
	name: string,
	avatar: ?string,
};

export type PresenceRoster = {
	scope: string,
	revision: number,
	participants: PresenceParticipant[],
};

export type PresenceActions = {
	enter: string,
	heartbeat: string,
	leave: string,
};

// Presence is opt-in. A disabled response contains only `enabled: false`; the remaining
// fields are emitted only for an authenticated internal editor session.
export type PresenceConfig = {
	enabled: boolean,
	presenceContext?: string,
	heartbeatInterval?: number,
	actions?: PresenceActions,
	pullConfig?: Object,
	moduleId?: string,
	command?: string,
	scope?: string,
};

// The open-config (DTO-EDITORCONFIG) is proxied verbatim from the platform and fed to
// `createEditor({ openConfig })` as-is. The wrapper never reshapes or re-signs it.
export type OpenConfig = {
	doc_id: string,
	host_doc_key: string,
	joined: boolean,
	editor_key: string,
	rev: number,
	session_id: string,
	session_expires_at: string,
	vo_sess: string,
	urls: {
		api_js: string,
		events: string,
		refresh: string,
	},
	config: Object,
};

export type EditorOptions = {
	openConfig: OpenConfig,
	// `element` is the id of the placeholder div (api.js contract). The template passes a
	// node here; the wrapper resolves it to an id string for the helper.
	element: HTMLElement | string,
	targetNode: HTMLElement,
	editorNode: HTMLElement,
	userBoxNode: HTMLElement,
	documentSession: DocumentSession,
	object: BaseObject,
	attachedObject: AttachedObject,
	currentUser: CurrentUser,
	panelButtonUniqIds: ?PanelButtonUniqIds,
	linkToEdit: ?string,
	linkToView: ?string,
	linkToDownload: ?string,
	historyEnabled: ?boolean,
	texts: ?Object,
	// Existing Disk object pull channel (object_{id}); used only to receive the live
	// `contentUpdated` host notification for an already-open VIEW (mirrors OnlyOffice).
	pullConfig: ?Object,
	publicChannel: ?string,
	presenceConfig: ?PresenceConfig,
};

// `contentUpdated` server command on the object pull channel. Emitted host-side by
// File::uploadVersion() and consumed only to refresh an open VIEW.
export type ContentUpdatedMessage = {
	object: {
		id: number,
		name: ?string,
		updatedBy: ?number,
	},
	updatedBy: ?{
		infoToken: ?string,
	},
};

// Public facade returned by `@vibeoffice/helper createEditor`. Kept structural so the
// vendored UMD and any future ESM build both satisfy it.
export type VibeOfficeEditor = {
	state: string,
	editorKey: string,
	instance: ?Object,
	on: (event: string, fn: Function) => () => void,
	destroy: () => void,
};

export type CreateEditor = (opts: {
	element: string,
	openConfig: OpenConfig,
	documentServerEvents?: Object,
	timeouts?: Object,
}) => Promise<VibeOfficeEditor>;
