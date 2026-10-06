import { Loc } from 'main.core';
import { createHistoryMessages } from 'note.ui.document-history';

export function buildSidebarMessages()
{
	const msg = (code) => Loc.getMessage(code);

	return {
		brandName: msg('NOTE_SIDEBAR_BRAND_NAME'),
		brandSuffix: msg('NOTE_SIDEBAR_BRAND_SUFFIX'),
		knowledgeBase: msg('NOTE_SIDEBAR_KNOWLEDGE_BASE'),
		collections: msg('NOTE_SIDEBAR_COLLECTIONS'),
		documents: msg('NOTE_SIDEBAR_DOCUMENTS'),
		emptyCollections: msg('NOTE_SIDEBAR_EMPTY_COLLECTIONS'),
		emptyDocuments: msg('NOTE_SIDEBAR_EMPTY_DOCUMENTS'),
		createDocument: msg('NOTE_SIDEBAR_CREATE_DOCUMENT'),
		createChildDocument: msg('NOTE_SIDEBAR_CREATE_CHILD_DOCUMENT'),
		delete: msg('NOTE_SIDEBAR_DELETE'),
		deleteWithNested: msg('NOTE_SIDEBAR_DELETE_WITH_NESTED'),
		confirmDeleteCollection: msg('NOTE_SIDEBAR_CONFIRM_DELETE_COLLECTION'),
		confirmDeleteCollectionTitle: msg('NOTE_SIDEBAR_CONFIRM_DELETE_COLLECTION_TITLE'),
		confirmDeleteDocument: msg('NOTE_SIDEBAR_CONFIRM_DELETE_DOCUMENT'),
		confirmDeleteDocumentTitle: msg('NOTE_SIDEBAR_CONFIRM_DELETE_DOCUMENT_TITLE'),
		archiveConfirm: msg('NOTE_APP_ARCHIVE'),
		archiveWithNested: msg('NOTE_SIDEBAR_ARCHIVE_WITH_NESTED'),
		confirmArchiveDocument: msg('NOTE_APP_CONFIRM_ARCHIVE_DOCUMENT'),
		confirmArchiveDocumentTitle: msg('NOTE_APP_CONFIRM_ARCHIVE_DOCUMENT_TITLE'),
		promptCollectionName: msg('NOTE_SIDEBAR_PROMPT_COLLECTION_NAME'),
		promptDocumentName: msg('NOTE_SIDEBAR_PROMPT_DOCUMENT_NAME'),
		errorGeneric: msg('NOTE_SIDEBAR_ERROR_GENERIC'),
		moveAccessEscalation: msg('NOTE_SIDEBAR_MOVE_ACCESS_ESCALATION'),
		errorDocumentNotFound: msg('NOTE_SIDEBAR_ERROR_DOCUMENT_NOT_FOUND'),
		openPermissions: msg('NOTE_SIDEBAR_OPEN_PERMISSIONS'),
		sharedWithMe: msg('NOTE_SIDEBAR_SHARED_WITH_ME'),
		expandShared: msg('NOTE_SIDEBAR_SHARED_EXPAND'),
		collapseShared: msg('NOTE_SIDEBAR_SHARED_COLLAPSE'),
		expandSharedContainer: msg('NOTE_SIDEBAR_SHARED_CONTAINER_EXPAND'),
		collapseSharedContainer: msg('NOTE_SIDEBAR_SHARED_CONTAINER_COLLAPSE'),
		emptyShared: msg('NOTE_SIDEBAR_SHARED_EMPTY'),
		archive: msg('NOTE_SIDEBAR_ARCHIVE'),
		recycleBin: msg('NOTE_SIDEBAR_RECYCLE_BIN'),
		search: msg('NOTE_SIDEBAR_SEARCH_PLACEHOLDER'),
		favorites: msg('NOTE_SIDEBAR_FAVORITES'),
		favoriteOn: msg('NOTE_SIDEBAR_FAVORITE_ON'),
		favoriteOff: msg('NOTE_SIDEBAR_FAVORITE_OFF'),
		// Name of the star, the one it keeps in both states: what the press does is in its tooltip, what
		// the row is now is in aria-pressed.
		favoriteState: msg('NOTE_SIDEBAR_FAVORITE_STATE'),
		notifyOn: msg('NOTE_SIDEBAR_NOTIFY_ON'),
		notifyOff: msg('NOTE_SIDEBAR_NOTIFY_OFF'),
		// Name of the bell, the one it keeps whatever the state: what the press does is in its tooltip.
		notifyState: msg('NOTE_SIDEBAR_NOTIFY_STATE'),
		favoritesShowNotified: msg('NOTE_SIDEBAR_FAVORITES_SHOW_NOTIFIED'),
		favoritesShowAll: msg('NOTE_SIDEBAR_FAVORITES_SHOW_ALL'),
		favoritesEmptyNotified: msg('NOTE_SIDEBAR_FAVORITES_EMPTY_NOTIFIED'),
		favoritesLoadError: msg('NOTE_SIDEBAR_FAVORITES_LOAD_ERROR'),
		favoritesRetry: msg('NOTE_SIDEBAR_FAVORITES_RETRY'),
		favoritesBranchError: msg('NOTE_SIDEBAR_FAVORITES_BRANCH_ERROR'),
		favoriteExpand: msg('NOTE_SIDEBAR_FAVORITE_EXPAND'),
		favoriteCollapse: msg('NOTE_SIDEBAR_FAVORITE_COLLAPSE'),
		favoriteAddFailed: msg('NOTE_SIDEBAR_FAVORITE_ADD_FAILED'),
		favoriteRemoveFailed: msg('NOTE_SIDEBAR_FAVORITE_REMOVE_FAILED'),
		favoriteMoveFailed: msg('NOTE_SIDEBAR_FAVORITE_MOVE_FAILED'),
		favoriteNotifyFailed: msg('NOTE_SIDEBAR_FAVORITE_NOTIFY_FAILED'),
		// [P4.T1] Wording of the depth chooser, taken from the extension that owns the popover - the
		// same phrases the bell of the editor shows, not a second copy of them.
		notifyPopover: createHistoryMessages(),
		expandCollections: msg('NOTE_SIDEBAR_COLLECTIONS_EXPAND'),
		collapseCollections: msg('NOTE_SIDEBAR_COLLECTIONS_COLLAPSE'),
		fileDropWarningSkipped: msg('NOTE_SIDEBAR_FILE_DROP_WARNING_SKIPPED'),
		fileDropWarningNoMarkdown: msg('NOTE_SIDEBAR_FILE_DROP_WARNING_NO_MARKDOWN'),
		fileDropSummary: msg('NOTE_SIDEBAR_FILE_DROP_SUMMARY'),
		fileDropSummaryPartial: msg('NOTE_SIDEBAR_FILE_DROP_SUMMARY_PARTIAL'),
	};
}
