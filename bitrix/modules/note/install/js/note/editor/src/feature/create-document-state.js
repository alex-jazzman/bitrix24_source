import { Type } from 'main.core';

export function createEmptyDocument(): Object
{
	return {
		type: 'doc',
		content: [{ type: 'paragraph' }],
	};
}

export function cloneDocumentContent(value: Object | string): Object | string
{
	if (Type.isString(value))
	{
		return value;
	}

	return JSON.parse(JSON.stringify(value));
}

export function createDocumentState(): Object
{
	return {
		editorMountId: `note-app-document-editor-${Math.random().toString(16).slice(2)}`,
		title: '',
		titleDraft: '',
		collectionId: 0,
		collectionTitle: '',
		ancestors: [],
		canEdit: false,
		canEditCollection: false,
		canManagePermissions: false,
		isArchived: false,
		archivedAt: null,
		isTrashed: false,
		recycleBinId: null,
		trashedAt: null,
		isOrphan: false,
		canRestore: false,
		canHardDelete: false,
		sharedAccess: false,
		collaborationStatus: 'idle',
		readOnly: false,
		currentUser: {},
		mode: 'view',
		isLoading: true,
		isSaving: false,
		loadRequestId: 0,
	};
}
