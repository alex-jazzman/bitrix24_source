export type AttachModelItem = Array<AttachConfig>;

export type AttachConfig = {
	id: string,
	description: string,
	color: string,
	colorToken?: string,
	blocks: Array<AttachBlock>
};

export type AttachBlock = {
	delimiter?: AttachDelimiterBlock,
	file?: AttachFileBlock,
	grid?: AttachGridBlock,
	html?: AttachHtmlBlock,
	image?: AttachImageBlock,
	link?: AttachLinkBlock,
	message?: AttachMessageBlock,
	richLink?: AttachRichBlock,
	user?: AttachUserBlock,
};

export type AttachMessageStyle = {
	fontColor: string,
	linkColor: string,
	mentionColor: string,
	linkUnderlined: boolean
};

export type AttachMessageBlockStyled = {
	text: string,
	style?: AttachMessageStyle
};

export type AttachMessageBlock = string | AttachMessageBlockStyled;

export type AttachMessageConfig = {
	message: AttachMessageBlock
};

export type AttachDelimiterBlock = {
	size?: number,
	color?: string,
	style?: AttachDelimiterStyle,
};

export type AttachDelimiterConfig = {
	delimiter: AttachDelimiterBlock
};

export type AttachFileBlock = Array<AttachFileItem>;

export type AttachFileItem = {
	link: string,
	name?: string,
	size?: number,
	displayedSize?: string,
	downloadText?: string,
	style?: AttachFileStyle,
};

export type AttachFileConfig = {
	file: AttachFileBlock
};

export type MobileAttachFileConfig = {
	file: Array<MobileAttachFileItemConfig>,
	style?: AttachFileStyle,
};

export type MobileAttachFileItemConfig = AttachFileItem & {
	downloadText?: string,
};

export type AttachGridBlock = Array<AttachGridItem>;

export type AttachGridItem = {
	display: AttachGridItemDisplayType,
	name: string,
	value: string,
	width?: number,
	color?: string,
	colorToken?: string,
	link?: string,
	style?: AttachGridItemStyle,
};

export enum AttachGridItemDisplayType
{
	block = 'BLOCK',
	line = 'LINE',
	row = 'ROW'
}

export type AttachGridConfig = {
	grid: AttachGridBlock
};

export type AttachHtmlBlock = string;

export type AttachHtmlConfig = {
	html: AttachHtmlBlock
};

export type AttachImageBlock = Array<AttachImageItem>;

export type AttachImageItem = {
	link: string,
	width?: number,
	height?: number,
	name?: string,
	preview?: string,
	style?: AttachImageStyle,
};

export type AttachImageConfig = {
	image: AttachImageBlock
};

export type AttachLinkBlock = Array<AttachLinkItem>;

export type AttachLinkItem = {
	link: string,
	name?: string,
	desc?: string,
	html?: string,
	preview?: string,
	width?: number,
	height?: number,
	style?: AttachLinkStyle,
};

export type AttachLinkConfig = {
	link: AttachLinkBlock
};

export type AttachUserBlock = Array<AttachUserItem>;

export type AttachUserItem = {
	name: string,
	avatar: string,
	avatarType: string,
	link: string,
	style?: AttachUserStyle,
};

export type AttachUserConfig = {
	user: AttachUserBlock
};

export type AttachRichBlock = Array<AttachRichItem>;

export type AttachRichItem = {
	link: string,
	name?: string,
	desc?: string,
	html?: string,
	preview?: string,
	previewUrl?: string | null,
	previewSize?: {
		height: number,
		width: number
	},
	style?: AttachRichLinkStyle,
};

export type AttachRichConfig = {
	richLink: AttachRichBlock
};

export type AttachDelimiterStyle = {
	lineColor: string
};

export type AttachUserStyle = {
	nameColor: string
};

export type AttachImageStyle = {
	nameColor: string
};

export type AttachFileStyle = {
	nameColor: string,
	displayedSizeColor: string
};

export type AttachLinkStyle = {
	nameColor: string,
	descriptionColor: string
};

export type AttachRichLinkStyle = {
	nameColor: string,
	descriptionColor: string
};

export type AttachGridItemValueStyle = {
	fontColor: string,
	linkColor: string,
	mentionColor: string,
	linkUnderlined: boolean
};

export type AttachGridItemStyle = {
	nameColor: string,
	valueStyle: AttachGridItemValueStyle
};

export type AttachConfigBlock = AttachBlock;
export type AttachFileItemConfig = AttachFileItem;
export type AttachGridItemConfig = AttachGridItem;
export type AttachImageItemConfig = AttachImageItem;
export type AttachLinkItemConfig = AttachLinkItem;
export type AttachRichItemConfig = AttachRichItem;
export type AttachUserItemConfig = AttachUserItem;
