export type PasswordRequirementsPolicy = {
	minPasswordSize: number,
	isDigitRequired: boolean,
	isUpperCaseRequired: boolean,
	isLowerCaseRequired: boolean,
	isSpecialCharsRequired: boolean,
	specialChars: string,
};

export type PasswordRequirementsValidationResult = 'neutral' | 'valid' | 'invalid';

export function validatePasswordRequirements(
	password: string,
	policy: PasswordRequirementsPolicy | null | undefined,
): PasswordRequirementsValidationResult
{
	if (password === '' || policy === null || policy === undefined)
	{
		return 'neutral';
	}

	if ([...password].length < policy.minPasswordSize)
	{
		return 'invalid';
	}

	if (policy.isUpperCaseRequired && !/[A-Z]/.test(password))
	{
		return 'invalid';
	}

	if (policy.isLowerCaseRequired && !/[a-z]/.test(password))
	{
		return 'invalid';
	}

	if (policy.isDigitRequired && !/\d/.test(password))
	{
		return 'invalid';
	}

	if (
		policy.isSpecialCharsRequired
		&& ![...password].some((character: string): boolean => policy.specialChars.includes(character))
	)
	{
		return 'invalid';
	}

	return 'valid';
}
