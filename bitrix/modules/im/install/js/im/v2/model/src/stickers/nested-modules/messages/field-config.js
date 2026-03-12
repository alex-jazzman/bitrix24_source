import { Type } from 'main.core';

import { isNumberOrString, type FieldsConfig } from 'im.v2.model';

export const stickerMessagesConfig: FieldsConfig = [
	{
		fieldName: 'messageId',
		targetFieldName: 'messageId',
		checkFunction: isNumberOrString,
	},
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
