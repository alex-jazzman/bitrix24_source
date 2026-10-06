import { Event, Type } from 'main.core';
import { FocusNavigator } from 'ui.a11y';
import { MessageBox, MessageBoxButtons } from 'ui.dialogs.messagebox';
import 'sidepanel';

export type ConfirmDialogTexts = {
	title: string,
	description: string,
	confirmCaption: string,
	cancelCaption: string,
};

// onClose runs on any way out of the dialog — cancel button, Esc, click outside and the confirmed
// exit as well, so it fits resetting a flag rather than an undo of the confirmed action
export function showConfirmDialog(texts: ConfirmDialogTexts, onConfirm: Function, onClose: ?Function): void
{
	const initiator = document.activeElement;

	const messageBox = MessageBox.create({
		message: texts.description,
		title: texts.title,
		okCaption: texts.confirmCaption,
		cancelCaption: texts.cancelCaption,
		onOk: onConfirm,
		// no onCancel here on purpose: the cancel button without a callback just closes the
		// popup, and the caller gets its single call from the onClose subscription below,
		// which also covers Esc and a click outside
		buttons: MessageBoxButtons.OK_CANCEL,
		popupOptions: {
			// the portal accessibility settings can be off, so the option is passed explicitly
			focusTrap: {
				restoreFocus: () => resolveFocusTarget(
					initiator,
					messageBox.getPopupWindow().getPopupContainer(),
				),
			},
		},
	});
	messageBox.show();

	const popup = messageBox.getPopupWindow();

	// the slider closes on keydown while a popup closes on keyup: with Esc enabled right away the
	// keypress that opened this dialog would also close it. A listener bound during that keydown
	// is not called for it, so closing by Esc starts working from the next keypress.
	const enableClosingByEsc = () => {
		Event.unbind(document, 'keydown', enableClosingByEsc);
		if (!popup.isDestroyed())
		{
			popup.setClosingByEsc(true);
		}
	};
	Event.bind(document, 'keydown', enableClosingByEsc);

	popup.subscribe('onClose', () => {
		Event.unbind(document, 'keydown', enableClosingByEsc);
	});

	if (Type.isFunction(onClose))
	{
		popup.subscribe('onClose', onClose);
	}
}

function resolveFocusTarget(initiator: ?HTMLElement, dialogContainer: ?HTMLElement): ?HTMLElement
{
	if (initiator && initiator !== document.body && document.contains(initiator))
	{
		return initiator;
	}

	// the dialog can be opened by the slider close button, then the initiator lives in the top document
	const slider = BX.SidePanel.Instance.getSliderByWindow(window);
	if (slider)
	{
		return slider.getLabel().getContainer();
	}

	// the dialog can also be shown outside a slider: without a fallback the keyboard user would be
	// left with no focus at all. Nodes of the closing dialog itself are not an option
	const fallback = FocusNavigator.getFirst(document.body);

	return fallback && dialogContainer?.contains(fallback) !== true ? fallback : null;
}
