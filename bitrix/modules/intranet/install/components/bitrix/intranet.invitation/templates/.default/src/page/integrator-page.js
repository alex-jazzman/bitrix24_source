import { Dom, Loc, Tag, Type } from 'main.core';
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
	#inputGroup: HTMLElement;
	#emailInput: Input;
	#transport: Transport;
	#inviteButton: Button;
	#confirmPopup: Popup;
	#analytics: Analytics;

	constructor(options)
	{
		super();
		this.#transport = options.transport;
		this.#analytics = options.analytics;
	}

	render(): HTMLElement
	{
		if (this.#container)
		{
			return this.#container;
		}

		this.#container = Tag.render`
			<div
				class="intranet-invitation-block"
				data-testid="invitation-integrator-page-root"
			>
				<div
					class="intranet-invitation-block__content"
					data-testid="invitation-integrator-page-form"
				>
					<div class="intranet-invitation-block__header">
						<h2
							class="intranet-invitation-status__title ui-headline --sm"
							tabindex="-1"
							data-role="page-title"
							data-testid="invitation-integrator-page-title"
						>${Loc.getMessage('BX24_INVITE_DIALOG_TAB_INTEGRATOR_TITLE')}</h2>
						${this.#renderDescription()}
					</div>
					${this.#renderInputGroup()}
					<div class="intranet-invitation-block__footer">
						${this.#getInviteButton().render()}
					</div>
				</div>
			</div>
		`;

		return this.#container;
	}

	#renderInputGroup(): HTMLElement
	{
		this.#inputGroup ??= Tag.render`
			<div
				class="intranet-invitation-block__body"
				data-testid="invitation-integrator-page-fields"
			>
				${this.#renderEmailInput()}
			</div>
		`;

		return this.#inputGroup;
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

	#renderEmailInput(): HTMLElement
	{
		const inputControl = this.#getEmailInput();
		const inputContainer = inputControl.render();
		const input = inputContainer.querySelector('.ui-system-input-value');
		const error = inputContainer.querySelector('.ui-system-input-label.--error');
		const requiredMark = inputContainer.querySelector('.ui-system-input-label-required');
		const inputId = 'invitation-integrator-page-email-input';
		Dom.attr(inputContainer, 'data-testid', 'invitation-integrator-page-email-field');

		if (input)
		{
			Dom.attr(input, {
				id: inputId,
				name: 'integratorEmail',
				type: 'email',
				autocomplete: 'email',
				'aria-required': 'true',
				'data-testid': inputId,
			});
		}

		if (error)
		{
			Dom.attr(error, {
				id: `${inputId}-error`,
				'data-testid': `${inputId}-error`,
				hidden: '',
			});
		}

		if (requiredMark)
		{
			Dom.attr(requiredMark, 'aria-hidden', 'true');
		}

		return inputContainer;
	}

	#getEmailInput(): Input
	{
		const label = Loc.getMessage('INTRANET_INVITE_DIALOG_INTEGRATOR_EMAIL_PLACEHOLDER');
		this.#emailInput ??= new Input({
			label,
			ariaLabel: label,
			type: 'email',
			required: true,
			design: InputDesign.Grey,
			onInput: () => this.#setEmailError(''),
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
				'data-testid': 'invitation-integrator-page-submit-button',
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
					},
					(reject) => {
						this.#inviteButton?.setState(null);
						this.#transport.onError(reject);
						const errorMessage = reject?.errors?.find((error) => {
							return Type.isStringFilled(error?.message);
						})?.message ?? Loc.getMessage('BX24_INVITE_DIALOG_INTEGRATOR_EMAIL_ERROR');
						this.#setEmailError(errorMessage);
						this.#getEmailInput().focus();
					},
					{
						...this.#analytics.getDataForAction('default'),
						INVITATION_TYPE: 'integrator',
					},
				).then((response) => {
					if (!response)
					{
						return;
					}

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

	#setEmailError(errorMessage: string): void
	{
		this.#getEmailInput().setError(errorMessage);

		const input = this.#getEmailInput().render().querySelector('.ui-system-input-value');
		if (input)
		{
			if (Type.isStringFilled(errorMessage))
			{
				Dom.attr(input, {
					'aria-invalid': 'true',
					'aria-describedby': 'invitation-integrator-page-email-input-error',
				});
			}
			else
			{
				input.removeAttribute('aria-invalid');
				input.removeAttribute('aria-describedby');
			}
		}
	}

	getAnalyticTab(): string
	{
		return Analytics.TAB_INTEGRATOR;
	}
}
