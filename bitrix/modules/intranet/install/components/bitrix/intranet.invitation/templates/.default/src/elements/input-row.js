import { Dom, Tag, Type } from 'main.core';
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
				${this.#lastNameInput ? this.#lastNameInput.render() : ''}
				${this.#nameInput ? this.#nameInput.render() : ''}
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
		this.#contactsInput.getInput().setError(error);
	}

	hasContactsError(): boolean
	{
		return Type.isStringFilled(this.#contactsInput.getInput().getError());
	}

	clear(): void
	{
		this.#contactsInput.getInput().setValue('');
		this.#lastNameInput?.clear();
		this.#nameInput?.clear();
	}
}
