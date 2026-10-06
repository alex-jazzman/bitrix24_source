import {Type} from 'main.core';

/**
 * Releases an object URL if the given source is one.
 *
 * @param {string} url
 */
export default function revokeObjectUrl(url)
{
	if (Type.isStringFilled(url) && url.startsWith('blob:'))
	{
		URL.revokeObjectURL(url);
	}
}
