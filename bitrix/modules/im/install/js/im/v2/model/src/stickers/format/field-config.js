import { Type } from 'main.core';

import type { FieldsConfig } from 'im.v2.model';

export const stickerFieldsConfig: FieldsConfig = [
	{
		fieldName: 'id',
		targetFieldName: 'id',
		checkFunction: Type.isNumber,
	},
	{
		fieldName: 'packId',
		targetFieldName: 'packId',
		checkFunction: Type.isNumber,
	},
	{
		fieldName: 'packType',
		targetFieldName: 'packType',
		checkFunction: Type.isString,
	},
	{
		fieldName: 'uri',
		targetFieldName: 'uri',
		checkFunction: Type.isString,
	},
	{
		fieldName: 'type',
		targetFieldName: 'type',
		checkFunction: Type.isString,
	},
	{
		fieldName: 'width',
		targetFieldName: 'width',
		checkFunction: Type.isNumber,
	},
	{
		fieldName: 'height',
		targetFieldName: 'height',
		checkFunction: Type.isNumber,
	},
	{
		fieldName: 'sort',
		targetFieldName: 'sort',
		checkFunction: Type.isNumber,
	},
];
