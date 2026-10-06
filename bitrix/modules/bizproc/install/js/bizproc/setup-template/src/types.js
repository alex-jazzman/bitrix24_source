export type Block = {
	items: Array<Item>;
};

export type ItemType = 'delimiter' | 'title' | 'description' | 'constant';
export type ConstantType = 'string' | 'int' | 'user' | 'file' | 'time' | 'date' | 'datetime' | 'bool';
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

export type TitleIconItem = Item & {
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
	default: string;
	description: string;
	required: boolean;
	options: Record<string, string>;
};

export type SetupTemplateData = {
	templateName: ?string,
	templateDescription: ?string,
	templateId: number,
	instanceId: string,
	blocks: ?Array<Block>,
	userId: number,
};

/**
 * Repeated needs_review payload for the callback fill flow: the blocks to
 * re-render (already prefilled with the values the server echoed) plus the
 * constant codes the server still reports as missing (`requiredConstants`) or
 * invalid (`invalidConstants`), so the form can highlight fields and explain
 * why the panel stayed open.
 */
export type FieldsSubmitReview = {
	blocks: Array<Block>,
	requiredConstants?: Array<string>,
	invalidConstants?: Array<string>,
};
