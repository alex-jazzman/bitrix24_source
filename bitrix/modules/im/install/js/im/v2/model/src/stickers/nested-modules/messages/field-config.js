import { Type } from 'main.core';

import { isNumberOrString } from '../../../utils/format';

import type { FieldsConfig } from '../../../utils/validate';

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
