import { Type } from 'main.core';

import { Utils } from 'im.v2.lib.utils';

import type { FieldsConfig } from '../../../../utils/validate';

export const sidebarSharedLinkFieldsConfig: FieldsConfig = [
	{
		fieldName: 'id',
		targetFieldName: 'id',
		checkFunction: Type.isNumber,
	},
	{
		fieldName: 'code',
		targetFieldName: 'code',
		checkFunction: Type.isString,
	},
	{
		fieldName: 'dateCreate',
		targetFieldName: 'dateCreate',
		checkFunction: Type.isString,
		formatFunction: Utils.date.cast,
	},
	{
		fieldName: 'dateExpire',
		targetFieldName: 'dateExpire',
		checkFunction: Type.isString,
		formatFunction: Utils.date.cast,
	},
	{
		fieldName: 'entityId',
		targetFieldName: 'entityId',
		checkFunction: Type.isString,
	},
	{
		fieldName: 'entityType',
		targetFieldName: 'entityType',
		checkFunction: Type.isString,
	},
	{
		fieldName: 'requireApproval',
		targetFieldName: 'requireApproval',
		checkFunction: Type.isBoolean,
	},
	{
		fieldName: 'type',
		targetFieldName: 'type',
		checkFunction: Type.isString,
	},
	{
		fieldName: 'url',
		targetFieldName: 'url',
		checkFunction: Type.isString,
	},
];
