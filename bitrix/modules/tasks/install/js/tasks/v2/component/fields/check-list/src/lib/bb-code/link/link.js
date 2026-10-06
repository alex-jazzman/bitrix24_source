import { Type } from 'main.core';

import { UrlClose, UrlOpenPrefix } from '../const';
import { CheckListUrl } from './url';

export class CheckListLink
{
	static buildSource(url: string, text: string): string
	{
		const safeUrl = CheckListUrl.sanitize(url);
		if (!safeUrl)
		{
			return '';
		}

		const linkText = (Type.isStringFilled(text) ? text : safeUrl).replace(/\[\/?url(?:=[^\]]*)?]/gi, '');

		return `${UrlOpenPrefix}${safeUrl}]${linkText}${UrlClose}`;
	}
}
