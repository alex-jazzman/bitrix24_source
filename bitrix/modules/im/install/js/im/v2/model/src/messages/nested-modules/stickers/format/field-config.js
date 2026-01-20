import { Type } from 'main.core';

import { StickerManager } from 'im.v2.lib.sticker-manager';
import { Utils } from 'im.v2.lib.utils';

import { preparePackKey, prepareStickerKey, getStickersKeys } from './format-functions';

import type { FieldsConfig } from 'im.v2.model';

export const messageFieldsConfig: FieldsConfig = [
	{
		fieldName: ['id', 'temporaryId'],
		targetFieldName: 'messageId',
		checkFunction: [Type.isNumber, Utils.text.isTempMessage],
	},
	{
		fieldName: 'stickerParams',
		targetFieldName: 'key',
		checkFunction: Type.isPlainObject,
		formatFunction: (target) => {
			const { id, packId, packType } = target;

			return (new StickerManager()).makeStickerKey(id, packId, packType);
		},
	},
	{
		fieldName: 'sticker',
		targetFieldName: 'key',
		checkFunction: Type.isBoolean,
		formatFunction: (target) => {
			return target ? '' : null;
		},
	},
	{
		fieldName: 'stickerParams',
		targetFieldName: 'uri',
		checkFunction: Type.isPlainObject,
		formatFunction: (target) => {
			return Type.isStringFilled(target.uri) ? target.uri : '';
		},
	},
	{
		fieldName: 'stickerParams',
		targetFieldName: 'type',
		checkFunction: Type.isPlainObject,
		formatFunction: (target) => {
			return Type.isStringFilled(target.type) ? target.type : '';
		},
	},
];

export const packFieldsConfig: FieldsConfig = [
	{
		fieldName: 'id',
		targetFieldName: 'key',
		checkFunction: Type.isNumber,
		formatFunction: preparePackKey,
	},
	{
		fieldName: 'name',
		targetFieldName: 'name',
		checkFunction: Type.isString,
	},
	{
		fieldName: 'stickers',
		targetFieldName: 'stickers',
		checkFunction: Type.isArray,
		formatFunction: getStickersKeys,
	},
];

export const stickerFieldsConfig: FieldsConfig = [
	{
		fieldName: 'id',
		targetFieldName: 'key',
		checkFunction: Type.isNumber,
		formatFunction: prepareStickerKey,
	},
	{
		fieldName: 'uri',
		targetFieldName: 'uri',
		checkFunction: Type.isString,
	},
	{
		fieldName: 'type',
		targetFieldName: 'type',
		checkFunction: Type.isString,
	},
];
