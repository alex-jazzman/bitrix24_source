import type { DailyReport, DateFilter, RecordReportPresentationFlags } from '../../api/types';
import { LayoutWidget, PageManager } from '../../../../../../../../../mobile/dev/janative/api';

type SheetHostWidget = PageManager | LayoutWidget;

type PrepareRequestResult = {
	dateFilter?: DateFilter;
	recordId?: number | null;
};

type WorkdayAnalyticsSource = {
	section: string;
	element: string;
};

type DailyReportBoxOptions = {
	parentWidget?: SheetHostWidget;
	analytics?: WorkdayAnalyticsSource;
};

type DailyReportBoxOpenOptions = DailyReportBoxOptions & {
	prepareRequest: () => Promise<PrepareRequestResult>;
};

type WorkReportViewOptions = {
	readOnly?: boolean;
};

type DailyReportBoxOpenReportOptions = DailyReportBoxOptions & {
	userId?: number;
	dateFilter?: DateFilter | null;
	recordId?: number | null;
	data?: DailyReport;
	// What the caller expects the report to carry: the sheet is sized by it before the report arrives.
	reportFlags?: RecordReportPresentationFlags;
	viewOptions?: WorkReportViewOptions;
};

type DailyReportBoxFetchOptions = {
	prepareRequest?: (() => Promise<PrepareRequestResult>) | null;
	userId?: number;
	dateFilter?: DateFilter | null;
	recordId?: number | null;
};

type CreateContainerComponentParams = {
	data: DailyReport;
};

type CreateReportComponentParams = {
	userId?: number;
	dateFilter?: DateFilter | null;
	recordId?: number | null;
	data?: DailyReport | null;
	reportFlags?: RecordReportPresentationFlags;
	initialHeight: number;
	viewOptions?: WorkReportViewOptions;
};

type CreateReportFormParams = {
	data: DailyReport;
	layoutWidget: LayoutWidget;
	viewOptions?: WorkReportViewOptions;
};

type ReportLoadFailureParams = {
	layoutWidget: LayoutWidget;
};

type DailyReportViewProps = {
	layoutWidget: LayoutWidget;
	data?: DailyReport | null;
	reportFlags?: RecordReportPresentationFlags;
	// The height the sheet was opened at: the view resizes it only when the report needs another one.
	initialHeight: number;
	loadData: () => Promise<DailyReport | null>;
	renderReport: (data: DailyReport) => LayoutComponent;
	onLoadError: () => void;
};

type DailyReportViewState = {
	data: DailyReport | null;
};

type InitialHeightParams = {
	data?: DailyReport | null;
	reportFlags?: RecordReportPresentationFlags;
};

type DailyReportShimmerProps = Partial<RecordReportPresentationFlags>;

type DailyReportContainerProps = {
	layoutWidget: LayoutWidget;
	parentWidget: SheetHostWidget;
	data: DailyReport;
	analytics?: WorkdayAnalyticsSource | null;
	onSave: (args: { report: string }) => Promise<void>;
	onReportChange?: (report: string | null) => void;
};

type DailyReportLayoutResult = {
	component: (layoutWidget: LayoutWidget) => LayoutComponent;
	data: DailyReport;
};

type SaveReportParams = {
	recordId: number;
	layoutWidget: LayoutWidget;
};

type RegisterDismissSaveParams = {
	layoutWidget: LayoutWidget;
};

type SaveDailyReportSilentlyParams = {
	recordId: number | null;
};

type OpenSheetOptions = {
	component: (layoutWidget: LayoutWidget) => LayoutComponent;
	height: number;
	title?: string;
};

type StatusViewProps = {
	layoutWidget: LayoutWidget;
	parentWidget: SheetHostWidget;
	hasGpt: boolean;
	hasAutoReport: boolean;
	date?: string;
	analytics?: WorkdayAnalyticsSource | null;
	onContinue: () => void;
};

type StatusViewBannerProps = {
	text: string;
	hasAutoReport: boolean;
	hasGpt: boolean;
};

export {
	LayoutWidget,
	SheetHostWidget,
	WorkReportViewOptions,
	WorkdayAnalyticsSource,
	PrepareRequestResult,
	DailyReportBoxOptions,
	DailyReportBoxOpenOptions,
	DailyReportBoxOpenReportOptions,
	DailyReportBoxFetchOptions,
	CreateContainerComponentParams,
	CreateReportComponentParams,
	CreateReportFormParams,
	ReportLoadFailureParams,
	DailyReportViewProps,
	DailyReportViewState,
	InitialHeightParams,
	DailyReportShimmerProps,
	DailyReportLayoutResult,
	DailyReportContainerProps,
	SaveReportParams,
	RegisterDismissSaveParams,
	SaveDailyReportSilentlyParams,
	OpenSheetOptions,
	StatusViewProps,
	StatusViewBannerProps,
};
