import { Tag, Loc } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { Dialog, type DialogOptions } from 'ui.system.dialog';
import { Button, AirButtonStyle, ButtonSize } from 'ui.buttons';

import '../css/parent-access-popup.css';

const EVENT_NAMESPACE = 'BX.Messenger.v2.Lib.Access.ParentAccessPopup';

export class ParentAccessPopup extends EventEmitter
{
	static events = {
		onConfirm: 'onConfirm',
		onCancel: 'onCancel',
	};

	#dialog: Dialog;
	#confirmed = false;

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

	#initDialog()
	{
		const params: DialogOptions = {
			title: Loc.getMessage('IM_LIB_ACCESS_PARENT_CHAT_ACCESS_TITLE'),
			closeByEsc: false,
			closeByClickOutside: false,
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
			<div class="bx-im-parent-access-popup__container bx-im-messenger__scope">
				<div class="bx-im-parent-access-popup__text">
					${Loc.getMessage('IM_LIB_ACCESS_PARENT_CHAT_ACCESS_TEXT')}
				</div>
				<div class="bx-im-parent-access-popup__image"></div>
			</div>
		`;
	}

	#getConfirmButton(): Button
	{
		return new Button({
			text: Loc.getMessage('IM_LIB_ACCESS_PARENT_CHAT_ACCESS_CONFIRM'),
			useAirDesign: true,
			size: ButtonSize.LARGE,
			wide: true,
			onclick: () => {
				this.#confirmed = true;
				this.emit(ParentAccessPopup.events.onConfirm);
				this.#hide();
			},
		});
	}

	#getCancelButton(): Button
	{
		return new Button({
			text: Loc.getMessage('IM_LIB_ACCESS_PARENT_CHAT_ACCESS_CANCEL'),
			useAirDesign: true,
			style: AirButtonStyle.OUTLINE,
			size: ButtonSize.LARGE,
			wide: true,
			onclick: () => this.#hide(),
		});
	}

	#onPopupHide()
	{
		if (this.#confirmed)
		{
			return;
		}

		this.emit(ParentAccessPopup.events.onCancel);
	}
}
