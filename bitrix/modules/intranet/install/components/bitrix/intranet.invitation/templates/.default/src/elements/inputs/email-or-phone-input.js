import { ContactsInput } from './contacts-input';
import { Loc, Validation } from 'main.core';
import { PhoneValidator } from '../../phone-validator';

export class EmailOrPhoneInput extends ContactsInput
{
	getValue(): Object
	{
		const rawValue = this.getInput().getValue();

		return PhoneValidator.isValid(rawValue)
			? { PHONE: rawValue }
			: { EMAIL: rawValue };
	}

	isValidValue(value: string): boolean
	{
		return PhoneValidator.isValid(value) || (Validation.isEmail(value) && /^[^@]+@[^@]+\.[^@]+$/.test(value));
	}

	getPlaceholder(): string
	{
		return Loc.getMessage('INTRANET_INVITE_DIALOG_EMAIL_OR_PHONE_INPUT');
	}

	getValidationErrorMessage(): string
	{
		return Loc.getMessage('INTRANET_INVITE_DIALOG_VALIDATE_ERROR_EMAIL_AND_PHONE');
	}
}
