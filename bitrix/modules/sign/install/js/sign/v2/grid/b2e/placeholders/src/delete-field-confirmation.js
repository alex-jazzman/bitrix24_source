import { Loc, Runtime, Tag, Text } from 'main.core';
import { AirButtonStyle, Button, ButtonSize } from 'ui.buttons';
import { UI } from 'ui.notification';
import { LiveAnnouncer } from 'ui.a11y';

const DIALOG_WIDTH = 400;
const DIALOG_EXTENSION = 'ui.system.dialog';
const NOTIFICATION_HIDE_DELAY = 4000;
// Every deletion asks for the same extension, so the toasts of the refusals replace one another.
const UNAVAILABLE_NOTIFICATION_ID = 'sign-placeholders-delete-unavailable';

/** The zone of the deletion stays live while the extension is on its way, and it waits for nobody. */
let isOpening = false;

export type DeleteFieldConfirmationOptions = {
	fieldName: string,
	onConfirm: () => Promise<void>,
};

/**
 * The dialog of the design system is asked for by the confirmation alone, while the panel itself comes
 * with the page of the documents: the extension arrives on the first deletion instead of the first
 * render of the page.
 */
const loadDialogClass = async (): Promise<?Function> => {
	try
	{
		const { Dialog } = await Runtime.loadExtension(DIALOG_EXTENSION);

		return Dialog;
	}
	catch
	{
		return null;
	}
};

/**
 * A refused load leaves the cross of the row without any answer at all, so the refusal is told to the
 * user: the extension arrives on the first deletion, and a click is what asked for it.
 */
const reportUnavailableDialog = (): void => {
	const message = Loc.getMessage('PLACEHOLDER_LIST_DELETE_FIELD_UNAVAILABLE_NOTIFICATION');

	UI.Notification.Center.notify({
		id: UNAVAILABLE_NOTIFICATION_ID,
		content: message,
		autoHideDelay: NOTIFICATION_HIDE_DELAY,
	});
	LiveAnnouncer.announce(message, 'assertive');
};

/**
 * Confirmation of the deletion of a user field. The dialog names the field being deleted and waits on
 * the confirm button while the request runs: a refusal of the server keeps the dialog open and speaks
 * for itself through the common error toast.
 */
export class DeleteFieldConfirmation
{
	#options: DeleteFieldConfirmationOptions;
	#dialogClass: Function;

	// A second click while the extension is on its way would build a second dialog over the first one,
	// and a confirmation in that one would delete a field that is already gone.
	static async show(options: DeleteFieldConfirmationOptions): Promise<void>
	{
		if (isOpening)
		{
			return;
		}

		isOpening = true;
		try
		{
			const dialogClass = await loadDialogClass();

			if (!dialogClass)
			{
				console.error(`The confirmation of the deletion of a field got no ${DIALOG_EXTENSION}.`);
				reportUnavailableDialog();

				return;
			}

			new DeleteFieldConfirmation(options, dialogClass).#show();
		}
		finally
		{
			isOpening = false;
		}
	}

	constructor(options: DeleteFieldConfirmationOptions, dialogClass: Function)
	{
		this.#options = options;
		this.#dialogClass = dialogClass;
	}

	/**
	 * A dialog per opening, never a kept one: `ui.system.dialog` builds its popup non-cacheable, so
	 * every way out - the buttons, Escape, the overlay, the cross - destroys it, and a second opening
	 * of the same instance would have nothing left to show.
	 */
	#show(): void
	{
		this.#createDialog().show();
	}

	#createDialog(): Object
	{
		const Dialog = this.#dialogClass;
		let dialog = null;
		const close = (): void => {
			dialog?.hide();
		};

		dialog = new Dialog({
			title: Loc.getMessage('PLACEHOLDER_LIST_DELETE_FIELD_TITLE'),
			content: this.#renderContent(),
			centerButtons: [this.#createConfirmButton(close), this.#createCancelButton(close)],
			width: DIALOG_WIDTH,
			hasOverlay: true,
			closeByEsc: true,
		});

		return dialog;
	}

	// The name of the field is written by a human, and the content of the dialog is a plain element.
	#renderContent(): HTMLElement
	{
		const message = Loc.getMessage('PLACEHOLDER_LIST_DELETE_FIELD_TEXT', {
			'#FIELD_NAME#': this.#options.fieldName,
		});

		return Tag.render`
			<div class="sign-placeholders-delete-confirmation" data-testid="sign-placeholder-delete-confirmation">
				${Text.encode(message)}
			</div>
		`;
	}

	#createConfirmButton(close: () => void): Button
	{
		return new Button({
			text: Loc.getMessage('PLACEHOLDER_LIST_DELETE_FIELD_CONFIRM'),
			useAirDesign: true,
			style: AirButtonStyle.FILLED_ALERT,
			size: ButtonSize.LARGE,
			dataset: {
				testid: 'sign-placeholder-delete-confirmation-confirm',
			},
			onclick: async (button: Button): Promise<void> => {
				button.setWaiting(true);
				try
				{
					await this.#options.onConfirm();
					close();
				}
				catch
				{
					button.setWaiting(false);
				}
			},
		});
	}

	#createCancelButton(close: () => void): Button
	{
		return new Button({
			text: Loc.getMessage('PLACEHOLDER_LIST_DELETE_FIELD_CANCEL'),
			useAirDesign: true,
			style: AirButtonStyle.PLAIN,
			size: ButtonSize.LARGE,
			dataset: {
				testid: 'sign-placeholder-delete-confirmation-cancel',
			},
			onclick: close,
		});
	}
}
