/**
 * @module timeman/work-reports/submit/full
 */
jn.define('timeman/work-reports/submit/full', (require, exports, module) => {
	const { Loc } = require('timeman/work-reports/loc');
	const { WorkReportsApi } = require('timeman/work-reports/api');
	const { AutoReportTitleEnum } = require('timeman/work-reports/enum');
	const { WorkReportForm } = require('timeman/work-reports/ui/form');
	const { openDialogSheet, formatDate, derivePeriod } = require('timeman/work-reports/utils');
	const { showToast, showErrorToast } = require('toast');
	const { WorkReportsAnalytics } = require('timeman/work-reports/analytics');

	class FullReportBox
	{
		#parentWidget = PageManager;
		#api = new WorkReportsApi();

		/**
		 * @param {FullReportBoxOptions} [options]
		 */
		constructor({ parentWidget } = {})
		{
			if (parentWidget)
			{
				this.#parentWidget = parentWidget;
			}
		}

		/**
		 * @param {FullReportBoxOpenOptions} options
		 */
		static async open(options)
		{
			return new this(options).open(options);
		}

		/**
		 * @param {FullReportBoxOpenReportOptions} options
		 */
		static openReport(options)
		{
			return new this(options).openReport(options);
		}

		/**
		 * @param {FullReportBoxOpenOptions} [options]
		 * @returns {Promise<boolean>}
		 */
		async open({ prepareRequest, dateReport } = {})
		{
			const reportToSend = await this.#fetch({ prepareRequest });

			if (!reportToSend)
			{
				return false;
			}

			this.openReport({ reportToSend, dateReport });

			return true;
		}

		/**
		 * @param {FullReportBoxOpenReportOptions} [options]
		 */
		openReport({ reportToSend, onSent, dateReport, settings } = {})
		{
			if (!reportToSend)
			{
				return;
			}

			const {
				id: reportId,
				dateFrom,
				dateTo,
				reportDate,
				report,
				gptReport,
				hasGpt,
				hasAutoReport,
				reportType,
			} = reportToSend;

			// The report of the send screen carries the settings of the portal; a caller with its own state
			// passes them itself. The send needs them to know which scheme the report belongs to.
			const reportSettings = settings ?? reportToSend.settings;

			const derived = derivePeriod({ dateFrom, dateTo, reportType });

			let periodLabel = derived?.label ?? '';
			if (!periodLabel && reportDate > 0)
			{
				periodLabel = formatDate(new Date(reportDate * 1000));
			}

			if (!periodLabel && dateReport)
			{
				periodLabel = formatDate(dateReport);
			}

			const period = derived?.type;
			const title = Loc.getMessage('M_TIMEMAN_FULL_REPORT_TITLE', { '#PERIOD#': periodLabel });
			const buttonText = Loc.getMessage('M_TIMEMAN_FULL_REPORT_SEND_BUTTON');

			this.#openSheet({
				title,
				height: WorkReportForm.getContentHeight({ hasAutoReport, hasGpt }),
				component: (layoutWidget) => new WorkReportForm({
					layoutWidget,
					buttonText,
					report,
					gptReport,
					hasGpt,
					hasAutoReport,
					period,
					reportTitle: AutoReportTitleEnum.fromReportType(period).getText({ isRobot: !hasGpt }),
					onClick: this.#onSendReport({
						layoutWidget,
						onSent,
						reportId,
						settings: reportSettings,
					}),
				}),
			});
		}

		/**
		 * The send runs before the sheet is closed on purpose: the widget takes its JS context down with
		 * it, so anything awaited inside a `close()` callback never resumes and the toast is never shown.
		 *
		 * A refused send keeps the sheet open: the text lives in the state of the sheet alone, so closing it
		 * would take away what the employee has just written. The form re-enables its own button, so the send
		 * can be repeated right away.
		 *
		 * @param {SendReportParams} params
		 * @returns {function(WorkReportFormOnClick): Promise<void>}
		 */
		#onSendReport = ({ layoutWidget, onSent, reportId, settings }) => async ({ report }) => {
			const comment = report ?? '';
			WorkReportsAnalytics.sendReportSent(comment.trim().length > 0);

			let error = null;
			try
			{
				await this.#api.saveFullReport(
					{
						reportId,
						comment,
					},
					{ isAiReportsSchemeOn: settings?.isAiReportsSchemeOn },
				);
			}
			catch (caught)
			{
				error = caught;
			}

			if (error)
			{
				showErrorToast();
				console.error(error);

				return;
			}

			layoutWidget.close();

			showToast({ message: Loc.getMessage('M_TIMEMAN_FULL_REPORT_SEND_SUCCESS') });

			onSent?.();
		};

		/**
		 * @param {OpenSheetOptions} params
		 */
		#openSheet({ title, component, height })
		{
			openDialogSheet({
				title,
				parentWidget: this.#parentWidget,
				component,
				height,
			})
				.catch(console.error);
		}

		/**
		 * @param {FullReportBoxFetchOptions} [options]
		 * @returns {Promise<FullReportToSend|null>}
		 */
		async #fetch({ prepareRequest = null } = {})
		{
			if (prepareRequest)
			{
				const [prepareResult, reportResult] = await Promise.allSettled([
					prepareRequest(),
					this.#api.getReportToSend(),
				]);

				if (prepareResult.status === 'rejected')
				{
					throw prepareResult.reason;
				}

				return reportResult.status === 'fulfilled'
					? reportResult.value
					: null;
			}

			return this.#api.getReportToSend();
		}
	}

	module.exports = { FullReportBox };
});
