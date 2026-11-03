import { Dom, Event, Loc, Tag, Type, Validation } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { FocusNavigator } from 'ui.a11y';
import { AirButtonStyle, Button, ButtonState } from 'ui.buttons';
import { Input, InputDesign } from 'ui.system.input';

import { DepartmentControl } from 'intranet.department-control';

import { Analytics } from '../analytics';
import { DepartmentControlBlock } from '../elements/department-control-block';
import { getFieldErrorMessageId, syncFieldErrorMessage } from '../field-error-message';
import { RestoreFiredUsersPopup } from '../popup/restore-fired-users-popup';
import { Transport } from '../transport';
import { Page } from './page';

type RegisterInputOptions = {
	id: string,
	name: string,
	type: string,
	autocomplete: string,
	required?: boolean,
};

export class RegisterPage extends Page
{
	#container: HTMLElement;
	#departmentControl: DepartmentControl;
	#departmentControlBlock: DepartmentControlBlock;
	#emailInput: Input;
	#nameInput: Input;
	#lastNameInput: Input;
	#inputGroup: HTMLElement;
	#inputGroupErrors: Array<string> = [];
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
			<div
				class="intranet-invitation-block"
				data-testid="invitation-register-page-root"
			>
				${this.#departmentControlBlock?.render()}
				<div
					class="intranet-invitation-block__content"
					data-testid="invitation-register-page-form"
				>
					<div class="intranet-invitation-block__header">
						<h2
							class="intranet-invitation-status__title ui-headline --sm"
							tabindex="-1"
							data-role="page-title"
							data-testid="invitation-register-page-title"
						>${Loc.getMessage('INTRANET_INVITE_DIALOG_REGISTER_TITLE_MSGVER_1')}</h2>
					</div>
					${this.#renderInputGroup()}
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

	restoreErrors(): void
	{
		const emailInput = this.#getEmailInput();
		this.#renderInput(emailInput, this.#getEmailInputOptions());
		syncFieldErrorMessage('invitation-register-page-email-input', emailInput.getError(), false);
		syncFieldErrorMessage(this.#getInputGroupTestId(), this.#inputGroupErrors.join(' '), false);
		this.#syncInputGroupErrorState();
	}

	#renderInputGroup(): HTMLElement
	{
		if (!this.#inputGroup)
		{
			this.#inputGroup = Tag.render`
				<fieldset
					class="intranet-invitation-block__body"
					tabindex="-1"
					data-testid="invitation-register-page-fields"
				>
					<legend>
						<visually-hidden>${Loc.getMessage('BX24_INVITE_DIALOG_EMPLOYEE')}</visually-hidden>
					</legend>
					${this.#renderInput(this.#getEmailInput(), this.#getEmailInputOptions())}
					<div class="intranet-invitation-block__inline-input">
						${this.#renderInput(this.#getNameInput(), {
							id: 'invitation-register-page-name-input',
							name: 'ADD_NAME',
							type: 'text',
							autocomplete: 'given-name',
						})}
						${this.#renderInput(this.#getLastNameInput(), {
							id: 'invitation-register-page-last-name-input',
							name: 'ADD_LAST_NAME',
							type: 'text',
							autocomplete: 'family-name',
						})}
					</div>
				</fieldset>
			`;

			Event.bind(this.#inputGroup, 'input', () => {
				if (this.#hasInputGroupError())
				{
					this.#setInputGroupError('');
				}
			});
		}

		return this.#inputGroup;
	}

	#getEmailInputOptions(): RegisterInputOptions
	{
		return {
			id: 'invitation-register-page-email-input',
			name: 'ADD_EMAIL',
			type: 'email',
			autocomplete: 'email',
			required: true,
		};
	}

	#renderInput(inputControl: Input, options: RegisterInputOptions): HTMLElement
	{
		const inputContainer = inputControl.render();
		const input = inputContainer.querySelector('.ui-system-input-value');
		const error = inputContainer.querySelector('.ui-system-input-label.--error');
		const requiredMark = inputContainer.querySelector('.ui-system-input-label-required');

		if (input)
		{
			Dom.attr(input, {
				id: options.id,
				name: options.name,
				type: options.type,
				autocomplete: options.autocomplete,
				'data-testid': options.id,
			});

			if (options.required === true)
			{
				Dom.attr(input, 'required', '');
			}
			else
			{
				input.removeAttribute('required');
			}

			if (Type.isStringFilled(inputControl.getError()))
			{
				Dom.attr(input, {
					'aria-invalid': 'true',
					'aria-describedby': getFieldErrorMessageId(options.id),
				});
			}
			else
			{
				input.removeAttribute('aria-invalid');
				input.removeAttribute('aria-describedby');
			}
		}

		if (error)
		{
			Dom.attr(error, {
				id: `${options.id}-error`,
				'data-testid': `${options.id}-error`,
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
		this.#emailInput ??= new Input({
			label: Loc.getMessage('INTRANET_INVITE_DIALOG_REGISTER_INPUT_EMAIL_LABEL'),
			ariaLabel: Loc.getMessage('INTRANET_INVITE_DIALOG_REGISTER_INPUT_EMAIL_LABEL'),
			placeholder: Loc.getMessage('INTRANET_INVITE_DIALOG_REGISTER_INPUT_EMAIL_PLACEHOLDER'),
			design: InputDesign.Grey,
			stretched: true,
			type: 'email',
			required: true,
			onInput: () => {
				this.#setEmailError('');
			},
		});

		return this.#emailInput;
	}

	#getNameInput(): Input
	{
		this.#nameInput ??= new Input({
			label: Loc.getMessage('BX24_INVITE_DIALOG_ADD_NAME_TITLE'),
			ariaLabel: Loc.getMessage('BX24_INVITE_DIALOG_ADD_NAME_TITLE'),
			placeholder: Loc.getMessage('BX24_INVITE_DIALOG_ADD_NAME_PLACEHOLDER'),
			design: InputDesign.Grey,
			stretched: true,
			type: 'text',
		});

		return this.#nameInput;
	}

	#getLastNameInput(): Input
	{
		this.#lastNameInput ??= new Input({
			label: Loc.getMessage('BX24_INVITE_DIALOG_ADD_LAST_NAME_TITLE'),
			ariaLabel: Loc.getMessage('BX24_INVITE_DIALOG_ADD_LAST_NAME_TITLE'),
			placeholder: Loc.getMessage('BX24_INVITE_DIALOG_ADD_LAST_NAME_PLACEHOLDER'),
			design: InputDesign.Grey,
			stretched: true,
			type: 'text',
		});

		return this.#lastNameInput;
	}

	#renderCheckbox(): HTMLElement
	{
		const hint = Tag.render`
			<span
				class="invite-invitation-helper"
				data-hint="${Loc.getMessage('INTRANET_INVITE_DIALOG_REGISTER_CHECKBOX_HINT')}"
				data-hint-no-icon
			></span>
		`;

		return Tag.render`
			<div
				class="intranet-invitation-checkbox__container"
				data-testid="invitation-register-page-send-password-control"
			>
				${this.#getCheckboxInput()}
				<label
					class="intranet-invitation-checkbox__label ui-text --sm"
					for="ADD_SEND_PASSWORD"
					data-testid="invitation-register-page-send-password-label"
				>
					${Loc.getMessage('INTRANET_INVITE_DIALOG_REGISTER_CHECKBOX_LABEL')}
				</label>
				${hint}
			</div>
		`;
	}

	#getCheckboxInput(): HTMLElement
	{
		if (!this.#checkboxInput)
		{
			this.#checkboxInput = Tag.render`
				<input
					id="ADD_SEND_PASSWORD"
					type="checkbox"
					name="ADD_SEND_PASSWORD"
					data-test-id="invite-register-checkbox"
					data-testid="invitation-register-page-send-password-checkbox"
					class="intranet-invitation-checkbox"
				>
			`;
			Event.bind(this.#checkboxInput, 'keydown', (event: KeyboardEvent) => {
				if (event.key === 'Enter')
				{
					event.preventDefault();
				}
			});
		}

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
			dataset: {
				testid: 'invitation-register-page-submit-button',
			},
			onclick: () => {
				if (registerButton.isWaiting())
				{
					return;
				}

				EventEmitter.emit(EventEmitter.GLOBAL_TARGET, 'BX.Intranet.Invitation:clearError');
				this.#setInputGroupError('');

				if (!this.#validateInputs())
				{
					this.#focusFirstErrorInput();

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
						this.#handleRegisterErrors(reject);
					},
				).then((response) => {
					if (!response)
					{
						return;
					}

					registerButton.setState(null);
					this.#departmentControl.reset();
					this.#getEmailInput().setValue('');
					this.#setEmailError('');
					this.#getNameInput().setValue('');
					this.#getLastNameInput().setValue('');
					this.#setInputGroupError('');

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

	#validateInputs(): boolean
	{
		const email = String(this.#getEmailInput().getValue() ?? '').trim();
		const isEmailValid = Validation.isEmail(email) && /^[^@]+@[^@]+\.[^@]+$/.test(email);
		this.#setEmailError(
			isEmailValid ? '' : Loc.getMessage('INTRANET_INVITE_DIALOG_VALIDATE_ERROR_EMAIL'),
		);

		return !this.#hasInputErrors();
	}

	#handleRegisterErrors(reject): void
	{
		const errors = Type.isArray(reject?.errors) ? reject.errors : [];
		let hasHandledErrors = false;

		errors.forEach((error) => {
			if (!Type.isStringFilled(error?.message))
			{
				return;
			}

			if (error?.customData?.field === 'email')
			{
				this.#setEmailError(error.message);
			}
			else
			{
				this.#setInputGroupError(error.message);
			}

			hasHandledErrors = true;
		});

		if (hasHandledErrors)
		{
			this.#focusFirstErrorInput();

			return;
		}

		this.#transport.onError(reject);
	}

	#hasInputErrors(): boolean
	{
		return Type.isStringFilled(this.#getEmailInput().getError()) || this.#hasInputGroupError();
	}

	#focusFirstErrorInput(): boolean
	{
		if (Type.isStringFilled(this.#getEmailInput().getError()))
		{
			this.#getEmailInput().focus();
		}
		else if (this.#hasInputGroupError())
		{
			FocusNavigator.focusContainer(this.#renderInputGroup(), { focusVisible: true });
		}
		else
		{
			return false;
		}

		this.#container?.ownerDocument.activeElement?.scrollIntoView({ block: 'center' });

		return true;
	}

	#setEmailError(errorMessage: string): void
	{
		const emailInput = this.#getEmailInput();
		emailInput.setError(errorMessage);
		this.#renderInput(emailInput, {
			id: 'invitation-register-page-email-input',
			name: 'ADD_EMAIL',
			type: 'email',
			autocomplete: 'email',
			required: true,
		});
		syncFieldErrorMessage('invitation-register-page-email-input', errorMessage);
	}

	#setInputGroupError(errorMessage: string): void
	{
		if (!Type.isStringFilled(errorMessage))
		{
			this.#inputGroupErrors = [];
		}
		else if (!this.#inputGroupErrors.includes(errorMessage))
		{
			this.#inputGroupErrors.push(errorMessage);
		}

		syncFieldErrorMessage(this.#getInputGroupTestId(), this.#inputGroupErrors.join(' '), false);
		this.#syncInputGroupErrorState();
	}

	#hasInputGroupError(): boolean
	{
		return this.#inputGroupErrors.length > 0;
	}

	#getInputGroupTestId(): string
	{
		return 'invitation-register-page-fields';
	}

	#syncInputGroupErrorState(): void
	{
		const inputGroup = this.#renderInputGroup();
		if (this.#hasInputGroupError())
		{
			Dom.attr(inputGroup, {
				'aria-invalid': 'true',
				'aria-describedby': getFieldErrorMessageId(this.#getInputGroupTestId()),
			});

			return;
		}

		inputGroup.removeAttribute('aria-invalid');
		inputGroup.removeAttribute('aria-describedby');
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
