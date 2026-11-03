import { Type } from 'main.core';

import { formatFieldsWithConfig, type FieldsConfig } from 'im.v2.model';
import { FolderType, RecentType, SystemFolderCode } from 'im.v2.const';

const folderCodes = Object.values(SystemFolderCode);

const isValidFolderType = (type) => Boolean(FolderType[type]);
const isValidFolderCode = (code) => folderCodes.includes(code);
const isValidRecentType = (type) => Object.values(RecentType).includes(type);

export const folderFieldsConfig: FieldsConfig = [
	{
		fieldName: 'id',
		targetFieldName: 'id',
		checkFunction: Type.isNumber,
	},
	{
		fieldName: 'sort',
		targetFieldName: 'sort',
		checkFunction: Type.isNumber,
	},
	{
		fieldName: 'type',
		targetFieldName: 'type',
		checkFunction: isValidFolderType,
	},
	{
		fieldName: 'code',
		targetFieldName: 'code',
		checkFunction: isValidFolderCode,
	},
	{
		fieldName: 'title',
		targetFieldName: 'title',
		checkFunction: Type.isStringFilled,
	},
	{
		fieldName: 'displaysNestedInRoot',
		targetFieldName: 'displaysNestedInRoot',
		checkFunction: Type.isBoolean,
	},
	{
		fieldName: 'visible',
		targetFieldName: 'visible',
		checkFunction: Type.isBoolean,
	},
	{
		fieldName: 'description',
		targetFieldName: 'description',
		checkFunction: Type.isString,
	},
	{
		fieldName: 'definition',
		targetFieldName: 'definition',
		checkFunction: Type.isPlainObject,
		formatFunction: (target) => formatFieldsWithConfig(target, folderDefinitionFieldConfig),
	},
];

const isValidChat = (chat) => {
	return Type.isPlainObject(chat) && Type.isNumber(chat.chatId) && Type.isStringFilled(chat.dialogId);
};

const folderDefinitionFieldConfig: FieldsConfig = [
	{
		fieldName: 'recentSection',
		targetFieldName: 'recentSection',
		checkFunction: isValidRecentType,
	},
	{
		fieldName: 'chats',
		targetFieldName: 'chats',
		checkFunction: Type.isArray,
		formatFunction: (chats) => chats.filter(isValidChat),
	},
	{
		fieldName: 'sourceFolders',
		targetFieldName: 'sourceFolders',
		checkFunction: Type.isArray,
		formatFunction: (sourceFolders) => sourceFolders.filter(Type.isStringFilled),
	},
	// 0 - roots only, null - every nesting level
	{
		fieldName: 'parentChatId',
		targetFieldName: 'parentChatId',
		checkFunction: [Type.isNumber, Type.isNull],
	},
];
