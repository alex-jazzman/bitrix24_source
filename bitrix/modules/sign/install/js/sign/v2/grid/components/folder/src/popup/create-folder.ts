import { Dom, Event, Loc, Text } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { Popup } from 'main.popup';
import { AirButtonStyle, Button, ButtonIcon, ButtonSize } from 'ui.buttons';
import { Center as NotificationCenter } from 'ui.notification';

export type CreateFolderPopupOptions = {
	initialTitle?: string;
	placeholder?: string;
	createButtonText?: string;
	saveButtonText?: string;
	cancelButtonText?: string;
	emptyTitleNotification?: string;
};

export class CreateFolderPopup extends EventEmitter
{
	#initialTitle: string | null;
	#placeholder: string;
	#createButtonText: string;
	#saveButtonText: string;
	#cancelButtonText: string;
	#emptyTitleNotification: string;

	constructor(options: CreateFolderPopupOptions = {})
	{
		super();
		this.setEventNamespace('BX.Sign.V2.Grid.Components.Folder.CreateFolderPopup');
		this.#initialTitle = options.initialTitle ?? null;
		this.#placeholder = options.placeholder
			?? Loc.getMessage('SIGN_V2_GRID_COMPONENTS_FOLDER_INPUT_PLACEHOLDER')
			?? '';
		this.#createButtonText = options.createButtonText
			?? Loc.getMessage('SIGN_V2_GRID_COMPONENTS_FOLDER_CREATE_BUTTON')
			?? '';
		this.#saveButtonText = options.saveButtonText
			?? Loc.getMessage('SIGN_V2_GRID_COMPONENTS_FOLDER_SAVE_BUTTON')
			?? '';
		this.#cancelButtonText = options.cancelButtonText
			?? Loc.getMessage('SIGN_V2_GRID_COMPONENTS_FOLDER_CANCEL_BUTTON')
			?? '';
		this.#emptyTitleNotification = options.emptyTitleNotification
			?? Loc.getMessage('SIGN_V2_GRID_COMPONENTS_FOLDER_TITLE_NOT_EMPTY')
			?? '';
	}

	show(): void
	{
		const uniqueId = `folderNameInput_${Date.now()}`;
		const initialTitle = this.#initialTitle;
		let popup: Popup | null = null;

		const handleSubmit = (): void => {
			const input = document.getElementById(uniqueId);
			if (!(input instanceof HTMLInputElement))
			{
				return;
			}

			const title = input.value.trim();
			if (title !== '')
			{
				this.emit('submit', { title });
				popup?.close();

				return;
			}

			NotificationCenter.notify({
				content: this.#emptyTitleNotification,
			});
		};

		popup = new Popup({
			id: `folderNamePopup_${uniqueId}`,
			cacheable: false,
			className: 'sign-folder-popup',
			content: `
				<div class="sign-folder-popup__content">
					<span class="sign-folder-popup__icon"></span>
					<div class="sign-folder-popup__input-container">
						<input
							type="text"
							id="${uniqueId}"
							class="ui-ctl-element"
							placeholder="${Text.encode(this.#placeholder)}"
							value="${initialTitle === null ? '' : Text.encode(initialTitle)}"
						>
					</div>
				</div>
			`,
			buttons: [
				new Button({
					useAirDesign: true,
					style: AirButtonStyle.FILLED,
					size: ButtonSize.LARGE,
					collapsedIcon: ButtonIcon.ADD_FOLDER,
					text: initialTitle === null ? this.#createButtonText : this.#saveButtonText,
					onclick: () => {
						handleSubmit();

						return true;
					},
				}),
				new Button({
					useAirDesign: true,
					style: AirButtonStyle.PLAIN,
					size: ButtonSize.LARGE,
					collapsedIcon: ButtonIcon.CANCEL,
					text: this.#cancelButtonText,
					onclick: () => {
						popup?.close();

						return true;
					},
				}),
			] as unknown as [],
			draggable: true,
			overlay: true,
			width: 500,
			height: 420,
			events: {
				onPopupShow: (): void => {
					if (popup === null)
					{
						return;
					}

					Dom.style(popup.getPopupContainer(), 'backgroundColor', 'rgba(255, 255, 255)');
					const input = document.getElementById(uniqueId);
					if (!(input instanceof HTMLInputElement))
					{
						return;
					}

					input.focus();
					input.setSelectionRange(input.value.length, input.value.length);
					Event.bind(input, 'keydown', (event: KeyboardEvent) => {
						if (event.key === 'Enter')
						{
							event.preventDefault();
							handleSubmit();
						}
					});
				},
			},
		});

		popup.show();
	}
}
