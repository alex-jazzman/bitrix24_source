import { Type } from 'main.core';

export const getExtensionFromType = (type: string): string => {
	if (!Type.isStringFilled(type))
	{
		return '';
	}

	const subtype = type.split('/').pop() as string;

	if (/javascript/.test(subtype))
	{
		return 'js';
	}

	if (/plain/.test(subtype))
	{
		return 'txt';
	}

	if (/svg/.test(subtype))
	{
		return 'svg';
	}

	if (/[a-z]+/.test(subtype))
	{
		return subtype;
	}

	return '';
};
