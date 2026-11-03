/**
 * @module timeman/work-reports/submit/daily
 */
jn.define('timeman/work-reports/submit/daily', (require, exports, module) => {
	const { WorkReportsApi } = require('timeman/work-reports/api');
	const { AutoReportTitleEnum, ReportTypeEnum } = require('timeman/work-reports/enum');
	const { Loc } = require('timeman/work-reports/loc');
	const { WorkReportForm } = require('timeman/work-reports/ui/form');
	const { openDialogSheet, formatDate } = require('timeman/work-reports/utils');
	const { showToast, showErrorToast } = require('toast');
	const { StatusBox } = require('timeman/layout/status-box');
	const { DailyReportContainer } = require('timeman/work-reports/submit/daily/src/container');
	const { DailyReportView } = require('timeman/work-reports/submit/daily/src/report-view');
	const { WorkdayAnalytics } = require('timeman/analytics/workday-analytics');

	class DailyReportBox
	{
		#parentWidget = PageManager;
		#api = new WorkReportsApi();
		#saved = false;
		#latestReport = '';
		#recordId = null;
		#analytics = null;

		/**
		 * @param {DailyReportBoxOptions} [options]
		 */
		constructor({ parentWidget, analytics = null } = {})
		{
			if (parentWidget)
			{
				this.#parentWidget = parentWidget;
			}

			this.#analytics = analytics;
		}

		/**
		 * @param {DailyReportBoxOpenOptions} options
		 */
		static async open(options)
		{
			return new this(options).open(options);
		}

		/**
		 * @param {DailyReportBoxOpenReportOptions} options
		 * @returns {Promise<LayoutWidget>} resolved once the sheet is up, with the report still on its way
		 */
		static async openReport(options)
		{
			return new this(options).openReport(options);
		}

		/**
		 * @param {DailyReportBoxOpenReportOptions} [options]
		 */
		static async openLayout(options)
		{
			return new this(options).openLayout(options);
		}

		/**
		 * @param {DailyReportBoxOpenOptions} [options]
		 */
		async open({ prepareRequest } = {})
		{
			const data = await this.#fetch({ prepareRequest });

			if (!data)
			{
				return;
			}

			if (!data.settings?.isAiReportsEnabled)
			{
				return;
			}

			this.#openSheet({
				component: this.#createContainerComponent({ data }),
				height: StatusBox.getContentHeight({
					hasAutoReport: data.hasAutoReport,
					hasGpt: data.hasGpt,
					hasTitle: true,
				}),
			})
				.catch(console.error);
		}

		/**
		 * The sheet is opened before the report is asked for, so the tap answers at once: the view draws
		 * the shimmer of the form until the report arrives and swaps the form in afterwards. The height
		 * of the open is counted here once, from the cards the caller expects the report to carry, and
		 * the view is told the same number so that it can tell whether the answer disproved it.
		 *
		 * The returned promise is settled by the OPEN of the sheet and says nothing about the report:
		 * it resolves while the shimmer is still running, and the failure of the report is told to the
		 * employee by the view itself, which takes the sheet down and shows the error.
		 *
		 * @param {DailyReportBoxOpenReportOptions} [options]
		 * @returns {Promise<LayoutWidget>} resolved once the sheet is up
		 */
		async openReport({ userId, dateFilter, recordId, data: prefetchedData, reportFlags, viewOptions } = {})
		{
			const initialHeight = DailyReportView.getInitialHeight({ data: prefetchedData, reportFlags });

			return this.#openSheet({
				component: this.#createReportComponent({
					userId,
					dateFilter,
					recordId,
					data: prefetchedData,
					reportFlags,
					initialHeight,
					viewOptions,
				}),
				height: initialHeight,
			});
		}

		/**
		 * @param {DailyReportBoxOpenReportOptions} [options]
		 * @returns {Promise<DailyReportLayoutResult|null>}
		 */
		async openLayout({ dateFilter, recordId } = {})
		{
			const data = await this.#fetch({ dateFilter, recordId });
			if (!data)
			{
				return null;
			}

			if (!data.settings?.isAiReportsEnabled)
			{
				return null;
			}

			return {
				component: this.#createContainerComponent({ data }),
				data,
			};
		}

		/**
		 * @param {CreateContainerComponentParams} params
		 * @returns {function(LayoutWidget): DailyReportContainer}
		 */
		#createContainerComponent({ data })
		{
			this.#latestReport = data.report ?? '';
			this.#recordId = data.recordId;

			return (layoutWidget) => {
				this.#registerDismissSave({ layoutWidget });

				return new DailyReportContainer({
					data,
					layoutWidget,
					parentWidget: this.#parentWidget,
					analytics: this.#analytics,
					onReportChange: this.#onReportChange,
					onSave: this.#onSaveReport({
						layoutWidget,
						recordId: data.recordId,
					}),
				});
			};
		}

		/**
		 * @param {string|null} report
		 */
		#onReportChange = (report) => {
			this.#latestReport = report ?? '';
		};

		#onDismiss = () => {
			if (this.#saved)
			{
				return;
			}

			this.#saved = true;
			void this.#saveDailyReportSilently({ recordId: this.#recordId });
		};

		/**
		 * @param {RegisterDismissSaveParams} params
		 */
		#registerDismissSave({ layoutWidget })
		{
			layoutWidget?.on?.('onViewHidden', this.#onDismiss);
			layoutWidget?.on?.('onViewRemoved', this.#onDismiss);
		}

		/**
		 * @param {SaveDailyReportSilentlyParams} params
		 * @returns {Promise<void>}
		 */
		async #saveDailyReportSilently({ recordId })
		{
			try
			{
				await this.#api.saveDailyReport({
					recordId,
					reportText: this.#latestReport ?? '',
				});
			}
			catch (error)
			{
				console.error(error);
			}
		}

		/**
		 * @param {CreateReportComponentParams} params
		 * @returns {function(LayoutWidget): DailyReportView}
		 */
		#createReportComponent({ userId, dateFilter, recordId, data, reportFlags, initialHeight, viewOptions })
		{
			return (layoutWidget) => new DailyReportView({
				layoutWidget,
				data,
				reportFlags,
				initialHeight,
				loadData: () => this.#fetch({ userId, dateFilter, recordId }),
				renderReport: (report) => this.#createReportForm({ data: report, layoutWidget, viewOptions }),
				onLoadError: () => this.#onReportLoadFailure({ layoutWidget }),
			});
		}

		/**
		 * The sheet is already open when the report fails to arrive, so it is taken down and the failure
		 * is told the way a failed save is told: an empty sheet under a running shimmer says nothing.
		 *
		 * @param {ReportLoadFailureParams} params
		 */
		#onReportLoadFailure({ layoutWidget })
		{
			layoutWidget.close();
			showErrorToast();
		}

		/**
		 * @param {CreateReportFormParams} params
		 * @returns {WorkReportForm}
		 */
		#createReportForm({ data, layoutWidget, viewOptions })
		{
			return new WorkReportForm({
				layoutWidget,
				buttonText: Loc.getMessage('M_TIMEMAN_DAILY_REPORT_SAVE_BUTTON'),
				onClick: this.#onSaveReport({
					layoutWidget,
					recordId: data.recordId,
				}),
				...data,
				period: ReportTypeEnum.DAY,
				reportTitle: AutoReportTitleEnum.DAILY.getText({ isRobot: !data.hasGpt }),
				formTitle: Loc.getMessage(
					'M_TIMEMAN_DAILY_REPORT_TITLE',
					{ '#DATE#': formatDate(data.dateReport) },
				),
				readOnly: viewOptions?.readOnly,
			});
		}

		/**
		 * The save runs before the sheet is closed on purpose: the widget takes its JS context down with
		 * it, so anything awaited inside a `close()` callback never resumes and the toast is never shown.
		 *
		 * @param {SaveReportParams} params
		 * @returns {function(WorkReportFormOnClick): Promise<void>}
		 */
		#onSaveReport = ({ recordId, layoutWidget }) => async ({ report }) => {
			this.#saved = true;

			const reportText = report ?? '';
			this.#sendSaveAnalytics(reportText.trim().length > 0);

			let error = null;
			try
			{
				await this.#api.saveDailyReport({
					recordId,
					reportText,
				});
			}
			catch (caught)
			{
				error = caught;
			}

			layoutWidget.close();

			if (error)
			{
				showErrorToast();
				console.error(error);

				return;
			}

			showToast({ message: Loc.getMessage('M_TIMEMAN_DAILY_REPORT_SAVE_SUCCESS') });
		};

		/**
		 * @param {boolean} hasComment
		 */
		#sendSaveAnalytics(hasComment)
		{
			const { section, element } = this.#analytics ?? {};
			if (!section)
			{
				return;
			}

			WorkdayAnalytics.sendDaySummarySave(section, element, hasComment);
		}

		/**
		 * @param {OpenSheetOptions} params
		 * @returns {Promise<LayoutWidget>} settled by the open of the sheet, not by its content
		 */
		#openSheet({ component, height, title })
		{
			return openDialogSheet({
				parentWidget: this.#parentWidget,
				component,
				height,
				title,
			});
		}

		/**
		 * @param {DailyReportBoxFetchOptions} [options]
		 * @returns {Promise<DailyReport|null>}
		 */
		async #fetch({ prepareRequest = null, userId = env.userId, dateFilter = null, recordId = null } = {})
		{
			const isSuccess = (res) => res.status === 'fulfilled';

			let resolvedDateFilter = dateFilter;
			let resolvedRecordId = recordId;
			if (prepareRequest)
			{
				const result = await prepareRequest();
				resolvedDateFilter = result?.dateFilter ?? resolvedDateFilter;
				resolvedRecordId = result?.recordId ?? resolvedRecordId;
			}

			const [reportRes, checkInRes] = await Promise.allSettled([
				this.#api.getDailyReport({ userId, dateFilter: resolvedDateFilter, recordId: resolvedRecordId }),
				this.#api.getManualCheckInCount(),
			]);

			if (!isSuccess(reportRes) || !reportRes.value)
			{
				console.error('DailyReportBox: getDailyReport failed', reportRes.reason ?? 'no data');

				return null;
			}

			return {
				...reportRes.value,
				checkInCount: isSuccess(checkInRes) ? checkInRes.value : 0,
			};
		}
	}

	module.exports = { DailyReportBox };
});
