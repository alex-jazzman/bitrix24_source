import { ajax } from 'main.core';

import { type FullReport, type FullReportCreate, type DiscussResult } from './types';

const normalize = (raw: ?Object): ?FullReport => {
	if (!raw)
	{
		return null;
	}

	const { reportPlain, reportExtended, reportType, type, hasGpt, ...rest } = raw;

	return {
		...rest,
		report: rest.report ?? null,
		reportPlain: reportPlain ?? null,
		gptReport: reportExtended ?? null,
		hasGpt: hasGpt ?? true,
		reportType: (reportType ?? 'week').toLowerCase(),
		type: type ?? 'REPORT',
	};
};

class FullReportService
{
	async getReportToSend(): Promise<?FullReport>
	{
		const response = await ajax.runAction('timeman.V2.FullReport.getReportToSend', {
			json: {},
		});

		return normalize(response?.data ?? null);
	}

	async get(userId: number, reportId: number): Promise<?FullReport>
	{
		const response = await ajax.runAction(
			'timeman.V2.FullReport.getUserReport',
			{
				json: {
					userId,
					reportId,
				},
			},
		);

		return normalize(response?.data ?? null);
	}

	async add(report: FullReportCreate): Promise<?FullReport>
	{
		const response = await ajax.runAction('timeman.V2.FullReport.add', {
			json: { report },
		});

		return normalize(response?.data ?? null);
	}

	async submit(reportId: number, reportText: string): Promise<?FullReport>
	{
		const response = await ajax.runAction('timeman.V2.FullReport.submit', {
			json: { reportId, reportText },
		});

		return normalize(response?.data ?? null);
	}

	async send(reportId: number): Promise<?FullReport>
	{
		const response = await ajax.runAction('timeman.V2.FullReport.send', {
			json: { reportId },
		});

		return normalize(response?.data ?? null);
	}

	async approve(reportId: number): Promise<boolean>
	{
		const response = await ajax.runAction('timeman.V2.FullReport.approve', {
			json: { reportId },
		});

		return Boolean(response?.data);
	}

	async reject(reportId: number): Promise<boolean>
	{
		const response = await ajax.runAction('timeman.V2.FullReport.reject', {
			json: { reportId },
		});

		return Boolean(response?.data);
	}

	async postpone(seconds: number = 3600): Promise<boolean>
	{
		const response = await ajax.runAction('timeman.V2.FullReport.postpone', {
			json: { seconds },
		});

		return Boolean(response?.data);
	}

	async discuss(reportId: number): Promise<DiscussResult>
	{
		const response = await ajax.runAction('timeman.V2.ReportDiscussion.discuss', {
			json: { reportId },
		});

		return {
			dialogId: response?.data?.dialogId ?? '',
			created: Boolean(response?.data?.created),
		};
	}
}

export { FullReportService };
export const fullReportService = new FullReportService();
