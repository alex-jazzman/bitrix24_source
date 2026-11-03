/**
 * @module timeman/work-reports/ui/gpt-report-card/src/base
 */
jn.define('timeman/work-reports/ui/gpt-report-card/src/base', (require, exports, module) => {
	const { PureComponent } = require('layout/pure-component');
	const { Color, Indent, Component } = require('tokens');
	const { H3 } = require('ui-system/typography/heading');
	const { Text2, Text4 } = require('ui-system/typography/text');
	const { BBCodeText } = require('ui-system/typography/bbcodetext');
	const { createTestIdGenerator } = require('utils/test');
	const { Loc } = require('timeman/work-reports/loc');
	const { AutoReportInProgressTextEnum } = require('timeman/work-reports/enum');
	const { formatDate, openReportLink } = require('timeman/work-reports/utils');

	/**
	 * @abstract
	 * @param {GptReportCardProps} props
	 */
	class BaseReportCard extends PureComponent
	{
		constructor(props)
		{
			super(props);

			this.getTestId = createTestIdGenerator({ context: this });
		}

		render()
		{
			const { report, style } = this.props;

			return View(
				{
					testId: this.getTestId(),
					style: {
						minHeight: this.getMinHeight(),
						borderWidth: 1,
						borderColor: this.getBorderColor().toHex(),
						borderRadius: Component.cardCornerXL.toNumber(),
						padding: Component.paddingLr.toNumber(),
						...style,
					},
				},
				this.renderTitle(),
				report
					? this.renderReport()
					: this.renderInProgress(),
			);
		}

		renderTitle()
		{
			return View(
				{
					testId: this.getTestId('title'),
					style: {
						flexDirection: 'row',
						alignItems: 'center',
						marginBottom: Indent.XL4.toNumber(),
					},
				},
				this.renderTitleIcon(),
				Text2({
					testId: this.getTestId('title-text'),
					text: this.props.title,
					accent: true,
					...this.getTitleColorProps(),
					style: {
						flex: 1,
					},
				}),
			);
		}

		renderReport()
		{
			return BBCodeText({
				testId: this.getTestId('report'),
				text: this.props.report,
				onLinkClick: openReportLink,
			});
		}

		renderInProgress()
		{
			return View(
				{
					testId: this.getTestId('in-progress'),
					style: {
						flexDirection: 'column',
						alignItems: 'center',
						paddingBottom: Indent.XL4.toNumber(),
					},
				},
				this.renderInProgressIcon(),
				View(
					{
						style: {
							flexDirection: 'column',
							alignItems: 'center',
						},
					},
					H3({
						testId: this.getTestId('in-progress-title'),
						text: this.getInProgressTitle(),
						accent: true,
						style: {
							textAlign: 'center',
							marginBottom: Indent.XL2.toNumber(),
						},
					}),
					Text4({
						testId: this.getTestId('in-progress-text'),
						text: this.getInProgressText(),
						style: {
							textAlign: 'center',
						},
					}),
				),
			);
		}

		renderInProgressIconWithUri(uri, width, height)
		{
			return Image({
				testId: this.getTestId('in-progress-icon'),
				uri,
				style: {
					width,
					height,
					marginBottom: Indent.XL2.toNumber(),
				},
			});
		}

		/**
		 * @abstract
		 * @returns {Color}
		 */
		getBorderColor()
		{
			throw new Error('BaseReportCard.getBorderColor() must be implemented by subclass');
		}

		/**
		 * @abstract
		 * @returns {number}
		 */
		getMinHeight()
		{
			throw new Error('BaseReportCard.getMinHeight() must be implemented by subclass');
		}

		/**
		 * @returns {ReportCardTitleColorProps}
		 */
		getTitleColorProps()
		{
			return { color: Color.base1 };
		}

		renderTitleIcon()
		{
			return null;
		}

		renderInProgressIcon()
		{
			return null;
		}

		getInProgressTitle()
		{
			return Loc.getMessage('M_TIMEMAN_GPT_REPORT_CARD_IN_PROGRESS_TITLE');
		}

		getInProgressText()
		{
			const { dateReport, period } = this.props;
			const replacements = dateReport ? { '#DATE#': formatDate(dateReport) } : undefined;

			return AutoReportInProgressTextEnum
				.fromReportType(period)
				.getText({ isRobot: this.isRobot(), replacements });
		}

		isRobot()
		{
			return false;
		}
	}

	module.exports = { BaseReportCard };
});
