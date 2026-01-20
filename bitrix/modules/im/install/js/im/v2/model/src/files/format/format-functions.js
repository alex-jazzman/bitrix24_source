import { Type } from 'main.core';

import { Core } from 'im.v2.application.core';
import { Utils } from 'im.v2.lib.utils';

import type { JsonObject } from 'main.core';

export const prepareIconType = (file: JsonObject): string => {
	const extension = file.extension.toString();

	if (file.type === 'image')
	{
		return 'img';
	}

	if (file.type === 'video')
	{
		return 'mov';
	}

	return Utils.file.getIconTypeByExtension(extension);
};

export const prepareImage = (image: { width: number, height: number }): { width: number, height: number } | boolean => {
	let result = {
		width: 0,
		height: 0,
	};

	if (Type.isString(image.width) || Type.isNumber(image.width))
	{
		result.width = Number.parseInt(image.width, 10);
	}

	if (Type.isString(image.height) || Type.isNumber(image.height))
	{
		result.height = Number.parseInt(image.height, 10);
	}

	if (result.width <= 0 || result.height <= 0)
	{
		result = false;
	}

	return result;
};

export const prepareUrl = (url: string): string => {
	if (
		!url
		|| url.startsWith('http')
		|| url.startsWith('bx')
		|| url.startsWith('file')
		|| url.startsWith('blob')
	)
	{
		return url;
	}

	return Core.getHost() + url;
};
