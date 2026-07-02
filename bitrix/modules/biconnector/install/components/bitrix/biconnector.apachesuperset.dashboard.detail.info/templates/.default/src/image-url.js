import { Type } from 'main.core';

export function normalizeImageUrl(url: any): string
{
	if (!Type.isStringFilled(url))
	{
		return '';
	}

	const normalizedUrl = url.trim();
	if (!Type.isStringFilled(normalizedUrl))
	{
		return '';
	}

	const isRootRelative = normalizedUrl.startsWith('/');
	const hasScheme = /^[a-z][a-z\d+\-.]*:/i.test(normalizedUrl);
	if (!isRootRelative && !hasScheme)
	{
		return '';
	}

	try
	{
		const parsedUrl = new URL(normalizedUrl, window.location.origin);
		const protocol = parsedUrl.protocol.toLowerCase();
		if (protocol !== 'http:' && protocol !== 'https:')
		{
			return '';
		}
	}
	catch (error)
	{
		return '';
	}

	return normalizedUrl;
}
