/* eslint-disable */
this.BX = this.BX || {};
this.BX.Timeman = this.BX.Timeman || {};
this.BX.Timeman.Provider = this.BX.Timeman.Provider || {};
(function (exports, main_core) {
	'use strict';

	const normalize = raw => {
		if (!raw) {
			return null;
		}
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
			reportType: (reportType ?? 'week').toLowerCase(),
			type: type ?? 'REPORT'
		};
	};
	class FullReportService {
		async getReportToSend() {
			const response = await main_core.ajax.runAction('timeman.V2.FullReport.getReportToSend', {
				json: {}
			});
			return normalize(response?.data ?? null);
		}
		async get(userId, reportId) {
			const response = await main_core.ajax.runAction('timeman.V2.FullReport.getUserReport', {
				json: {
					userId,
					reportId
				}
			});
			return normalize(response?.data ?? null);
		}
		async add(report) {
			const response = await main_core.ajax.runAction('timeman.V2.FullReport.add', {
				json: {
					report
				}
			});
			return normalize(response?.data ?? null);
		}
		async submit(reportId, reportText) {
			const response = await main_core.ajax.runAction('timeman.V2.FullReport.submit', {
				json: {
					reportId,
					reportText
				}
			});
			return normalize(response?.data ?? null);
		}
		async send(reportId) {
			const response = await main_core.ajax.runAction('timeman.V2.FullReport.send', {
				json: {
					reportId
				}
			});
			return normalize(response?.data ?? null);
		}
		async approve(reportId) {
			const response = await main_core.ajax.runAction('timeman.V2.FullReport.approve', {
				json: {
					reportId
				}
			});
			return Boolean(response?.data);
		}
		async reject(reportId) {
			const response = await main_core.ajax.runAction('timeman.V2.FullReport.reject', {
				json: {
					reportId
				}
			});
			return Boolean(response?.data);
		}
		async postpone(seconds = 3600) {
			const response = await main_core.ajax.runAction('timeman.V2.FullReport.postpone', {
				json: {
					seconds
				}
			});
			return Boolean(response?.data);
		}
		async discuss(reportId) {
			const response = await main_core.ajax.runAction('timeman.V2.ReportDiscussion.discuss', {
				json: {
					reportId
				}
			});
			return {
				dialogId: response?.data?.dialogId ?? '',
				created: Boolean(response?.data?.created)
			};
		}
	}
	const fullReportService = new FullReportService();

	exports.FullReportService = FullReportService;
	exports.fullReportService = fullReportService;

})(this.BX.Timeman.Provider.Service = this.BX.Timeman.Provider.Service || {}, BX);
//# sourceMappingURL=full-report-service.bundle.js.map
