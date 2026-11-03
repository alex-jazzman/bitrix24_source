/**
 * @module timeman/ui/report-banner
 */
jn.define('timeman/ui/report-banner', (require, exports, module) => {
	const { GptBanner } = require('ui-system/blocks/banners/gpt-banner');
	const { RobotBanner } = require('timeman/ui/report-banner/src/robot-banner');

	/**
	 * @param {ReportBannerProps} props
	 */
	const ReportBanner = (props) => {
		const { hasAutoReport, hasGpt } = props;

		if (!hasAutoReport && !hasGpt)
		{
			return null;
		}

		return hasGpt
			? GptBanner(props)
			: RobotBanner(props);
	};

	module.exports = {
		ReportBanner,
	};
});
