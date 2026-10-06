import { Dom } from 'main.core';

/** `ui.dialogs.messagebox` carries no types, so the used calls are declared here. */
type MessageBoxApi = {
	getPopupWindow(): { getPopupContainer(): HTMLElement },
	getOkButton(): { getContainer(): HTMLElement },
	getCancelButton(): { getContainer(): HTMLElement },
};

export type MessageBoxTestIds = {
	dialog: string,
	ok?: string,
	cancel?: string,
};

/**
 * `ui.dialogs.messagebox` builds its window and its buttons itself and forwards no `dataset` to either, so
 * the marks are put on from this side, on the nodes it hands over. Without them a test reaches the dialog by
 * its text or by the internal classes of the design system.
 *
 * Called before `show()`: the nodes exist from the moment the box is created, and the popup renders these
 * very ones.
 */
export function markMessageBox(box: MessageBoxApi, testIds: MessageBoxTestIds): void
{
	Dom.attr(box.getPopupWindow().getPopupContainer(), 'data-testid', testIds.dialog);

	if (testIds.ok)
	{
		Dom.attr(box.getOkButton().getContainer(), 'data-testid', testIds.ok);
	}

	if (testIds.cancel)
	{
		Dom.attr(box.getCancelButton().getContainer(), 'data-testid', testIds.cancel);
	}
}
