import { Tag, Loc } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { Popup } from 'main.popup';
import { Button, AirButtonStyle, ButtonState } from 'ui.buttons';
import { Input, InputDesign } from 'ui.system.input';

import { Analytics } from '../analytics';
import { IntegratorInviteConfirmPopup } from '../popup/integrator-invite-confirm-popup';
import { Transport } from '../transport';
import { Page } from './page';

export class IntegratorPage extends Page
{
	#container: HTMLElement;
	#emailInput: Input;
	#transport: Transport;
	#inviteButton: Button;
	#confirmPopup: Popup;

	constructor(options)
	{
		super();
		this.#transport = options.transport;
	}

	render(): HTMLElement
	{
		if (this.#container)
		{
			return this.#container;
		}

		this.#container = Tag.render`
			<div class="intranet-invitation-block">
				<div class="intranet-invitation-block__content">
					<div class="intranet-invitation-block__header">
						${this.#renderDescription()}
					</div>
					<div class="intranet-invitation-block__body">
						${this.#getEmailInput().render()}
					</div>
					<div class="intranet-invitation-block__footer">
						${this.#getInviteButton().render()}
					</div>
				</div>
			</div>
		`;

		return this.#container;
	}

	#renderDescription(): HTMLElement
	{
		const message = Loc.getMessage('INTRANET_INVITE_DIALOG_CONFIRM_INTEGRATOR_POPUP_DESCRIPTION', {
			'[LINK]': '<a href="javascript:top.BX.Helper.show(\'redirect=detail&code=7725333\')" class="ui-link ui-link-secondary ui-link-dashed ui-text --md">',
			'[/LINK]': '</a>',
		});

		return Tag.render`
			<p class="intranet-invitation-description ui-text --md">${message}</p>
		`;
	}

	#getEmailInput(): Input
	{
		this.#emailInput ??= new Input({
			label: Loc.getMessage('INTRANET_INVITE_DIALOG_INTEGRATOR_EMAIL_PLACEHOLDER'),
			design: InputDesign.Grey,
		});

		return this.#emailInput;
	}

	#getInviteButton(): Button
	{
		this.#inviteButton ??= new Button({
			useAirDesign: true,
			text: Loc.getMessage('BX24_INVITE_DIALOG_BUTTON_INVITE'),
			style: AirButtonStyle.FILLED,
			props: {
				'data-test-id': 'invite-integrator-page-submit-button',
			},
			onclick: () => {
				if (this.#inviteButton?.isWaiting())
				{
					return;
				}

				this.#inviteButton?.setState(ButtonState.WAITING);
				this.#getConfirmPopup().show();
			},
		});

		return this.#inviteButton;
	}

	#getConfirmPopup(): Popup
	{
		this.#confirmPopup ??= new IntegratorInviteConfirmPopup({
			onConfirm: () => {
				this.#transport.sendAction(
					{
						action: 'intranet.v2.Integrator.Invitation.send',
						data: {
							integratorEmail: this.#getEmailInput().getValue(),
						},
						analytics: {
							INVITATION_TYPE: 'integrator',
						},
					},
					(reject) => {
						this.#inviteButton?.setState(null);
						this.#transport.onError(reject);
					},
				).then(() => {
					EventEmitter.emit(EventEmitter.GLOBAL_TARGET, 'BX.Intranet.Invitation:showSuccessPopup');
					this.#inviteButton?.setState(null);
				}).catch((reject) => {
					top.console.error(reject);
				});
			},
			onCancel: () => {
				this.#inviteButton?.setState(null);
			},
		});

		return this.#confirmPopup;
	}

	getAnalyticTab(): string
	{
		return Analytics.TAB_INTEGRATOR;
	}
}
