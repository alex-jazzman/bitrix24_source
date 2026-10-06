import { Loc } from 'main.core';
import { openCollectionPicker } from 'note.ui.collection-picker';

export type MoveDocumentsPopupResult = {
	collectionId: number,
	parentId: null,
} | null;

// Q-1 default: only the target collection is chosen; documents land at the collection root (parentId=null).
// Resolves null on cancel/close; the page keeps the current selection on null (ERR-004).
export function openMoveDocumentsPopup(): Promise<MoveDocumentsPopupResult>
{
	return openCollectionPicker({
		title: Loc.getMessage('NOTE_WORKSPACE_BULK_MOVE_TITLE') || '',
		description: Loc.getMessage('NOTE_WORKSPACE_BULK_MOVE_TEXT') || '',
		placeholder: Loc.getMessage('NOTE_WORKSPACE_BULK_MOVE_PLACEHOLDER') || '',
		primaryLabel: Loc.getMessage('NOTE_WORKSPACE_BULK_MOVE_PRIMARY') || '',
		cancelLabel: Loc.getMessage('NOTE_WORKSPACE_BULK_CANCEL') || '',
	}).then((result) => {
		if (!result)
		{
			return null;
		}

		return { collectionId: result.collectionId, parentId: null };
	});
}
