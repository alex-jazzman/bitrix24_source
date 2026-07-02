import { Typography } from '../../../../../../../../../dev/janative/types/enum/typography';

interface GptBannerProps
{
	testId: string;
	text: string;
	imageUri?: string;
	typography?: Typography;
	numberOfLines?: number;
	style?: object;
	onClick?: () => void;
}

export { GptBannerProps };
