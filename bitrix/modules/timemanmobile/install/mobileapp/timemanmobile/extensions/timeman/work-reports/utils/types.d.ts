import { PageManager } from '../../../../../../../../mobile/dev/janative/api';
import type { ReportTypeEnum } from '../enum/src/report-type';

type DialogSheetOptions = {
	title: string,
	component: (layoutWidget: object) => LayoutComponent,
	height: number,
	parentWidget: PageManager
};

type DerivePeriodOptions = {
	dateFrom?: number,
	dateTo?: number,
	reportType?: ReportTypeEnum,
};

export { DialogSheetOptions, DerivePeriodOptions };
