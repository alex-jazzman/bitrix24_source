import { Tag, Loc } from 'main.core';
import { Analytics } from '../analytics';
import DepartmentControl from 'intranet.department-control';
import { RestoreFiredUsersPopup } from '../popup/restore-fired-users-popup';
import { Page } from './page';
import { AirButtonStyle, Button, ButtonState } from 'ui.buttons';
import { Input, InputDesign } from 'ui.system.input';
import { Transport } from '../transport';
import { EventEmitter } from 'main.core.events';

export class RegisterPage extends Page
{
	#container: HTMLElement;
	#departmentControl: DepartmentControl;
	#emailInput: Input;
	#nameInput: Input;
	#lastNameInput: Input;
	#positionInput: Input;
	#checkboxInput: HTMLElement;
	#transport: Transport;

	constructor(options)
	{
		super();
		this.#departmentControl = options.departmentControl instanceof DepartmentControl ? options.departmentControl : null;
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
				<div class="intranet-invitation-block__department-control">
					<div class="intranet-invitation-block__department-control-inner">${this.#departmentControl.render()}</div>
				</div>
				<div class="intranet-invitation-block__content">
					<div class="intranet-invitation-block__header">
						<span class="intranet-invitation-status__title ui-headline --sm">${Loc.getMessage('INTRANET_INVITE_DIALOG_REGISTER_TITLE')}</span>
						<p class="intranet-invitation-description ui-text --md">${Loc.getMessage('INTRANET_INVITE_DIALOG_REGISTER_DESCRIPTION')}</p>
					</div>
					<div class="intranet-invitation-block__body">
						${this.#getEmailInput().render()}
						${this.#getNameInput().render()}
						${this.#getLastNameInput().render()}
						${this.#getPositionInput().render()}
					</div>
					${this.#renderCheckbox()}
					<div class="intranet-invitation-block__footer">
						${this.#getRegisterButton().render()}
					</div>
				</div>
			</div>
		`;

		BX.UI.Hint.init(this.#container);

		return this.#container;
	}

	#getEmailInput(): Input
	{
		this.#emailInput ??= new Input({
			label: Loc.getMessage('INTRANET_INVITE_DIALOG_REGISTER_INPUT_EMAIL_LABEL'),
			placeholder: Loc.getMessage('INTRANET_INVITE_DIALOG_REGISTER_INPUT_EMAIL_PLACEHOLDER'),
			design: InputDesign.Grey,
		});

		return this.#emailInput;
	}

	#getNameInput(): Input
	{
		this.#nameInput ??= new Input({
			label: Loc.getMessage('BX24_INVITE_DIALOG_ADD_NAME_TITLE'),
			placeholder: Loc.getMessage('BX24_INVITE_DIALOG_ADD_NAME_PLACEHOLDER'),
			design: InputDesign.Grey,
		});

		return this.#nameInput;
	}

	#getLastNameInput(): Input
	{
		this.#lastNameInput ??= new Input({
			label: Loc.getMessage('BX24_INVITE_DIALOG_ADD_LAST_NAME_TITLE'),
			placeholder: Loc.getMessage('BX24_INVITE_DIALOG_ADD_LAST_NAME_PLACEHOLDER'),
			design: InputDesign.Grey,
		});

		return this.#lastNameInput;
	}

	#getPositionInput(): Input
	{
		this.#positionInput ??= new Input({
			label: Loc.getMessage('BX24_INVITE_DIALOG_ADD_POSITION_TITLE'),
			placeholder: Loc.getMessage('BX24_INVITE_DIALOG_ADD_POSITION_PLACEHOLDER'),
			design: InputDesign.Grey,
		});

		return this.#positionInput;
	}

	#renderCheckbox(): HTMLElement
	{
		return Tag.render`
			<div class="intranet-invitation-checkbox__container">
				${this.#getCheckboxInput()}
				<label class="intranet-invitation-checkbox__label ui-text --sm" for="ADD_SEND_PASSWORD">
					${Loc.getMessage('INTRANET_INVITE_DIALOG_REGISTER_CHECKBOX_LABEL')}
				</label>
				<div class="invite-invitation-helper"
					 data-hint="${Loc.getMessage('INTRANET_INVITE_DIALOG_REGISTER_CHECKBOX_HINT')}"
					 data-hint-no-icon
				>
				</div>
			</div>
		`;
	}

	#getCheckboxInput(): HTMLElement
	{
		this.#checkboxInput ??= Tag.render`
			<input
				type="checkbox"
				name="ADD_SEND_PASSWORD"
				data-test-id="invite-register-checkbox"
				class="intranet-invitation-checkbox"
			>
		`;

		return this.#checkboxInput;
	}

	#getRegisterButton(): Button
	{
		const registerButton = new Button({
			useAirDesign: true,
			text: Loc.getMessage('BX24_INVITE_DIALOG_TAB_ADD_TITLE_NEW'),
			style: AirButtonStyle.FILLED,
			props: {
				'data-test-id': 'invite-register-submit-button',
			},
			onclick: () => {
				if (registerButton.isWaiting())
				{
					return;
				}

				registerButton.setState(ButtonState.WAITING);

				this.#transport.send(
					{
						action: 'add',
						data: {
							ADD_EMAIL: this.#getEmailInput().getValue(),
							ADD_NAME: this.#getNameInput().getValue(),
							ADD_LAST_NAME: this.#getLastNameInput().getValue(),
							ADD_POSITION: this.#getPositionInput().getValue(),
							ADD_SEND_PASSWORD: this.#getCheckboxInput().checked ? 'Y' : 'N',
							SONET_GROUPS_CODE: this.#departmentControl.getGroupValues(),
							departmentIds: this.#departmentControl.getValues(),
						},
					},
					(reject) => {
						registerButton.setState(null);
						this.#transport.onError(reject);
					},
				).then((response) => {
					registerButton.setState(null);
					this.#departmentControl.reset();
					this.#getEmailInput().setValue('');
					this.#getNameInput().setValue('');
					this.#getLastNameInput().setValue('');
					this.#getPositionInput().setValue('');

					if (response.data.firedUserList)
					{
						(new RestoreFiredUsersPopup({
							userList: response.data.firedUserList,
							isRestoreUsersAccessAvailable: response.data.isRestoreUsersAccessAvailable,
							transport: this.#transport,
						})).show();
					}
					else
					{
						EventEmitter.emit(EventEmitter.GLOBAL_TARGET, 'BX.Intranet.Invitation:showSuccessPopup');
					}
				}).catch((reject) => {
					console.error(reject);
				});
			},
		});

		return registerButton;
	}

	getAnalyticTab(): string
	{
		return Analytics.TAB_REGISTRATION;
	}
}
