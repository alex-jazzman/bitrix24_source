import Type from '../type';

export default class Cookie
{
	/**
	 * Gets cookies list for current domain
	 * @return {object}
	 */
	static getList(): { [key: string]: string }
	{
		return document.cookie
			.split(';')
			.map((item) => item.split('='))
			.map((item) => item.map((subItem) => subItem.trim()))
			.reduce((acc: Record<string, string>, item) => {
				const [key, value] = item;
				acc[decodeURIComponent(key)] = decodeURIComponent(value);

				return acc;
			}, {});
	}

	/**
	 * Gets cookie value
	 * @param {string} name
	 * @return {*}
	 */
	static get(name: string): string | undefined
	{
		const cookiesList = Cookie.getList();

		if (name in cookiesList)
		{
			return cookiesList[name];
		}

		return undefined;
	}

	/**
	 * Sets cookie
	 * @param {string} name
	 * @param {*} value
	 * @param {object} [options]
	 */
	static set(name: string, value: any, options: Record<string, any> = {}): void
	{
		const attributes: Record<string, any> = {
			expires: '',
			...options,
		};

		if (Type.isNumber(attributes.expires))
		{
			const now = Date.now();
			const days = attributes.expires;
			const dayInMs = 864e5;
			attributes.expires = new Date(now + days * dayInMs);
		}

		if (Type.isDate(attributes.expires))
		{
			attributes.expires = attributes.expires.toUTCString();
		}

		const safeName = decodeURIComponent(String(name))
			.replaceAll(/%(23|24|26|2B|5E|60|7C)/g, decodeURIComponent)
			.replaceAll(/[()]/g, escape);

		const safeValue = encodeURIComponent(String(value)).replaceAll(
			/%(23|24|26|2B|3A|3C|3E|3D|2F|3F|40|5B|5D|5E|60|7B|7D|7C)/g,
			decodeURIComponent,
		);

		const stringifiedAttributes = Object.keys(attributes).reduce((acc, key) => {
			const attributeValue = attributes[key];

			if (!attributeValue)
			{
				return acc;
			}

			if (attributeValue === true)
			{
				return `${acc}; ${key}`;
			}

			/**
			 * Considers RFC 6265 section 5.2:
			 * ...
			 * 3. If the remaining unparsed-attributes contains a %x3B (';')
			 * character:
			 * Consume the characters of the unparsed-attributes up to,
			 * not including, the first %x3B (';') character.
			 */
			return `${acc}; ${key}=${attributeValue.split(';')[0]}`;
		}, '');

		document.cookie = `${safeName}=${safeValue}${stringifiedAttributes}`;
	}

	/**
	 * Removes cookie
	 * @param {string} name
	 * @param {object} [options]
	 */
	static remove(name: string, options: Record<string, any> = {}): void
	{
		Cookie.set(name, '', { ...options, expires: -1 });
	}
}
