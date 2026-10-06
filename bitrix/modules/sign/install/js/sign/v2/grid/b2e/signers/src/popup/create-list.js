import { Tag, Dom, Loc, Text, Event } from 'main.core';
import { CancelButton, CreateButton } from 'ui.buttons';
import { Center as NotificationCenter } from 'ui.notification';
import { Popup } from 'main.popup';
import './create-list.css';

const TestId = Object.freeze({
	popupContainer: 'sign-b2e-signers-list-popup',
	popup: 'sign-b2e-signers-list-popup-content',
	title: 'sign-b2e-signers-list-popup-title',
	description: 'sign-b2e-signers-list-popup-description',
	nameInput: 'sign-b2e-signers-list-title-input',
	submitButton: 'sign-b2e-signers-list-submit',
	cancelButton: 'sign-b2e-signers-list-cancel',
});

export class CreateListPopup
{
	async show(inputText: ?string = null): Promise<any>
	{
		return new Promise((resolve) => {
			const isRenameMode = inputText !== null;
			const inputId = `listNameInput_${Date.now()}`;
			const input = Tag.render`
				<input
					type="text"
					id="${inputId}"
					class="ui-ctl-element"
					data-testid="${TestId.nameInput}"
					placeholder="${Loc.getMessage('SIGN_SIGNERS_GRID_CREATE_LIST_POPUP_INPUT_PLACEHOLDER')}"
					value="${isRenameMode ? Text.encode(inputText) : ''}"
				>
			`;

			const popup = new Popup(`listNamePopup_${inputId}`, null, {
				draggable: false,
				overlay: true,
				width: 500,
				height: 280,
				padding: 0,
				closeByEsc: true,
				closeIcon: true,
				className: 'sign-signers-grid-create-list-popup',

				content: this.#renderContent(input, isRenameMode),

				buttons: [
					new CreateButton({
						text: isRenameMode
							? Loc.getMessage('SIGN_SIGNERS_GRID_CREATE_LIST_SAVE_BUTTON_TEXT')
							: Loc.getMessage('SIGN_SIGNERS_GRID_CREATE_LIST_CREATE_BUTTON_TEXT'),
						round: true,
						dataset: { testid: TestId.submitButton },
						events: {
							click: async () => {
								await this.#save(input, popup, resolve);
							},
						},
					}),
					new CancelButton({
						text: Loc.getMessage('SIGN_SIGNERS_GRID_CREATE_LIST_CANCEL_BUTTON_TEXT'),
						dataset: { testid: TestId.cancelButton },
						events: {
							click()
							{
								popup.close();
							},
						},
					}),
				],

				events: {
					onPopupShow() {
						this.popupContainer.dataset.testid = TestId.popupContainer;
						Dom.style(this.popupContainer, 'backgroundColor', 'rgba(255, 255, 255)');
					},
					onAfterShow: () => {
						input.focus();

						if (isRenameMode && inputText.length > 1)
						{
							input.setSelectionRange(input.value.length, input.value.length);
						}

						Event.bind(input, 'keydown', async (event) => {
							if (event.key === 'Enter')
							{
								await this.#save(input, popup, resolve);
							}
						});
					},
				},
			});

			popup.show();
		});
	}

	// The name is saved from two places — the submit button and Enter in the input — and both must
	// behave identically: report an empty name and keep the popup open, or resolve and close.
	async #save(input: HTMLElement, popup: Popup, resolve: (listName: string) => void): Promise<void>
	{
		try
		{
			const listName = await this.#handleSave(input);
			resolve(listName);
			popup.close();
		}
		catch (error)
		{
			this.#showError(error);
		}
	}

	#renderContent(input: HTMLElement, isRenameMode: boolean): HTMLElement
	{
		const title = this.#getPopupTitle(isRenameMode);
		const description = this.#getPopupDescription(isRenameMode);

		return Tag.render`
			<div class="sign-create-list-popup-item-container-wrapper" data-testid="${TestId.popup}">
				<span class="sign-create-list-title-titlebar" data-testid="${TestId.title}">${title}</span>
				<div class="sign-create-list-popup-item-container">
					<div class="sign-create-list-title-input-container">
						${input}
					</div>
					<span style="text-align: left; width: 100%" data-testid="${TestId.description}">${description}</span>
				</div>
			</div>
		`;
	}

	#getPopupTitle(isRenameMode: boolean): string
	{
		return isRenameMode
			? Loc.getMessage('SIGN_SIGNERS_GRID_RENAME_LIST_POPUP_TITLE')
			: Loc.getMessage('SIGN_SIGNERS_GRID_CREATE_LIST_POPUP_TITLE');
	}

	#getPopupDescription(isRenameMode: boolean): string
	{
		return isRenameMode
			? Loc.getMessage('SIGN_SIGNERS_GRID_RENAME_LIST_DESCRIPTION')
			: Loc.getMessage('SIGN_SIGNERS_GRID_CREATE_LIST_DESCRIPTION');
	}

	async #handleSave(input: HTMLElement): Promise<string>
	{
		const listName = input ? input.value : '';

		if (!listName)
		{
			throw new Error(Loc.getMessage('SIGN_SIGNERS_GRID_CREATE_LIST_HINT_TITLE_NOT_EMPTY_MSGVER_1'));
		}

		return listName;
	}

	#showError(error: Error): void
	{
		NotificationCenter.notify({
			content: error.message,
		});
	}
}
