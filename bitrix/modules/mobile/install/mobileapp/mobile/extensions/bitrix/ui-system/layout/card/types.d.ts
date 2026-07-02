interface CardExcludePaddingSide
{
	left?: boolean;
	right?: boolean;
	top?: boolean;
	bottom?: boolean;
	horizontal?: boolean;
	vertical?: boolean;
	all?: boolean;
}

interface CardProps
{
	testId: string;
	style?: object;
	excludePaddingSide?: CardExcludePaddingSide;
	hideCross?: boolean;
	selected?: boolean;
	accent?: boolean;
	border?: boolean;
	corner?: object;
	withPressed?: boolean;
	badgeMode?: object;
	badge?: object;
	onClose?: () => void;
	onClick?: () => void;
	design?: object;
}

export { CardProps, CardExcludePaddingSide };
