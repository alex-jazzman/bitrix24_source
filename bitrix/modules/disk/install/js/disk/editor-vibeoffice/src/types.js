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
	restartTarget: ?string,
	openingBudget: ?{ version: number, totalMs: number, remainingMs: number },
	// `element` is the id of the placeholder div (api.js contract). The template passes a
	// node here; the wrapper resolves it to an id string for the helper.
	element: HTMLElement | string,
	targetNode: HTMLElement,
	editorNode: HTMLElement,
	// the description of the opening, made by the server together with this page: the wrapper answers
	// the requests of the editor for the access settings and for the rename by it
	headerComposition: ?Object,
	documentSession: DocumentSession,
	object: BaseObject,
	attachedObject: AttachedObject,
	currentUser: CurrentUser,
	linkToView: ?string,
	linkToDownload: ?string,
	// absent when the opening carries no transition to editing
	linkToEdit: ?string,
	historyEnabled: ?boolean,
	externalLinkMode: ?boolean,
	initialNotice: ?boolean,
	texts: ?Object,
	// Existing Disk object pull channel for viewer updates and exact editor conflict facts.
	pullConfig: ?Object,
	publicChannel: ?string,
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

export type ConflictMessage = {
	object: { id: number },
	event: string,
	documentSessionIds: Array<number>,
};

export type EditorUser = {
	id: string,
	name: string,
};

export type CurrentUserAvatar = {
	id: string,
	image: ?string,
};

export type NativeEditorInstance = {
	setUsers?: (options: { c: 'info', users: Array<EditorUser & { image: string }> }) => void,
};

// Public facade returned by `@vibeoffice/helper createEditor`. Kept structural so the
// vendored UMD and any future ESM build both satisfy it.
export type VibeOfficeEditor = {
	state: string,
	editorKey: string,
	instance: ?NativeEditorInstance,
	on: (event: string, fn: Function) => () => void,
	destroy: () => void,
};

export type CreateEditor = (opts: {
	element: string,
	openConfig: OpenConfig,
	documentServerEvents?: Object,
	onFirstLoadProgress?: (progress: { waitCode?: string, stage?: string, attempt?: number }) => void,
	signal?: AbortSignal,
	firstLoadContext?: { version: number, remainingMs: number, helperRemainingMs: number },
	timeouts?: Object,
}) => Promise<VibeOfficeEditor>;
