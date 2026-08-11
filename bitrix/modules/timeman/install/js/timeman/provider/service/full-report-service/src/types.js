export type FullReportUser = {
	id: number,
	name: ?string,
	photo: ?string,
};

export type FullReport = {
	id: number,
	userId?: number,
	timestamp: number,
	dateFrom?: number,
	dateTo?: number,
	report: ?string,
	reportExtended: ?string,
	gptReport: ?string,
	hasGpt: boolean,
	reportType: 'day' | 'week' | 'month' | 'none',
	type: 'REPORT' | 'AI_REPORT' | 'ROBOT_REPORT',
	approve?: 'Y' | 'N',
	mark: ?string,
	fromUser: ?FullReportUser,
	toUsers: ?Array<FullReportUser>,
};

export type FullReportCreate = {
	userId: number,
	reportText: string,
};
