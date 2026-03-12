import { Type } from 'main.core';

import {
	CONSTANT_ID_PREFIX,
	CONSTANT_TYPES,
	DELIMITER_TYPES,
	ITEM_TYPES,
} from './constants';
import type {
	ConstantItem,
	DelimiterItem,
	DescriptionItem,
	TitleItem,
	TitleWithIconItem,
	ConstantConvertedData,
} from './types';

export function makeEmptyBlock(): {...}
{
	return {
		id: generateConstantId(),
		items: [],
	};
}

export function makeEmptyDelimiter(): DelimiterItem
{
	return {
		id: generateConstantId(),
		itemType: ITEM_TYPES.DELIMITER,
		delimiterType: DELIMITER_TYPES.LINE,
	};
}

export function makeEmptyTitle(): TitleItem
{
	return {
		id: generateConstantId(),
		itemType: ITEM_TYPES.TITLE,
		text: '',
	};
}

export function makeEmptyTitleWithIcon(): TitleWithIconItem
{
	return {
		id: generateConstantId(),
		itemType: ITEM_TYPES.TITLE_WITH_ICON,
		text: '',
		icon: 'IMAGE',
	};
}

export function makeEmptyDescription(): DescriptionItem
{
	return {
		id: generateConstantId(),
		itemType: ITEM_TYPES.DESCRIPTION,
		text: '',
	};
}

export function makeEmptyConstant(id: ?string = null): ConstantItem
{
	return {
		itemType: ITEM_TYPES.CONSTANT,
		id: id || generateConstantId(),
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
		Options: Type.isObject(constant.options) ? constant.options : null,
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

export function generateConstantId(): string
{
	return CONSTANT_ID_PREFIX + generateRandomString(10);
}

export function getScrollParent(node: HTMLElement): HTMLElement | null
{
	let parent = node?.parentElement;

	while (parent && parent !== document.body)
	{
		const style = window.getComputedStyle(parent);
		const overflowY = style.overflowY;
		const isScrollable = overflowY === 'auto' || overflowY === 'scroll';

		if (isScrollable && parent.tagName !== 'FORM')
		{
			return parent;
		}
		parent = parent.parentElement;
	}

	return null;
}
