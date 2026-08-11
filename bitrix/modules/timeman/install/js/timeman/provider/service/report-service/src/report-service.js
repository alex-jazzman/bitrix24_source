import { ajax } from 'main.core';

import type { DailyReport, DailyReportFilter, DayPlan } from './types';

const DAY_PLAN_SOURCE_TYPE_MAP = {
	AI_DAY_PLAN: 'AI_REPORT',
	ROBOT_DAY_PLAN: 'ROBOT_REPORT',
};

const DEFAULT_DAY_PLAN_SOURCE_TYPE = 'REPORT';

const normalizeDayPlan = (data: ?Object): ?DayPlan => {
	if (!data)
	{
		return null;
	}

	return {
		report: data.report ?? null,
		sourceType: DAY_PLAN_SOURCE_TYPE_MAP[data.type] ?? DEFAULT_DAY_PLAN_SOURCE_TYPE,
	};
};

const normalize = (raw: Object): DailyReport => {
	const { reportPlain, reportExtended, reportType, type, hasGpt, ...rest } = raw;

	return {
		...rest,
		report: rest.report ?? null,
		reportPlain: reportPlain ?? null,
		gptReport: reportExtended ?? null,
		hasGpt: hasGpt ?? true,
		reportType: (reportType ?? 'day').toLowerCase(),
		type: type ?? 'REPORT',
	};
};

class ReportService
{
	async getUserReports(filter: DailyReportFilter): Promise<DailyReport[]>
	{
		const response = await ajax.runAction('timeman.V2.Report.getUserReports', {
			json: { filter },
		});
		const list = response?.data ?? [];

		return list.map(normalize);
	}

	async saveDailyReport(recordId: number, reportText: string): Promise<boolean>
	{
		await ajax.runAction('timeman.V2.Report.saveDailyReport', {
			json: { recordId, reportText },
		});

		return true;
	}

	async getDayPlan(recordId: number): Promise<?DayPlan>
	{
		const response = await ajax.runAction('timeman.V2.Report.getDayPlan', {
			json: { recordId },
		});
		const data = response?.data ?? null;

		return normalizeDayPlan(data);
	}
}

export { ReportService, normalizeDayPlan };
export const reportService = new ReportService();
