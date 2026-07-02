import { Color } from '../../../../../../../../dev/janative/types/enum/color';
import { Typography } from '../../../../../../../../dev/janative/types/enum/typography';

interface TextBaseColorGradient
{
	colors: Array<Color | string>;
	angle?: number;
}

interface TextBaseProps
{
	size?: number | string;
	accent?: boolean;
	header?: boolean;
	nativeElement?: (props: object) => object;
	typography?: Typography;
	color?: Color;
	colorGradient?: TextBaseColorGradient;
}

export { TextBaseProps, TextBaseColorGradient };
