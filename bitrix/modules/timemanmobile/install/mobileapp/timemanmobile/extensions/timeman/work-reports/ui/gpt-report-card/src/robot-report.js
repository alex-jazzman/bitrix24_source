/**
 * @module timeman/work-reports/ui/gpt-report-card/src/robot-report
 */
jn.define('timeman/work-reports/ui/gpt-report-card/src/robot-report', (require, exports, module) => {
	const { Color } = require('tokens');
	const { makeLibraryImagePath } = require('asset-manager');
	const { BaseReportCard } = require('timeman/work-reports/ui/gpt-report-card/src/base');
	const { ROBOT_CARD_HEIGHT } = require('timeman/work-reports/ui/gpt-report-card/src/heights');

	const ROBOT_ICON_URI = makeLibraryImagePath('robot.png', 'graphic', 'timeman');
	const IN_PROGRESS_ICON_WIDTH = 185;
	const IN_PROGRESS_ICON_HEIGHT = 171;

	/**
	 * @param {GptReportCardProps} props
	 */
	class RobotReport extends BaseReportCard
	{
		getMinHeight()
		{
			return ROBOT_CARD_HEIGHT;
		}

		getBorderColor()
		{
			return Color.accentSoftBlue1;
		}

		renderInProgressIcon()
		{
			return this.renderInProgressIconWithUri(ROBOT_ICON_URI, IN_PROGRESS_ICON_WIDTH, IN_PROGRESS_ICON_HEIGHT);
		}

		isRobot()
		{
			return true;
		}
	}

	module.exports = { RobotReport };
});
