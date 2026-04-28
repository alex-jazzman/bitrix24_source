import { ContactsInput } from './contacts-input';
import { Loc, Validation } from 'main.core';

export class EmailInput extends ContactsInput
{
	getValue(): Object
	{
		return { EMAIL: this.getInput().getValue() };
	}

	isValidValue(value: string): boolean
	{
		return Validation.isEmail(value) && /^[^@]+@[^@]+\.[^@]+$/.test(value);
	}

	getPlaceholder(): string
	{
		return Loc.getMessage('INTRANET_INVITE_DIALOG_EMAIL_INPUT');
	}

	getValidationErrorMessage(): string
	{
		return Loc.getMessage('INTRANET_INVITE_DIALOG_VALIDATE_ERROR_EMAIL');
	}
}
