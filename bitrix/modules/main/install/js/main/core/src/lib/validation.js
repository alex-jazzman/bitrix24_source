import Type from './type';

/**
 * Checks if the given value is a valid email address.
 * Supports Cyrillic characters in both local and domain parts.
 *
 * @param {any} email The value to validate.
 * @returns {boolean} True if the value is a valid email, false otherwise.
 * @memberOf BX
 */
export default class Validation
{
	static MAX_EMAIL_LENGTH = 254;
	static MAX_LOCAL_LENGTH = 64;
	static LOCAL_ALLOWED_CHARS = /^[\w%+.ЁА-яё-]+$/;
	static DOMAIN_LABEL_CHARS = /^[\w.ЁА-яё-]+$/;

	static isEmail(email: mixed): boolean
	{
		if (!Type.isStringFilled(email))
		{
			return false;
		}

		if (email.length > Validation.MAX_EMAIL_LENGTH)
		{
			return false;
		}

		const atPos: number = email.indexOf('@');
		if (
			atPos <= 0
			|| atPos === email.length - 1
			|| email.includes('@', atPos + 1)
		)
		{
			return false;
		}

		const local: string = email.slice(0, atPos);
		const domain: string = email.slice(atPos + 1);

		if (!Validation.LOCAL_ALLOWED_CHARS.test(local))
		{
			return false;
		}

		if (
			local.startsWith('.')
			|| local.endsWith('.')
			|| local.startsWith('-')
			|| local.endsWith('-')
			|| local.includes('..')
			|| local.length > Validation.MAX_LOCAL_LENGTH
		)
		{
			return false;
		}

		if (!Validation.DOMAIN_LABEL_CHARS.test(domain))
		{
			return false;
		}

		if (
			domain.startsWith('.')
			|| domain.endsWith('.')
			|| domain.includes('..')
		)
		{
			return false;
		}

		const labels: Array<string> = domain.split('.');
		if (labels.length < 2)
		{
			return false;
		}

		const tld = labels[labels.length - 1];
		if (tld.length < 2 || tld.length > 24)
		{
			return false;
		}

		for (const label of labels)
		{
			if (label.startsWith('-') || label.endsWith('-'))
			{
				return false;
			}

			const startsWithLetterOrDigit = /^[\dA-Za-zЁА-яё]/.test(label);
			const endsWithLetterOrDigit = /[\dA-Za-zЁА-яё]$/.test(label);

			if (!startsWithLetterOrDigit || !endsWithLetterOrDigit)
			{
				return false;
			}
		}

		return true;
	}
}
