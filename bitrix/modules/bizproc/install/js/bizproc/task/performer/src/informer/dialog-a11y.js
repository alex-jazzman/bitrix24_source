import { Dom, Loc, Type } from 'main.core';
import { PopupManager } from 'main.popup';
import { setupDialog, type DialogHandle } from 'bizproc.a11y';

/**
 * The cross of the layout inside the popup of the dialog. There is no accessor for it either, so it is
 * reached by the region it lives in: a heading region a dialog has to have, and not a class name of
 * the design system, which may be renamed without notice.
 */
const DIALOG_CLOSE_BUTTON_SELECTOR = 'header button';

export type DialogA11yHandle = DialogHandle;

export type DialogA11yOptions = {
	label: string,
	testId?: string,
	closeTestId?: string,
};

/**
 * Makes a dialog of the design system keyboard-manageable and announced as a dialog through the
 * accessibility layer of the module - the way every surface of this layer needs it. The focus has to
 * stay inside the whole popup, its header and footer included, and not only inside the content we
 * built, so the popup itself is what all of this is put on.
 *
 * The popup is also where the test marker of the surface goes: the buttons of the layout live outside
 * the content we built, so a test reaches them by the whole popup and not by the content.
 *
 * @param options.testId The test marker for the surface as a whole.
 * @param options.closeTestId The test marker for the cross of the layout, when the dialog has one.
 */
export function setupDialogA11y(content: HTMLElement, options: DialogA11yOptions): ?DialogA11yHandle
{
	const container = findPopupContainer(content);

	if (container === null)
	{
		// without the popup the surface loses its focus trap, its name for a screen reader and the
		// markers a test reaches it by - all three at once and none of it visible on the screen
		console.error(
			'bizproc.task.performer: the popup of the dialog was not found, the dialog stays unmanageable '
			+ 'from the keyboard',
			content,
		);

		return null;
	}

	if (Type.isStringFilled(options.testId))
	{
		Dom.attr(container, 'data-testid', options.testId);
	}

	prepareCloseButton(container, options.closeTestId);

	return setupDialog(container, { label: options.label });
}

/**
 * The popup the dialog was drawn in. The dialog of the design system gives no accessor for its own
 * popup, so it is asked of the manager of popups - the public register of them: the popup whose
 * container holds our content is the popup of our dialog.
 */
function findPopupContainer(content: HTMLElement): ?HTMLElement
{
	const popup = PopupManager
		.getPopups()
		.find((item) => popupContainer(item)?.contains(content) === true)
	;

	return popup ? popupContainer(popup) : null;
}

function popupContainer(popup: ?Object): ?HTMLElement
{
	const container = Type.isFunction(popup?.getPopupContainer) ? popup.getPopupContainer() : null;

	return Type.isDomNode(container) ? container : null;
}

/**
 * The dialog renders its cross as an icon-only button and leaves it unnamed, while the title makes
 * that cross a stop of the Tab order. An existing name is left alone: naming the cross belongs to the
 * component, and once it does so its own label wins.
 *
 * The cross comes from the component too, so its test marker is set from here as well - it is the
 * only control of the layout that leaves the question unanswered.
 */
function prepareCloseButton(container: HTMLElement, testId: ?string): void
{
	const closeButton = container.querySelector(DIALOG_CLOSE_BUTTON_SELECTOR);

	if (!closeButton)
	{
		// a marker is asked for only by a surface whose layout has a cross, so a cross asked for and not
		// found is the markup of the dialog having changed under us
		if (Type.isStringFilled(testId))
		{
			console.error(
				'bizproc.task.performer: the close button of the dialog was not found, it stays unnamed',
				container,
			);
		}

		return;
	}

	if (Type.isStringFilled(testId))
	{
		Dom.attr(closeButton, 'data-testid', testId);
	}

	if (!Type.isStringFilled(Dom.attr(closeButton, 'aria-label')))
	{
		Dom.attr(closeButton, 'aria-label', Loc.getMessage('UI_BUTTONS_CLOSE_BTN_TEXT'));
	}
}
