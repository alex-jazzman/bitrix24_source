import { Type } from 'main.core';

import { type FieldsConfig } from 'im.v2.model';

const ALLOWED_VOTE_VALUES = new Set(['like', 'dislike']);

export const votesFieldsConfig: FieldsConfig = [
	{
		fieldName: 'messageId',
		targetFieldName: 'messageId',
		checkFunction: (value) => Type.isNumber(value) && value > 0,
	},
	{
		fieldName: 'value',
		targetFieldName: 'value',
		checkFunction: (value) => Type.isString(value) && ALLOWED_VOTE_VALUES.has(value),
	},
];
