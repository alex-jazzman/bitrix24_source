import type { ConstantPreset, ConstantType, DelimiterType, ItemType } from './types';

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
	ENTITY_SELECTOR: 'entityselector',
	KNOWLEDGE_BASE: 'rag_knowledge_base',
	BOOL: 'bool',
	DATE: 'date',
	DATETIME: 'datetime',
});

export const DELIMITER_TYPES: Record<string, DelimiterType> = Object.freeze({
	LINE: 'line',
});

export const EDITING_MODES = Object.freeze({
	CREATE: 'create',
	EDIT: 'edit',
});

export const CONSTANT_ID_PREFIX = 'SetupTemplateActivity_';
export const SETUP_TEMPLATE_ACTIVITY_SOURCE = 'SetupTemplateActivity';

export const PRESET_TITLE_ICONS = {
	IMAGE: 'o-image',
	ATTACH: 'o-attach',
	SETTINGS: 'o-settings',
	STARS: 'o-ai-stars',
};

export const MENU_SECTIONS: Record<string, string> = Object.freeze({
	ELEMENTS: 'elements',
	PRESETS: 'presets',
	CUSTOM: 'custom',
});

// Order of the entries is the order of the menu items in the "ready-made constants" section.
export const CONSTANT_PRESETS: Array<ConstantPreset> = Object.freeze([
	{
		code: 'user',
		constantType: CONSTANT_TYPES.USER,
		multiple: true,
		labelKey: 'BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_PRESET_USER_LABEL',
		hintKey: 'BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_PRESET_USER_HINT',
		nameKey: 'BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_PRESET_USER_NAME',
	},
	{
		code: 'knowledgeBase',
		constantType: CONSTANT_TYPES.KNOWLEDGE_BASE,
		multiple: false,
		labelKey: 'BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_PRESET_KNOWLEDGE_BASE_LABEL',
		hintKey: 'BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_PRESET_KNOWLEDGE_BASE_HINT',
		nameKey: 'BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_PRESET_KNOWLEDGE_BASE_NAME',
	},
	{
		code: 'prompt',
		constantType: CONSTANT_TYPES.TEXT,
		multiple: false,
		labelKey: 'BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_PRESET_PROMPT_LABEL',
		hintKey: 'BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_PRESET_PROMPT_HINT',
		nameKey: 'BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_PRESET_PROMPT_NAME',
	},
]);
