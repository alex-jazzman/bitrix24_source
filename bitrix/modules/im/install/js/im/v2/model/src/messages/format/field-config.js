import { Type } from 'main.core';

import { CopilotSimpleReasoningPlanField } from 'im.v2.const';
import { prepareReasoningPlan } from 'im.v2.lib.copilot-simple-status';
import { Utils } from 'im.v2.lib.utils';
import { type FieldsConfig } from 'im.v2.model';
import { MessageManager } from 'im.v2.lib.message';

import { convertToNumber, convertToString, isNumberOrString } from '../../utils/format';
import { prepareComponentId, prepareAuthorId, prepareKeyboard } from './format-functions';

export const messageFieldsConfig: FieldsConfig = [
	{
		fieldName: ['id', 'temporaryId'],
		targetFieldName: 'id',
		checkFunction: [Type.isNumber, MessageManager.isTempMessage],
	},
	{
		fieldName: 'chatId',
		targetFieldName: 'chatId',
		checkFunction: isNumberOrString,
		formatFunction: convertToNumber,
	},
	{
		fieldName: 'date',
		targetFieldName: 'date',
		checkFunction: [Type.isString, Type.isDate],
		formatFunction: Utils.date.cast,
	},
	{
		fieldName: 'text',
		targetFieldName: 'text',
		checkFunction: isNumberOrString,
		formatFunction: convertToString,
	},
	{
		fieldName: ['senderId', 'authorId'],
		targetFieldName: 'authorId',
		checkFunction: isNumberOrString,
		formatFunction: prepareAuthorId,
	},
	{
		fieldName: 'sending',
		targetFieldName: 'sending',
		checkFunction: Type.isBoolean,
	},
	{
		fieldName: 'unread',
		targetFieldName: 'unread',
		checkFunction: Type.isBoolean,
	},
	{
		fieldName: 'viewed',
		targetFieldName: 'viewed',
		checkFunction: Type.isBoolean,
	},
	{
		fieldName: 'viewedByOthers',
		targetFieldName: 'viewedByOthers',
		checkFunction: Type.isBoolean,
	},
	{
		fieldName: 'error',
		targetFieldName: 'error',
		checkFunction: Type.isBoolean,
	},
	{
		fieldName: 'sendingTs',
		targetFieldName: 'sendingTs',
		checkFunction: isNumberOrString,
		formatFunction: convertToNumber,
	},
	{
		fieldName: 'componentId',
		targetFieldName: 'componentId',
		checkFunction: (target): boolean => {
			return Type.isString(target) && target !== '';
		},
		formatFunction: prepareComponentId,
	},
	{
		fieldName: 'componentParams',
		targetFieldName: 'componentParams',
		checkFunction: Type.isPlainObject,
	},
	{
		fieldName: ['files', 'fileId'],
		targetFieldName: 'files',
		checkFunction: Type.isArray,
	},
	{
		fieldName: 'attach',
		targetFieldName: 'attach',
		checkFunction: [Type.isArray, Type.isBoolean, Type.isString],
	},
	{
		fieldName: 'keyboard',
		targetFieldName: 'keyboard',
		checkFunction: Type.isArray,
		formatFunction: prepareKeyboard,
	},
	{
		fieldName: 'keyboard',
		targetFieldName: 'keyboard',
		checkFunction: (target): boolean => target === 'N',
		formatFunction: (): [] => [],
	},
	{
		fieldName: 'isEdited',
		targetFieldName: 'isEdited',
		checkFunction: Type.isString,
		formatFunction: (target): boolean => target === 'Y',
	},
	{
		fieldName: 'isEdited',
		targetFieldName: 'isEdited',
		checkFunction: Type.isBoolean,
	},
	{
		fieldName: 'isDeleted',
		targetFieldName: 'isDeleted',
		checkFunction: Type.isString,
		formatFunction: (target): boolean => target === 'Y',
	},
	{
		fieldName: 'isDeleted',
		targetFieldName: 'isDeleted',
		checkFunction: Type.isBoolean,
	},
	{
		fieldName: 'replyId',
		targetFieldName: 'replyId',
		checkFunction: isNumberOrString,
		formatFunction: convertToNumber,
	},
	{
		fieldName: 'forward',
		targetFieldName: 'forward',
		checkFunction: Type.isPlainObject,
	},
	{
		fieldName: 'langfuseTraceId',
		targetFieldName: 'langfuseTraceId',
		checkFunction: isNumberOrString,
		formatFunction: convertToString,
	},
	{
		fieldName: CopilotSimpleReasoningPlanField,
		targetFieldName: CopilotSimpleReasoningPlanField,
		// No check: a value that fails one skips the write and leaves the previous plan on the message,
		// while any value of the param has to reset the field. The format function is the single gate.
		formatFunction: prepareReasoningPlan,
	},
];
