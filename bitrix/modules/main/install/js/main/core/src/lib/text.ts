import Type from './type';

const reEscape = /["&'<>]/g;
const reUnescape = /&(?:amp|#38|lt|#60|gt|#62|apos|#39|quot|#34);/g;

const escapeEntities: Record<string, string> = {
	'&': '&amp;',
	'<': '&lt;',
	'>': '&gt;',
	"'": '&#39;',
	'"': '&quot;',
};

const unescapeEntities: Record<string, string> = {
	'&amp;': '&',
	'&#38;': '&',
	'&lt;': '<',
	'&#60;': '<',
	'&gt;': '>',
	'&#62;': '>',
	'&apos;': "'",
	'&#39;': "'",
	'&quot;': '"',
	'&#34;': '"',
};

/**
 * @memberOf BX
 */
export default class Text
{
	/**
	 * Encodes all unsafe entities
	 * @param {string} value
	 * @return {string}
	 */
	static encode(value: string): string
	{
		if (Type.isString(value))
		{
			return value.replaceAll(reEscape, (item) => escapeEntities[item]);
		}

		return value;
	}

	/**
	 * Decodes all encoded entities
	 * @param {string} value
	 * @return {string}
	 */
	static decode(value: string): string
	{
		if (Type.isString(value))
		{
			return value.replaceAll(reUnescape, (item) => unescapeEntities[item]);
		}

		return value;
	}

	static getRandom(length: number = 8): string
	{
		return Array.from({ length }, () => Math.trunc(Math.random() * 36).toString(36)).join('');
	}

	static toNumber(value: unknown): number
	{
		const parsedValue = Number.parseFloat(String(value));

		if (Type.isNumber(parsedValue))
		{
			return parsedValue;
		}

		return 0;
	}

	static toInteger(value: unknown): number
	{
		return Text.toNumber(Number.parseInt(String(value), 10));
	}

	static toBoolean(value: unknown, trueValues: readonly unknown[] = []): boolean
	{
		const transformedValue = Type.isString(value) ? value.toLowerCase() : value;
		const truthyValues: unknown[] = ['true', 'y', '1', 1, true, ...trueValues];

		return truthyValues.includes(transformedValue);
	}

	static toCamelCase(str: string): string
	{
		if (!Type.isStringFilled(str))
		{
			return str;
		}

		const regex = /[\s_-]+(.)?/g;
		if (!regex.test(str))
		{
			return /^[A-Z]+$/.test(str) ? str.toLowerCase() : str[0].toLowerCase() + str.slice(1);
		}

		const result = str.toLowerCase().replaceAll(regex, (match, letter) => {
			return letter ? letter.toUpperCase() : '';
		});

		return result[0].toLowerCase() + result.slice(1);
	}

	static toPascalCase(str: string): string
	{
		if (!Type.isStringFilled(str))
		{
			return str;
		}

		return this.capitalize(this.toCamelCase(str));
	}

	static toKebabCase(str: string): string
	{
		if (!Type.isStringFilled(str))
		{
			return str;
		}

		const matches = str.match(/[A-Z]{2,}(?=[A-Z][a-z]+\d*|\b)|[A-Z]?[a-z]+\d*|[A-Z]|\d+/g);
		if (!matches)
		{
			return str;
		}

		return matches.map((x) => x.toLowerCase()).join('-');
	}

	static capitalize(str: string): string
	{
		if (!Type.isStringFilled(str))
		{
			return str;
		}

		return str[0].toUpperCase() + str.slice(1);
	}
}
