type BaseBlock = {
	id: string | number,
	type: string,
};

type SourceItem = {
	url: string,
	metaData: {
		title: string,
		description: string,
	},
};

export type TitleBlockType = BaseBlock & {
	text: string,
	size: 1 | 2,
	color?: $Values<typeof MessageBuilderPlainColorToken> | $Values<typeof MessageBuilderGradientColorToken>,
};

export type TextBlockType = BaseBlock & {
	text: string,
	sources?: { [key: string]: Array<SourceItem> },
};

type IconItem = {
	type?: 'bullet' | 'number' | 'arrow' | 'search',
	color: $Values<typeof MessageBuilderPlainColorToken>,
};
type ListItem = { text: string, color: $Values<typeof MessageBuilderPlainColorToken>, icon?: IconItem };
type Fold = { title: string, isOpened: boolean };

export type OrderedListBlockType = BaseBlock & {
	color: $Values<typeof MessageBuilderPlainColorToken>,
	elements: Array<ListItem>,
	fold?: Fold,
	sources?: { [key: string]: Array<SourceItem> },
};

export type UnorderedListBlockType = BaseBlock & {
	color: $Values<typeof MessageBuilderPlainColorToken>,
	icon?: IconItem,
	elements: Array<ListItem>,
	fold?: Fold,
	sources?: { [key: string]: Array<SourceItem> },
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

export type AiAssistantSearchBlockType = BaseBlock & {
	title: string,
	text: string,
};

export type AnyBlockType =
	TitleBlockType
	| TextBlockType
	| OrderedListBlockType
	| UnorderedListBlockType
	| MapBlockType
	| LineDividerBlockType
	| SpaceDividerBlockType
	| TableBlockType
	| AiAssistantSearchBlockType;

export const MessageBuilderPlainColorToken = {
	base: 'base',
	primary: 'primary',
	secondary: 'secondary',
	alert: 'alert',
	success: 'success',
	tertiary: 'tertiary',
};

export const MessageBuilderGradientColorToken = {
	'ai-assistant': 'ai-assistant',
};
