import { Type } from 'main.core';

import { type FieldsConfig, formatFieldsWithConfig } from '../../../../utils/validate';

export const tariffRestrictionsFieldsConfig: FieldsConfig = [
	{
		fieldName: 'fullChatHistory',
		targetFieldName: 'fullChatHistory',
		checkFunction: Type.isPlainObject,
		formatFunction: (target) => formatFieldsWithConfig(target, tariffFullChatHistoryFieldsConfig),
	},
	{
		fieldName: 'collab',
		targetFieldName: 'collabV2',
		checkFunction: Type.isPlainObject,
		formatFunction: (target) => formatFieldsWithConfig(target, tariffCollabFieldsConfig),
	},
];

const tariffFullChatHistoryFieldsConfig: FieldsConfig = [
	{
		fieldName: 'isAvailable',
		targetFieldName: 'isAvailable',
		checkFunction: Type.isBoolean,
	},
	{
		fieldName: 'limitDays',
		targetFieldName: 'limitDays',
		checkFunction: Type.isNumber,
	},
];

const tariffCollabFieldsConfig: FieldsConfig = [
	{
		fieldName: 'isAvailable',
		targetFieldName: 'isAvailable',
		checkFunction: Type.isBoolean,
	},
	{
		fieldName: 'isCopyAvailable',
		targetFieldName: 'isCopyAvailable',
		checkFunction: Type.isBoolean,
	},
];
