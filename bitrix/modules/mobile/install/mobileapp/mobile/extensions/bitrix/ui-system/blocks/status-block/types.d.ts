import { Color } from '../../../../../../../../dev/janative/types/enum/color';
import { Icon } from '../../../../../../../../dev/janative/types/enum/icon';

interface StatusBlockListItem
{
	icon: string | Icon;
	text: string;
}

interface StatusBlockProps
{
	testId: string;
	title?: string;
	titleColor?: Color;
	description?: string;
	descriptionColor?: Color;
	list?: Array<StatusBlockListItem>;
	footnote?: string;
	footnoteColor?: Color;
	buttons?: Array<object>;
	emptyScreen?: boolean;
	verticalAlign?: object;
	forwardRef?: Function;
	style?: object;
	image?: object;
	preventRefresh?: boolean;
	onRefresh?: () => void;
	onDescriptionLinkClick?: Function;
}

export { StatusBlockProps, StatusBlockListItem };
