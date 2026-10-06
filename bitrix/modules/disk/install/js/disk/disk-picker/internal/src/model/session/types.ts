import {
	type StageTypeValue,
	type ObjectTypeFilterValue,
	type FileTypeFilterValue,
	type SelectionModeValue,
} from '../../const/types';

// Immutable snapshot of the caller's constraints, captured once per session.
// Every request and every feature reads only this snapshot, never the original
// signedConfig/allowedFileTypes reference.
export type PickerConstraints = {
	signedConfig: object | null,
	allowedFileTypes: string[],
	initialStage: {
		type: StageTypeValue,
		storageId: number | null,
		folderId: number | null,
	} | null,
	selectionMode: SelectionModeValue,
	maxItems: number | null,
};

// A single result item handed to the caller (DTO-04). The internal app builds it
// and passes it out through the lifecycle callback; the public facade defines the
// callback signature at mount and never shares its own types with the internal.
export type PickerSelectionItem = {
	objectId: number,
	name: string,
	size: number,
	extension: string | null,
	fileType: string,
	previewUrl: string | null,
	sourceTitle: string,
	parentFolderName: string,
	editorFileType: string | null,
};

export type PickerSelectionResult = {
	items: PickerSelectionItem[],
};

// Session-scoped callbacks bridging internal features to the public facade and
// the standard filter component. Held non-reactive in the session store.
export type SessionCallbacks = {
	// Clears the standard filter's FIND with its own apply event suppressed, so a
	// navigation feed change fires exactly one request. Owned by the filter adapter.
	suppressFilterFind: () => void,
	// Resets the standard filter (query and both filters) through its own apply
	// pipeline, so the empty-state "reset filters" action stays in sync.
	resetFilters: () => void,
	onContextInvalid: () => void,
	notify: (messageCode: string, replacements?: { [key: string]: string }) => void,
	// Delivers the confirmed selection out to the facade, which closes the window.
	emitSelection: (result: PickerSelectionResult) => void,
	// Requests a plain cancel-close (the footer Cancel button).
	requestCancel: () => void,
};

// A feed is the identity of the main output: (stage type, storage, folder).
// Search query, filters and view mode do NOT change the feed.
export type PickerFeed = {
	stageType: StageTypeValue,
	storageId: number | null,
	folderId: number | null,
};

export type SessionFilters = {
	objectTypeFilter: ObjectTypeFilterValue,
	fileTypeFilters: FileTypeFilterValue[],
};

// One breadcrumb shown in the header. The current folder is appended to the
// server ancestors for display, so its `objectId` is the current folder id.
export type DisplayBreadcrumb = {
	objectId: number,
	name: string,
};

export type CurrentFolder = {
	folderId: number,
	name: string,
};

// Client navigation context, mirroring DTO-07. `currentFolder` is null outside a
// folder stage (recent / sources).
export type NavigationContext = {
	storageId: number | null,
	folderId: number | null,
	currentFolder: CurrentFolder | null,
	breadcrumbs: DisplayBreadcrumb[],
};
