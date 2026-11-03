import { Loc } from 'main.core';

import { PhoneValidator } from '../../phone-validator';
import { ContactsInput } from './contacts-input';

export class PhoneInput extends ContactsInput
{
	getValue(): Object
	{
		return { PHONE: this.getInput().getValue() };
	}

	isValidValue(value: string): boolean
	{
		return PhoneValidator.isValid(value);
	}

	getPlaceholder(): string
	{
		return Loc.getMessage('INTRANET_INVITE_DIALOG_TITLE_PHONE');
	}

	getType(): string
	{
		return 'tel';
	}

	getAutocomplete(): string
	{
		return 'tel';
	}

	getValidationErrorMessage(): string
	{
		return Loc.getMessage('INTRANET_INVITE_DIALOG_VALIDATE_ERROR_PHONE');
	}
}
