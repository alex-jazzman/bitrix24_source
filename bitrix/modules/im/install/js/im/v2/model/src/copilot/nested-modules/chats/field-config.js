import { Type } from 'main.core';

import { CopilotMcpSelectionStatus } from 'im.v2.const';
import type { FieldsConfig } from 'im.v2.model';

export const chatFieldsConfig: FieldsConfig = [
	{
		fieldName: 'dialogId',
		targetFieldName: 'dialogId',
		checkFunction: Type.isString,
	},
	{
		fieldName: 'role',
		targetFieldName: 'role',
		checkFunction: Type.isString,
	},
	{
		fieldName: 'engine',
		targetFieldName: 'aiModel',
		checkFunction: Type.isString,
	},
	{
		fieldName: 'titleIsCustom',
		targetFieldName: 'titleIsCustom',
		checkFunction: Type.isBoolean,
	},
	{
		fieldName: 'mcpAuth',
		targetFieldName: 'mcpAuth',
		// null is the server saying the selection is cleared, so it has to reach the store too
		checkFunction: [Type.isPlainObject, Type.isNull],
		formatFunction: (target) => {
			if (!target)
			{
				return null;
			}

			return {
				id: target.id,
				name: target.name,
				icon: target.icon ?? null,
			};
		},
	},
	{
		fieldName: 'mcpAuth',
		targetFieldName: 'mcpSelectionStatus',
		checkFunction: [Type.isPlainObject, Type.isNull],
		formatFunction: (target) => {
			return target?.available === false
				? CopilotMcpSelectionStatus.unavailable
				: CopilotMcpSelectionStatus.ready;
		},
	},
];
