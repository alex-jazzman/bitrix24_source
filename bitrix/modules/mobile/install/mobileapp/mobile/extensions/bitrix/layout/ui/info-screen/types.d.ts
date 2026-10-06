type InfoScreenColor = Color;

type InfoScreenImage = {
	uri?: string;
	named?: string;
	svg?: object;
	width: number;
	height: number;
	maxWidth?: number;
	resizeMode?: 'cover' | 'contain' | 'stretch' | 'repeat' | 'center';
	style?: Partial<ElementStyle>;
};

type InfoScreenIcon = {
	getIconName?: () => string;
	getPath?: () => string;
	getSvg?: () => string;
};

type InfoScreenSvgIcon = {
	svg: {
		content: string;
	};
};

type InfoScreenItemIcon = string | InfoScreenIcon | InfoScreenSvgIcon;

type InfoScreenColorGradient = {
	colors: Array<InfoScreenColor | string>;
	angle?: number;
};

type LegacyInfoScreenItem = {
	icon: InfoScreenItemIcon;
	text: string;
	title?: never;
	description?: never;
};

type DetailedInfoScreenItem = {
	icon: InfoScreenItemIcon;
	title: string;
	titleGradient?: InfoScreenColorGradient;
	description?: string;
	text?: never;
};

type InfoScreenItem = LegacyInfoScreenItem | DetailedInfoScreenItem;

type InfoScreenButton = {
	text?: string;
	onClick?: () => void | Promise<unknown>;
	testId?: string;
	leftIcon?: InfoScreenIcon;
	size?: BaseEnum;
	design?: BaseEnum;
	backgroundColor?: Color;
	stretched?: boolean;
	disabled?: boolean;
	loading?: boolean;
};

type InfoScreenSecondaryLink = {
	text: string;
	testId?: string;
	href?: string;
	useInAppLink?: boolean;
	color?: Color;
	leftIcon?: InfoScreenIcon;
	rightIcon?: InfoScreenIcon;
	ellipsize?: Ellipsize | 'start' | 'middle' | 'end';
	numberOfLines?: number;
	textDecorationLine?: 'none' | 'underline' | 'line-through';
	style?: Partial<ElementStyle>;
	onClick?: (href?: string) => void | Promise<unknown>;
	onLongClick?: () => void;
};

type InfoScreenTestIds = {
	box?: string;
	content?: string;
	image?: string;
	footer?: string;
	bottomBlock?: string;
	primaryButton?: string;
	footnote?: string;
};

type InfoScreenSafeArea = Partial<{
	top: boolean;
	bottom: boolean;
	left: boolean;
	right: boolean;
}>;

type InfoScreenProps = {
	testId?: string;
	testIds?: InfoScreenTestIds;
	safeArea?: InfoScreenSafeArea;
	withScroll?: boolean;
	backgroundColor?: InfoScreenColor;
	image?: InfoScreenImage | null;
	title?: string | null;
	titleColor?: InfoScreenColor;
	description?: string | null;
	descriptionColor?: InfoScreenColor;
	items?: Array<InfoScreenItem>;
	itemsPaddingHorizontal?: number;
	footnote?: string | null;
	footnoteColor?: InfoScreenColor;
	primaryButton?: InfoScreenButton | null;
	secondaryLink?: InfoScreenSecondaryLink | null;
	footer?: boolean;
	bottomBlock?: boolean;
	contentMaxWidth?: number;
	accentColor?: InfoScreenColor;
};

declare function InfoScreen(props?: InfoScreenProps): LayoutComponent<InfoScreenProps, Record<string, never>>;

export {
	InfoScreen,
	InfoScreenButton,
	InfoScreenColor,
	InfoScreenColorGradient,
	InfoScreenIcon,
	InfoScreenImage,
	InfoScreenItem,
	InfoScreenItemIcon,
	InfoScreenProps,
	InfoScreenSafeArea,
	InfoScreenSecondaryLink,
	InfoScreenSvgIcon,
	InfoScreenTestIds,
};
