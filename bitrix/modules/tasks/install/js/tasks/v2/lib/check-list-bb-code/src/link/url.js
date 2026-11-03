import { Type } from 'main.core';

// eslint-disable-next-line no-control-regex
const AttributeWhitespaces = /[\u0000-\u0020\u00A0\u1680\u180E\u2000-\u2029\u205F\u3000]/g;
const HttpUrl = /^https?:\/\//i;
const ProtocolRelativeUrl = /^\/\//;
const ExplicitScheme = /^[a-z][\d+.a-z-]*:/i;

export class CheckListUrl
{
	static sanitize(url: string): string
	{
		if (!Type.isStringFilled(url))
		{
			return '';
		}

		const normalizedUrl = url.replaceAll(AttributeWhitespaces, '');

		return this.sanitizeHttpUrl(normalizedUrl);
	}

	static sanitizeHttpUrl(url: string): string
	{
		const httpUrl = this.prepareHttpUrl(url);
		if (!httpUrl)
		{
			return '';
		}

		try
		{
			const parsedUrl = new URL(httpUrl);
			const hasAllowedProtocol = parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
			const hasValidHost = parsedUrl.hostname.includes('.') || parsedUrl.hostname === 'localhost';

			return hasAllowedProtocol && hasValidHost ? httpUrl : '';
		}
		catch
		{
			return '';
		}
	}

	static prepareHttpUrl(url: string): string
	{
		if (HttpUrl.test(url))
		{
			return url;
		}

		if (ProtocolRelativeUrl.test(url))
		{
			return `https:${url}`;
		}

		if (ExplicitScheme.test(url))
		{
			return '';
		}

		return `https://${url}`;
	}
}
