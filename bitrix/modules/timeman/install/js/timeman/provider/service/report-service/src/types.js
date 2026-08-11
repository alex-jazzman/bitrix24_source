export type DailyReport = {
	id: number,
	recordId: number,
	userId: number,
	timestamp: number,
	report: ?string,
	gptReport: ?string,
	hasGpt: boolean,
	reportType: 'day' | 'week' | 'month' | 'none',
	type: 'REPORT' | 'AI_REPORT' | 'ROBOT_REPORT',
};

export type DayPlan = {
	report: ?string,
	sourceType: 'AI_REPORT' | 'ROBOT_REPORT',
};

export type DailyReportFilter = {
	userId: number,
	recordId?: number,
	dateFrom?: number,
	dateTo?: number,
	withAi?: boolean,
};
