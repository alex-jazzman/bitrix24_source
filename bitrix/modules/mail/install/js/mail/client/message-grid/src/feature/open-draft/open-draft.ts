import { ScreenListManagerPath } from '../../const';
import { resolveGlobal } from '../../lib/global/global';

type ScreenListManager = {
	openDraft(draftId: number): void,
};

/**
 * Opens the draft in the slider of the compose form. The screen owns the address of that form, and
 * it is the screen the server addresses the actions of the row to (`DraftRowBuilder.php`).
 */
export function openDraft(draftId: number): void
{
	resolveGlobal<ScreenListManager>(ScreenListManagerPath)?.openDraft(draftId);
}
