import type { ReportTypeEnum } from '../enum/src/report-type';

type DateFilter = {
	from?: string | Date;
	to?: string | Date;
};

type GetDailyReportOptions = {
	dateFilter?: DateFilter | null;
	userId?: number;
	recordId?: number | null;
};

type GetUserReportsOptions = {
	userId?: number;
	dateFilter?: DateFilter;
	recordId?: number | null;
};

type SaveDailyReportOptions = {
	recordId: number;
	reportText: string;
};

type RecordReportTypeValue = 'REPORT' | 'AI_REPORT' | 'ROBOT_REPORT';

type RecordReportPresentationFlags = {
	hasGpt: boolean;
	hasAutoReport: boolean;
};

type ReportSettings = {
	isReportsSettingTurnedOn: boolean;
	isReportGenerationAvailable: boolean;
	hasAiReportAccess: boolean;
	// Whether the content of the AI reports layer is shown; the portal flag turns it off on its own.
	isAiReportsEnabled: boolean;
	// Which scheme the reports of this user are stored in; only the setting of the department decides it.
	isAiReportsSchemeOn: boolean;
};

type RawReportPayload = {
	reportExtended?: string;
	reportPlain?: string;
	report?: string;
	reportType?: string | number;
	type?: RecordReportTypeValue | string;
	[key: string]: any;
};

type NormalizedReport = RecordReportPresentationFlags & {
	report: string;
	gptReport?: string;
	reportType?: ReportTypeEnum;
	type?: RecordReportTypeValue | string;
	[key: string]: any;
};

type DailyReport = RecordReportPresentationFlags & {
	id: number;
	recordId: number;
	report: string;
	gptReport: string;
	timestamp: number;
	type: RecordReportTypeValue | string;
	userId: number;
	dateReport: Date;
	settings: ReportSettings;
};

type ReportUser = {
	id: number;
	name?: string | null;
	photo?: string | null;
};

type FullReportToSend = RecordReportPresentationFlags & {
	id: number;
	userId: number;
	active?: boolean | null;
	reportType?: ReportTypeEnum;
	type?: RecordReportTypeValue | string;
	settings: ReportSettings;
	dateFrom?: number | null;
	dateTo?: number | null;
	reportDate?: number | null;
	report?: string;
	gptReport?: string;
	plans?: string | null;
	mark?: string | null;
	isReadyForSubmit?: boolean | null;
	files?: object | null;
	events?: object[] | null;
	tasks?: object[] | null;
	fromUser?: ReportUser | null;
	toUsers?: ReportUser[] | null;
};

export {
	DateFilter,
	GetDailyReportOptions,
	GetUserReportsOptions,
	SaveDailyReportOptions,
	RawReportPayload,
	NormalizedReport,
	DailyReport,
	ReportUser,
	FullReportToSend,
	RecordReportTypeValue,
	RecordReportPresentationFlags,
	ReportSettings,
};
