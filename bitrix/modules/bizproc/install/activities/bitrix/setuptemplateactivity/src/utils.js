import { CONSTANT_ID_PREFIX, CONSTANT_TYPES, DELIMITER_TYPES, ITEM_TYPES } from './constants';
import type { ConstantItem, DelimiterItem, DescriptionItem, TitleItem, ConstantConvertedData } from './types';

export function makeEmptyDelimiter(): DelimiterItem
{
	return {
		itemType: ITEM_TYPES.DELIMITER,
		delimiterType: DELIMITER_TYPES.LINE,
	};
}

export function makeEmptyTitle(): TitleItem
{
	return {
		itemType: ITEM_TYPES.TITLE,
		text: '',
	};
}

export function makeEmptyDescription(): DescriptionItem
{
	return {
		itemType: ITEM_TYPES.DESCRIPTION,
		text: '',
	};
}

export function makeEmptyConstant(): ConstantItem
{
	return {
		itemType: ITEM_TYPES.CONSTANT,
		id: generateConstantId(),
		name: '',
		constantType: CONSTANT_TYPES.STRING,
		multiple: false,
		description: '',
		default: '',
		options: [],
		required: false,
	};
}

export function convertConstants(constant: ConstantItem): ConstantConvertedData
{
	return {
		Name: constant.name,
		Description: constant.description,
		Type: constant.constantType,
		Required: 0,
		Multiple: constant.multiple ? 1 : 0,
		Options: (constant.options && constant.options.length > 0) ? constant.options : null,
		Default: constant.default,
	};
}

function generateRandomString(length: number): string
{
	const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	let result = '';
	const charactersLength = characters.length;
	for (let i = 0; i < length; i++)
	{
		result += characters.charAt(Math.floor(Math.random() * charactersLength));
	}

	return result;
}

function generateConstantId(): string
{
	return CONSTANT_ID_PREFIX + generateRandomString(10);
}
