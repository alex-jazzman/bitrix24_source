import { PopupManager, type Popup } from 'main.popup';

const POPUP_SELECTOR = '.popup-window';
const DIALOG_HEADER_SELECTOR = '.ui-system-dialog__header';

/**
 * A window that stays open while a person edits the scheme has to move off whatever it covers.
 * ui.system.dialog keeps its popup private and takes no draggable option, and the popup is reached by
 * the id its container carries. The handle is the header: the content below it stays scrollable and
 * selectable. The content has to be set and shown before this runs - a re-rendered header would be a
 * new element, and the handle would stay bound to the previous one.
 *
 * Answers with the popup it dressed, so a caller may go on dressing it.
 */
export function makeDialogDraggable(content: HTMLElement | null): Popup | null
{
	const container = content?.closest(POPUP_SELECTOR);
	const header = container?.querySelector(DIALOG_HEADER_SELECTOR);
	if (!header)
	{
		return null;
	}

	const popup = PopupManager.getPopupById(container.id) ?? null;
	popup?.setDraggable({ element: header, restrict: true });

	return popup;
}
