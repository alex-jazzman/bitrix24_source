import type { ConstantType, DelimiterType, ItemType } from './types';

export const ITEM_TYPES: Record<string, ItemType> = Object.freeze({
	DELIMITER: 'delimiter',
	TITLE: 'title',
	TITLE_WITH_ICON: 'titleWithIcon',
	ICON_TITLE: 'iconTitle',
	DESCRIPTION: 'description',
	CONSTANT: 'constant',
});

export const CONSTANT_TYPES: Record<string, ConstantType> = Object.freeze({
	STRING: 'string',
	INT: 'int',
	USER: 'user',
	FILE: 'file',
	TEXT: 'text',
	SELECT: 'select',
});

export const DELIMITER_TYPES: Record<string, DelimiterType> = Object.freeze({
	LINE: 'line',
});

export const CONSTANT_ID_PREFIX = 'SetupTemplateActivity_';

export const PRESET_TITLE_ICONS = {
	IMAGE: 'o-image',
	ATTACH: 'o-attach',
	SETTINGS: 'o-settings',
	STARS: 'o-ai-stars',
};
