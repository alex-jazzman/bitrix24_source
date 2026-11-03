export type Block = {
	id: string;
	items: Array<Item>;
};

export type ItemType =
	| 'delimiter'
	| 'title'
	| 'titleWithIcon'
	| 'iconTitle'
	| 'description'
	| 'constant';
export type ConstantType =
	| 'string'
	| 'int'
	| 'user'
	| 'file'
	| 'text'
	| 'select'
	| 'entityselector'
	| 'rag_knowledge_base'
	| 'bool'
	| 'date'
	| 'datetime';
export type DelimiterType = 'line';

export type ConstantValueRule = {
	Min?: number;
	Max?: number;
	MaxLength?: number;
};

// The value rule lives next to the settings the other constant types declare for themselves.
export type ConstantSettings = {
	ValueRule?: ConstantValueRule;
	[key: string]: mixed;
};

export type Item = {
	itemType: ItemType;
};

export type DelimiterItem = Item & {
	delimiterType: DelimiterType;
};

export type TitleItem = Item & {
	text: string;
};

export type TitleWithIconItem = Item & {
	text: string;
	icon: string;
};

export type DescriptionItem = Item & {
	text: string;
};

export type ConstantItem = Item & {
	id: string;
	name: string;
	constantType: string;
	multiple: boolean;
	default: string | Array<string>;
	description: string;
	required: boolean;
	options: Record<string, string>;
	settings: ConstantSettings,
};

export type ConstantPreset = {
	code: string;
	constantType: ConstantType;
	multiple: boolean;
	labelKey: string;
	hintKey: string;
	nameKey: string;
};

export type UpdateItemPropertyEventPayload = {
	propertyValues: Record<string, any>;
	itemIndex?: number;
};

export type ConstantConvertedData = {
	Name: string,
	Description: string,
	Type: string,
	Required: boolean,
	Multiple: boolean,
	Options: Array,
	Default: string,
	Settings: ConstantSettings,
	Source: string,
};

export type ConstantConfiguration = {
	title: string,
	type: string,
	options: Object,
};

export type EntitySelectorConstantConfiguration = ConstantConfiguration & {
	options: {
		selectors: Array<{
			id: string | number,
			title: string,
			dialogOptions: Object,
		}>,
	},
};
