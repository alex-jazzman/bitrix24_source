import { Color } from '../../../../../../../../../mobile/install/mobileapp/mobile/dev/janative/types/enum/color';
import { TextBaseColorGradient } from '../../../../../../../../../mobile/install/mobileapp/mobile/extensions/bitrix/ui-system/typography/text-base/types';
import { ReportTypeEnum } from '../../enum/src/report-type';

type GptReportCardProps = {
	testId?: string;
	report?: string;
	period?: ReportTypeEnum;
	title?: string;
	style?: object;
	hasAutoReport?: boolean;
	hasGpt?: boolean;
};

type ReportCardTitleColorProps = {
	color?: Color;
	colorGradient?: TextBaseColorGradient;
};

export {
	GptReportCardProps,
	ReportCardTitleColorProps,
};
