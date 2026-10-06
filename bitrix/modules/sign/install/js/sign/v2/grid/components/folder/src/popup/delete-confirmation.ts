import { Tag, Text } from 'main.core';
import {
	AirButtonStyle,
	Button,
	ButtonIcon,
	ButtonSize,
	type BaseButton,
} from 'ui.buttons';
import { MessageBox } from 'ui.dialogs.messagebox';

export type DeleteConfirmationPopupOptions = {
	title: string;
	message: string;
	confirmButtonText: string;
	cancelButtonText: string;
	onConfirm: () => Promise<void>;
};

export class DeleteConfirmationPopup
{
	#options: DeleteConfirmationPopupOptions;

	constructor(options: DeleteConfirmationPopupOptions)
	{
		this.#options = options;
	}

	show(): void
	{
		MessageBox.show({
			title: this.#options.title,
			message: this.#renderMessage(),
			modal: true,
			buttons: [
				new Button({
					useAirDesign: true,
					style: AirButtonStyle.FILLED_ALERT,
					size: ButtonSize.LARGE,
					collapsedIcon: ButtonIcon.REMOVE,
					text: this.#options.confirmButtonText,
					dataset: {
						testid: 'sign-folder-delete-confirmation-confirm-button',
					},
					onclick: async (baseButton: BaseButton) => {
						const button = baseButton as Button;
						button.setWaiting(true);
						try
						{
							await this.#options.onConfirm();
							button.getContext().close();
						}
						catch
						{
							button.setWaiting(false);
						}
					},
				}),
				new Button({
					useAirDesign: true,
					style: AirButtonStyle.PLAIN,
					size: ButtonSize.LARGE,
					collapsedIcon: ButtonIcon.CANCEL,
					text: this.#options.cancelButtonText,
					dataset: {
						testid: 'sign-folder-delete-confirmation-cancel-button',
					},
					onclick: (baseButton: BaseButton) => {
						(baseButton as Button).getContext().close();

						return true;
					},
				}),
			],
		});
	}

	#renderMessage(): HTMLElement
	{
		return Tag.render`
			<div
				class="sign-folder-delete-confirmation__message"
				data-test-id="sign-folder-delete-confirmation"
			>
				<span>${Text.encode(this.#options.message)}</span>
			</div>
		`;
	}
}
