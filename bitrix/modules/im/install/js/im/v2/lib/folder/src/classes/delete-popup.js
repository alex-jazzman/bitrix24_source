import { Tag, Loc } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { Dialog, type DialogOptions } from 'ui.system.dialog';
import { Button, AirButtonStyle, ButtonSize } from 'ui.buttons';

import '../css/delete-popup.css';

const EVENT_NAMESPACE = 'BX.Messenger.v2.Lib.Folder.DeletePopup';

export class FolderDeletePopup extends EventEmitter
{
	static events = {
		onConfirm: 'onConfirm',
		onCancel: 'onCancel',
	};

	#dialog: Dialog;
	#confirmed: boolean = false;

	constructor()
	{
		super();
		this.setEventNamespace(EVENT_NAMESPACE);

		this.#initDialog();
	}

	show(): void
	{
		this.#dialog.show();
	}

	#hide(): void
	{
		this.#dialog.hide();
	}

	#initDialog(): void
	{
		const params: DialogOptions = {
			title: Loc.getMessage('IM_LIB_FOLDER_DELETE_POPUP_TITLE'),
			closeByEsc: true,
			content: this.#getContainer(),
			centerButtons: [
				this.#getConfirmButton(),
				this.#getCancelButton(),
			],
			events: {
				onHide: () => this.#onPopupHide(),
			},
		};

		this.#dialog = new Dialog(params);
	}

	#getContainer(): Element
	{
		return Tag.render`
			<div class="bx-im-folder-delete-popup__container bx-im-messenger__scope" data-testid="folder-delete-popup">
				<div class="bx-im-folder-delete-popup__text">
					${Loc.getMessage('IM_LIB_FOLDER_DELETE_POPUP_TEXT')}
				</div>
			</div>
		`;
	}

	#getConfirmButton(): Button
	{
		return new Button({
			text: Loc.getMessage('IM_LIB_FOLDER_DELETE_POPUP_CONFIRM'),
			useAirDesign: true,
			style: AirButtonStyle.FILLED_ALERT,
			size: ButtonSize.LARGE,
			wide: true,
			dataset: { testid: 'folder-delete-popup-confirm-btn' },
			onclick: () => {
				this.#confirmed = true;
				this.emit(FolderDeletePopup.events.onConfirm);
				this.#hide();
			},
		});
	}

	#getCancelButton(): Button
	{
		return new Button({
			text: Loc.getMessage('IM_LIB_FOLDER_DELETE_POPUP_CANCEL'),
			useAirDesign: true,
			style: AirButtonStyle.OUTLINE,
			size: ButtonSize.LARGE,
			wide: true,
			dataset: { testid: 'folder-delete-popup-cancel-btn' },
			onclick: () => this.#hide(),
		});
	}

	#onPopupHide(): void
	{
		if (this.#confirmed)
		{
			return;
		}

		this.emit(FolderDeletePopup.events.onCancel);
	}
}
