import { Loc } from 'main.core';

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
		delete: msg('NOTE_SIDEBAR_DELETE'),
		confirmDeleteCollection: msg('NOTE_SIDEBAR_CONFIRM_DELETE_COLLECTION'),
		confirmDeleteCollectionTitle: msg('NOTE_SIDEBAR_CONFIRM_DELETE_COLLECTION_TITLE'),
		confirmDeleteDocument: msg('NOTE_SIDEBAR_CONFIRM_DELETE_DOCUMENT'),
		confirmDeleteDocumentTitle: msg('NOTE_SIDEBAR_CONFIRM_DELETE_DOCUMENT_TITLE'),
		promptCollectionName: msg('NOTE_SIDEBAR_PROMPT_COLLECTION_NAME'),
		promptDocumentName: msg('NOTE_SIDEBAR_PROMPT_DOCUMENT_NAME'),
		errorGeneric: msg('NOTE_SIDEBAR_ERROR_GENERIC'),
		errorDocumentNotFound: msg('NOTE_SIDEBAR_ERROR_DOCUMENT_NOT_FOUND'),
		openPermissions: msg('NOTE_SIDEBAR_OPEN_PERMISSIONS'),
		sharedWithMe: msg('NOTE_SIDEBAR_SHARED_WITH_ME'),
		archive: msg('NOTE_SIDEBAR_ARCHIVE'),
		recycleBin: msg('NOTE_SIDEBAR_RECYCLE_BIN'),
		expandCollections: msg('NOTE_SIDEBAR_COLLECTIONS_EXPAND'),
		collapseCollections: msg('NOTE_SIDEBAR_COLLECTIONS_COLLAPSE'),
	};
}
