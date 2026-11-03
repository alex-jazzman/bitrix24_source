/**
 * @module timeman/work-reports/api
 */
jn.define('timeman/work-reports/api', (require, exports, module) => {
	const { RunActionExecutor } = require('rest/run-action-executor');
	const { parseDateToSec, toMs } = require('utils/time');
	const { MarkEnum, RecordReportTypeEnum, ReportTypeEnum } = require('timeman/work-reports/enum');
	const { getReportCardFlags } = require('timeman/work-reports/presentation');

	/**
	 * The decision of a report belongs to the scheme its OWNER reads, and the owner is somebody else than
	 * the manager deciding: the setting is answered per department, so the two may read different schemes
	 * and the screen only ever knows its own. The action picks the scheme by the owner and writes it there.
	 */
	const MARK_ACTION = 'timemanmobile.FullReport.setMark';

	const WRITABLE_MARK_STATES = Object.freeze([
		MarkEnum.State.APPROVED,
		MarkEnum.State.DISAPPROVED,
		MarkEnum.State.NONE,
	]);

	// The send of the old scheme publishes the livefeed entry and notifies the manager; the ai layer does not.
	const AI_SEND_ACTION = 'timeman.V2.FullReport.submit';
	const LEGACY_SEND_ACTION = 'timemanmobile.FullReport.submit';

	// Report ids with a mark write in flight. The module is a singleton, so every screen shares this registry.
	const markWritesInFlight = new Set();

	class WorkReportsApi
	{
		/**
		 * @param {RawReportPayload} data
		 * @param {{ settings?: ReportSettings }} [options]
		 * @returns {NormalizedReport}
		 */
		static normalizeReportPayload(data, { settings } = {})
		{
			const { reportExtended, reportPlain, reportType, type, ...rest } = data;
			const recordType = RecordReportTypeEnum.fromValue(type, RecordReportTypeEnum.REPORT);
			const flags = getReportCardFlags(recordType, settings);

			const normalized = {
				...rest,
				type,
				report: reportPlain ?? rest.report,
				gptReport: reportExtended,
				hasGpt: flags.hasGpt,
				hasAutoReport: flags.hasAutoReport,
			};

			if (reportType)
			{
				normalized.reportType = ReportTypeEnum.fromValue(reportType, ReportTypeEnum.WEEK);
			}

			return normalized;
		}

		/**
		 * @param {string} action
		 * @param {object} options
		 * @param {boolean} useCache
		 * @return {Promise}
		 */
		#runAction(action, options = {}, useCache = false)
		{
			return new Promise((resolve, reject) => {
				(new RunActionExecutor(action, options))
					.enableJson()
					.setHandler((response) => {
						if (response?.errors?.length > 0)
						{
							reject(response);

							return;
						}

						resolve(response);
					})
					.call(useCache)
					// A request that never reached the server calls no handler: the caller would wait forever.
					.catch(reject);
			});
		}

		/**
		 * @param {GetDailyReportOptions} [options]
		 * @returns {Promise<DailyReport|null>}
		 */
		async getDailyReport({ userId = env.userId, dateFilter = null, recordId } = {})
		{
			const now = new Date();
			const { items, settings } = await this.#getUserReports({
				userId,
				dateFilter,
				recordId,
			});

			const report = items?.[0];

			if (!report?.recordId)
			{
				console.warn('WorkReportsApi.getDailyReport: no report record', { dateFilter, recordId, items });

				return null;
			}

			return {
				...report,
				dateReport: new Date(toMs(report.timestamp) || now),
				settings,
			};
		}

		/**
		 * @param {GetUserReportsOptions} [options]
		 * @returns {Promise<{ items: NormalizedReport[], settings: ReportSettings }>}
		 */
		async #getUserReports({ userId = env.userId, dateFilter = {}, recordId = null } = {})
		{
			const filter = { userId, withAi: true };
			const dateFrom = parseDateToSec(dateFilter?.from);
			const dateTo = parseDateToSec(dateFilter?.to);

			if (recordId)
			{
				filter.recordId = recordId;
			}

			if (dateFrom)
			{
				filter.dateFrom = dateFrom;
			}

			if (dateTo)
			{
				filter.dateTo = dateTo;
			}

			const response = await this.#runAction(
				'timemanmobile.Report.getUserReports',
				{ filter },
			);

			const items = response?.data?.items;
			if (!items)
			{
				throw new Error('Failed to fetch user reports');
			}

			const settings = response?.data?.settings;

			return {
				items: items.map((item) => WorkReportsApi.normalizeReportPayload(item, { settings })),
				settings,
			};
		}

		/**
		 * @param {SaveDailyReportOptions} data
		 * @returns {Promise<boolean>}
		 */
		async saveDailyReport({ recordId, reportText } = {})
		{
			await this.#runAction('timeman.V2.Report.saveDailyReport', {
				recordId,
				reportText,
			});

			return true;
		}

		/**
		 * @returns {Promise<FullReportToSend>}
		 */
		async getReportToSend()
		{
			const response = await this.#runAction('timemanmobile.FullReport.getReportToSend');

			const report = response?.data?.report;
			if (!report)
			{
				throw new Error('No report data found');
			}

			const settings = response?.data?.settings;

			return {
				...WorkReportsApi.normalizeReportPayload(report, { settings }),
				settings,
			};
		}

		/**
		 * @returns {Promise<FullReportToSend>}
		 */
		async getPreloadData()
		{
			return this.getReportToSend();
		}

		/**
		 * @returns {Promise<ReportSettings|null>}
		 */
		async getReportSettings()
		{
			const response = await this.#runAction('timemanmobile.FullReport.getReportSettings');

			return response?.data?.settings ?? null;
		}

		/**
		 * @returns {Promise<boolean>}
		 */
		async hasOtherSubordinates()
		{
			const response = await this.#runAction('timeman.V2.FullReport.hasOtherSubordinates');

			return Boolean(response?.data);
		}

		/**
		 * @returns {Promise<number>}
		 */
		async getManualCheckInCount()
		{
			const response = await this.#runAction('stafftrackmobile.v2.CheckIn.getManualCheckInCount');
			const count = response?.data?.count;

			if (count === null)
			{
				throw new Error('No check-in count data');
			}

			return count;
		}

		/**
		 * The report goes into the scheme the department of its sender keeps: to the AI reports transport
		 * while that scheme is on, to the old one otherwise. The web path branches by the very same setting,
		 * and only the old scheme publishes the entry of the report into the livefeed and notifies the
		 * manager about it — the gate inside that publication asks this same setting about this same person,
		 * so a send routed by anything else would be stored and never announced.
		 *
		 * A caller without settings knows nothing about the scheme, which is not the same as the AI one
		 * being off: the settings are asked for once instead of sending where nobody may read.
		 *
		 * @param {{ reportId: number, comment: string }} data
		 * @param {{ isAiReportsSchemeOn?: boolean }} [options]
		 * @returns {Promise<boolean>}
		 */
		async saveFullReport({ reportId, comment } = {}, { isAiReportsSchemeOn } = {})
		{
			const sendToAiLayer = isAiReportsSchemeOn ?? await this.#fetchAiReportsMode();

			await this.#runAction(sendToAiLayer ? AI_SEND_ACTION : LEGACY_SEND_ACTION, {
				reportId,
				reportText: comment,
			});

			return true;
		}

		/**
		 * The report stays locked until the answer arrives, whatever the answer is. The decision travels as
		 * a mark of the old scheme, and the scheme it is written into is chosen by the server, see
		 * MARK_ACTION: the screen knows the mode of its own reader and not the one of the report owner.
		 *
		 * @param {number} reportId
		 * @param {MarkStateValue} state
		 * @returns {Promise<boolean>}
		 */
		async saveMarkState(reportId, state)
		{
			if (!WRITABLE_MARK_STATES.includes(state))
			{
				throw new Error(`Unknown report mark state: ${state}`);
			}

			markWritesInFlight.add(reportId);

			try
			{
				await this.#runAction(MARK_ACTION, {
					reportId,
					mark: MarkEnum.fromState(state),
				});
			}
			finally
			{
				markWritesInFlight.delete(reportId);
			}

			return true;
		}

		/**
		 * An unknown scheme is never read as one of the two answers: it is asked about once, and a send that
		 * has no scheme even then fails, so that the caller rolls its screen back and reports instead of
		 * sending where the portal may never read. The card of a report resolves its own unknown scheme by
		 * the same rule, see the review detail screen.
		 *
		 * @returns {Promise<boolean>}
		 */
		async #fetchAiReportsMode()
		{
			const settings = await this.getReportSettings();
			const isAiReportsSchemeOn = settings?.isAiReportsSchemeOn;

			if (isAiReportsSchemeOn === true || isAiReportsSchemeOn === false)
			{
				return isAiReportsSchemeOn;
			}

			throw new Error('Report settings are unknown: the write has no scheme to go to');
		}

		/**
		 * Screens ask this before an optimistic mark change: a repeated tap is dropped without an error.
		 * The answer only holds within the current synchronous run, so ask it right before the write.
		 *
		 * @param {number} reportId
		 * @returns {boolean}
		 */
		isMarkWriteInFlight(reportId)
		{
			return markWritesInFlight.has(reportId);
		}

		/**
		 * Discussion of the AI reports layer: the backend picks or creates the chat and answers with its id.
		 *
		 * @param {number} reportId
		 * @returns {Promise<{ dialogId: string|undefined, created: boolean|undefined }>}
		 */
		async discussReport(reportId)
		{
			const response = await this.#runAction('timeman.V2.ReportDiscussion.discuss', { reportId });

			return {
				dialogId: response?.data?.dialogId,
				created: response?.data?.created,
			};
		}

		/**
		 * An empty url is a regular answer: the log entry is missing or unavailable for the viewer.
		 *
		 * @param {number} reportId
		 * @returns {Promise<string|null>}
		 */
		async getDiscussionUrl(reportId)
		{
			const response = await this.#runAction('timemanmobile.FullReport.getDiscussionUrl', { reportId });

			return response?.data?.url ?? null;
		}
	}

	module.exports = { WorkReportsApi };
});
