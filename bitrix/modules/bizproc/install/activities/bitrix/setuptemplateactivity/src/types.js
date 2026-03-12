export type Block = {
	items: Array<Item>;
};

export type ItemType = 'delimiter' | 'title' | 'description' | 'constant';
export type ConstantType = 'string' | 'int' | 'user' | 'file';
export type DelimiterType = 'line';

export type Item = {
	itemType: ItemType;
};

export type DelimiterItem = Item & {
	delimiterType: DelimiterType;
};

export type TitleItem = Item & {
	text: string;
};

export type DescriptionItem = Item & {
	text: string;
};

export type ConstantItem = Item & {
	id: string;
	name: string;
	constantType: string;
	multiple: boolean;
	default: string;
	description: string;
	required: boolean;
	options: Record<string, string>;
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
};
