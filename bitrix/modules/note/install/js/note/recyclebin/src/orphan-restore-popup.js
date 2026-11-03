import { Loc, Type } from 'main.core';
import { openCollectionPicker } from 'note.ui.collection-picker';

export type OrphanRestorePopupResult = {
	collectionId: number,
	collectionTitle: string,
} | null;

export type OrphanRestorePopupOptions = {
	documentTitle?: string,
	// Overrides the per-document body text (used by the bulk restore flow where a subset has orphans).
	bodyText?: string,
	canCreateCollection?: boolean,
	onCreateCollection?: (name: string) => Promise<{ id: number, title: string } | null>,
};

export function openOrphanRestorePopup(options: OrphanRestorePopupOptions = {}): Promise<OrphanRestorePopupResult>
{
	const documentTitle = String(options?.documentTitle || '');
	const bodyOverride = String(options?.bodyText || '');
	const onCreateCollection = Type.isFunction(options?.onCreateCollection) ? options.onCreateCollection : null;
	const canCreateCollection = Boolean(options?.canCreateCollection && onCreateCollection);

	return openCollectionPicker({
		title: Loc.getMessage('NOTE_RECYCLEBIN_ORPHAN_POPUP_TITLE') || '',
		description: bodyOverride || buildBodyText(documentTitle),
		placeholder: Loc.getMessage('NOTE_RECYCLEBIN_ORPHAN_POPUP_PLACEHOLDER') || '',
		primaryLabel: Loc.getMessage('NOTE_RECYCLEBIN_PAGE_RESTORE') || '',
		cancelLabel: Loc.getMessage('NOTE_RECYCLEBIN_PAGE_CONFIRM_CANCEL') || '',
		accessLevel: 'manage',
		canCreateCollection,
		createFooterLabel: Loc.getMessage('NOTE_SIDEBAR_PICK_COLLECTION_FOOTER_CREATE') || '',
		onCreateCollection,
		confirmAfterCreate: true,
	});
}

function buildBodyText(documentTitle: string): string
{
	return (Loc.getMessage('NOTE_RECYCLEBIN_ORPHAN_POPUP_TEXT_MSGVER_1') || '')
		.replace('#DOCUMENT#', documentTitle)
	;
}
