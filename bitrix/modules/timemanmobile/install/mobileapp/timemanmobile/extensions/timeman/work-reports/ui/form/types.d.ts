import { LayoutWidget } from '../../../../../../../../../mobile/dev/janative/api';
import type { ReportTypeEnum } from '../../enum/src/report-type';

type WorkReportFormProps = {
	buttonText?: string;
	report?: string | null;
	gptReport?: string | null;
	hasGpt?: boolean;
	hasAutoReport?: boolean;
	period?: ReportTypeEnum | null;
	reportTitle?: string;
	formTitle?: string;
	dateReport?: Date | null;
	checkInCount?: number;
	snapshotUrl?: string | null;
	onClick?: (params: WorkReportFormOnClick) => void | Promise<void>;
	onReportChange?: (report: string | null) => void;
	layoutWidget?: LayoutWidget;
	readOnly?: boolean;
};

type WorkReportFormOnClick = {
	report: string | null;
};

type ContentHeightOptions = {
	hasAutoReport?: boolean;
	hasGpt?: boolean;
	hasMap?: boolean;
};

export { WorkReportFormProps, WorkReportFormOnClick, ContentHeightOptions };
