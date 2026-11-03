/**
 * @module timeman/work-reports/submit/daily/src/status-view
 */
jn.define('timeman/work-reports/submit/daily/src/status-view', (require, exports, module) => {
	const { PureComponent } = require('layout/pure-component');
	const { Button, ButtonSize, ButtonDesign } = require('ui-system/form/buttons/button');
	const { Color } = require('tokens');
	const { Loc } = require('timeman/work-reports/loc');
	const { createTestIdGenerator } = require('utils/test');
	const { StatusBox } = require('timeman/layout/status-box');
	const { makeLibraryImagePath } = require('asset-manager');
	const { WorkdayAnalytics } = require('timeman/analytics/workday-analytics');

	class StatusView extends PureComponent
	{
		/**
		 * @param {StatusViewProps} props
		 */
		constructor(props)
		{
			super(props);

			this.getTestId = createTestIdGenerator({
				context: this,
				prefix: 'daily-report-box',
			});
		}

		render()
		{
			return new StatusBox({
				title: Loc.getMessage('M_TIMEMAN_DAILY_REPORT_SCREEN_TITLE', {
					'#DATE#': this.props.date,
				}),
				imageUri: makeLibraryImagePath(
					'sit-indicate-shaking.png',
					'marshmallow',
					'timeman',
					false,
				),
				showConfetti: true,
				buttons: this.#getButtons(),
				banner: this.#getBannerProps(),
				testId: 'daily-report-box',
			});
		}

		/**
		 * @returns {Array}
		 */
		#getButtons()
		{
			return [
				Button({
					text: Loc.getMessage('M_TIMEMAN_DAILY_REPORT_SCREEN_BUTTON'),
					size: ButtonSize.L,
					design: ButtonDesign.FILLED,
					stretched: true,
					testId: this.getTestId('show-report-button'),
					onClick: this.#onShowReportClick,
				}),
			];
		}

		/**
		 * @returns {StatusViewBannerProps|null}
		 */
		#getBannerProps()
		{
			const { date, hasAutoReport, hasGpt } = this.props;
			const hasAnyReport = hasAutoReport || hasGpt;

			if (!hasAnyReport || !date)
			{
				return null;
			}

			return {
				text: hasGpt
					? Loc.getMessage(
						'M_TIMEMAN_DAILY_REPORT_SCREEN_COPILOT_TEXT',
						{
							'#BBCODE_START#': `[COLOR=${Color.copilotAccentLess2.toHex()}][B]`,
							'#BBCODE_END#': '[/B][/COLOR]',
							'#DATE#': date,
						},
					)
					: Loc.getMessage('M_TIMEMAN_DAILY_REPORT_SCREEN_ROBOT_TEXT', {
						'#DATE#': date,
					}),
				hasAutoReport,
				hasGpt,
			};
		}

		#onShowReportClick = () => {
			this.#sendOpenAnalytics();
			this.props.onContinue?.();
		};

		#sendOpenAnalytics()
		{
			const { section, element } = this.props.analytics ?? {};
			if (!section)
			{
				return;
			}

			WorkdayAnalytics.sendDaySummaryOpen(section, element);
		}
	}

	module.exports = {
		StatusView,
	};
});
