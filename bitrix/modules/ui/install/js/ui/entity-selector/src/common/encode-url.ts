import { Type } from 'main.core';

const regexp = /^data:((?:\w+\/(?:(?!;).)+)?)((?:;[\W\w]*?[^;])*),(.+)$/;

const isDataUri = (str: string): boolean => {
	return Type.isString(str) ? str.match(regexp) !== null : false;
};

export function encodeUrl(url: string): string
{
	if (isDataUri(url))
	{
		return url;
	}

	return encodeURI(url);
}
