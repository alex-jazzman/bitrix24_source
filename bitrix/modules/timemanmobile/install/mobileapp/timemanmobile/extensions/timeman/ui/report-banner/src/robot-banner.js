/**
 * @module timeman/ui/report-banner/src/robot-banner
 */
jn.define('timeman/ui/report-banner/src/robot-banner', (require, exports, module) => {
	const { Color } = require('tokens');
	const { makeLibraryImagePath } = require('asset-manager');
	const { GptBannerClass } = require('ui-system/blocks/banners/gpt-banner');

	const ROBOT_IMAGE_URI = makeLibraryImagePath('robot.png', 'graphic', 'timeman');
	const IMAGE_WIDTH = 81;
	const IMAGE_HEIGHT = 75;

	/**
	 * @param {ReportBannerProps} props
	 */
	class RobotBanner extends GptBannerClass
	{
		getTestIdPrefix()
		{
			return 'robot-banner';
		}

		getImageUri()
		{
			return ROBOT_IMAGE_URI;
		}

		getImageWidth()
		{
			return IMAGE_WIDTH;
		}

		getImageHeight()
		{
			return IMAGE_HEIGHT;
		}

		getCardBorderColor()
		{
			return Color.accentSoftBlue1;
		}

		getCardBackgroundStyle()
		{
			return {
				backgroundColor: Color.bgContentPrimary.toHex(),
				minHeight: 50,
			};
		}
	}

	module.exports = {
		RobotBanner: (props) => new RobotBanner(props),
	};
});
