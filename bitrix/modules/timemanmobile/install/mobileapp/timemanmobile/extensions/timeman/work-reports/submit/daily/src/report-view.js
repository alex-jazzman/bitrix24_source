/**
 * @module timeman/work-reports/submit/daily/src/report-view
 */
jn.define('timeman/work-reports/submit/daily/src/report-view', (require, exports, module) => {
	const { PureComponent } = require('layout/pure-component');
	const { WorkReportForm } = require('timeman/work-reports/ui/form');
	const { DailyReportShimmer } = require('timeman/work-reports/submit/daily/src/report-shimmer');

	/**
	 * Content of the sheet of the daily report. The sheet is opened before the report is asked for, so
	 * the tap answers at once: until the answer arrives the view draws the shimmer of the form, and on
	 * the answer it puts the form in its place. The sheet is opened at a guessed height, and the answer
	 * either confirms it, and then the open sheet is left alone, or disproves it, and then the height is
	 * corrected once. A report that never arrives is left to the owner: it takes the sheet down instead
	 * of letting the shimmer run over an empty sheet.
	 *
	 * @extends {PureComponent<DailyReportViewProps, DailyReportViewState>}
	 */
	class DailyReportView extends PureComponent
	{
		/**
		 * The height the sheet is opened at, counted from the same terms as the form itself.
		 *
		 * @param {InitialHeightParams} [params]
		 * @returns {number}
		 */
		static getInitialHeight({ data, reportFlags } = {})
		{
			if (data)
			{
				return DailyReportView.#getContentHeight(data);
			}

			// Without the report in hand this height is a guess twice over: the number of check-ins is
			// answered by a request of its own, and the cards the row of the day names are read from the
			// type of the record alone, without the settings of the portal. The map is counted in, and a
			// guess the answer disproves is corrected once, when the answer arrives.
			return WorkReportForm.getContentHeight({
				hasAutoReport: reportFlags?.hasAutoReport,
				hasGpt: reportFlags?.hasGpt,
				hasMap: true,
			});
		}

		/**
		 * @param {DailyReport} data
		 * @returns {number}
		 */
		static #getContentHeight({ checkInCount, hasAutoReport, hasGpt })
		{
			return WorkReportForm.getContentHeight({
				hasAutoReport,
				hasGpt,
				hasMap: checkInCount > 0,
			});
		}

		/**
		 * @param {DailyReportViewProps} props
		 */
		constructor(props)
		{
			super(props);

			this.state = {
				data: props.data ?? null,
			};
		}

		#unmounted = false;

		componentDidMount()
		{
			if (!this.state.data)
			{
				this.#load().catch(console.error);
			}
		}

		componentWillUnmount()
		{
			this.#unmounted = true;
		}

		async #load()
		{
			let data = null;

			try
			{
				data = await this.props.loadData();
			}
			catch (error)
			{
				console.error(error);
			}

			// The sheet was closed while the answer was on its way: there is nothing left to draw.
			if (this.#unmounted)
			{
				return;
			}

			if (!data)
			{
				this.props.onLoadError();

				return;
			}

			this.#applyContentHeight(data);
			this.setState({ data });
		}

		/**
		 * The sheet is only resized when the report turns out to need a height other than the one it was
		 * opened at: a guess the answer confirms leaves the open sheet untouched.
		 *
		 * @param {DailyReport} data
		 */
		#applyContentHeight(data)
		{
			const { layoutWidget, initialHeight } = this.props;
			const height = DailyReportView.#getContentHeight(data);

			if (height === initialHeight)
			{
				return;
			}

			// The widget is read without a guard, the way the neighbours of the same sheet read it
			// (`src/container.js`, `submit/full`): it is handed to the component by the open of the sheet
			// and lives as long as the view does. A missing one is a defect of the open, and a guard here
			// would turn it into a sheet silently stuck at the height it was guessed at.
			layoutWidget.setBottomSheetParams({ mediumPositionHeight: height });
			layoutWidget.setBottomSheetHeight(height);
		}

		render()
		{
			const { data } = this.state;

			return data
				? this.props.renderReport(data)
				: new DailyReportShimmer({ ...this.props.reportFlags });
		}
	}

	module.exports = { DailyReportView };
});
