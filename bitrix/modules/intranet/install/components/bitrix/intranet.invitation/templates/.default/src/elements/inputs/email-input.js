import { Loc, Validation } from 'main.core';

import { ContactsInput } from './contacts-input';

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

	getType(): string
	{
		return 'email';
	}

	getAutocomplete(): string
	{
		return 'email';
	}

	getValidationErrorMessage(): string
	{
		return Loc.getMessage('INTRANET_INVITE_DIALOG_VALIDATE_ERROR_EMAIL');
	}
}
