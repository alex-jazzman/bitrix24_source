import Type from './type';
import message from './loc/message';

/**
 * Implements interface for works with language messages
 * @memberOf BX
 */
export default class Loc
{
	/**
	 * Gets message by id
	 * @param {string} messageId
	 * @param {object} replacements
	 * @return {?string}
	 */
	static getMessage(messageId: string, replacements: Record<string, string> | null = null): string | null | undefined
	{
		let mess: string | null | undefined = message(messageId) as string | undefined;
		if (Type.isString(mess) && Type.isPlainObject(replacements))
		{
			const escape = (str: string): string => String(str).replaceAll(/[$()*+.?[\\\]^{|}]/g, '\\$&');
			Object.keys(replacements).forEach((replacement: string) => {
				const globalRegexp = new RegExp(escape(replacement), 'gi');
				mess = (mess as string).replaceAll(globalRegexp, () => {
					return Type.isNil(replacements[replacement]) ? '' : String(replacements[replacement]);
				});
			});
		}

		return mess;
	}

	static hasMessage(messageId: string): boolean
	{
		return Type.isString(messageId) && !Type.isNil((message as Record<string, unknown>)[messageId]);
	}

	/**
	 * Sets message or messages
	 * @param {string | Record<string, string>} id
	 * @param {string} [value]
	 */
	static setMessage(id: string | Record<string, string>, value?: string): void
	{
		if (Type.isString(id) && Type.isString(value))
		{
			message({ [id]: value });
		}

		if (Type.isObject(id))
		{
			message(id);
		}
	}

	/**
	 * Gets plural message by id and number
	 * @param {string} messageId
	 * @param {number} value
	 * @param {object} [replacements]
	 * @return {?string}
	 */
	static getMessagePlural(
		messageId: string,
		value: number,
		replacements: Record<string, string> | null = null,
	): string | null | undefined
	{
		let result: string | null | undefined = '';

		if (Type.isNumber(value))
		{
			if (this.hasMessage(`${messageId}_PLURAL_${this.getPluralForm(value)}`))
			{
				result = this.getMessage(`${messageId}_PLURAL_${this.getPluralForm(value)}`, replacements);
			}
			else
			{
				result = this.getMessage(`${messageId}_PLURAL_1`, replacements);
			}
		}
		else
		{
			result = this.getMessage(messageId, replacements);
		}

		return result;
	}

	/**
	 * Gets language plural form id by number
	 * see http://docs.translatehouse.org/projects/localization-guide/en/latest/l10n/pluralforms.html
	 * @param {number} value
	 * @param {string} [languageId]
	 * @return {?number}
	 */
	// eslint-disable-next-line sonarjs/cognitive-complexity
	static getPluralForm(value: number, languageId?: string): number
	{
		let pluralForm = 1;
		let lang = languageId;

		if (!Type.isStringFilled(lang))
		{
			lang = message('LANGUAGE_ID') as string;
		}

		const absValue = Math.abs(value);

		switch (lang)
		{
			case 'ar':
				pluralForm = absValue === 1 ? 0 : 1;
				/*
    				if (absValue === 0)
    				{
    					pluralForm = 0;
    				}
    				else if (absValue === 1)
    				{
    					pluralForm = 1;
    				}
    				else if (absValue === 2)
    				{
    					pluralForm = 2;
    				}
    				else if (
    					absValue % 100 >= 3
    					&& absValue % 100 <= 10
    				)
    				{
    					pluralForm = 3;
    				}
    				else if (absValue % 100 >= 11)
    				{
    					pluralForm = 4;
    				}
    				else
    				{
    					pluralForm = 5;
    				}
     */
				break;

			case 'br':
			case 'fr':
			case 'tr':
				pluralForm = absValue > 1 ? 1 : 0;
				break;

			case 'de':
			case 'en':
			case 'hi':
			case 'it':
			case 'la':
				pluralForm = absValue === 1 ? 0 : 1;
				break;

			case 'ru':
			case 'ua':
				if (absValue % 10 === 1 && absValue % 100 !== 11)
				{
					pluralForm = 0;
				}
				else if (absValue % 10 >= 2 && absValue % 10 <= 4 && (absValue % 100 < 10 || absValue % 100 >= 20))
				{
					pluralForm = 1;
				}
				else
				{
					pluralForm = 2;
				}
				break;

			case 'pl':
				if (absValue === 1)
				{
					pluralForm = 0;
				}
				else if (absValue % 10 >= 2 && absValue % 10 <= 4 && (absValue % 100 < 10 || absValue % 100 >= 20))
				{
					pluralForm = 1;
				}
				else
				{
					pluralForm = 2;
				}
				break;

			case 'id':
			case 'ja':
			case 'ms':
			case 'sc':
			case 'tc':
			case 'th':
			case 'vn':
				pluralForm = 0;
				break;

			default:
				pluralForm = 1;
				break;
		}

		return pluralForm;
	}
}
