import { Type } from 'main.core';

function getSafeUrl(url: string): string | null
{
	if (!url || !Type.isString(url))
	{
		return null;
	}

	const trimmedUrl = url.trim();

	const allowedProtocols = ['https://'];
	const isSafeProtocol = allowedProtocols.some((protocol) => trimmedUrl.startsWith(protocol));

	if (!isSafeProtocol)
	{
		return null;
	}

	return trimmedUrl;
}

export function getBackgroundImage(url: string): Object
{
	const safeUrl = getSafeUrl(url);
	if (!safeUrl)
	{
		return {};
	}

	return {
		'background-image': `url('${safeUrl}')`,
	};
}
