import type OnlyOffice from "./onlyoffice";
import type { PresenceConfig } from 'disk.document-header';
import type { EditorWarning, FailureEvent } from './save-adapter';

export type WaitingOptions = {
	targetNode: HTMLElement,
	documentSession: DocumentSession,
	object: BaseObject,
	unifiedLinkMode: boolean,
};

export type CommonWarningOptions = {
	container: HTMLElement,
	targetNode: HTMLElement,
	title: string,
	fileName: string,
	description: string,
	linkToDownload: string,
	downloadSizeValue: string;
};

export type EditorOptions = {
	targetNode: HTMLElement,
	saveButtonNode: HTMLElement,
	cancelButtonNode: HTMLElement,
	editorNode: HTMLElement,
	headerContainerNode: ?HTMLElement,
	currentUser: User,
	editorWrapper: HTMLElement,
	documentSession: DocumentSession,
	linkToEdit: string,
	linkToView: string,
	linkToDownload: string,
	object: BaseObject,
	attachedObject: AttachedObject,
	editorJson: any,
	pullConfig: any,
	logoUrl: ?string,
	// the composition of the header, described by the server together with this page
	headerComposition: ?Object,
	sessionBoostOptions: ?SessionBoostOptions,
	promoShowImmediately: ?boolean,
	// the live roster of the header, as the server described it for this opening
	presenceConfig: ?PresenceConfig,
};

// The one-time automatic show of the widget of the boosts, as the component counts it.
export type SessionBoostOptions = {
	shouldShowButtonWidgetInstantly: boolean,
	optionParamsToControlButtonWidgetDisplay: {
		category: string,
		name: string,
	},
};

export type EditorWarningEvent = {
	data: ?EditorWarning,
}

/**
 * The warning of the editor the adapter reads, the failure of saving it tells the page about and the
 * moment the editor takes that failure back.
 */
export type { EditorWarning, FailureEvent };

export type Context = {
	currentUser: User,
	documentSession: DocumentSession,
	object: BaseObject,
	attachedObject: AttachedObject,
}

export type DocumentSession = {
	id: number,
	hash: string,
}

export type DocumentSessionInfo = {
	contentStatus: ?number,
	wasFinallySaved: boolean,
	// `Save\FailureCategory` of the module: what went wrong on the portal side, `null` on a write
	failureCategory: ?string,
}

/** EVENT-02: the outcome of a save asked for inside the session, Ctrl+S of the editor. */
export type IntermediateSaveInfo = {
	contentStatus: ?number,
	wasWritten: boolean,
	failureCategory: ?string,
}

export type BaseObject = {
	id: number,
	name: string,
	size: ?number,
	updatedBy: ?number,
	uniqueCode: ?string,
	docType: ?string,
}

export type AttachedObject = {
	id: ?number,
}

export type CommandOptions = {
	context: Context,
	onlyOffice: OnlyOffice,
}

export type User = {
	id: number,
	name: string,
	avatar: string,
	infoToken: string,
	onlineAt: ?number,
}

export type DocumentSavedMessage = {
	documentSession: DocumentSession,
	// the signal to the participants of the document comes by the same command and carries no report
	documentSessionInfo: ?DocumentSessionInfo,
	event: string,
}

export type IntermediateSaveMessage = {
	object: BaseObject,
	documentSession: DocumentSession,
	saveInfo: IntermediateSaveInfo,
}

export type ContentUpdatedMessage = {
	object: BaseObject,
	updatedBy: {
		infoToken: string,
	},
}