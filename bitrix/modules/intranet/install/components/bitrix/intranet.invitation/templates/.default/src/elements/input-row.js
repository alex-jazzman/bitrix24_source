import { Dom, Tag, Type } from 'main.core';
import { ContactsInput } from './inputs/contacts-input';

export type InputRowOptions = {
	id: number,
	contactsInput: ContactsInput;
}

export class InputRow
{
	#container: HTMLElement;
	#contactsInput: ContactsInput;
	#id: number;

	constructor(options: InputRowOptions)
	{
		this.#id = options.id;
		this.#contactsInput = options.contactsInput;
	}

	render(): HTMLElement
	{
		this.#container ??= Tag.render`
			<div data-test-id="invite-input-row${this.#id}" class="intranet-invite-form-row">
				${this.#contactsInput.getInput().render()}
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

	getValue(): Object
	{
		return this.#contactsInput.getValue();
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
	}
}
