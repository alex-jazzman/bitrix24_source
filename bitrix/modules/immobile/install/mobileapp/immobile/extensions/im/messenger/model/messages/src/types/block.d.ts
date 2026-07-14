export type BlockBackgroundType = 'plain';

export type BlockConfig = {
	elements: Array<BaseBlockElementType>,
	background?: BlockBackgroundType,
	unsupportedBlock?: { text: string, iconColor: string },
	sourceButton?: { icon: string, text: string },
}

export type BaseBlockElementType =
	BaseTextBlockElementType
	| TitleBlockElementType
	| LineDividerBlockElementType
	| SpaceDividerBlockElementType
	| MapBlockElementType
	| UnorderedListBlockElementType
	| OrderedListBlockElementType
	| ActionButtonBlockElementType
	| GalleryBlockElementType
	| AudioBlockElementType
	| FileBlockElementType
	| ContextBlockElementType
	| DropdownMenuBlockElementType
	| GeoBlockElementType
	| TableBlockElementType
	| BulletListBlockElementType
	| CardBlockElementType
	| InlineElementBlockType
	| AiAssistantSearchBlockElementType;

export type TitleBlockElementType = {
	id: string,
	type: 'title',
	text: string,
	size?: TitleSizeType,
	color?: BlockColorToken,
	colorGradient?: BlockColorGradient,
}
export type TitleSizeType = 1 | 2;

export type BaseTextBlockElementType = {
	id: string,
	type: 'text',
	text: string,
	sources?: BlockSourcesType,
}

export type LineDividerBlockElementType = {
	id: string,
	type: 'lineDivider',
}

export type SpaceDividerBlockElementType = {
	id: string,
	type: 'spaceDivider',
	size?: SpaceDividerSizeType,
}
export type SpaceDividerSizeType = 's' | 'm' | 'l';

export type MapBlockElementType = {
	id: string,
	type: 'map',
	imageUrl: string,
	text?: string | null,
	status?: string | null,
}

export type UnorderedListBlockElementType = {
	id: string,
	type: 'unorderedList',
	icon?: UnorderedListBlockIconType,
	elements: Array<{ text: string, color?: BlockColorToken, colorGradient?: BlockColorGradient, icon?: UnorderedListBlockIconType }>,
	fold?: BlockFoldType,
	sources?: BlockSourcesType,
	color?: BlockColorToken,
	colorGradient?: BlockColorGradient,
}
export type UnorderedListBlockIconType = { type: UnorderedListIconTypeValue, color?: BlockColorToken, colorGradient?: BlockColorGradient };
export type UnorderedListIconTypeValue = 'bullet' | 'arrow' | 'search';

export type OrderedListBlockElementType = {
	id: string,
	type: 'orderedList',
	elements: Array<{ text: string, color?: BlockColorToken, colorGradient?: BlockColorGradient }>,
	fold?: BlockFoldType,
	sources?: BlockSourcesType,
	color?: BlockColorToken,
	colorGradient?: BlockColorGradient,
}

export type TableBlockElementType = {
	id: string,
	type: 'table',
	rows: Array<Array<{ text: string }>>,
}

export type ActionButtonBlockElementType = {
	id: string,
	type: 'action_button',
	text: string,
	actionId: string,
	params?: object,
	style?: object,
}

export type GalleryBlockElementType = {
	id: string,
	type: 'gallery',
	fileIds: Array<number>,
}

export type AudioBlockElementType = {
	id: string,
	type: 'audio',
	diskId: number,
}

export type FileBlockElementType = {
	id: string,
	type: 'file',
	diskId: number,
}

export type ContextBlockElementType = {
	id: string,
	type: 'context',
	elements: Array<ContextElementType>,
	alignment?: 'left' | 'right',
}

export type DropdownMenuBlockElementType = {
	id: string,
	type: 'dropdown_menu',
	placeholder: string,
	options?: Array<{ label: string, value: string }>,
	optionsUrl?: string,
	actionId: string,
}

export type GeoBlockElementType = {
	id: string,
	type: 'geo',
	coordinates: { lat: number, lng: number } | string,
	zoom?: number,
	width?: string | number,
	height?: string | number,
	markers?: Array<GeoMarkerType>,
}

export type BulletListBlockElementType = {
	id: string,
	type: 'bullet_list',
	items: Array<string>,
	bulletStyle?: 'circle' | 'square' | string,
	color?: string,
}

export type CardBlockElementType = {
	id: string,
	type: 'card',
	imageUrl?: string,
	title: string,
	text?: string,
	buttons?: Array<Array<BlockButtonTypeData>>,
}

export type BlockButtonTypeData = EventButtonType | LinkButtonType | RequestButtonType;

export type EventButtonType = {
	id: string,
	type: 'eventButton',
	title: string,
	design?: CardButtonDesignType,
	actionId: string,
	actionParams?: object,
}

export type LinkButtonType = {
	id: string,
	type: 'linkButton',
	title: string,
	design?: CardButtonDesignType,
	url: string,
}

export type RequestButtonType = {
	id: string,
	type: 'requestButton',
	title: string,
	design?: CardButtonDesignType,
	actionId: string,
	actionParams?: object,
}

export type CardButtonDesignType = 'FILLED' | 'OUTLINE_ACCENT_2' | 'PLAIN_NO_ACCENT';

export type AiAssistantSearchBlockElementType = {
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

export type BlockColorToken = 'base' | 'primary' | 'secondary' | 'alert' | 'success' | 'tertiary' | 'ai-assistant';

export type BlockColorGradient = {
	colors: Array<string>,
	positions?: Array<number>,
	angle?: number,
}

export type BlockSourcesType = Record<number, BlockSourceItem>;

export type BlockSourceItem = {
	url: string,
	metaData?: {
		title?: string | null,
		description?: string | null,
	},
}

export type BlockFoldType = {
	title: string,
	isOpened?: boolean,
}

export type DialogWidgetBlockItemBlockType = Omit<BaseBlockElementType, 'sources'>;

export type DialogWidgetBlockItem = Omit<BlockConfig, 'elements'> & {
	blocks: Array<DialogWidgetBlockItemBlockType>
}
