type BaseBlock = {
	type: string,
};

export type TitleBlockType = BaseBlock & {
	text: string,
	size: 1 | 2,
	color: 'base' | 'primary' | 'secondary' | 'alert' | 'ai-assistant',
};

export type TextBlockType = BaseBlock & {
	text: string,
};

export type ListBlockType = BaseBlock & {
	text: string,
	icon: string,
	elements: Array<{ text: string }>,
};

export type MapBlockType = BaseBlock & {
	imageUrl: string,
	text?: string,
	status?: string,
};

export type LineDividerBlockType = BaseBlock;

export type SpaceDividerBlockType = BaseBlock & {
	size: 's' | 'm' | 'l',
};

export type TableBlockType = BaseBlock & {
	rows: Array<Array<{ text: string }>>,
};
