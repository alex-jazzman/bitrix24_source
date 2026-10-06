import { Loc } from 'main.core';
import { openCollectionPicker } from 'note.ui.collection-picker';

export type OrphanRestorePopupResult = {
	collectionId: number,
	collectionTitle: string,
} | null;

export type OrphanRestorePopupOptions = {
	documentTitle?: string,
	// Overrides the per-document body text (used by the bulk restore flow where a subset has orphans).
	bodyText?: string,
};

export function openOrphanRestorePopup(options: OrphanRestorePopupOptions = {}): Promise<OrphanRestorePopupResult>
{
	const documentTitle = String(options?.documentTitle || '');
	const bodyOverride = String(options?.bodyText || '');

	return openCollectionPicker({
		title: Loc.getMessage('NOTE_RECYCLEBIN_ORPHAN_POPUP_TITLE') || '',
		description: bodyOverride || buildBodyText(documentTitle),
		placeholder: Loc.getMessage('NOTE_RECYCLEBIN_ORPHAN_POPUP_PLACEHOLDER') || '',
		primaryLabel: Loc.getMessage('NOTE_RECYCLEBIN_PAGE_RESTORE') || '',
		cancelLabel: Loc.getMessage('NOTE_RECYCLEBIN_PAGE_CONFIRM_CANCEL') || '',
	});
}

function buildBodyText(documentTitle: string): string
{
	return (Loc.getMessage('NOTE_RECYCLEBIN_ORPHAN_POPUP_TEXT') || '')
		.replace('#DOCUMENT#', documentTitle)
	;
}
