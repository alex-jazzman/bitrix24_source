import { Type } from 'main.core';

import type { FieldsConfig } from '../../utils/validate';

export const copilotFieldsConfig: FieldsConfig = [
	{
		fieldName: 'code',
		targetFieldName: 'code',
		checkFunction: Type.isString,
	},
	{
		fieldName: 'default',
		targetFieldName: 'default',
		checkFunction: Type.isBoolean,
	},
	{
		fieldName: 'recommended',
		targetFieldName: 'recommended',
		checkFunction: Type.isBoolean,
	},
	{
		fieldName: 'supportsReasoning',
		targetFieldName: 'supportsReasoning',
		checkFunction: Type.isBoolean,
	},
	{
		fieldName: 'name',
		targetFieldName: 'name',
		checkFunction: Type.isString,
	},
];
