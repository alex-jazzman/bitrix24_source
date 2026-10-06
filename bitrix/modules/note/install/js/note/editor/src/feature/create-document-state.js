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
		isMain: false,
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
		// Id of the document the server refused a collaborative baseline for: an out-of-band REST
		// overwrite demoted it to plain markdown, and it will never be collaborative again. Held as an
		// id rather than a flag so it cannot travel with the user to the next document opened, and so
		// reopening the same document does not pay for a request that is bound to be refused.
		collaborationUnavailableDocumentId: 0,
		// Id of the document whose attempt to stand up collaborative editing has ENDED leaving no
		// provider behind, which means it has no path that persists text - why that follows, and why the
		// test is the provider and not the indicator, is in #settleCollaborationOutcome. Editing stays
		// open on such a document so the text can be read and copied out; what closes is saving.
		// Distinct from collaborationUnavailableDocumentId, which states a rule of the document itself:
		// this one describes this tab and clears the moment a provider appears.
		collaborationSettledWithoutProviderDocumentId: 0,
		readOnly: false,
		currentUser: {},
		participants: [],
		mode: 'view',
		isLoading: true,
		isSaving: false,
		loadRequestId: 0,
		// [#6] Initial "who viewed" snapshot bundled with the document bootstrap — handed down
		// to ViewsWidgetComponent so it can skip its own getViews call on mount (see type.js's
		// DocumentViewsSnapshot).
		initialViews: null,
		// [DTO-01] Backlinks counter bundled with the document bootstrap — handed down to
		// BacklinksWidgetComponent so it can skip its own count request on mount (see type.js's
		// DocumentBacklinksSnapshot).
		initialBacklinks: null,
		// [#2] `{ authors, time } | null` — last content-change snapshot bundled with the
		// document bootstrap, handed down to ActivityLineComponent's chip (see type.js's
		// DocumentLastChange).
		lastChange: null,
		// [P8.T5] ISO-8601 creation timestamp from the bootstrap payload — the activity-line chip
		// falls back to "Created <date>" when there is no last-change info to show.
		createdAt: null,
		// Bell state bundled with the document bootstrap, handed down to SubscriptionBellComponent
		// so it skips its own getState request on mount.
		initialSubscription: null,
		// [TPL-01] "In favorites" flag bundled with the document bootstrap, handed down to the
		// activity-line star. `null` means the bootstrap reported nothing, so the star keeps reading
		// the sidebar store alone.
		initialFavorite: null,
	};
}
