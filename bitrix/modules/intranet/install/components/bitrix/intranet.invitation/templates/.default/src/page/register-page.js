import { Tag, Loc } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { AirButtonStyle, Button, ButtonState } from 'ui.buttons';
import { Input, InputDesign } from 'ui.system.input';

import { DepartmentControl } from 'intranet.department-control';

import { Analytics } from '../analytics';
import { DepartmentControlBlock } from '../elements/department-control-block';
import { RestoreFiredUsersPopup } from '../popup/restore-fired-users-popup';
import { Transport } from '../transport';
import { Page } from './page';

export class RegisterPage extends Page
{
	#container: HTMLElement;
	#departmentControl: DepartmentControl;
	#departmentControlBlock: DepartmentControlBlock;
	#emailInput: Input;
	#nameInput: Input;
	#lastNameInput: Input;
	#checkboxInput: HTMLElement;
	#transport: Transport;

	constructor(options)
	{
		super();
		this.#departmentControl = options.departmentControl instanceof DepartmentControl ? options.departmentControl : null;
		this.#departmentControlBlock = options.departmentControlBlock instanceof DepartmentControlBlock
			? options.departmentControlBlock
			: null
		;
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
				${this.#departmentControlBlock?.render()}
				<div class="intranet-invitation-block__content">
					<div class="intranet-invitation-block__header">
						<span class="intranet-invitation-status__title ui-headline --sm">${Loc.getMessage('INTRANET_INVITE_DIALOG_REGISTER_TITLE_MSGVER_1')}</span>
<!--						<p class="intranet-invitation-description ui-text &#45;&#45;md">${Loc.getMessage('INTRANET_INVITE_DIALOG_REGISTER_DESCRIPTION_MSGVER_1')}</p>-->
					</div>
					<div class="intranet-invitation-block__body">
						${this.#getEmailInput().render()}
						<div class="intranet-invitation-block__inline-input">
							${this.#getNameInput().render()}
							${this.#getLastNameInput().render()}
						</div>
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
			stretched: true,
		});

		return this.#emailInput;
	}

	#getNameInput(): Input
	{
		this.#nameInput ??= new Input({
			label: Loc.getMessage('BX24_INVITE_DIALOG_ADD_NAME_TITLE'),
			placeholder: Loc.getMessage('BX24_INVITE_DIALOG_ADD_NAME_PLACEHOLDER'),
			design: InputDesign.Grey,
			stretched: true,
		});

		return this.#nameInput;
	}

	#getLastNameInput(): Input
	{
		this.#lastNameInput ??= new Input({
			label: Loc.getMessage('BX24_INVITE_DIALOG_ADD_LAST_NAME_TITLE'),
			placeholder: Loc.getMessage('BX24_INVITE_DIALOG_ADD_LAST_NAME_PLACEHOLDER'),
			design: InputDesign.Grey,
			stretched: true,
		});

		return this.#lastNameInput;
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

				const departmentIds = this.#departmentControl.getValues();
				const workgroupIds = this.#departmentControl.getGroupValues();
				const notSendInvitationChecked = this.#getCheckboxInput().checked;

				this.#transport.send(
					{
						action: 'add',
						data: {
							ADD_EMAIL: this.#getEmailInput().getValue(),
							ADD_NAME: this.#getNameInput().getValue(),
							ADD_LAST_NAME: this.#getLastNameInput().getValue(),
							ADD_SEND_PASSWORD: notSendInvitationChecked ? 'Y' : 'N',
							SONET_GROUPS_CODE: workgroupIds,
							departmentIds,
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

					if (response.data.firedUserList)
					{
						(new RestoreFiredUsersPopup({
							userList: response.data.firedUserList,
							isRestoreUsersAccessAvailable: response.data.isRestoreUsersAccessAvailable,
							transport: this.#transport,
							departmentIds,
							workgroupIds,
						})).show();
					}
					else
					{
						EventEmitter.emit(
							EventEmitter.GLOBAL_TARGET,
							'BX.Intranet.Invitation:showSuccessPopup',
							notSendInvitationChecked
								? {
									content: this.#getNotificationContentWithoutInvitation(),
								} : {},
						);
					}
				}).catch((reject) => {
					console.error(reject);
				});
			},
		});

		return registerButton;
	}

	#getNotificationContentWithoutInvitation(): HTMLElement
	{
		return Tag.render`
			<div class="invite-email-notification">
				<div class="invite-email-notification__content">
					<div class="invite-email-notification__title ui-text --sm --accent">
						${Loc.getMessage('INTRANET_INVITE_DIALOG_LOCAL_POPUP_SUCCESS_ADDED_TITLE')}
					</div>
					<div class="invite-email-notification__description ui-text --2xs">
						${Loc.getMessage('INTRANET_INVITE_DIALOG_LOCAL_POPUP_SUCCESS_ADDED_DESCRIPTION')}
					</div>
				</div>
			</div>
		`;
	}

	getAnalyticTab(): string
	{
		return Analytics.TAB_REGISTRATION;
	}
}
