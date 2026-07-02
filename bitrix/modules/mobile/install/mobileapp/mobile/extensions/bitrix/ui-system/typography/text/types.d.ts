import { TextBaseProps } from '../text-base/types';
import { TextProps } from '../../../../../../../../dev/janative/elements';

type TypographyTextProps = TextBaseProps & TextProps;

interface TypographyBodyTextProps extends TypographyTextProps
{
	size?: number;
}

export { TypographyTextProps, TypographyBodyTextProps };
