import { type AirButtonStyle } from 'ui.vue3.components.button';

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

type BaseButton = {
	title: string,
	design: $Keys<typeof AirButtonStyle>,
};

export type EventButtonBlockType = BaseButton & {
	type: 'eventButton',
	actionId: string,
	actionParams?: { [string]: any },
};

export type LinkButtonBlockType = BaseButton & {
	type: 'linkButton',
	url: string,
};

export type RequestButtonBlockType = BaseButton & {
	id: string | number,
	type: 'requestButton',
	actionId: string,
	actionParams?: { [string]: any },
	disabled: boolean,
};

export type AnyButtonBlock = EventButtonBlockType | LinkButtonBlockType | RequestButtonBlockType;

export type CardBlockType = BaseBlock & {
	imageUrl?: string,
	title: string,
	text?: string,
	buttons?: EventButtonBlockType[],
};

type Progress = {
	value: number,
	colorToken?: $Values<typeof MessageBuilderPlainColorToken> | $Values<typeof MessageBuilderGradientColorToken>,
};

export type AiAssistantSearchBlockType = BaseBlock & {
	title: string,
	text: string,
	progress?: Progress,
};

export type GalleryBlockType = BaseBlock & {
	title: string,
	fileIds: number[],
};

export type FileBlockType = BaseBlock & {
	fileIds: number[],
};

export type AudioBlockType = BaseBlock & {
	fileId: number,
};

export type FormFieldOption = {
	id: string,
	label: string,
};

export type FormFieldBlockType = {
	id: string,
	type: $Values<typeof FormFieldType>,
	label?: string,
	placeholder?: string,
	options?: FormFieldOption[],
	disabled: boolean,
};

export type FormBlockType = BaseBlock & {
	elements: FormFieldBlockType[],
	buttons: RequestButtonBlockType[][],
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
	| CardBlockType
	| GalleryBlockType
	| FileBlockType
	| AudioBlockType
	| FormBlockType
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

export const MessageBuilderBackgroundPlainToken = 'plain';

// Mirrors SendContextualStatus::THINKING_SEARCH_BLOCK_ID. messages/builder/updateBlock silently
// does nothing on a mismatched id, so the plan player must address the block by the server's id.
export const AiAssistantThinkingBlockId = 'aiassistant-thinking-search';

export const FormFieldType = Object.freeze({
	singleLineText: 'singleLineText',
	multilineText: 'multilineText',
	select: 'select',
	radio: 'radio',
	checkbox: 'checkbox',
});
