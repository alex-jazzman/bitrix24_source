/**
 * @module timeman/work-reports/ui/gpt-report-card/src/gpt-report
 */
jn.define('timeman/work-reports/ui/gpt-report-card/src/gpt-report', (require, exports, module) => {
	const { Color, Indent } = require('tokens');
	const { makeLibraryImagePath } = require('asset-manager');
	const { BaseReportCard } = require('timeman/work-reports/ui/gpt-report-card/src/base');
	const { GPT_CARD_HEIGHT } = require('timeman/work-reports/ui/gpt-report-card/src/heights');

	const GPT_ICON_URI = makeLibraryImagePath('bitrix-gpt.png', 'graphic');
	const TITLE_ICON_SIZE = 32;
	const IN_PROGRESS_ICON_SIZE = 160;

	/**
	 * @param {GptReportCardProps} props
	 */
	class GptReport extends BaseReportCard
	{
		getMinHeight()
		{
			return GPT_CARD_HEIGHT;
		}

		getBorderColor()
		{
			return Color.bgBitrixGptLineGradient2;
		}

		getTitleColorProps()
		{
			return {
				colorGradient: {
					colors: [
						Color.bgBitrixGptGradient7,
						Color.bgBitrixGptGradient4,
						Color.bgBitrixGptGradient3,
						Color.bgBitrixGptGradient2,
						Color.bgBitrixGptGradient1,
					],
					angle: 225,
				},
			};
		}

		renderTitleIcon()
		{
			return Image({
				testId: this.getTestId('title-icon'),
				uri: GPT_ICON_URI,
				style: {
					width: TITLE_ICON_SIZE,
					height: TITLE_ICON_SIZE,
					marginRight: Indent.M.toNumber(),
				},
			});
		}

		renderInProgressIcon()
		{
			return this.renderInProgressIconWithUri(GPT_ICON_URI, IN_PROGRESS_ICON_SIZE, IN_PROGRESS_ICON_SIZE);
		}
	}

	module.exports = { GptReport };
});
