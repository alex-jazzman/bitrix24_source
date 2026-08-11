import { InputRow, type InputRowOptions } from './elements/input-row';
import InviteType from './type/invite-type';
import { ContactsInput } from './elements/inputs/contacts-input';
import { EmailInput } from './elements/inputs/email-input';
import { PhoneInput } from './elements/inputs/phone-input';
import { EmailOrPhoneInput } from './elements/inputs/email-or-phone-input';
import { NameInput } from './elements/inputs/name-input';
import { LastNameInput } from './elements/inputs/last-name-input';

export type InputRowFactoryType = {
	inviteType?: InviteType,
	withProfileNameFields?: boolean,
}

export class InputRowFactory
{
	#inviteType: InviteType;
	#nextId: number = 0;
	#withProfileNameFields: boolean;

	constructor(params: InputRowFactoryType)
	{
		this.#inviteType = params.inviteType ?? InviteType.ALL;
		this.#withProfileNameFields = params.withProfileNameFields === true;
	}

	createInputsRow(id?: number): InputRow
	{
		const rowId = typeof id === 'number' ? id : this.#nextId;
		this.#nextId = Math.max(this.#nextId, rowId + 1);

		const options: InputRowOptions = {
			id: rowId,
			contactsInput: this.#createContactsInput(rowId),
		};

		if (this.#withProfileNameFields)
		{
			options.lastNameInput = new LastNameInput(`invite-input-row${rowId}-last-name-input`);
			options.nameInput = new NameInput(`invite-input-row${rowId}-name-input`);
		}

		return new InputRow(options);
	}

	#createContactsInput(rowId: number): ContactsInput
	{
		switch (this.#inviteType)
		{
			case InviteType.EMAIL:
				return new EmailInput(`invite-input-row${rowId}-email-input`);
			case InviteType.PHONE:
				return new PhoneInput(`invite-input-row${rowId}-phone-input`);
			case InviteType.All:
			default:
				return new EmailOrPhoneInput(`invite-input-row${rowId}-contact-input`);
		}
	}
}
