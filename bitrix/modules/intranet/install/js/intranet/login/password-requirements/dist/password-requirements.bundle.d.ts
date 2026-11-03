/* eslint-disable */
type PasswordRequirementsPolicy = {
	minPasswordSize: number;
	isDigitRequired: boolean;
	isUpperCaseRequired: boolean;
	isLowerCaseRequired: boolean;
	isSpecialCharsRequired: boolean;
	specialChars: string;
};

type PasswordRequirementsValidationResult = 'neutral' | 'valid' | 'invalid';

declare namespace BX.Intranet.Login {
	function validatePasswordRequirements(password: string, policy: PasswordRequirementsPolicy | null | undefined): PasswordRequirementsValidationResult;
}
