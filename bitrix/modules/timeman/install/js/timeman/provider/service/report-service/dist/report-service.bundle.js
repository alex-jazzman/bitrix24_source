/* eslint-disable */
this.BX = this.BX || {};
this.BX.Timeman = this.BX.Timeman || {};
this.BX.Timeman.Provider = this.BX.Timeman.Provider || {};
(function (exports, main_core) {
	'use strict';

	const DAY_PLAN_SOURCE_TYPE_MAP = {
		AI_DAY_PLAN: 'AI_REPORT',
		ROBOT_DAY_PLAN: 'ROBOT_REPORT'
	};
	const DEFAULT_DAY_PLAN_SOURCE_TYPE = 'REPORT';
	const normalizeDayPlan = data => {
		if (!data) {
			return null;
		}
		return {
			report: data.report ?? null,
			sourceType: DAY_PLAN_SOURCE_TYPE_MAP[data.type] ?? DEFAULT_DAY_PLAN_SOURCE_TYPE
		};
	};
	const normalize = raw => {
		const {
			reportPlain,
			reportExtended,
			reportType,
			type,
			hasGpt,
			...rest
		} = raw;
		return {
			...rest,
			report: rest.report ?? null,
			reportPlain: reportPlain ?? null,
			gptReport: reportExtended ?? null,
			hasGpt: hasGpt ?? true,
			reportType: (reportType ?? 'day').toLowerCase(),
			type: type ?? 'REPORT'
		};
	};
	class ReportService {
		async getUserReports(filter) {
			const response = await main_core.ajax.runAction('timeman.V2.Report.getUserReports', {
				json: {
					filter
				}
			});
			const list = response?.data ?? [];
			return list.map(normalize);
		}
		async saveDailyReport(recordId, reportText) {
			await main_core.ajax.runAction('timeman.V2.Report.saveDailyReport', {
				json: {
					recordId,
					reportText
				}
			});
			return true;
		}
		async getDayPlan(recordId) {
			const response = await main_core.ajax.runAction('timeman.V2.Report.getDayPlan', {
				json: {
					recordId
				}
			});
			const data = response?.data ?? null;
			return normalizeDayPlan(data);
		}
	}
	const reportService = new ReportService();

	exports.ReportService = ReportService;
	exports.reportService = reportService;

})(this.BX.Timeman.Provider.Service = this.BX.Timeman.Provider.Service || {}, BX);
//# sourceMappingURL=report-service.bundle.js.map
