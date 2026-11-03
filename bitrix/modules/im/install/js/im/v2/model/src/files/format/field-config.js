import { Type } from 'main.core';

import { FileStatus } from 'im.v2.const';
import { Utils } from 'im.v2.lib.utils';

import { prepareImage, prepareIconType, prepareUrl } from './format-functions';
import { convertToNumber, convertToString, isNumberOrString } from '../../utils/format';

import type { FieldsConfig } from 'im.v2.model';
import type { JsonObject, JsonValue } from 'main.core';

export const fileFieldsConfig: FieldsConfig = [
	{
		fieldName: 'id',
		targetFieldName: 'id',
		checkFunction: isNumberOrString,
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
		formatFunction: Utils.date.cast,
	},
	{
		fieldName: 'type',
		targetFieldName: 'type',
		checkFunction: Type.isString,
	},
	{
		fieldName: 'extension',
		targetFieldName: 'icon',
		checkFunction: Type.isString,
		formatFunction: (target: JsonValue, currentResult: JsonObject, rawFields: JsonObject) => {
			return prepareIconType(rawFields);
		},
	},
	{
		fieldName: 'name',
		targetFieldName: 'name',
		checkFunction: isNumberOrString,
		formatFunction: convertToString,
	},
	{
		fieldName: 'size',
		targetFieldName: 'size',
		checkFunction: isNumberOrString,
		formatFunction: convertToNumber,
	},
	{
		fieldName: 'image',
		targetFieldName: 'image',
		checkFunction: [Type.isPlainObject, Type.isBoolean],
		formatFunction: (target: JsonValue) => {
			if (Type.isBoolean(target))
			{
				return target;
			}

			return prepareImage(target);
		},
	},
	{
		fieldName: 'status',
		targetFieldName: 'status',
		checkFunction: [Type.isString, (file) => !Type.isUndefined(FileStatus[file.status])],
	},
	{
		fieldName: 'validationError',
		targetFieldName: 'validationError',
		checkFunction: [Type.isString, Type.isNull],
	},
	{
		fieldName: 'progress',
		targetFieldName: 'progress',
		checkFunction: isNumberOrString,
		formatFunction: convertToNumber,
	},
	{
		fieldName: 'isVideoNote',
		targetFieldName: 'isVideoNote',
		checkFunction: Type.isBoolean,
	},
	{
		fieldName: 'isVoiceNote',
		targetFieldName: 'isVoiceNote',
		checkFunction: Type.isBoolean,
	},
	{
		// Comes only with files sent after the field appeared: for the rest the check drops the null
		// the server sends, and the consumer falls back to reading the duration from the media itself.
		fieldName: 'duration',
		targetFieldName: 'duration',
		checkFunction: isNumberOrString,
		formatFunction: convertToNumber,
	},
	{
		fieldName: 'authorId',
		targetFieldName: 'authorId',
		checkFunction: isNumberOrString,
		formatFunction: convertToNumber,
	},
	{
		fieldName: 'authorName',
		targetFieldName: 'authorName',
		checkFunction: isNumberOrString,
		formatFunction: convertToString,
	},
	{
		fieldName: 'urlPreview',
		targetFieldName: 'urlPreview',
		checkFunction: Type.isString,
		formatFunction: prepareUrl,
	},
	{
		fieldName: 'mediaUrl',
		targetFieldName: 'mediaUrl',
		checkFunction: Type.isPlainObject,
	},
	{
		fieldName: 'urlDownload',
		targetFieldName: 'urlDownload',
		checkFunction: Type.isString,
		formatFunction: prepareUrl,
	},
	{
		fieldName: 'urlShow',
		targetFieldName: 'urlShow',
		checkFunction: Type.isString,
		formatFunction: prepareUrl,
	},
	{
		fieldName: 'viewerAttrs',
		targetFieldName: 'viewerAttrs',
		checkFunction: Type.isPlainObject,
	},
	{
		fieldName: 'isTranscribable',
		targetFieldName: 'isTranscribable',
		checkFunction: Type.isBoolean,
	},
];
