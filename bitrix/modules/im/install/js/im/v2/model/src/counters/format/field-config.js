import { Type } from 'main.core';

import type { FieldsConfig } from '../../utils/validate';

export const counterFieldsConfig: FieldsConfig = [
	{
		fieldName: 'chatId',
		targetFieldName: 'chatId',
		checkFunction: Type.isNumber,
	},
	{
		fieldName: 'parentChatId',
		targetFieldName: 'parentChatId',
		checkFunction: Type.isNumber,
	},
	{
		fieldName: 'counter',
		targetFieldName: 'counter',
		checkFunction: Type.isNumber,
	},
	{
		fieldName: 'isMarkedAsUnread',
		targetFieldName: 'isMarkedAsUnread',
		checkFunction: Type.isBoolean,
	},
	{
		fieldName: 'isMuted',
		targetFieldName: 'isMuted',
		checkFunction: Type.isBoolean,
	},
	{
		fieldName: 'recentSections',
		targetFieldName: 'recentSections',
		checkFunction: Type.isArray,
	},
];
