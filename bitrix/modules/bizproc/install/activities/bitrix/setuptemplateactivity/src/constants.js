import type { ConstantType, DelimiterType, ItemType } from './types';

export const ITEM_TYPES: Record<string, ItemType> = Object.freeze({
	DELIMITER: 'delimiter',
	TITLE: 'title',
	DESCRIPTION: 'description',
	CONSTANT: 'constant',
});

export const CONSTANT_TYPES: Record<string, ConstantType> = Object.freeze({
	STRING: 'string',
	INT: 'int',
	USER: 'user',
	FILE: 'file',
});

export const DELIMITER_TYPES: Record<string, DelimiterType> = Object.freeze({
	LINE: 'line',
});

export const CONSTANT_ID_PREFIX = 'SetupTemplateActivity_';
