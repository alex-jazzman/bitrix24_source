/**
 * @module timeman/work-reports/ui/gpt-report-card
 */
jn.define('timeman/work-reports/ui/gpt-report-card', (require, exports, module) => {
	const { PureComponent } = require('layout/pure-component');
	const { ReportTypeEnum } = require('timeman/work-reports/enum');
	const { GptReport } = require('timeman/work-reports/ui/gpt-report-card/src/gpt-report');
	const { RobotReport } = require('timeman/work-reports/ui/gpt-report-card/src/robot-report');
	const { GPT_CARD_HEIGHT, ROBOT_CARD_HEIGHT } = require('timeman/work-reports/ui/gpt-report-card/src/heights');

	/**
	 * @param {GptReportCardProps} props
	 */
	class GptReportCard extends PureComponent
	{
		render()
		{
			const { hasAutoReport, hasGpt, period } = this.props;

			if (!hasAutoReport && !hasGpt)
			{
				return null;
			}

			if (period?.equal(ReportTypeEnum.NONE))
			{
				return null;
			}

			return hasGpt
				? new GptReport(this.props)
				: new RobotReport(this.props);
		}
	}

	module.exports = {
		GptReportCard,
		GPT_CARD_HEIGHT,
		ROBOT_CARD_HEIGHT,
	};
});
