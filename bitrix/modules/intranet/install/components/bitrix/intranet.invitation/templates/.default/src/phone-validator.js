const PHONE_REGEX = /^[\d+][\d ()-]{4,22}\d$/;

export class PhoneValidator
{
	static isValid(phone: string): boolean
	{
		return PHONE_REGEX.test(phone);
	}
}
