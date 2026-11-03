import type { FullReportToSend, ReportSettings } from '../../api/types';

declare global
{
	type WorkReportMarkChange = (reportId: number, markState: MarkStateValue) => void;

	type WorkReportDetailProps = {
		item: FullReportToSend,
		settings?: ReportSettings | null,
		onMarkChange?: WorkReportMarkChange,
	};

	type WorkReportDetailState = {
		markState: MarkStateValue,
		discussionUrl: string | null,
		isAiReportsSchemeOn: boolean | null,
	};

	type WorkReportDetailOpenOptions = {
		item: FullReportToSend,
		settings?: ReportSettings | null,
		onMarkChange?: WorkReportMarkChange,
		parentWidget?: object,
	};
}

export {};
