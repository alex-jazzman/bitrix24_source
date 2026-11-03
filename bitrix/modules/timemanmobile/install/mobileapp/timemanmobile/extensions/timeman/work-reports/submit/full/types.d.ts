import type { FullReportToSend, ReportSettings } from '../../api/types';
import { LayoutWidget, PageManager } from '../../../../../../../../../mobile/dev/janative/api';

type SheetHostWidget = PageManager | LayoutWidget;

type FullReportBoxOptions = {
	parentWidget?: SheetHostWidget;
};

type FullReportBoxOpenOptions = FullReportBoxOptions & {
	prepareRequest?: () => Promise<void>;
	dateReport?: Date;
};

type FullReportBoxOpenReportOptions = FullReportBoxOptions & {
	reportToSend?: FullReportToSend;
	onSent?: () => void;
	dateReport?: Date;
	settings?: ReportSettings | null;
};

type FullReportBoxFetchOptions = {
	prepareRequest?: (() => Promise<void>) | null;
};

type SendReportParams = {
	layoutWidget: LayoutWidget;
	reportId: number;
	onSent?: () => void;
	settings?: ReportSettings | null;
};

type OpenSheetOptions = {
	title: string;
	component: (layoutWidget: LayoutWidget) => LayoutComponent;
	height: number;
};

export {
	LayoutWidget,
	SheetHostWidget,
	FullReportBoxOptions,
	FullReportBoxOpenOptions,
	FullReportBoxFetchOptions,
	FullReportBoxOpenReportOptions,
	SendReportParams,
	OpenSheetOptions,
};
