export type BuilderConfig = {
	blocks: Array<BaseBuilderBlockType>,
	unsupportedBlock?: { text: string, iconColor: string },
	sourceButton?: { icon: string, text: string },
}

export type BaseBuilderBlockType =
	BaseTextBuilderBlockType
	| TitleBuilderBlockType
	| LineDividerBuilderBlockType
	| SpaceDividerBuilderBlockType
	| MapBuilderBlockType
	| UnorderedListBuilderBlockType
	| OrderedListBuilderBlockType
	| ActionButtonBuilderBlockType
	| GalleryBuilderBlockType
	| AudioBuilderBlockType
	| FileBuilderBlockType
	| ContextBuilderBlockType
	| DropdownMenuBuilderBlockType
	| GeoBuilderBlockType
	| TableBuilderBlockType
	| BulletListBuilderBlockType
	| CardBuilderBlockType
	| InlineElementBlockType
	| AiAssistantSearchBuilderBlockType;

export type TitleBuilderBlockType = {
	id: string,
	type: 'title',
	text: string,
	size?: TitleSizeType,
	color?: BuilderColorToken,
	colorGradient?: BuilderColorGradient,
}
export type TitleSizeType = 1 | 2;

export type BaseTextBuilderBlockType = {
	id: string,
	type: 'text',
	text: string,
	sources?: BuilderSourcesType,
}

export type LineDividerBuilderBlockType = {
	id: string,
	type: 'lineDivider',
}

export type SpaceDividerBuilderBlockType = {
	id: string,
	type: 'spaceDivider',
	size?: SpaceDividerSizeType,
}
export type SpaceDividerSizeType = 's' | 'm' | 'l';

export type MapBuilderBlockType = {
	id: string,
	type: 'map',
	imageUrl: string,
	text?: string | null,
	status?: string | null,
}

export type UnorderedListBuilderBlockType = {
	id: string,
	type: 'unorderedList',
	icon?: UnorderedListBlockIconType,
	elements: Array<{ text: string, color?: BuilderColorToken, colorGradient?: BuilderColorGradient, icon?: UnorderedListBlockIconType }>,
	fold?: BuilderFoldType,
	sources?: BuilderSourcesType,
	color?: BuilderColorToken,
	colorGradient?: BuilderColorGradient,
}
export type UnorderedListBlockIconType = { type: UnorderedListIconTypeValue, color?: BuilderColorToken, colorGradient?: BuilderColorGradient };
export type UnorderedListIconTypeValue = 'bullet' | 'arrow' | 'search';

export type OrderedListBuilderBlockType = {
	id: string,
	type: 'orderedList',
	elements: Array<{ text: string, color?: BuilderColorToken, colorGradient?: BuilderColorGradient }>,
	fold?: BuilderFoldType,
	sources?: BuilderSourcesType,
	color?: BuilderColorToken,
	colorGradient?: BuilderColorGradient,
}

export type TableBuilderBlockType = {
	id: string,
	type: 'table',
	rows: Array<Array<{ text: string }>>,
}

export type ActionButtonBuilderBlockType = {
	id: string,
	type: 'action_button',
	text: string,
	actionId: string,
	params?: object,
	style?: object,
}

export type GalleryBuilderBlockType = {
	id: string,
	type: 'gallery',
	diskIds: Array<number>,
}

export type AudioBuilderBlockType = {
	id: string,
	type: 'audio',
	diskId: number,
}

export type FileBuilderBlockType = {
	id: string,
	type: 'file',
	diskId: number,
}

export type ContextBuilderBlockType = {
	id: string,
	type: 'context',
	elements: Array<ContextElementType>,
	alignment?: 'left' | 'right',
}

export type DropdownMenuBuilderBlockType = {
	id: string,
	type: 'dropdown_menu',
	placeholder: string,
	options?: Array<{ label: string, value: string }>,
	optionsUrl?: string,
	actionId: string,
}

export type GeoBuilderBlockType = {
	id: string,
	type: 'geo',
	coordinates: { lat: number, lng: number } | string,
	zoom?: number,
	width?: string | number,
	height?: string | number,
	markers?: Array<GeoMarkerType>,
}

export type BulletListBuilderBlockType = {
	id: string,
	type: 'bullet_list',
	items: Array<string>,
	bulletStyle?: 'circle' | 'square' | string,
	color?: string,
}

export type CardBuilderBlockType = {
	id: string,
	type: 'card',
	title?: string,
	description?: string,
	imageDiskId?: number,
	backgroundColor?: string,
	border?: { color?: string, width?: number, radius?: number },
	actions?: Array<ActionButtonBuilderBlockType>,
}

export type AiAssistantSearchBuilderBlockType = {
	id: string,
	type: 'aiAssistantSearch',
	title: string,
	text: string,
}

export type InlineElementBlockType =
	| { type: 'user', userId: string, name?: string, avatarUrl?: string }
	| { type: 'icon', iconId: string, color?: string }
	| { type: 'task', taskId: string, title?: string }

export type ContextElementType =
	| { type: 'text', text: string, color?: string }
	| { type: 'icon', iconId: string, color?: string }

export type GeoMarkerType = {
	coordinates: object,
	iconDiskId?: number,
}

export type BuilderColorToken = 'base' | 'primary' | 'secondary' | 'alert' | 'success' | 'tertiary' | 'ai-assistant';

export type BuilderColorGradient = {
	colors: Array<string>,
	positions?: Array<number>,
	angle?: number,
}

export type BuilderSourcesType = Record<number, BuilderSourceItem>;

export type BuilderSourceItem = {
	url: string,
	metaData?: {
		title?: string | null,
		description?: string | null,
	},
}

export type BuilderFoldType = {
	title: string,
	isOpened?: boolean,
}

export type DialogWidgetBuilderItemBlockType = Omit<BaseBuilderBlockType, 'sources'>;

export type DialogWidgetBuilderItem = Omit<BuilderConfig, 'blocks'> & {
	blocks: Array<DialogWidgetBuilderItemBlockType>
}
