import { Type } from 'main.core';

import type { FieldsConfig } from 'im.v2.model';

export const recentStickerConfig: FieldsConfig = [
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
];
