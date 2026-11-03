import { Dom, Event, Loc, Tag, Type } from 'main.core';
import { FocusNavigator } from 'ui.a11y';
import { getFieldErrorMessageId, syncFieldErrorMessage } from '../field-error-message';
import { ContactsInput } from './inputs/contacts-input';
import { NameInput } from './inputs/name-input';
import { LastNameInput } from './inputs/last-name-input';

export type InputRowOptions = {
	id: number,
	contactsInput: ContactsInput;
	nameInput?: NameInput;
	lastNameInput?: LastNameInput;
}

export class InputRow
{
	#container: HTMLElement;
	#contactsInput: ContactsInput;
	#nameInput: ?NameInput;
	#lastNameInput: ?LastNameInput;
	#id: number;
	#invitationErrors: Array<string> = [];

	constructor(options: InputRowOptions)
	{
		this.#id = options.id;
		this.#contactsInput = options.contactsInput;
		this.#nameInput = options.nameInput;
		this.#lastNameInput = options.lastNameInput;
	}

	render(): HTMLElement
	{
		if (!this.#container)
		{
			this.#container = Tag.render`
			<fieldset
				class="intranet-invite-form-row"
				data-test-id="invite-input-row${this.#id}"
				data-testid="invitation-input-row-${this.#id}"
			>
				<legend>
					<visually-hidden>
						${Loc.getMessage('BX24_INVITE_DIALOG_EMPLOYEE')} ${this.#id + 1}
					</visually-hidden>
				</legend>
				${this.#contactsInput.render()}
				${this.#lastNameInput ? this.#lastNameInput.render() : ''}
				${this.#nameInput ? this.#nameInput.render() : ''}
			</fieldset>
			`;
			Event.bind(this.#container, 'input', () => {
				if (this.hasInvitationError())
				{
					this.setInvitationError('');
				}
			});
		}

		return this.#container;
	}

	renderTo(target: HTMLElement): void
	{
		Dom.append(this.render(), target);
	}

	isEmpty(): boolean
	{
		return !this.#contactsInput.getInput().getValue();
	}

	isInvitationRowEmpty(): boolean
	{
		return !Type.isStringFilled(this.getContactsValue());
	}

	getValue(): { [key: string]: string }
	{
		const result = this.#contactsInput.getValue();
		const lastName = this.#lastNameInput?.getValue();
		const name = this.#nameInput?.getValue();

		if (Type.isStringFilled(lastName))
		{
			result.LAST_NAME = lastName;
		}

		if (Type.isStringFilled(name))
		{
			result.NAME = name;
		}

		return result;
	}

	getContactsValue(): string
	{
		return this.#contactsInput.getInput().getValue();
	}

	setContactsError(error: string): void
	{
		this.#contactsInput.setError(error);
	}

	setInvitationError(error: string): void
	{
		if (!Type.isStringFilled(error))
		{
			this.#invitationErrors = [];
		}
		else if (!this.#invitationErrors.includes(error))
		{
			this.#invitationErrors.push(error);
		}

		syncFieldErrorMessage(this.#getTestId(), this.#invitationErrors.join(' '), false);
		this.#syncInvitationErrorState();
	}

	hasInvitationError(): boolean
	{
		return this.#invitationErrors.length > 0;
	}

	hasError(): boolean
	{
		return this.#contactsInput.hasError()
			|| this.#lastNameInput?.hasError() === true
			|| this.#nameInput?.hasError() === true
			|| this.hasInvitationError()
		;
	}

	restoreErrors(): void
	{
		this.#contactsInput.restoreError();
		this.#lastNameInput?.restoreError();
		this.#nameInput?.restoreError();
		syncFieldErrorMessage(this.#getTestId(), this.#invitationErrors.join(' '), false);
		this.#syncInvitationErrorState();
	}

	validate(): boolean
	{
		return this.#contactsInput.validate();
	}

	focusFirstErrorInput(): boolean
	{
		if (this.#contactsInput.hasError())
		{
			this.#contactsInput.focus();

			return true;
		}

		if (this.#lastNameInput?.hasError())
		{
			this.#lastNameInput.focus();

			return true;
		}

		if (this.#nameInput?.hasError())
		{
			this.#nameInput.focus();

			return true;
		}

		if (this.hasInvitationError())
		{
			FocusNavigator.focusContainer(this.render(), { focusVisible: true });

			return true;
		}

		return false;
	}

	clear(): void
	{
		this.#contactsInput.getInput().setValue('');
		this.#contactsInput.setError('');
		this.#lastNameInput?.clear();
		this.#nameInput?.clear();
		this.setInvitationError('');
	}

	#getTestId(): string
	{
		return `invitation-input-row-${this.#id}`;
	}

	#syncInvitationErrorState(): void
	{
		const container = this.render();
		if (this.hasInvitationError())
		{
			Dom.attr(container, {
				'aria-invalid': 'true',
				'aria-describedby': getFieldErrorMessageId(this.#getTestId()),
			});

			return;
		}

		container.removeAttribute('aria-invalid');
		container.removeAttribute('aria-describedby');
	}
}
