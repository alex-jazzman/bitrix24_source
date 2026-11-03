import { Typography } from '../../../../../../../../../mobile/install/mobileapp/mobile/dev/janative/types/enum/typography';

type ReportBannerProps = {
	testId?: string;
	text: string;
	hasAutoReport?: boolean;
	hasGpt?: boolean;
	typography?: Typography;
	numberOfLines?: number;
	style?: object;
	onClick?: () => void;
};

export {
	ReportBannerProps,
};
