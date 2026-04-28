import { Loc } from 'main.core';
import { Input, InputDesign } from 'ui.system.input';
import { InputRow } from './elements/input-row';
import InviteType from './type/invite-type';
import { ContactsInput } from './elements/inputs/contacts-input';
import { EmailInput } from './elements/inputs/email-input';
import { PhoneInput } from './elements/inputs/phone-input';
import { EmailOrPhoneInput } from './elements/inputs/email-or-phone-input';

export type InputRowFactoryType = {
	inviteType?: InviteType,
}

export class InputRowFactory
{
	#inviteType: InviteType;

	constructor(params: InputRowFactoryType)
	{
		this.#inviteType = params.inviteType ?? InviteType.ALL;
	}

	createInputsRow(id: number): InputRow
	{
		return new InputRow({
			id,
			contactsInput: this.#createContactsInput(),
			nameInput: this.#createNameInput(),
			lastNameInput: this.#createLastNameInput(),
		});
	}

	#createContactsInput(): ContactsInput
	{
		switch (this.#inviteType)
		{
			case InviteType.EMAIL:
				return new EmailInput();
			case InviteType.PHONE:
				return new PhoneInput();
			case InviteType.All:
			default:
				return new EmailOrPhoneInput();
		}
	}

	#createNameInput(): Input
	{
		return new Input({
			placeholder: Loc.getMessage('BX24_INVITE_DIALOG_ADD_NAME_PLACEHOLDER'),
			design: InputDesign.Grey,
			withClear: true,
			dataTestId: 'invite-page-name-input',
		});
	}

	#createLastNameInput(): Input
	{
		return new Input({
			placeholder: Loc.getMessage('BX24_INVITE_DIALOG_ADD_LAST_NAME_PLACEHOLDER'),
			design: InputDesign.Grey,
			withClear: true,
			dataTestId: 'invite-page-last-name-input',
		});
	}
}
