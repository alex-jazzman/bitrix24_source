import { CloseIconSize, Popup } from 'main.popup';
import { Loc, Tag } from 'main.core';
import { Button, AirButtonStyle } from 'ui.buttons';

export class IntegratorInviteConfirmPopup
{
	#popup: Popup;
	#onConfirm: Function;
	#onCancel: Function;

	constructor(options)
	{
		this.#onConfirm = options.onConfirm;
		this.#onCancel = options.onCancel;
	}

	show(): void
	{
		this.#getPopup().show();
	}

	#getPopup(): Popup
	{
		this.#popup ??= new Popup({
			id: 'integrator-confirm-invitation-popup',
			content: this.#getPopupContent(),
			closeByEsc: true,
			closeIcon: true,
			closeIconSize: CloseIconSize.LARGE,
			autoHide: true,
			padding: 0,
			overlay: {
				backgroundColor: 'rgba(0, 32, 78, 0.46)',
			},
		});

		return this.#popup;
	}

	#getPopupContent(): HTMLElement
	{
		return Tag.render`
			<div class="intranet-invitation-popup">
				<div class="intranet-invitation-popup__title">
					<span class="ui-headline --sm">${Loc.getMessage('INTRANET_INVITE_DIALOG_CONFIRM_INTEGRATOR_POPUP_TITLE')}</span>
				</div>
				<div class="intranet-invitation-popup__body">
					<p class="intranet-invitation-description ui-text --sm">
						${this.#getDescription()}
					</p>
				</div>
				<div class="intranet-invitation-popup__footer">
					<div class="intranet-invitation-popup__footer-button-container">
						${this.#getConfirmButton().render()}
						${this.#getCancelButton().render()}
					</div>
				</div>
			</div>
		`;
	}

	#getConfirmButton(): Button
	{
		return new Button({
			id: 'integrator-confirm-invitation-popup-submit-button',
			text: Loc.getMessage('INTRANET_INVITE_DIALOG_CONFIRM_INTEGRATOR_BUTTON_YES'),
			useAirDesign: true,
			style: AirButtonStyle.FILLED,
			onclick: () => {
				this.#onConfirm();
				this.#getPopup().close();
			},
		});
	}

	#getCancelButton(): Button
	{
		return new Button({
			id: 'integrator-confirm-invitation-popup-cancel-button',
			text: Loc.getMessage('INTRANET_INVITE_DIALOG_CONFIRM_INTEGRATOR_BUTTON_NO'),
			useAirDesign: true,
			style: AirButtonStyle.OUTLINE,
			onclick: () => {
				this.#onCancel();
				this.#getPopup().close();
			},
		});
	}

	#getDescription(): string
	{
		return Loc.getMessage('INTRANET_INVITE_DIALOG_CONFIRM_INTEGRATOR_DESCRIPTION_MSGVER_1', {
			'[LINK]': '<a href="javascript:top.BX.Helper.show(\'redirect=detail&code=20682986\')" class="ui-link ui-link-secondary ui-link-dashed ui-text --sm">',
			'[/LINK]': '</a>',
		});
	}
}
