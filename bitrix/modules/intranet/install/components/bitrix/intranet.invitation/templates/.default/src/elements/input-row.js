import { Dom, Tag, Type } from 'main.core';
import { Input } from 'ui.system.input';
import { ContactsInput } from './inputs/contacts-input';

export type InputRowOptions = {
	id: number,
	nameInput: Input;
	lastNameInput: Input;
	contactsInput: ContactsInput;
}

export class InputRow
{
	#container: HTMLElement;
	#nameInput: Input;
	#lastNameInput: Input;
	#contactsInput: ContactsInput;
	#id: number;

	constructor(options: InputRowOptions)
	{
		this.#id = options.id;
		this.#contactsInput = options.contactsInput;
		this.#nameInput = options.nameInput;
		this.#lastNameInput = options.lastNameInput;
	}

	render(): HTMLElement
	{
		this.#container ??= Tag.render`
			<div data-test-id="invite-input-row${this.#id}" class="intranet-invite-form-row">
				${this.#contactsInput.getInput().render()}
				${this.#nameInput.render()}
				${this.#lastNameInput.render()}
			</div>
		`;

		return this.#container;
	}

	renderTo(target: HTMLElement): void
	{
		Dom.append(this.render(), target);
	}

	isEmpty(): boolean
	{
		return !(
			this.#contactsInput.getInput().getValue()
			|| this.#nameInput.getValue()
			|| this.#lastNameInput.getValue()
		);
	}

	isInvitationRowEmpty(): boolean
	{
		return !Type.isStringFilled(this.getContactsValue());
	}

	getValue(): Object
	{
		return {
			NAME: this.#nameInput.getValue(),
			LAST_NAME: this.#lastNameInput.getValue(),
			...this.#contactsInput.getValue(),
		};
	}

	getContactsValue(): string
	{
		return this.#contactsInput.getInput().getValue();
	}

	setContactsError(error: string): void
	{
		this.#contactsInput.getInput().setError(error);
	}

	hasContactsError(): boolean
	{
		return Type.isStringFilled(this.#contactsInput.getInput().getError());
	}

	clear(): void
	{
		this.#contactsInput.getInput().setValue('');
		this.#nameInput.setValue('');
		this.#lastNameInput.setValue('');
	}
}
